"use client";

import { useState } from "react";
import type { Ticket } from "@/lib/types";
import { buildCsmSummary } from "@/lib/report";

interface Props {
  tickets: Ticket[];
  onAdd: (draft: { type: string; requester: string; qty: number; note: string }) => void;
  onDelete: (id: string) => void;
}

function emptyDraft() {
  return { type: "", requester: "", qty: "", note: "" };
}

export default function TicketsPanel({ tickets, onAdd, onDelete }: Props) {
  const [draft, setDraft] = useState(emptyDraft());
  const csm = buildCsmSummary(tickets);

  function submit() {
    if (!draft.type) return;
    onAdd({ type: draft.type, requester: draft.requester, qty: Number(draft.qty) || 1, note: draft.note });
    setDraft(emptyDraft());
  }

  return (
    <div className="ds-card" style={{ marginTop: 8, padding: 24 }}>
      <div className="ds-kicker" style={{ marginBottom: 10 }}>
        Chamados CSM
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#16A34A",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#16A34A", letterSpacing: "-.01em" }}>
          {csm.total} chamados solucionados na semana
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 6 }}>{csm.breakdownStr}</div>
      {csm.highlight ? (
        <div style={{ fontSize: 12.5, color: "#166534", fontWeight: 700, marginBottom: 18 }}>★ {csm.highlight}</div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
        {csm.ticketsView.map((t) => (
          <div key={t.id} className="ds-card" style={{ borderLeft: "3px solid #2C3E66", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".03em", color: "#1A1A1A", textTransform: "uppercase" }}>
                {t.type}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#1A1A1A", marginBottom: 2 }}>{t.requester}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>Quantidade: {t.qty}</div>
            {t.hasNote ? <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>{t.note}</div> : null}
            <div style={{ textAlign: "right" }}>
              <button className="btn-ghost" onClick={() => onDelete(t.id)}>
                remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "14px 16px" }}>
        <input
          list="tiposChamado"
          className="ds-input"
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          placeholder="Tipo"
          style={{ width: 170 }}
        />
        <input
          className="ds-input"
          value={draft.requester}
          onChange={(e) => setDraft({ ...draft, requester: e.target.value })}
          placeholder="Solicitante / setor"
          style={{ width: 150 }}
        />
        <input
          type="number"
          min={1}
          className="ds-input"
          value={draft.qty}
          onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
          placeholder="Qtd"
          style={{ width: 70 }}
        />
        <input
          className="ds-input"
          value={draft.note}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          placeholder="Observação"
          style={{ flex: 1, minWidth: 140 }}
        />
        <button className="btn-primary" onClick={submit}>
          + Registrar
        </button>
      </div>
      <datalist id="tiposChamado">
        <option value="Mobilização" />
        <option value="Solicitação de documentos" />
      </datalist>
    </div>
  );
}
