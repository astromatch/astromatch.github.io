import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AppShell, Page } from './components';
import { birthProfilesApi, type BirthProfile, type ChartAspect, type ChartHouse, type ChartPoint, type ChartResponse, type NatalChart } from './lib/birthProfiles';
import { ApiError } from './lib/api';
import { ProfileTabs } from './ProfileTabs';

type ChartFailure='not_available'|'validation'|'temporary'|'unauthenticated'|'selection'|null;

function pointText(point:ChartPoint|string|null|undefined){
  if(!point)return null;
  if(typeof point==='string')return point;
  const label=point.name??point.body??point.planet;
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
  const [chartView,setChartView]=useState<'wheel'|'placements'>('wheel');

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
  const highlights=[
    ['SUN',chart.sun_sign??pointText(chart.sun)],
    ['RISING',pointText(chart.ascendant)],
    ['MIDHEAVEN',pointText(chart.mc)],
  ].filter((entry):entry is [string,string]=>Boolean(entry[1]));
  const houses=Array.isArray(chart.houses)?chart.houses:[];
  const planets=chart.planets??[];
  const aspects=chart.aspects??[];

  return <AppShell><div className="chart-profile-shell">
    <header className="chart-identity">
      <p className="eyebrow">YOUR COSMIC BLUEPRINT</p>
      <h1>{profile.display_name}</h1>
      <p>{highlights.map(([label,value])=><span key={label}><small>{label}</small>{value}</span>)}</p>
    </header>
    <ProfileTabs/>
    <div className="chart-toolbar">
      <div className="chart-view-switch" role="group" aria-label="Chart view">
        <button className={chartView==='wheel'?'active':''} onClick={()=>setChartView('wheel')}>Orbit</button>
        <button className={chartView==='placements'?'active':''} onClick={()=>setChartView('placements')}>Placements</button>
      </div>
      <span className="chart-quality"><i/> {(chart.data_quality??'available').toUpperCase()} DATA</span>
    </div>
    {chart.data_quality==='limited'&&<div className="notice">The current engine returned limited data. Time-dependent or ephemeris-dependent facts are omitted rather than estimated.</div>}
    {chartView==='wheel'
      ?<section className="chart-canvas" aria-label="Natal chart wheel">
        <NatalChartWheel chart={chart}/>
        <div className="wheel-caption"><span>ASC</span><p>The outer ring shows signs. House cusps, planets, and aspect lines are plotted only from your backend-calculated chart.</p><span>MC</span></div>
      </section>
      :<PlacementsView planets={planets} houses={houses}/>}
    <section className="chart-summary">
      {highlights.map(([label,value],index)=><article key={label}><span>0{index+1}</span><small>{label}</small><strong>{value}</strong></article>)}
    </section>
    <section className="chart-section aspect-section">
      <div className="chart-section-heading"><div><p className="eyebrow">CONNECTIONS</p><h2>Major aspects</h2></div><span>{aspects.length} found</span></div>
      {aspects.length>0?<div className="aspect-list">{aspects.slice(0,8).map((aspect,index)=><AspectRow key={`${aspect.planet_a}-${aspect.planet_b}-${index}`} aspect={aspect}/>)}</div>:<p className="chart-empty-copy">No aspects were returned by the calculation engine.</p>}
    </section>
    <section className="detail-card"><div><p className="eyebrow">BIRTH DETAILS</p><h2>The coordinates behind your chart</h2></div><dl><div><dt>Date</dt><dd>{formatDate(profile.birth_date)}</dd></div><div><dt>Time</dt><dd>{formatTime(profile.birth_time)} <small>{profile.birth_time_precision}</small></dd></div><div><dt>Place</dt><dd>{profile.city}</dd></div><div><dt>Timezone</dt><dd>{profile.timezone}</dd></div></dl></section>
    {editing&&<form className="stack-form chart-edit" onSubmit={saveDetails}><h2>Edit profile details</h2><label>Display name<input name="display_name" defaultValue={profile.display_name} required/></label><label>Notes <span>optional</span><textarea name="notes" defaultValue={profile.notes??''} maxLength={2000}/></label><div className="report-actions"><button className="button">Save changes</button><button type="button" className="button secondary" onClick={()=>setEditing(false)}>Cancel</button></div><small>Name and notes edits reuse the existing immutable chart.</small></form>}
    <div className="chart-meta"><span>{chart.house_system&&`${chart.house_system} houses`}</span>{chart.calculation_version&&<span>Engine {chart.calculation_version}</span>}{chart.calculated_at&&<span>Calculated {new Date(chart.calculated_at).toLocaleString()}</span>}</div>
    {message&&<p role="alert" className="form-message">{message}</p>}
    {Object.keys(fieldErrors).length>0&&<ul className="field-errors">{Object.entries(fieldErrors).map(([field,error])=><li key={field}><strong>{field.replaceAll('_',' ')}</strong>: {error}</li>)}</ul>}
    <div className="report-actions"><button className="button secondary" onClick={()=>setEditing(value=>!value)}>Edit profile</button><button className="button secondary" onClick={recalculate} disabled={recalculating}><RefreshCw/>{recalculating?'Calculating your chart…':'Recalculate chart'}</button></div>
  </div></AppShell>;
}

