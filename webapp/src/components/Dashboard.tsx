"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/login/actions";
import * as data from "@/lib/data";
import type { AppSettings, Demand, HistoryWeek, LogoGalleryItem, Project, ProjectPreset, Status, Ticket } from "@/lib/types";
import { addDays, fmtBR } from "@/lib/dates";
import { buildCsmSummary, buildReportProject } from "@/lib/report";
import { exportReportPdf } from "@/lib/pdf";
import ProjectCard from "./ProjectCard";
import TicketsPanel from "./TicketsPanel";
import LogoUpload from "./LogoUpload";
import ReportView from "./ReportView";
import HistoryView from "./HistoryView";
import CloseWeekModal from "./CloseWeekModal";

type ProjectWithDemands = Project & { demands: Demand[] };
type View = "painel" | "relatorio" | "historico";

function mergeField(existing: string, incoming: string): string {
  const parts = existing.split(",").map((s) => s.trim()).filter(Boolean);
  const next = incoming.trim();
  if (!next || parts.includes(next)) return existing;
  return [...parts, next].join(", ");
}

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [projects, setProjects] = useState<ProjectWithDemands[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [gallery, setGallery] = useState<LogoGalleryItem[]>([]);
  const [presets, setPresets] = useState<ProjectPreset[]>([]);
  const [history, setHistory] = useState<HistoryWeek[]>([]);
  const [view, setView] = useState<View>("painel");
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [closePending, setClosePending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [s, projectRows, demandRows, ticketRows, galleryRows, presetRows, historyRows] = await Promise.all([
        data.fetchOrCreateAppSettings(supabase, user.id),
        data.fetchProjects(supabase),
        data.fetchDemands(supabase),
        data.fetchTickets(supabase),
        data.fetchGallery(supabase),
        data.fetchPresets(supabase),
        data.fetchHistoryList(supabase),
      ]);
      if (cancelled) return;

      const grouped: ProjectWithDemands[] = projectRows.map((p) => ({
        ...p,
        demands: demandRows.filter((d) => d.project_id === p.id),
      }));

      setSettings(s);
      setProjects(grouped);
      setTickets(ticketRows);
      setGallery(galleryRows);
      setPresets(presetRows);
      setHistory(historyRows);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  function alertErr(e: unknown) {
    window.alert(e instanceof Error ? e.message : "Ocorreu um erro. Tente novamente.");
  }

  // ── Company logo / report name ──
  async function onCompanyLogoFile(file: File) {
    if (!settings) return;
    try {
      const url = await data.uploadLogo(supabase, settings.user_id, file);
      await data.updateAppSettings(supabase, settings.user_id, { company_logo_url: url });
      setSettings({ ...settings, company_logo_url: url });
    } catch (e) {
      alertErr(e);
    }
  }
  async function onWeekStartChange(weekStart: string) {
    if (!settings || weekStart === settings.week_start) return;
    setSettings({ ...settings, week_start: weekStart });
    try {
      await data.updateAppSettings(supabase, settings.user_id, { week_start: weekStart });
    } catch (e) {
      alertErr(e);
    }
  }
  async function onWeekEndChange(weekEnd: string) {
    if (!settings || weekEnd === settings.week_end) return;
    setSettings({ ...settings, week_end: weekEnd });
    try {
      await data.updateAppSettings(supabase, settings.user_id, { week_end: weekEnd });
    } catch (e) {
      alertErr(e);
    }
  }

  // ── Projects ──
  async function addProject() {
    if (!settings) return;
    setShowPresetMenu(false);
    try {
      const p = await data.createProject(supabase, settings.user_id, projects.length);
      setProjects([...projects, { ...p, demands: [] }]);
    } catch (e) {
      alertErr(e);
    }
  }
  async function addProjectFromPreset(preset: ProjectPreset) {
    if (!settings) return;
    setShowPresetMenu(false);
    try {
      const p = await data.createProject(supabase, settings.user_id, projects.length);
      const patch: Partial<Project> = {
        name: preset.name,
        logo_url: preset.logo_url,
        start_date: preset.start_date,
        end_date: preset.end_date,
      };
      await data.updateProject(supabase, p.id, patch);
      setProjects([...projects, { ...p, ...patch, demands: [] }]);
    } catch (e) {
      alertErr(e);
    }
  }
  async function saveProjectAsPreset(p: ProjectWithDemands) {
    if (!settings) return;
    try {
      await data.upsertPreset(supabase, settings.user_id, {
        name: p.name,
        logo_url: p.logo_url,
        start_date: p.start_date,
        end_date: p.end_date,
      });
      setPresets(await data.fetchPresets(supabase));
    } catch (e) {
      alertErr(e);
    }
  }
  async function removePreset(id: string) {
    try {
      await data.deletePreset(supabase, id);
      setPresets((prev) => prev.filter((pr) => pr.id !== id));
    } catch (e) {
      alertErr(e);
    }
  }
  function patchProjectLocal(id: string, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  async function updateProject(id: string, patch: Partial<Project>) {
    patchProjectLocal(id, patch);
    try {
      await data.updateProject(supabase, id, patch);
    } catch (e) {
      alertErr(e);
    }
  }
  async function deleteProject(id: string) {
    if (!window.confirm("Remover este projeto e todas as suas demandas?")) return;
    const prev = projects;
    setProjects(projects.filter((p) => p.id !== id));
    try {
      await data.deleteProject(supabase, id);
    } catch (e) {
      setProjects(prev);
      alertErr(e);
    }
  }
  async function onProjectLogoFile(pid: string, file: File) {
    if (!settings) return;
    try {
      const url = await data.uploadLogo(supabase, settings.user_id, file);
      await updateProject(pid, { logo_url: url });
      const p = projects.find((x) => x.id === pid);
      await data.upsertGalleryLogo(supabase, settings.user_id, p ? p.name : "", url);
      const gal = await data.fetchGallery(supabase);
      setGallery(gal);
    } catch (e) {
      alertErr(e);
    }
  }
  function pickGalleryLogo(pid: string, url: string) {
    updateProject(pid, { logo_url: url });
  }
  async function removeGalleryLogo(id: string) {
    setGallery(gallery.filter((g) => g.id !== id));
    try {
      await data.deleteGalleryLogo(supabase, id);
    } catch (e) {
      alertErr(e);
    }
  }

  // ── Demands ──
  async function addDemand(
    pid: string,
    draft: { type: string; collaborator: string; role: string; date: string; releaseDate: string; situation: string; observation: string; status: Status }
  ) {
    if (!settings) return;
    try {
      const d = await data.createDemand(supabase, settings.user_id, pid, draft);
      setProjects((prev) => prev.map((p) => (p.id === pid ? { ...p, demands: [...p.demands, d] } : p)));
    } catch (e) {
      alertErr(e);
    }
  }
  async function updateDemand(pid: string, did: string, patch: Partial<Demand>) {
    setProjects((prev) =>
      prev.map((p) => (p.id === pid ? { ...p, demands: p.demands.map((d) => (d.id === did ? { ...d, ...patch } : d)) } : p))
    );
    try {
      await data.updateDemand(supabase, did, patch);
    } catch (e) {
      alertErr(e);
    }
  }
  async function deleteDemand(pid: string, did: string) {
    const prev = projects;
    setProjects((cur) => cur.map((p) => (p.id === pid ? { ...p, demands: p.demands.filter((d) => d.id !== did) } : p)));
    try {
      await data.deleteDemand(supabase, did);
    } catch (e) {
      setProjects(prev);
      alertErr(e);
    }
  }

  // ── Tickets ──
  async function addTicket(draft: { type: string; requester: string; qty: number; note: string }) {
    if (!settings) return;
    const existing = tickets.find((t) => t.type.trim().toLowerCase() === draft.type.trim().toLowerCase());
    try {
      if (existing) {
        const patch = {
          qty: existing.qty + draft.qty,
          requester: mergeField(existing.requester, draft.requester),
          note: mergeField(existing.note, draft.note),
        };
        await data.updateTicket(supabase, existing.id, patch);
        setTickets((prev) => prev.map((t) => (t.id === existing.id ? { ...t, ...patch } : t)));
      } else {
        const t = await data.createTicket(supabase, settings.user_id, draft);
        setTickets((prev) => [...prev, t]);
      }
    } catch (e) {
      alertErr(e);
    }
  }
  async function deleteTicket(id: string) {
    const prev = tickets;
    setTickets(tickets.filter((t) => t.id !== id));
    try {
      await data.deleteTicket(supabase, id);
    } catch (e) {
      setTickets(prev);
      alertErr(e);
    }
  }

  // ── Export / import JSON backup ──
  function exportJson() {
    const blob = new Blob([JSON.stringify({ settings, projects, tickets, gallery }, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "alinhamento-semanal-backup.json";
    a.click();
  }
  async function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !settings) return;
    try {
      const parsed = JSON.parse(await f.text()) as { projects?: ProjectWithDemands[]; tickets?: Ticket[] };
      if (!window.confirm("Isso vai ADICIONAR os projetos e chamados deste arquivo à semana atual (sem apagar nada existente). Continuar?")) return;
      for (const p of parsed.projects || []) {
        const created = await data.createProject(supabase, settings.user_id, projects.length);
        await data.updateProject(supabase, created.id, {
          name: p.name,
          color: p.color,
          start_date: p.start_date,
          end_date: p.end_date,
          monday_pct: p.monday_pct,
          friday_pct: p.friday_pct,
          general_notes: p.general_notes,
          logo_url: p.logo_url,
        });
        const newDemands: Demand[] = [];
        for (const d of p.demands || []) {
          const nd = await data.createDemand(supabase, settings.user_id, created.id, {
            type: d.type,
            collaborator: d.collaborator,
            role: d.role,
            date: d.date || "",
            releaseDate: d.release_date || "",
            situation: d.situation,
            observation: d.observation,
            status: d.status,
          });
          newDemands.push(nd);
        }
        setProjects((prev) => [...prev, { ...created, ...p, id: created.id, demands: newDemands }]);
      }
      for (const t of parsed.tickets || []) {
        const nt = await data.createTicket(supabase, settings.user_id, { type: t.type, requester: t.requester, qty: t.qty, note: t.note });
        setTickets((prev) => [...prev, nt]);
      }
      window.alert("Importação concluída.");
    } catch (err) {
      alertErr(err);
    }
  }

  // ── Fechar semana ──
  async function confirmCloseWeek() {
    if (!settings) return;
    setClosePending(true);
    try {
      const weekStart = settings.week_start;
      const weekEnd = settings.week_end;
      const weekLabel = `Semana de ${fmtBR(weekStart)} a ${fmtBR(weekEnd)}`;
      const dateStr = fmtBR(weekEnd);
      const nextWeekStart = addDays(weekStart, 7);
      const nextWeekEnd = addDays(weekEnd, 7);
      const snapshot = { projects: projects.map((p) => ({ ...p })), tickets };

      const id = await data.closeWeek(supabase, {
        weekLabel,
        reportName: settings.report_name,
        dateStr,
        weekStart,
        snapshot,
        nextWeekStart,
        nextWeekEnd,
      });

      const entry: HistoryWeek = {
        id,
        user_id: settings.user_id,
        week_label: weekLabel,
        closed_at: new Date().toISOString(),
        report_name: settings.report_name,
        date_str: dateStr,
        week_start: weekStart,
        snapshot,
        created_at: new Date().toISOString(),
      };

      setHistory([entry, ...history]);
      setProjects(projects.map((p) => ({ ...p, demands: [], monday_pct: 0, friday_pct: 0, general_notes: "" })));
      setTickets([]);
      setSettings({ ...settings, week_start: nextWeekStart, week_end: nextWeekEnd });
      setShowCloseConfirm(false);
      setView("historico");
      setViewingHistoryId(null);
    } catch (e) {
      alertErr(e);
    } finally {
      setClosePending(false);
    }
  }

  // ── PDF ──
  async function handleExportPdf() {
    if (!reportRef.current) return;
    setPdfPending(true);
    try {
      const dateStr = viewingHistoryId
        ? history.find((h) => h.id === viewingHistoryId)?.date_str
        : settings
        ? fmtBR(settings.week_end)
        : "";
      await exportReportPdf(reportRef.current, `alinhamento-semanal-${(dateStr || "").replace(/\//g, "-")}.pdf`);
    } catch (e) {
      alertErr(e);
    } finally {
      setPdfPending(false);
    }
  }

  if (loading || !settings) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 13 }}>
        Carregando…
      </div>
    );
  }

  const weekLabel = `Semana de ${fmtBR(settings.week_start)} a ${fmtBR(settings.week_end)}`;

  const viewingHistory = !!viewingHistoryId;
  const historyEntry = viewingHistory ? history.find((h) => h.id === viewingHistoryId) : null;

  let reportProjects, reportCsm, reportName, reportDateStr;
  if (viewingHistory && historyEntry) {
    reportProjects = historyEntry.snapshot.projects.map((p) => buildReportProject(p, p.demands, historyEntry.week_start));
    reportCsm = buildCsmSummary(historyEntry.snapshot.tickets);
    reportName = historyEntry.report_name;
    reportDateStr = `${fmtBR(historyEntry.week_start)} - ${historyEntry.date_str}`;
  } else {
    reportProjects = projects.map((p) => buildReportProject(p, p.demands, settings.week_start));
    reportCsm = buildCsmSummary(tickets);
    reportName = settings.report_name;
    reportDateStr = `${fmtBR(settings.week_start)} - ${fmtBR(settings.week_end)}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAFA", fontFamily: "'Inter',system-ui,sans-serif", color: "#1A1A1A" }}>
      <div
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-.01em" }}>Alinhamento Semanal</div>
          <div style={{ fontSize: 12, color: "#2C3E66", fontWeight: 600, background: "#EEF1F7", padding: "4px 10px", borderRadius: 999 }}>
            {weekLabel}
          </div>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <button className={`tab-btn ${view === "painel" ? "active" : ""}`} onClick={() => setView("painel")}>
            Painel
          </button>
          <button
            className={`tab-btn ${view === "relatorio" ? "active" : ""}`}
            onClick={() => {
              setView("relatorio");
              setViewingHistoryId(null);
            }}
          >
            Relatório / PDF
          </button>
          <button className={`tab-btn ${view === "historico" ? "active" : ""}`} onClick={() => setView("historico")}>
            Histórico
          </button>
          <span style={{ fontSize: 12, color: "#6B7280" }}>{userEmail}</span>
          <button className="btn-ghost" onClick={() => signOut()}>
            Sair
          </button>
        </div>
      </div>

      <div className="no-print" style={{ padding: "24px 32px 0", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>Semana de</span>
          <input
            type="date"
            className="ds-input"
            value={settings.week_start}
            onChange={(e) => e.target.value && onWeekStartChange(e.target.value)}
            style={{ fontSize: 16 }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>a</span>
          <input
            type="date"
            className="ds-input"
            value={settings.week_end}
            onChange={(e) => e.target.value && onWeekEndChange(e.target.value)}
            style={{ fontSize: 16 }}
          />
        </div>
      </div>

      {view === "painel" ? (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
          <div className="ds-card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", marginBottom: 24, flexWrap: "wrap" }}>
            <LogoUpload logoUrl={settings.company_logo_url} onFile={onCompanyLogoFile} size={64} />
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>
                Seu nome (aparece no relatório)
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>{settings.report_name}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              <button className="btn-secondary" onClick={exportJson}>
                Exportar dados
              </button>
              <label className="btn-secondary" style={{ display: "inline-flex", alignItems: "center" }}>
                Importar dados
                <input type="file" accept="application/json" onChange={importJson} style={{ display: "none" }} />
              </label>
              <button className="btn-secondary" onClick={() => setShowCloseConfirm(true)}>
                Fechar Semana
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
            <div className="ds-kicker">Projetos</div>
            <button className="btn-primary" onClick={() => setShowPresetMenu((v) => !v)}>
              + Novo projeto
            </button>
            {showPresetMenu ? (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 19 }} onClick={() => setShowPresetMenu(false)} />
                <div
                  className="ds-card"
                  style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, padding: 8, zIndex: 20, minWidth: 260, maxHeight: 320, overflowY: "auto" }}
                >
                  <button
                    className="btn-secondary"
                    onClick={addProject}
                    style={{ width: "100%", textAlign: "left", marginBottom: presets.length ? 6 : 0 }}
                  >
                    Em branco
                  </button>
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => addProjectFromPreset(preset)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", borderRadius: 8, cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #E5E7EB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#fff" }}>
                        {preset.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preset.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          {preset.start_date ? fmtBR(preset.start_date) : "?"} - {preset.end_date ? fmtBR(preset.end_date) : "?"}
                        </div>
                      </div>
                      <button
                        title="Remover preset"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreset(preset.id);
                        }}
                        style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 12, padding: 4 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              gallery={gallery}
              onUpdate={(patch) => updateProject(p.id, patch)}
              onDelete={() => deleteProject(p.id)}
              onLogoFile={(f) => onProjectLogoFile(p.id, f)}
              onPickGalleryLogo={(url) => pickGalleryLogo(p.id, url)}
              onRemoveGalleryLogo={removeGalleryLogo}
              onAddDemand={(draft) => addDemand(p.id, draft)}
              onUpdateDemand={(did, patch) => updateDemand(p.id, did, patch)}
              onDeleteDemand={(did) => deleteDemand(p.id, did)}
              onSaveAsPreset={() => saveProjectAsPreset(p)}
            />
          ))}

          <datalist id="tiposDemanda">
            <option value="Mobilização" />
            <option value="Documentação" />
            <option value="Treinamento" />
          </datalist>

          <TicketsPanel tickets={tickets} onAdd={addTicket} onDelete={deleteTicket} />
        </div>
      ) : null}

      {view === "relatorio" ? (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px" }}>
          <div className="no-print" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 16 }}>
            {viewingHistory ? (
              <button className="btn-secondary" onClick={() => setViewingHistoryId(null)}>
                Voltar à semana atual
              </button>
            ) : null}
            <button className="btn-primary" onClick={handleExportPdf} disabled={pdfPending}>
              {pdfPending ? "Gerando PDF…" : "Exportar PDF"}
            </button>
            {!viewingHistory ? (
              <button className="btn-secondary" onClick={() => setShowCloseConfirm(true)}>
                Fechar semana e arquivar
              </button>
            ) : null}
          </div>
          <div className="ds-card report-page">
            <ReportView
              ref={reportRef}
              reportName={reportName}
              dateStr={reportDateStr}
              companyLogoUrl={settings.company_logo_url}
              projects={reportProjects}
              csm={reportCsm}
            />
          </div>
        </div>
      ) : null}

      {view === "historico" ? (
        <HistoryView
          history={history}
          onView={(id) => {
            setViewingHistoryId(id);
            setView("relatorio");
          }}
        />
      ) : null}

      <CloseWeekModal
        open={showCloseConfirm}
        pending={closePending}
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseWeek}
      />
    </div>
  );
}
