"use client";

import type { Demand, Status } from "@/lib/types";
import { STATUS_COLOR, STATUS_PILL } from "@/lib/constants";

interface Props {
  demand: Demand;
  onUpdate: (patch: Partial<Demand>) => void;
  onDelete: () => void;
}

export default function DemandCard({ demand: d, onUpdate, onDelete }: Props) {
  const pill = STATUS_PILL[d.status] || STATUS_PILL.amarelo;
  return (
    <div className="ds-card" style={{ borderLeft: `3px solid ${STATUS_COLOR[d.status]}`, padding: "14px 16px" }}>
      <input
        defaultValue={d.type}
        onBlur={(e) => e.target.value !== d.type && onUpdate({ type: e.target.value })}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".03em",
          color: "#1A1A1A",
          textTransform: "uppercase",
          width: "100%",
          marginBottom: 8,
          padding: 0,
        }}
      />
      <input
        defaultValue={d.collaborator}
        onBlur={(e) => e.target.value !== d.collaborator && onUpdate({ collaborator: e.target.value })}
        placeholder="Colaborador"
        style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#1A1A1A", width: "100%", marginBottom: 2, padding: 0 }}
      />
      <input
        defaultValue={d.role}
        onBlur={(e) => e.target.value !== d.role && onUpdate({ role: e.target.value })}
        placeholder="Função"
        style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "#6B7280", width: "100%", marginBottom: 2, padding: 0 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>Solicitado</span>
        <input
          type="date"
          defaultValue={d.date || ""}
          onChange={(e) => onUpdate({ date: e.target.value || null })}
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 11, color: "#6B7280", flex: 1, padding: 0 }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>Liberado</span>
        <input
          type="date"
          defaultValue={d.release_date || ""}
          onChange={(e) => onUpdate({ release_date: e.target.value || null })}
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 11, color: "#6B7280", flex: 1, padding: 0 }}
        />
      </div>
      <textarea
        defaultValue={d.situation}
        onBlur={(e) => e.target.value !== d.situation && onUpdate({ situation: e.target.value })}
        placeholder="Situação"
        rows={2}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: 12,
          color: "#1A1A1A",
          width: "100%",
          resize: "none",
          fontFamily: "inherit",
          marginBottom: 6,
          padding: 0,
          boxSizing: "border-box",
        }}
      />
      <textarea
        defaultValue={d.observation}
        onBlur={(e) => e.target.value !== d.observation && onUpdate({ observation: e.target.value })}
        placeholder="Observação (opcional)"
        rows={2}
        style={{
          border: "1px dashed #E5E7EB",
          outline: "none",
          background: "#F9FAFB",
          fontSize: 11,
          color: "#6B7280",
          width: "100%",
          resize: "none",
          fontFamily: "inherit",
          marginBottom: 10,
          padding: 6,
          borderRadius: 6,
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <select
          className="status-pill"
          defaultValue={d.status}
          onChange={(e) => onUpdate({ status: e.target.value as Status })}
          style={{ background: pill.bg, color: pill.text }}
        >
          <option value="verde">Concluído</option>
          <option value="amarelo">Em andamento</option>
          <option value="vermelho">Atenção</option>
        </select>
        <button className="btn-ghost" onClick={onDelete}>
          remover
        </button>
      </div>
    </div>
  );
}
