import { useState, type FormEvent } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { AccountState } from './lib/account';
import { searchPlaces, supportedTimezones, type PlaceResult } from './lib/geocoding';

const hours=Array.from({length:24},(_,hour)=>String(hour).padStart(2,'0'));
const minutes=Array.from({length:60},(_,minute)=>String(minute).padStart(2,'0'));
const timezones=supportedTimezones();

interface Props {
  loading:boolean;
  profile:AccountState['profile'];
  onSubmit:(event:FormEvent<HTMLFormElement>)=>void;
}

export function BirthProfileForm({loading,profile,onSubmit}:Props){
  const [timeStatus,setTimeStatus]=useState<'exact'|'approximate'|'unknown'>('exact');
  const [placeQuery,setPlaceQuery]=useState('');
  const [places,setPlaces]=useState<PlaceResult[]>([]);
  const [selectedPlace,setSelectedPlace]=useState<PlaceResult|null>(null);
  const [searching,setSearching]=useState(false);
  const [placeMessage,setPlaceMessage]=useState('');

  async function findPlaces(){
    if(placeQuery.trim().length<2){setPlaceMessage('Enter at least two characters.');return}
    setSearching(true);
    setPlaceMessage('');
    try{
      const results=await searchPlaces(placeQuery);
      setPlaces(results);
      setSelectedPlace(null);
      if(!results.length)setPlaceMessage('No matching places found. Try a city and country.');
    }catch{
      setPlaceMessage('Place search is temporarily unavailable. Please try again.');
    }finally{
      setSearching(false);
    }
  }

  function selectPlace(id:string){
    setSelectedPlace(places.find(result=>result.id===id)??null);
  }

  return <form className="stack-form" onSubmit={onSubmit}>
    <label>Profile name<input name="display_name" defaultValue={profile?.preferred_name??profile?.first_name??''} required/></label>
    <label>Relationship<select name="relationship_type" defaultValue="self" required><option value="self">Self</option><option value="partner">Partner</option><option value="spouse">Spouse</option><option value="crush">Crush</option><option value="ex">Ex</option><option value="friend">Friend</option><option value="custom">Other</option></select></label>
    <label>Date of birth<input name="birth_date" type="date" defaultValue={profile?.date_of_birth??''} required/></label>
    <fieldset><legend>How accurate is your birth time?</legend><div className="radio-stack">
      <label><input type="radio" name="birth_time_status" value="exact" checked={timeStatus==='exact'} onChange={()=>setTimeStatus('exact')}/><span><b>Exact</b><small>Recorded precisely, such as from a birth certificate.</small></span></label>
      <label><input type="radio" name="birth_time_status" value="approximate" checked={timeStatus==='approximate'} onChange={()=>setTimeStatus('approximate')}/><span><b>Approximate</b><small>Close estimate; some house and ascendant details may shift.</small></span></label>
      <label><input type="radio" name="birth_time_status" value="unknown" checked={timeStatus==='unknown'} onChange={()=>setTimeStatus('unknown')}/><span><b>Unknown</b><small>We’ll avoid time-sensitive astrological claims.</small></span></label>
    </div></fieldset>
    {timeStatus!=='unknown'&&<div className="time-fields">
      <label>Hour (24-hour)<select name="birth_hour" defaultValue="12" required>{hours.map(hour=><option key={hour}>{hour}</option>)}</select></label>
      <label>Minute<select name="birth_minute" defaultValue="00" required>{minutes.map(minute=><option key={minute}>{minute}</option>)}</select></label>
    </div>}
    {timeStatus==='approximate'&&<label>Possible variation<select name="birth_time_accuracy_minutes" defaultValue="30"><option value="15">± 15 minutes</option><option value="30">± 30 minutes</option><option value="60">± 1 hour</option><option value="120">± 2 hours</option><option value="240">± 4 hours</option></select></label>}
    <fieldset className="place-search"><legend>Birthplace</legend>
      <div><input value={placeQuery} onChange={event=>setPlaceQuery(event.target.value)} placeholder="Search city and country" aria-label="Search birthplace"/><button type="button" onClick={findPlaces} disabled={searching}><Search size={17}/>{searching?'Searching…':'Search places'}</button></div>
      {places.length>0&&<label>Choose a matching place<select value={selectedPlace?.id??''} onChange={event=>selectPlace(event.target.value)} required><option value="">Select a place</option>{places.map(place=><option key={place.id} value={place.id}>{place.label}</option>)}</select></label>}
      {placeMessage&&<small role="status">{placeMessage}</small>}
      <small>Place search data © OpenStreetMap contributors.</small>
      <input type="hidden" name="birth_place_label" value={selectedPlace?.label??''}/>
      <input type="hidden" name="latitude" value={selectedPlace?.latitude??''}/>
      <input type="hidden" name="longitude" value={selectedPlace?.longitude??''}/>
      <input type="hidden" name="city" value={selectedPlace?.city??''}/>
      <input type="hidden" name="country" value={selectedPlace?.country??''}/>
    </fieldset>
    <label>Timezone<input name="timezone" list="timezone-options" defaultValue={profile?.timezone??Intl.DateTimeFormat().resolvedOptions().timeZone} required placeholder="Search timezone"/></label>
    <datalist id="timezone-options">{timezones.map(timezone=><option key={timezone} value={timezone}/>)}</datalist>
    <label>Notes <span>optional</span><textarea name="notes" maxLength={2000}/></label>
    <button className="button" disabled={loading||!selectedPlace}>{loading?'Saving…':'Complete setup'} <ArrowRight/></button>
  </form>;
}
