"use client";

interface Props {
  open: boolean;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CloseWeekModal({ open, pending, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          padding: 28,
          maxWidth: 420,
          width: "90%",
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", marginBottom: 10 }}>
          Você deseja realmente fechar essa semana?
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, marginBottom: 24 }}>
          Todas as demandas e chamados lançados nesta semana serão removidos. Os projetos
          cadastrados serão mantidos, e um registro desta semana ficará salvo no Histórico.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn-secondary" onClick={onCancel} disabled={pending}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={pending}>
            {pending ? "Fechando…" : "Sim, fechar semana"}
          </button>
        </div>
      </div>
    </div>
  );
}
