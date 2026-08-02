"use client";

import { useState } from "react";
import type { Demand, LogoGalleryItem, Project, Status } from "@/lib/types";
import { toISO } from "@/lib/dates";
import DemandCard from "./DemandCard";
import LogoUpload from "./LogoUpload";

interface Props {
  project: Project & { demands: Demand[] };
  gallery: LogoGalleryItem[];
  onUpdate: (patch: Partial<Project>) => void;
  onDelete: () => void;
  onLogoFile: (file: File) => void;
  onPickGalleryLogo: (url: string) => void;
  onRemoveGalleryLogo: (id: string) => void;
  onAddDemand: (draft: {
    type: string;
    collaborator: string;
    role: string;
    date: string;
    releaseDate: string;
    situation: string;
    observation: string;
    status: Status;
  }) => void;
  onUpdateDemand: (demandId: string, patch: Partial<Demand>) => void;
  onDeleteDemand: (demandId: string) => void;
  onSaveAsPreset: () => void;
}

function emptyDraft() {
  return {
    type: "",
    collaborator: "",
    role: "",
    date: toISO(new Date()),
    releaseDate: "",
    situation: "",
    observation: "",
    status: "vermelho" as Status,
  };
}

export default function ProjectCard({
  project: p,
  gallery,
  onUpdate,
  onDelete,
  onLogoFile,
  onPickGalleryLogo,
  onRemoveGalleryLogo,
  onAddDemand,
  onUpdateDemand,
  onDeleteDemand,
  onSaveAsPreset,
}: Props) {
  const [draft, setDraft] = useState(emptyDraft());
  const [presetSaved, setPresetSaved] = useState(false);

  const mondayPct = p.monday_pct ?? 0;
  const fridayPct = p.friday_pct ?? 0;
  const progression = fridayPct - mondayPct;
  const trendColor = progression >= 0 ? "#16a34a" : "#dc2626";
  const trendLabel =
    progression >= 0
      ? `Progressão positiva de ${progression}% na semana`
      : `Retração de ${Math.abs(progression)}% na semana`;

  function clampPct(n: string): number {
    const num = Number(n);
    if (Number.isNaN(num)) return 0;
    return Math.max(0, Math.min(100, Math.round(num)));
  }

  function submitDraft() {
    if (!draft.type && !draft.collaborator) return;
    onAddDemand(draft);
    setDraft(emptyDraft());
  }

  return (
    <div className="ds-card" style={{ borderLeft: `3px solid ${p.color}`, padding: 24, marginBottom: 16, position: "relative" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <LogoUpload
          logoUrl={p.logo_url}
          onFile={onLogoFile}
          gallery={gallery}
          onPickGallery={onPickGalleryLogo}
          onRemoveGallery={onRemoveGalleryLogo}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            className="ds-input-ghost"
            defaultValue={p.name}
            onBlur={(e) => e.target.value !== p.name && onUpdate({ name: e.target.value })}
            placeholder="Nome do projeto"
            style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", width: "100%", padding: "2px 0" }}
          />
          <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
              Início
              <input
                type="date"
                className="ds-input"
                defaultValue={p.start_date || ""}
                onChange={(e) => onUpdate({ start_date: e.target.value || null })}
                style={{ padding: "6px 8px", fontSize: 12, width: "auto" }}
              />
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 6 }}>
              Fim
              <input
                type="date"
                className="ds-input"
                defaultValue={p.end_date || ""}
                onChange={(e) => onUpdate({ end_date: e.target.value || null })}
                style={{ padding: "6px 8px", fontSize: 12, width: "auto" }}
              />
            </div>
          </div>
        </div>
        <input
          type="color"
          defaultValue={p.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
          style={{ width: 32, height: 32, border: "1px solid #E5E7EB", borderRadius: 8, cursor: "pointer", padding: 0 }}
        />
        <button
          className="btn-icon"
          aria-label="Favoritar como preset"
          title="Salvar nome, ícone e datas como preset reaproveitável"
          onClick={() => {
            onSaveAsPreset();
            setPresetSaved(true);
          }}
          style={{ color: presetSaved ? "#F59E0B" : undefined }}
        >
          {presetSaved ? "★" : "☆"}
        </button>
        <button className="btn-icon" aria-label="Remover projeto" onClick={onDelete}>
          ✕
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          margin: "16px 0",
          padding: "14px 16px",
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>% segunda</span>
          <input
            type="number"
            min={0}
            max={100}
            className="ds-input"
            defaultValue={mondayPct}
            onBlur={(e) => onUpdate({ monday_pct: clampPct(e.target.value) })}
            style={{ width: 60, padding: "6px 8px", fontSize: 12 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>% sexta</span>
          <input
            type="number"
            min={0}
            max={100}
            className="ds-input"
            defaultValue={fridayPct}
            onBlur={(e) => onUpdate({ friday_pct: clampPct(e.target.value) })}
            style={{ width: 60, padding: "6px 8px", fontSize: 12 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22 }}>
            {[8, 13, 18, 22].map((h, i) => (
              <div key={i} style={{ width: 5, height: h, background: trendColor, borderRadius: 1 }} />
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: trendColor }}>{trendLabel}</div>
        </div>
      </div>

      <div style={{ margin: "0 0 16px" }}>
        <div className="ds-kicker" style={{ marginBottom: 6 }}>
          Observações gerais
        </div>
        <textarea
          className="ds-input"
          defaultValue={p.general_notes}
          onBlur={(e) => e.target.value !== p.general_notes && onUpdate({ general_notes: e.target.value })}
          placeholder="Contexto sobre o andamento da semana (opcional)"
          rows={2}
          style={{ width: "100%", padding: "10px 12px", fontSize: 13, color: "#1A1A1A", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
        />
      </div>

      <div className="ds-kicker" style={{ margin: "20px 0 10px" }}>
        Principais demandas
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {p.demands.map((d) => (
          <DemandCard
            key={d.id}
            demand={d}
            onUpdate={(patch) => onUpdateDemand(d.id, patch)}
            onDelete={() => onDeleteDemand(d.id)}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "14px 16px" }}>
        <input
          list="tiposDemanda"
          className="ds-input"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          placeholder="Tipo"
          style={{ width: 110 }}
        />
        <input
          className="ds-input"
          value={draft.collaborator}
          onChange={(e) => setDraft({ ...draft, collaborator: e.target.value })}
          placeholder="Colaborador"
          style={{ width: 130 }}
        />
        <input
          className="ds-input"
          value={draft.role}
          onChange={(e) => setDraft({ ...draft, role: e.target.value })}
          placeholder="Função"
          style={{ width: 110 }}
        />
        <input
          type="date"
          className="ds-input"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
        />
        <input
          type="date"
          title="Data de liberação (opcional)"
          className="ds-input"
          value={draft.releaseDate}
          onChange={(e) => setDraft({ ...draft, releaseDate: e.target.value })}
        />
        <input
          className="ds-input"
          value={draft.situation}
          onChange={(e) => setDraft({ ...draft, situation: e.target.value })}
          placeholder="Situação"
          style={{ flex: 1, minWidth: 140 }}
        />
        <input
          className="ds-input"
          value={draft.observation}
          onChange={(e) => setDraft({ ...draft, observation: e.target.value })}
          placeholder="Observação (opcional)"
          style={{ flex: 1, minWidth: 140 }}
        />
        <select
          className="ds-input"
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}
        >
          <option value="vermelho">Atenção</option>
          <option value="amarelo">Em andamento</option>
          <option value="verde">Concluído</option>
        </select>
        <button className="btn-primary" onClick={submitDraft}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}
