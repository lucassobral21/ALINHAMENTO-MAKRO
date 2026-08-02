import type { Demand, Project, Ticket } from "./types";
import { addDays, fmtBR } from "./dates";
import { gaugeBg, gaugeColor, ticketIcon } from "./constants";

export interface ReportDemandView {
  id: string;
  type: string;
  collaborator: string;
  role: string;
  dateStr: string;
  hasRelease: boolean;
  releaseDateStr: string;
  situation: string;
  hasObservation: boolean;
  observation: string;
  borderColor: string;
}

export interface ReportProjectView {
  id: string;
  name: string;
  color: string;
  logoUrl: string | null;
  startStr: string;
  endStr: string;
  mondayDateStr: string;
  fridayDateStr: string;
  mondayPctStr: string;
  fridayPctStr: string;
  mondayColor: string;
  fridayColor: string;
  mondayGaugeBg: string;
  fridayGaugeBg: string;
  trendColor: string;
  trendLabel: string;
  hasGeneralNotes: boolean;
  generalNotes: string;
  demands: ReportDemandView[];
}

export function buildReportProject(
  p: Project,
  demands: Demand[],
  weekStart: string
): ReportProjectView {
  const fridayISO = addDays(weekStart, 4);
  const mondayPct = p.monday_pct ?? 0;
  const fridayPct = p.friday_pct ?? 0;
  const progression = fridayPct - mondayPct;
  const trendColor = progression >= 0 ? "#16a34a" : "#dc2626";
  const trendLabel =
    progression >= 0
      ? `Progressão positiva de ${progression}% na semana`
      : `Retração de ${Math.abs(progression)}% na semana`;
  const mColor = gaugeColor(mondayPct);
  const fColor = gaugeColor(fridayPct);

  return {
    id: p.id,
    name: p.name,
    color: p.color,
    logoUrl: p.logo_url,
    startStr: fmtBR(p.start_date),
    endStr: fmtBR(p.end_date),
    mondayDateStr: fmtBR(weekStart),
    fridayDateStr: fmtBR(fridayISO),
    mondayPctStr: mondayPct + "%",
    fridayPctStr: fridayPct + "%",
    mondayColor: mColor,
    fridayColor: fColor,
    mondayGaugeBg: gaugeBg(mondayPct, mColor),
    fridayGaugeBg: gaugeBg(fridayPct, fColor),
    trendColor,
    trendLabel,
    hasGeneralNotes: !!(p.general_notes && p.general_notes.trim()),
    generalNotes: p.general_notes || "",
    demands: demands.map((d) => ({
      id: d.id,
      type: d.type,
      collaborator: d.collaborator,
      role: d.role,
      dateStr: fmtBR(d.date),
      hasRelease: !!d.release_date,
      releaseDateStr: d.release_date ? fmtBR(d.release_date) : "",
      situation: d.situation,
      hasObservation: !!(d.observation && d.observation.trim()),
      observation: d.observation || "",
      borderColor: gaugeColorForStatus(d.status),
    })),
  };
}

function gaugeColorForStatus(status: string): string {
  if (status === "verde") return "#16a34a";
  if (status === "vermelho") return "#dc2626";
  return "#d97706";
}

export interface TicketView {
  id: string;
  type: string;
  requester: string;
  qty: number;
  note: string;
  icon: string;
  hasNote: boolean;
}

export interface CsmSummary {
  total: number;
  breakdownStr: string;
  highlight: string;
  ticketsView: TicketView[];
}

export function buildCsmSummary(tickets: Ticket[]): CsmSummary {
  const total = tickets.reduce((s, t) => s + t.qty, 0);
  const breakdownMap: Record<string, number> = {};
  tickets.forEach((t) => {
    breakdownMap[t.type] = (breakdownMap[t.type] || 0) + t.qty;
  });
  const entries = Object.entries(breakdownMap);
  const breakdownStr = entries.map(([type, count]) => `${type}: ${count}`).join(" · ");
  let highlight = "";
  if (total > 0 && entries.length > 0) {
    const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    const pct = Math.round((top[1] / total) * 100);
    if (pct >= 50) highlight = `${top[0]} representou ${pct}% dos chamados desta semana`;
  }
  return {
    total,
    breakdownStr: breakdownStr || "Nenhum chamado registrado",
    highlight,
    ticketsView: tickets.map((t) => ({
      id: t.id,
      type: t.type,
      requester: t.requester,
      qty: t.qty,
      note: t.note,
      icon: ticketIcon(t.type),
      hasNote: !!(t.note && t.note.trim()),
    })),
  };
}
