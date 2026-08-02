import type { Status } from "./types";

export const STATUS_COLOR: Record<Status, string> = {
  verde: "#16a34a",
  amarelo: "#d97706",
  vermelho: "#dc2626",
};

export const STATUS_PILL: Record<Status, { bg: string; text: string }> = {
  verde: { bg: "#DCFCE7", text: "#166534" },
  amarelo: { bg: "#FEF3C7", text: "#92400E" },
  vermelho: { bg: "#FEE2E2", text: "#991B1B" },
};

export const STATUS_LABEL: Record<Status, string> = {
  verde: "Concluído",
  amarelo: "Em andamento",
  vermelho: "Atenção",
};

export function ticketIcon(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("mobiliza")) return "👤";
  if (t.includes("documento")) return "📄";
  return "🎫";
}

export function gaugeColor(pct: number, low = 35, high = 70): string {
  if (pct >= high) return STATUS_COLOR.verde;
  if (pct >= low) return STATUS_COLOR.amarelo;
  return STATUS_COLOR.vermelho;
}

export function gaugeBg(pct: number, color: string): string {
  return `conic-gradient(${color} ${pct * 3.6}deg, #e5e7eb 0deg)`;
}
