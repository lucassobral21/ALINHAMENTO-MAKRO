"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "./actions";

type FormState = { error?: string; message?: string } | null;

async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const res = await signIn(formData);
  return res ?? null;
}

async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const res = await signUp(formData);
  return res;
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInFormAction, signInPending] = useActionState(signInAction, null);
  const [signUpState, signUpFormAction, signUpPending] = useActionState(signUpAction, null);

  const state = mode === "signin" ? signInState : signUpState;
  const action = mode === "signin" ? signInFormAction : signUpFormAction;
  const pending = mode === "signin" ? signInPending : signUpPending;

  const inputStyle: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    color: "#1A1A1A",
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAFA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          padding: 32,
          width: "100%",
          maxWidth: 380,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-.01em", marginBottom: 4 }}>
          Alinhamento Semanal
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>
          {mode === "signin" ? "Entre para acessar seu painel." : "Crie sua conta para começar."}
        </div>

        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
              E-mail
            </div>
            <input name="email" type="email" required style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>
              Senha
            </div>
            <input name="password" type="password" required minLength={6} style={inputStyle} />
          </div>

          {state?.error ? (
            <div style={{ fontSize: 12.5, color: "#991B1B", background: "#FEE2E2", borderRadius: 8, padding: "8px 10px" }}>
              {state.error}
            </div>
          ) : null}
          {state?.message ? (
            <div style={{ fontSize: 12.5, color: "#166534", background: "#DCFCE7", borderRadius: 8, padding: "8px 10px" }}>
              {state.message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            style={{
              background: "#2C3E66",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: pending ? "default" : "pointer",
              opacity: pending ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {pending ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={{
            background: "none",
            border: "none",
            color: "#2C3E66",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 18,
            padding: 0,
          }}
        >
          {mode === "signin" ? "Ainda não tenho conta" : "Já tenho conta — entrar"}
        </button>
      </div>
    </div>
  );
}
