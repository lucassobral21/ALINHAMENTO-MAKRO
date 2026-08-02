-- Alinhamento Semanal — schema do banco de dados
-- Rode este script inteiro no SQL Editor do seu projeto Supabase
-- (Supabase Dashboard > SQL Editor > New query > colar > Run).

-- ── Configurações do usuário (nome do relatório, semana atual, logo da empresa) ──
create table if not exists app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  report_name text not null default '',
  week_start date not null default date_trunc('week', current_date)::date,
  week_end date not null default (date_trunc('week', current_date)::date + 4),
  company_logo_url text,
  updated_at timestamptz not null default now()
);

alter table app_settings add column if not exists week_end date;
update app_settings set week_end = week_start + 4 where week_end is null;
alter table app_settings alter column week_end set not null;

-- ── Projetos ──
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Novo projeto',
  color text not null default '#2C3E66',
  start_date date,
  end_date date,
  monday_pct int not null default 0,
  friday_pct int not null default 0,
  general_notes text not null default '',
  logo_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Demandas (cards "Principais demandas") ──
create table if not exists demands (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default '',
  collaborator text not null default '',
  role text not null default '',
  date date,
  release_date date,
  situation text not null default '',
  observation text not null default '',
  status text not null default 'amarelo' check (status in ('verde', 'amarelo', 'vermelho')),
  created_at timestamptz not null default now()
);

-- ── Chamados CSM ──
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default '',
  requester text not null default '',
  qty int not null default 1,
  note text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── Galeria de logos salvas (reaproveitar entre projetos/semanas) ──
create table if not exists logo_gallery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  created_at timestamptz not null default now()
);

-- ── Presets de projetos favoritados (ícone, nome, início e fim reaproveitáveis) ──
create table if not exists project_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- ── Histórico de semanas fechadas (snapshot completo em JSON) ──
create table if not exists history_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_label text not null,
  closed_at timestamptz not null default now(),
  report_name text not null default '',
  date_str text not null default '',
  week_start date not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security: cada usuário só vê/edita os próprios dados ──
alter table app_settings enable row level security;
alter table projects enable row level security;
alter table demands enable row level security;
alter table tickets enable row level security;
alter table logo_gallery enable row level security;
alter table project_presets enable row level security;
alter table history_weeks enable row level security;

drop policy if exists "own rows" on app_settings;
create policy "own rows" on app_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on projects;
create policy "own rows" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on demands;
create policy "own rows" on demands for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on tickets;
create policy "own rows" on tickets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on logo_gallery;
create policy "own rows" on logo_gallery for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on project_presets;
create policy "own rows" on project_presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on history_weeks;
create policy "own rows" on history_weeks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Storage: bucket para logos (empresa, clientes, galeria) ──
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos public read" on storage.objects;
create policy "logos public read" on storage.objects for select using (bucket_id = 'logos');

drop policy if exists "logos own write" on storage.objects;
create policy "logos own write" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos own update" on storage.objects;
create policy "logos own update" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos own delete" on storage.objects;
create policy "logos own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── "Fechar Semana": arquiva a semana atual e zera demandas/chamados/observações ──
-- Roda tudo numa única transação no banco (atômico) — se algo falhar, nada é alterado.
drop function if exists close_week(text, text, text, date, jsonb, date);

create or replace function close_week(
  p_week_label text,
  p_report_name text,
  p_date_str text,
  p_week_start date,
  p_snapshot jsonb,
  p_next_week_start date,
  p_next_week_end date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into history_weeks (user_id, week_label, report_name, date_str, week_start, snapshot)
  values (v_uid, p_week_label, p_report_name, p_date_str, p_week_start, p_snapshot)
  returning id into v_id;

  delete from demands where user_id = v_uid;
  delete from tickets where user_id = v_uid;

  update projects set general_notes = '', monday_pct = 0, friday_pct = 0 where user_id = v_uid;

  update app_settings set week_start = p_next_week_start, week_end = p_next_week_end, updated_at = now() where user_id = v_uid;

  return v_id;
end;
$$;

grant execute on function close_week(text, text, text, date, jsonb, date, date) to authenticated;
