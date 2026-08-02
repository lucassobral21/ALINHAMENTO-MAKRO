"use client";

import type { HistoryWeek } from "@/lib/types";

interface Props {
  history: HistoryWeek[];
  onView: (id: string) => void;
}

export default function HistoryView({ history, onView }: Props) {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>
      <div className="ds-kicker" style={{ marginBottom: 16 }}>
        Semanas arquivadas
      </div>
      {history.length === 0 ? (
        <div style={{ color: "#6B7280", fontSize: 13 }}>Nenhuma semana arquivada ainda.</div>
      ) : (
        history.map((h) => (
          <div
            key={h.id}
            className="ds-card"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", marginBottom: 12 }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{h.week_label}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>
                Arquivada em {new Date(h.closed_at).toLocaleString("pt-BR")}
              </div>
            </div>
            <button className="btn-secondary" onClick={() => onView(h.id)}>
              Ver relatório
            </button>
          </div>
        ))
      )}
    </div>
  );
}
