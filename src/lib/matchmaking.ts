import { api, idempotencyHeaders } from './api';

export interface Introduction {
  user_id:string;
  display_name:string;
  username:string|null;
  age:number;
  bio:string|null;
  location_label:string|null;
  distance_km:number;
  relationship_intent:string;
  interests:string[];
  photo_url:string|null;
  rank_score:number;
  compatibility_score:number;
  explanation_themes:string[];
}

export interface DatingMatch {
  id:string;
  other_user_id:string;
  other_display_name:string;
  other_photo_url:string|null;
  status:'active'|'unmatched'|'blocked';
  can_current_user_initiate:boolean;
  can_other_user_initiate:boolean;
  matched_at:string;
}

export interface DecisionResult {
  decision:'like'|'pass';
  match?:DatingMatch;
}

export const matchmakingApi={
  activate:()=>api<{discovery_active:boolean;discovery_paused:boolean}>('/api/v1/me/dating-profile/activate',{method:'POST'}),
  pause:()=>api<{discovery_active:boolean;discovery_paused:boolean}>('/api/v1/me/dating-profile/pause',{method:'POST'}),
  introductions:()=>api<{items:Introduction[]}>('/api/v1/discovery/introductions'),
  decide:(userId:string,decision:'like'|'pass',allowMatchToMessageFirst?:boolean)=>api<DecisionResult>(`/api/v1/discovery/introductions/${userId}/decision`,{
    method:'PUT',headers:idempotencyHeaders(),body:JSON.stringify({decision,...(decision==='like'?{allow_match_to_message_first:allowMatchToMessageFirst}: {})}),
  }),
  matches:()=>api<{items:DatingMatch[]}>('/api/v1/dating-matches'),
  unmatch:(matchId:string)=>api<void>(`/api/v1/dating-matches/${matchId}`,{method:'DELETE'}),
  block:(userId:string)=>api<void>(`/api/v1/safety/blocks/${userId}`,{method:'PUT'}),
};
