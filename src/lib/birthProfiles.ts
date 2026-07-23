import { ApiError, api } from './api';

export type BirthTimePrecision='exact'|'approximate'|'unknown';
export type RelationshipType='self'|'partner'|'spouse'|'crush'|'ex'|'friend'|'custom';

export interface BirthProfileInput {
  display_name:string;
  relationship_type:RelationshipType;
  birth_date:string;
  birth_time:string|null;
  birth_time_precision:BirthTimePrecision;
  timezone:string;
  country:string;
  city:string;
  latitude:number;
  longitude:number;
  is_primary:boolean;
  notes:string|null;
}

export interface BirthProfile extends BirthProfileInput {
  id:string;
  active_chart_id?:string|null;
  archived_at?:string|null;
}

export interface BirthProfileCreation {
  profile:BirthProfile;
  active_chart_id:string;
}

export interface ChartPoint {
  name?:string;
  body?:string;
  sign?:string;
  degree?:number;
  house?:number|null;
  [key:string]:unknown;
}

export interface NatalChart {
  id?:string;
  data_quality?:string;
  calculation_version?:string;
  calculated_at?:string;
  sun?:ChartPoint|string|null;
  ascendant?:ChartPoint|string|null;
  mc?:ChartPoint|string|null;
  planets?:ChartPoint[];
  houses?:Record<string,unknown>[]|Record<string,unknown>;
  aspects?:Record<string,unknown>[];
  [key:string]:unknown;
}

export interface ChartResponse {
  birth_profile:BirthProfile;
  chart:NatalChart;
}

function sameCreation(profile:BirthProfile,input:BirthProfileInput){
  return profile.display_name===input.display_name
    &&profile.birth_date===input.birth_date
    &&profile.relationship_type===input.relationship_type
    &&profile.is_primary===input.is_primary;
}

export const birthProfilesApi={
  list:()=>api<BirthProfile[]>('/api/v1/birth-profiles'),
  chart:(id:string)=>api<ChartResponse>(`/api/v1/birth-profiles/${id}/chart`),
  planets:(id:string)=>api<ChartPoint[]>(`/api/v1/birth-profiles/${id}/planets`),
  houses:(id:string)=>api<Record<string,unknown>[]>(`/api/v1/birth-profiles/${id}/houses`),
  aspects:(id:string)=>api<Record<string,unknown>[]>(`/api/v1/birth-profiles/${id}/aspects`),
  update:(id:string,patch:Partial<BirthProfileInput>)=>api<BirthProfile>(`/api/v1/birth-profiles/${id}`,{
    method:'PATCH',
    body:JSON.stringify(patch),
  }),
  recalculate:(id:string)=>api<ChartResponse>(`/api/v1/birth-profiles/${id}/recalculate`,{method:'POST'}),
  async create(input:BirthProfileInput){
    try{
      return await api<BirthProfileCreation>('/api/v1/birth-profiles',{
        method:'POST',
        body:JSON.stringify(input),
      });
    }catch(error){
      if(!(error instanceof ApiError)||error.code!=='NETWORK_ERROR')throw error;
      const profiles=await this.list();
      const existing=profiles.find(profile=>sameCreation(profile,input));
      if(existing){
        return {profile:existing,active_chart_id:existing.active_chart_id??''};
      }
      return api<BirthProfileCreation>('/api/v1/birth-profiles',{
        method:'POST',
        body:JSON.stringify(input),
      });
    }
  },
};
