import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppSettings,
  Demand,
  HistoryWeek,
  LogoGalleryItem,
  Project,
  Status,
  Ticket,
} from "./types";
import { mondayOf, toISO } from "./dates";

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ── App settings ──────────────────────────────────────────────
export async function fetchOrCreateAppSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<AppSettings> {
  const existing = await supabase
    .from("app_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as AppSettings;

  const created = await supabase
    .from("app_settings")
    .insert({ user_id: userId, report_name: "", week_start: toISO(mondayOf(new Date())) })
    .select("*")
    .single();
  return must(created);
}

export async function updateAppSettings(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Pick<AppSettings, "report_name" | "week_start" | "company_logo_url">>
): Promise<void> {
  const res = await supabase.from("app_settings").update(patch).eq("user_id", userId);
  if (res.error) throw new Error(res.error.message);
}

// ── Projects ───────────────────────────────────────────────────
export async function fetchProjects(supabase: SupabaseClient): Promise<Project[]> {
  const res = await supabase.from("projects").select("*").order("position", { ascending: true });
  return must(res) ?? [];
}

export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  position: number
): Promise<Project> {
  const res = await supabase
    .from("projects")
    .insert({ user_id: userId, name: "Novo projeto", color: "#2C3E66", position })
    .select("*")
    .single();
  return must(res);
}

export async function updateProject(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Project>
): Promise<void> {
  const res = await supabase.from("projects").update(patch).eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteProject(supabase: SupabaseClient, id: string): Promise<void> {
  const res = await supabase.from("projects").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

// ── Demands ────────────────────────────────────────────────────
export async function fetchDemands(supabase: SupabaseClient): Promise<Demand[]> {
  const res = await supabase.from("demands").select("*").order("created_at", { ascending: true });
  return must(res) ?? [];
}

export async function createDemand(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  draft: {
    type: string;
    collaborator: string;
    role: string;
    date: string;
    releaseDate: string;
    situation: string;
    observation: string;
    status: Status;
  }
): Promise<Demand> {
  const res = await supabase
    .from("demands")
    .insert({
      user_id: userId,
      project_id: projectId,
      type: draft.type,
      collaborator: draft.collaborator,
      role: draft.role,
      date: draft.date || null,
      release_date: draft.releaseDate || null,
      situation: draft.situation,
      observation: draft.observation,
      status: draft.status,
    })
    .select("*")
    .single();
  return must(res);
}

export async function updateDemand(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Demand>
): Promise<void> {
  const res = await supabase.from("demands").update(patch).eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function deleteDemand(supabase: SupabaseClient, id: string): Promise<void> {
  const res = await supabase.from("demands").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

// ── Tickets (Chamados CSM) ────────────────────────────────────
export async function fetchTickets(supabase: SupabaseClient): Promise<Ticket[]> {
  const res = await supabase.from("tickets").select("*").order("created_at", { ascending: true });
  return must(res) ?? [];
}

export async function createTicket(
  supabase: SupabaseClient,
  userId: string,
  draft: { type: string; requester: string; qty: number; note: string }
): Promise<Ticket> {
  const res = await supabase
    .from("tickets")
    .insert({
      user_id: userId,
      type: draft.type,
      requester: draft.requester,
      qty: draft.qty,
      note: draft.note,
      date: toISO(new Date()),
    })
    .select("*")
    .single();
  return must(res);
}

export async function deleteTicket(supabase: SupabaseClient, id: string): Promise<void> {
  const res = await supabase.from("tickets").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

// ── Logo gallery ───────────────────────────────────────────────
export async function fetchGallery(supabase: SupabaseClient): Promise<LogoGalleryItem[]> {
  const res = await supabase
    .from("logo_gallery")
    .select("*")
    .order("created_at", { ascending: true });
  return must(res) ?? [];
}

export async function upsertGalleryLogo(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  url: string
): Promise<void> {
  if (!name.trim()) return;
  const existing = await supabase
    .from("logo_gallery")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name.trim())
    .maybeSingle();
  if (existing.data) {
    const res = await supabase.from("logo_gallery").update({ url }).eq("id", existing.data.id);
    if (res.error) throw new Error(res.error.message);
  } else {
    const res = await supabase
      .from("logo_gallery")
      .insert({ user_id: userId, name: name.trim(), url });
    if (res.error) throw new Error(res.error.message);
  }
}

export async function deleteGalleryLogo(supabase: SupabaseClient, id: string): Promise<void> {
  const res = await supabase.from("logo_gallery").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

// ── Storage: upload a logo file, return its public URL ─────────
export async function uploadLogo(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("logos").upload(path, file, { upsert: false });
  if (up.error) throw new Error(up.error.message);
  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return data.publicUrl;
}

// ── History ────────────────────────────────────────────────────
export async function fetchHistoryList(supabase: SupabaseClient): Promise<HistoryWeek[]> {
  const res = await supabase
    .from("history_weeks")
    .select("id,user_id,week_label,closed_at,report_name,date_str,week_start,created_at,snapshot")
    .order("closed_at", { ascending: false });
  return must(res) ?? [];
}

export async function closeWeek(
  supabase: SupabaseClient,
  args: {
    weekLabel: string;
    reportName: string;
    dateStr: string;
    weekStart: string;
    snapshot: unknown;
    nextWeekStart: string;
  }
): Promise<string> {
  const res = await supabase.rpc("close_week", {
    p_week_label: args.weekLabel,
    p_report_name: args.reportName,
    p_date_str: args.dateStr,
    p_week_start: args.weekStart,
    p_snapshot: args.snapshot,
    p_next_week_start: args.nextWeekStart,
  });
  if (res.error) throw new Error(res.error.message);
  return res.data as string;
}