function ChevronLabel(){
  return <span aria-hidden="true">›</span>;
}

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_SYMBOLS=['♈︎','♉︎','♊︎','♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎'];
const PLANET_GLYPHS:Record<string,string>={Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇',Chiron:'⚷','North Node':'☊','South Node':'☋'};

function absoluteDegree(sign?:string,degree?:number){
  const signIndex=SIGNS.findIndex(item=>item.toLowerCase()===sign?.toLowerCase());
  return signIndex<0||typeof degree!=='number'?null:signIndex*30+degree;
}

function polar(angle:number,radius:number){
  const radians=(angle-90)*Math.PI/180;
  return {x:200+radius*Math.cos(radians),y:200+radius*Math.sin(radians)};
}

function NatalChartWheel({chart}:{chart:NatalChart}){
  const titleId=useId();
  const planets=chart.planets??[];
  const houses=Array.isArray(chart.houses)?chart.houses:[];
  const planetPositions=new Map(planets.map(planet=>[planet.planet??planet.name??planet.body??'',absoluteDegree(planet.sign,planet.degree)]));
  const plottedPlanets=planets.map(planet=>({planet,angle:absoluteDegree(planet.sign,planet.degree)})).filter((item):item is {planet:ChartPoint;angle:number}=>item.angle!==null);

  return <svg className="natal-wheel" viewBox="0 0 400 400" role="img" aria-labelledby={titleId}>
    <title id={titleId}>Backend-calculated natal chart for {chart.sun_sign??'this profile'}</title>
    <circle className="wheel-disc" cx="200" cy="200" r="188"/>
    <circle className="wheel-ring" cx="200" cy="200" r="158"/>
    <circle className="wheel-inner" cx="200" cy="200" r="112"/>
    {SIGNS.map((sign,index)=>{
      const start=polar(index*30,158);
      const end=polar(index*30,188);
      const label=polar(index*30+15,173);
      return <g key={sign}><line className="sign-tick" x1={start.x} y1={start.y} x2={end.x} y2={end.y}/><text className="sign-symbol" x={label.x} y={label.y} aria-label={sign}>{SIGN_SYMBOLS[index]}</text></g>;
    })}
    {houses.map(house=>{
      const angle=absoluteDegree(house.sign,house.degree);
      if(angle===null)return null;
      const outer=polar(angle,157);
      const inner=polar(angle,112);
      const label=polar(angle+8,101);
      return <g key={house.house}><line className="house-line" x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}/><text className="house-label" x={label.x} y={label.y}>{house.house}</text></g>;
    })}
    {(chart.aspects??[]).map((aspect,index)=>{
      const a=planetPositions.get(aspect.planet_a);
      const b=planetPositions.get(aspect.planet_b);
      if(a===null||a===undefined||b===null||b===undefined)return null;
      const start=polar(a,105);
      const end=polar(b,105);
      return <line key={`${aspect.planet_a}-${aspect.planet_b}-${index}`} className={`aspect-line ${aspect.aspect}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y}/>;
    })}
    {plottedPlanets.map(({planet,angle},index)=>{
      const position=polar(angle,135-(index%2)*7);
      const name=planet.planet??planet.name??planet.body??'Planet';
      return <g className="planet-marker" key={`${name}-${index}`}><circle cx={position.x} cy={position.y} r="11"/><text x={position.x} y={position.y}>{PLANET_GLYPHS[name]??name.slice(0,1)}</text>{planet.retrograde&&<text className="retrograde" x={position.x+9} y={position.y-8}>R</text>}</g>;
    })}
    <g className="wheel-center"><circle cx="200" cy="200" r="41"/><text x="200" y="194">{chart.sun_sign??'Natal'}</text><text x="200" y="211">{typeof chart.ascendant==='string'?`${chart.ascendant} rising`:'YOUR CHART'}</text></g>
  </svg>;
}

function PlacementsView({planets,houses}:{planets:ChartPoint[];houses:ChartHouse[]}){
  return <section className="placements-view">
    <div className="placement-column"><p className="eyebrow">CELESTIAL BODIES</p>{planets.map((planet,index)=>{
      const name=planet.planet??planet.name??planet.body??'Planet';
      return <article key={`${name}-${index}`}><span className="planet-symbol">{PLANET_GLYPHS[name]??'·'}</span><div><strong>{name}</strong><small>{planet.retrograde?'Retrograde':'Direct'}</small></div><p>{planet.sign} <b>{formatDegree(planet.degree)}</b></p><em>House {planet.house??'—'}</em></article>;
    })}</div>
    <div className="placement-column houses-column"><p className="eyebrow">HOUSE CUSPS</p>{houses.map(house=><article key={house.house}><span className="house-number">{house.house}</span><div><strong>{house.sign}</strong><small>{formatDegree(house.degree)}</small></div></article>)}</div>
  </section>;
}

function AspectRow({aspect}:{aspect:ChartAspect}){
  return <article><div><span>{PLANET_GLYPHS[aspect.planet_a]??'·'}</span><span>{PLANET_GLYPHS[aspect.planet_b]??'·'}</span></div><p><strong>{aspect.planet_a} — {aspect.planet_b}</strong><small>{aspect.aspect}</small></p><em>{aspect.orb.toFixed(2)}° orb</em></article>;
}

function formatDegree(degree?:number){
  return typeof degree==='number'?`${degree.toFixed(2)}°`:'—';
}

function formatDate(value:string){
  const date=new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())?value:date.toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'});
}

function formatTime(value:string|null){
  if(!value)return 'Unknown';
  const [hour,minute]=value.split(':').map(Number);
  if(Number.isNaN(hour)||Number.isNaN(minute))return value;
  return new Date(2000,0,1,hour,minute).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
}
