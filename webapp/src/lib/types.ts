export type Status = "verde" | "amarelo" | "vermelho";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
  monday_pct: number;
  friday_pct: number;
  general_notes: string;
  logo_url: string | null;
  position: number;
  created_at: string;
}

export interface Demand {
  id: string;
  project_id: string;
  user_id: string;
  type: string;
  collaborator: string;
  role: string;
  date: string | null;
  release_date: string | null;
  situation: string;
  observation: string;
  status: Status;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  type: string;
  requester: string;
  qty: number;
  note: string;
  date: string;
  created_at: string;
}

export interface LogoGalleryItem {
  id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface AppSettings {
  user_id: string;
  report_name: string;
  week_start: string;
  company_logo_url: string | null;
  updated_at: string;
}

export interface HistoryWeekSnapshot {
  projects: (Project & { demands: Demand[] })[];
  tickets: Ticket[];
}

export interface HistoryWeek {
  id: string;
  user_id: string;
  week_label: string;
  closed_at: string;
  report_name: string;
  date_str: string;
  week_start: string;
  snapshot: HistoryWeekSnapshot;
  created_at: string;
}
