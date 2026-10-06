// API-kontraktet mellan api/ och client/.

export interface Guide {
  id: number;
  slug: string;
  title: string;
  region: string;
  difficulty: "lätt" | "medel" | "svår";
  length_km: number;
  body_html: string;
  hero_image: string | null;
  published: boolean;
  author_id: number | null;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  display_name: string;
  role: "member" | "editor";
  created_at: string;
}

export interface Tour {
  id: number;
  user_id: number;
  guide_id: number | null;
  title: string;
  started_at: string;
  distance_m: number;
  notes: string | null;
}

export interface TourLog {
  id: number;
  tour_id: number;
  recorded_at: string;
  lat: number;
  lon: number;
  elevation_m: number | null;
  heart_rate: number | null;
  note: string | null;
}

export interface Photo {
  id: number;
  tour_id: number;
  filename: string;
  width: number;
  height: number;
  created_at: string;
}

/** GET /api/tours – varje tur med användare, guide, bilder och loggar inbakade */
export interface TourWithRelations extends Tour {
  user?: User; // saknas om användaren raderats – inga foreign keys (Debt 10, #12)
  guide: Guide | null;
  photos: Photo[];
  logs: TourLog[];
}

/** Fel från API */
export interface ApiError {
  error: string;
}
