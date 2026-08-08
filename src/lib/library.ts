import { api } from "./api";
import type { Conversation } from "./conversations";

export type SavedItemType =
  | "relationship_report"
  | "blueprint_insight"
  | "compatibility_guidance";
export interface SavedItem {
  id: string;
  item_type: SavedItemType;
  relationship_id?: string;
  blueprint_id?: string;
  report_id?: string;
  content_key?: string;
  created_at?: string;
}
export interface ShareCard {
  id: string;
  relationship_id?: string;
  payload: {
    overall_score?: number;
    strongest_category?: string;
    strongest_category_score?: number;
  };
  expires_at?: string | null;
  created_at?: string;
}
export interface Library {
  saved_items: SavedItem[];
  share_cards: ShareCard[];
  conversations: Conversation[];
}
export const libraryApi = {
  get: (signal?: AbortSignal) => api<Library>("/api/v1/library", { signal }),
  save: (input: {
    item_type: SavedItemType;
    relationship_id?: string;
    blueprint_id?: string;
    report_id?: string;
    content_key?: string;
  }) =>
    api<SavedItem>("/api/v1/saved-items", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    api<void>(`/api/v1/saved-items/${id}`, { method: "DELETE" }),
  createShare: (relationshipId: string) =>
    api<ShareCard>(`/api/v1/relationships/${relationshipId}/share-cards`, {
      method: "POST",
      body: JSON.stringify({ expires_at: null }),
    }),
  revokeShare: (id: string) =>
    api<void>(`/api/v1/share-cards/${id}`, { method: "DELETE" }),
};
