"use client";

import { forwardRef } from "react";
import type { CsmSummary, ReportProjectView } from "@/lib/report";

interface Props {
  reportName: string;
  dateStr: string;
  companyLogoUrl: string | null;
  projects: ReportProjectView[];
  csm: CsmSummary;
}

function Gauge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <div style={{ position: "relative", width: 46, height: 46, borderRadius: "50%", flexShrink: 0, background: bg }}>
      <div
        style={{
          position: "absolute",
          inset: 5,
          background: "#fff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function LogoBox({ url, size }: { url: string | null; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        border: "1px solid #E5E7EB",
        borderRadius: size > 30 ? 10 : 8,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : null}
    </div>
  );
}

const ReportView = forwardRef<HTMLDivElement, Props>(function ReportView(
  { reportName, dateStr, companyLogoUrl, projects, csm },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#1A1A1A",
        background: "#fff",
        padding: "0.55in",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <div
        data-pdf-block
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderBottom: "2px solid #1A1A1A",
          paddingBottom: 14,
          marginBottom: 20,
          background: "#fff",
        }}
      >
        <LogoBox url={companyLogoUrl} size={52} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: ".01em" }}>
            ALINHAMENTO SEMANAL DE DEMANDAS
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{reportName}</div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{dateStr}</div>
        </div>
      </div>

      {projects.map((p) => (
        <div
          key={p.id}
          data-pdf-block
          style={{
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            padding: "16px 18px",
            marginBottom: 18,
            background: "#fff",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              color: "#6B7280",
              marginBottom: 8,
            }}
          >
            PROJETOS
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderLeft: `4px solid ${p.color}`,
              paddingLeft: 12,
              marginBottom: 10,
            }}
          >
            <LogoBox url={p.logoUrl} size={44} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>
                Previsão de início: {p.startStr} · Previsão de fim: {p.endStr}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 22 }}>
              {[8, 13, 18, 22].map((h, i) => (
                <div key={i} style={{ width: 5, height: h, background: p.trendColor, borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: p.trendColor }}>{p.trendLabel}</div>
          </div>

          {p.hasGeneralNotes ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "#6B7280", marginBottom: 4 }}>
                OBSERVAÇÕES
              </div>
              <div style={{ fontSize: 11.5, color: "#1A1A1A" }}>{p.generalNotes}</div>
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <LogoBox url={p.logoUrl} size={28} />
              <div style={{ flex: 1, fontSize: 11, color: "#6B7280" }}>
                Segunda-feira
                <br />
                <b style={{ color: "#1A1A1A" }}>{p.mondayDateStr}</b>
              </div>
              <Gauge bg={p.mondayGaugeBg} color={p.mondayColor} label={p.mondayPctStr} />
            </div>
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: 10,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <LogoBox url={p.logoUrl} size={28} />
              <div style={{ flex: 1, fontSize: 11, color: "#6B7280" }}>
                Sexta-feira
                <br />
                <b style={{ color: "#1A1A1A" }}>{p.fridayDateStr}</b>
              </div>
              <Gauge bg={p.fridayGaugeBg} color={p.fridayColor} label={p.fridayPctStr} />
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", color: "#6B7280", marginBottom: 8 }}>
            PRINCIPAIS DEMANDAS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {p.demands.map((d) => (
              <div
                key={d.id}
                style={{
                  border: "1px solid #E5E7EB",
                  borderLeft: `3px solid ${d.borderColor}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".03em", marginBottom: 3 }}>
                  {d.type}
                </div>
                <div style={{ fontSize: 10.5 }}>Colaborador: {d.collaborator}</div>
                <div style={{ fontSize: 10.5, color: "#6B7280" }}>Função: {d.role}</div>
                <div style={{ fontSize: 10.5, color: "#6B7280" }}>Solicitado: {d.dateStr}</div>
                {d.hasRelease ? (
                  <div style={{ fontSize: 10.5, color: "#6B7280" }}>Liberado: {d.releaseDateStr}</div>
                ) : null}
                <div style={{ fontSize: 10.5 }}>Situação: {d.situation}</div>
                {d.hasObservation ? (
                  <div style={{ fontSize: 10.5, color: "#6B7280" }}>Observação: {d.observation}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        data-pdf-block
        style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "16px 18px", background: "#fff" }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".08em",
            color: "#6B7280",
            marginBottom: 10,
          }}
        >
          CHAMADOS CSM
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#16A34A",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A", letterSpacing: "-.01em" }}>
            {csm.total} chamados solucionados na semana
          </div>
        </div>
        <div style={{ fontSize: 11.5, color: "#6B7280", marginBottom: 4 }}>{csm.breakdownStr}</div>
        {csm.highlight ? (
          <div style={{ fontSize: 11.5, color: "#166534", fontWeight: 700, marginBottom: 12 }}>
            ★ {csm.highlight}
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {csm.ticketsView.map((t) => (
            <div
              key={t.id}
              style={{
                border: "1px solid #E5E7EB",
                borderLeft: "3px solid #2C3E66",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".03em" }}>{t.type}</span>
              </div>
              <div style={{ fontSize: 10.5 }}>{t.requester}</div>
              <div style={{ fontSize: 10.5, color: "#6B7280" }}>Quantidade: {t.qty}</div>
              {t.hasNote ? <div style={{ fontSize: 10.5, color: "#6B7280" }}>{t.note}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ReportView;
