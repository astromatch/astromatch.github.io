import { env } from './env';

export interface PlaceResult {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const cache=new Map<string,PlaceResult[]>();

export async function searchPlaces(query:string,signal?:AbortSignal):Promise<PlaceResult[]>{
  const normalized=query.trim();
  if(normalized.length<2)return [];
  const cacheKey=normalized.toLocaleLowerCase();
  const cached=cache.get(cacheKey);
  if(cached)return cached;
  const params=new URLSearchParams({q:normalized,format:'jsonv2',limit:'6',featuretype:'settlement'});
  const response=await fetch(`${env.VITE_GEOCODING_BASE_URL}/search?${params}`,{
    headers:{Accept:'application/json'},
    signal,
  });
  if(!response.ok)throw new Error('Place search failed');
  const body=await response.json() as NominatimResult[];
  const results=body.map(place=>({
    id:String(place.place_id),
    label:place.display_name,
    latitude:Number(place.lat),
    longitude:Number(place.lon),
  }));
  cache.set(cacheKey,results);
  return results;
}

export function supportedTimezones(){
  try{
    return Intl.supportedValuesOf('timeZone');
  }catch{
    return ['UTC','Asia/Kolkata','Europe/London','America/New_York','America/Los_Angeles'];
  }
}
