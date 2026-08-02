# Alinhamento Semanal

Sistema pessoal de acompanhamento semanal de demandas e chamados, com login, persistência em
Supabase e exportação de relatório em PDF.

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage) — banco de dados, login e armazenamento das logos
- `html2canvas` + `jspdf` — geração real do PDF do relatório

## Configuração local

1. Crie um projeto no [supabase.com](https://supabase.com) (veja o passo a passo completo no
   README raiz do repositório).
2. Rode `supabase/schema.sql` inteiro no **SQL Editor** do seu projeto Supabase.
3. Copie `.env.local.example` para `.env.local` e preencha com a **Project URL** e a
   **anon public key** do seu projeto (Supabase Dashboard > Project Settings > API).
4. `npm install`
5. `npm run dev` — acesse `http://localhost:3000`, clique em "Ainda não tenho conta" para criar
   seu login.

## Deploy

Publique este diretório (`webapp/`) na Vercel como Root Directory, com as mesmas duas variáveis
de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) configuradas no painel
do projeto Vercel.
