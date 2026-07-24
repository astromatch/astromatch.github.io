import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AppShell, Page } from './components';
import { birthProfilesApi, type BirthProfile, type ChartPoint, type ChartResponse } from './lib/birthProfiles';
import { ApiError } from './lib/api';
import { ProfileTabs } from './ProfileTabs';

type ChartFailure='not_available'|'validation'|'temporary'|'unauthenticated'|'selection'|null;

function pointText(point:ChartPoint|string|null|undefined){
  if(!point)return null;
  if(typeof point==='string')return point;
  const label=point.name??point.body;
  const position=[point.sign,typeof point.degree==='number'?`${point.degree.toFixed(2)}°`:null].filter(Boolean).join(' ');
  return [label,position].filter(Boolean).join(' · ')||null;
}

export function ChartPage(){
  const {birthProfileId}=useParams();
  const navigate=useNavigate();
  const [data,setData]=useState<ChartResponse|null>(null);
  const [resolvedProfileId,setResolvedProfileId]=useState<string|null>(birthProfileId??null);
  const [availableProfiles,setAvailableProfiles]=useState<BirthProfile[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [failure,setFailure]=useState<ChartFailure>(null);
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const [recalculating,setRecalculating]=useState(false);
  const [editing,setEditing]=useState(false);

  const load=useCallback(async()=>{
    setLoading(true);
    setMessage('');
    setFailure(null);
    setFieldErrors({});
    try{
      let id=birthProfileId;
      if(!id){
        const profiles=await birthProfilesApi.list();
        setAvailableProfiles(profiles);
        id=profiles.find(profile=>profile.is_primary)?.id??profiles[0]?.id;
      }
      if(!id){
        setResolvedProfileId(null);
        setFailure('selection');
        setMessage('No birth profile exists yet.');
        return;
      }
      setResolvedProfileId(id);
      setData(await birthProfilesApi.chart(id));
    }catch(error){
      setData(null);
      if(error instanceof ApiError){
        if(error.status===404){
          setFailure('not_available');
          setMessage('Chart not available');
        }else if(error.status===422){
          setFailure('validation');
          setFieldErrors(error.fields??{});
          setMessage(error.message);
        }else if(error.status===500||error.status===503||error.code==='NETWORK_ERROR'){
          setFailure('temporary');
          setMessage('Chart generation is temporarily unavailable');
        }else if(error.status===401){
          setFailure('unauthenticated');
          setMessage('Your session has expired. Please sign in again.');
        }else{
          setFailure('temporary');
          setMessage(error.message);
        }
      }else{
        setFailure('temporary');
        setMessage('Chart generation is temporarily unavailable');
      }
    }finally{
      setLoading(false);
    }
  },[birthProfileId]);

  useEffect(()=>{void load()},[load]);

  async function recalculate(){
    const id=resolvedProfileId??data?.birth_profile.id;
    if(!id||recalculating)return;
    setRecalculating(true);
    setMessage('');
    setFieldErrors({});
    try{
      await birthProfilesApi.recalculate(id);
      setData(await birthProfilesApi.chart(id));
      setFailure(null);
    }catch(error){
      if(error instanceof ApiError&&error.status===404){
        try{
          const profiles=await birthProfilesApi.list();
          const profileStillExists=profiles.some(profile=>profile.id===id);
          if(profileStillExists){
            setFailure('not_available');
            setMessage('Chart not available');
          }else{
            setData(null);
            setAvailableProfiles(profiles);
            setResolvedProfileId(null);
            setFailure('selection');
            setMessage('That birth profile no longer exists. Choose another profile.');
            navigate('/profile/chart',{replace:true});
          }
        }catch{
          setFailure('temporary');
          setMessage('Chart generation is temporarily unavailable');
        }
      }else if(error instanceof ApiError&&error.status===422){
        setFailure('validation');
        setFieldErrors(error.fields??{});
        setMessage(error.message);
      }else if(error instanceof ApiError&&(error.status===500||error.status===503||error.code==='NETWORK_ERROR')){
        setFailure('temporary');
        setMessage('Chart generation is temporarily unavailable');
      }else{
        setMessage(error instanceof ApiError?error.message:'We couldn’t calculate your chart. Please try again.');
      }
    }finally{
      setRecalculating(false);
    }
  }

  async function saveDetails(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!data)return;
    setLoading(true);
    setMessage('');
    const form=new FormData(event.currentTarget);
    try{
      await birthProfilesApi.update(data.birth_profile.id,{
        display_name:String(form.get('display_name')).trim(),
        notes:String(form.get('notes')).trim()||null,
      });
      setData(await birthProfilesApi.chart(data.birth_profile.id));
      setEditing(false);
    }catch{
      setMessage('We couldn’t update this birth profile. Please try again.');
    }finally{
      setLoading(false);
    }
  }

  if(loading)return <AppShell><div className="chart-profile-shell"><Page eyebrow="YOUR CHART" title="Reading your chart…"/><ProfileTabs/><p role="status">Loading backend-calculated chart data…</p></div></AppShell>;
  if(!data){
    return <AppShell><div className="chart-profile-shell">
      <Page eyebrow="YOUR CHART" title={failure==='not_available'?'Chart not available':failure==='validation'?'Birth details need attention':failure==='selection'?'Choose a birth profile':'Chart unavailable'}/>
      <ProfileTabs/>
      <p role="alert">{recalculating?'Calculating your chart…':message}</p>
      {failure==='validation'&&Object.keys(fieldErrors).length>0&&<ul className="field-errors">{Object.entries(fieldErrors).map(([field,error])=><li key={field}><strong>{field.replaceAll('_',' ')}</strong>: {error}</li>)}</ul>}
      {failure==='selection'&&availableProfiles.length>0&&<div className="list">{availableProfiles.map(profile=><Link className="list-row" key={profile.id} to={`/profile/chart/${profile.id}`}>{profile.display_name}<ChevronLabel/></Link>)}</div>}
      {failure==='not_available'&&<button className="button" onClick={recalculate} disabled={recalculating}>{recalculating?'Calculating your chart…':'Calculate chart'}</button>}
      {failure==='temporary'&&<button className="button" onClick={load} disabled={loading}>Retry</button>}
      {failure==='validation'&&<button className="button secondary" onClick={load}>Retry after updating details</button>}
      {failure==='unauthenticated'&&<Link className="button" to="/login">Sign in</Link>}
    </div></AppShell>;
  }

  const {birth_profile:profile,chart}=data;
  const highlights=[['SUN',pointText(chart.sun)],['ASCENDANT',pointText(chart.ascendant)],['MC',pointText(chart.mc)]].filter((entry):entry is [string,string]=>Boolean(entry[1]));

  return <AppShell><div className="chart-profile-shell">
    <Page eyebrow="YOUR NATAL CHART" title={profile.display_name} action={<Link to="/settings">Settings</Link>}/>
    <ProfileTabs/>
    <div className="chart-meta"><span className="quality">{(chart.data_quality??'available').toUpperCase()} DATA</span>{chart.calculation_version&&<span>Engine {chart.calculation_version}</span>}{chart.calculated_at&&<span>Calculated {new Date(chart.calculated_at).toLocaleString()}</span>}</div>
    {chart.data_quality==='limited'&&<div className="notice">The current engine returned limited data. Time-dependent or ephemeris-dependent facts are omitted rather than estimated.</div>}
    {highlights.length>0&&<div className="profile-orbit">{highlights.map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>}
    <section className="detail-card"><p className="eyebrow">BIRTH DETAILS</p><dl><div><dt>Date</dt><dd>{profile.birth_date}</dd></div><div><dt>Time</dt><dd>{profile.birth_time??'Unknown'} · {profile.birth_time_precision}</dd></div><div><dt>Place</dt><dd>{profile.city}, {profile.country}</dd></div><div><dt>Timezone</dt><dd>{profile.timezone}</dd></div></dl></section>
    {editing&&<form className="stack-form chart-edit" onSubmit={saveDetails}><h2>Edit profile details</h2><label>Display name<input name="display_name" defaultValue={profile.display_name} required/></label><label>Notes <span>optional</span><textarea name="notes" defaultValue={profile.notes??''} maxLength={2000}/></label><div className="report-actions"><button className="button">Save changes</button><button type="button" className="button secondary" onClick={()=>setEditing(false)}>Cancel</button></div><small>Name and notes edits reuse the existing immutable chart.</small></form>}
    {chart.planets&&chart.planets.length>0&&<section className="chart-section"><h2>Planets</h2><div className="chart-facts">{chart.planets.map((planet,index)=><div key={`${planet.name??planet.body??'planet'}-${index}`}><span>{planet.name??planet.body??'Planet'}</span><strong>{[planet.sign,typeof planet.degree==='number'?`${planet.degree.toFixed(2)}°`:null].filter(Boolean).join(' ')||'Available'}</strong></div>)}</div></section>}
    {Array.isArray(chart.houses)&&chart.houses.length>0&&<section className="chart-section"><h2>Houses</h2><p>{chart.houses.length} backend-calculated houses available.</p></section>}
    {chart.aspects&&chart.aspects.length>0&&<section className="chart-section"><h2>Aspects</h2><p>{chart.aspects.length} backend-calculated aspects available.</p></section>}
    {message&&<p role="alert" className="form-message">{message}</p>}
    {Object.keys(fieldErrors).length>0&&<ul className="field-errors">{Object.entries(fieldErrors).map(([field,error])=><li key={field}><strong>{field.replaceAll('_',' ')}</strong>: {error}</li>)}</ul>}
    <div className="report-actions"><button className="button secondary" onClick={()=>setEditing(value=>!value)}>Edit profile</button><button className="button secondary" onClick={recalculate} disabled={recalculating}><RefreshCw/>{recalculating?'Calculating your chart…':'Recalculate chart'}</button></div>
  </div></AppShell>;
}

function ChevronLabel(){
  return <span aria-hidden="true">›</span>;
}
