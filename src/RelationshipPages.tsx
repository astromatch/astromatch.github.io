import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, LockKeyhole, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { ApiError } from './lib/api';
import { env } from './lib/env';
import { track } from './lib/analytics';
import { peopleApi, relationshipsApi, type CompatibilityCategory, type CompatibilityFactor, type MatchFocus, type PersonInput, type PrivatePerson, type Relationship } from './lib/relationships';
import { AppShell, ButtonLink, Disclaimer, Page } from './components';

const focusOptions:[MatchFocus,string,string][]=[
  ['general','Overall connection','A complete view of the relationship dynamic.'],
  ['romantic','Emotional and romantic','Affection, attraction and intimacy.'],
  ['communication','Communication','How you understand, miss and repair each other.'],
  ['long_term','Long-term dynamics','Stability, growth and recurring patterns.'],
];

function useLoad<T>(loader:(signal:AbortSignal)=>Promise<T>,deps:unknown[]=[]){
  const [data,setData]=useState<T|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError('');
    loader(controller.signal).then(setData).catch(value=>{
      if((value as Error).name!=='AbortError')setError(safeMessage(value));
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[revision,...deps]);
  return {data,loading,error,retry:()=>setRevision(value=>value+1)};
}

function safeMessage(error:unknown){
  if(error instanceof ApiError){
    if(error.status===429)return error.message||'You have reached the current generation limit.';
    if(error.status===503)return 'The relationship service is resting for a moment. Your details are safe—please retry.';
    if(error.status===422)return error.message;
    return error.message;
  }
  return 'AstroMatch could not connect. Please try again.';
}

function StateMessage({title,text,action}:{title:string;text:string;action?:ReactNode}){
  return <div className="relationship-state"><Sparkles/><h2>{title}</h2><p>{text}</p>{action}</div>;
}

const blueprintFixture={
  archetype:'The Tender Truth-Teller',
  opening:'You connect most deeply where honesty and gentleness can coexist. Love becomes meaningful when it feels both emotionally real and spacious enough for two distinct people.',
  sections:[
    ['Core emotional needs','Consistency matters, but not at the cost of aliveness. You need a relationship where care is visible and curiosity remains active.'],
    ['How you connect','You tend to build intimacy through specific attention: remembering details, noticing changes and making the other person feel genuinely observed.'],
    ['Communication','Clarity is an act of affection for you. Ambiguity can feel more destabilising than a difficult truth delivered with care.'],
    ['Conflict and repair','Your instinct may be to solve before both people feel understood. Repair becomes easier when emotion is named before logistics are negotiated.'],
    ['Patterns worth noticing','Discernment protects you, but perfectionism can quietly turn connection into an evaluation. Notice when standards stop serving intimacy.'],
    ['What supports you','A partner who respects your sensitivity, communicates directly and makes room for independent rhythms helps your relationships breathe.'],
  ],
};

export function BlueprintPage(){
  useEffect(()=>track('blueprint_screen_viewed'),[]);
  if(!env.VITE_ENABLE_DEV_FIXTURES)return <AppShell><Page eyebrow="RELATIONSHIP BLUEPRINT" title="How you love is a story worth reading."/><StateMessage title="Blueprint integration is waiting on the backend" text="Your natal chart is safe and ready. The live API does not yet expose a Relationship Blueprint contract, so AstroMatch will not invent or calculate this interpretation in the browser." action={<ButtonLink to="/profile/chart">View your natal chart</ButtonLink>}/></AppShell>;
  return <AppShell><article className="editorial-report blueprint-report">
    <header className="report-opening"><p className="eyebrow">YOUR RELATIONSHIP BLUEPRINT · DEVELOPMENT PREVIEW</p><h1>{blueprintFixture.archetype}</h1><p>{blueprintFixture.opening}</p><span className="quality">FIXTURE · NOT PRODUCTION DATA</span></header>
    {blueprintFixture.sections.map(([title,text],index)=><section className="editorial-section" key={title}><span>0{index+1}</span><div><h2>{title}</h2><p>{text}</p></div></section>)}
    <section className="reflection-panel"><p className="eyebrow">REFLECT</p><h2>Where do you feel most yourself in love?</h2><p>What kind of reassurance helps you soften without giving up your independence?</p></section>
    <div className="notice"><ShieldCheck/>This development preview is visible only when fixtures are explicitly enabled. Production requires a backend-generated blueprint.</div><Disclaimer/>
  </article></AppShell>;
}

export function PeoplePage(){
  const {data:people,loading,error,retry}=useLoad(signal=>peopleApi.all(signal));
  async function archive(person:PrivatePerson){
    if(!confirm(`Archive ${person.displayName}'s private profile?`))return;
    await peopleApi.archive(person.id);track('person_archived');retry();
  }
  return <AppShell><Page eyebrow="PRIVATE PEOPLE" title="The people in your inner world." action={<Link className="icon-button" to="/people/new" aria-label="Add a private person"><Plus/></Link>}/>
    <div className="private-notice"><LockKeyhole/><div><strong>Private to you</strong><p>AstroMatch does not notify the people you add. Only enter information you are comfortable using for a private astrological interpretation.</p></div></div>
    {loading?<RelationshipSkeleton/>:error?<StateMessage title="We couldn’t open your private people" text={error} action={<button className="button secondary" onClick={retry}>Retry</button>}/>:people?.length?<div className="people-ledger">{people.map(person=><article key={person.id}><Link to={`/people/${person.id}`}><span className="person-mark">{person.displayName.slice(0,1)}</span><div><small>{person.relationshipType}</small><h2>{person.displayName}</h2><p>{person.birthTimeStatus==='unknown'?'Time-independent reading available':`${person.birthTimeStatus} birth time`} · {person.chartStatus??'Chart status pending'}</p></div><Quality value={person.dataQuality??person.birthTimeStatus}/></Link><button onClick={()=>void archive(person)} aria-label={`Archive ${person.displayName}`}><Trash2/></button></article>)}</div>:<StateMessage title="Add someone privately to explore the astrology between you." text="A partner, spouse, crush, ex, friend or another meaningful connection." action={<ButtonLink to="/people/new">Add a private person</ButtonLink>}/>}
  </AppShell>;
}

export function PersonPage(){
  const {personId}=useParams();
  const navigate=useNavigate();
  const {data:existing,loading,error}=useLoad(signal=>personId?peopleApi.get(personId,signal):Promise.resolve(null),[personId]);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [timeQuality,setTimeQuality]=useState<PersonInput['birthTimeStatus']>('unknown');
  useEffect(()=>{if(existing)setTimeQuality(existing.birthTimeStatus)},[existing]);
  useEffect(()=>{if(!personId)track('person_creation_started')},[personId]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setMessage('');
    const form=new FormData(event.currentTarget);
    const input:PersonInput={
      displayName:String(form.get('displayName')).trim(),
      pronouns:String(form.get('pronouns')).trim()||null,
      relationshipType:String(form.get('relationshipType')) as PersonInput['relationshipType'],
      birthDate:String(form.get('birthDate')),
      birthTime:timeQuality==='unknown'?null:String(form.get('birthTime'))||null,
      birthTimeStatus:timeQuality,
      birthTimeAccuracyMinutes:timeQuality==='approximate'?Number(form.get('birthTimeAccuracyMinutes'))||30:null,
      birthPlaceLabel:String(form.get('birthPlaceLabel')).trim(),
      latitude:Number(form.get('latitude')),
      longitude:Number(form.get('longitude')),
      timezone:String(form.get('timezone')).trim(),
      astrologySystem:'western_tropical',
      notes:String(form.get('notes')).trim()||null,
    };
    try{
      if(existing)await peopleApi.update(existing.id,input);else await peopleApi.create(input);
      track(existing?'person_updated':'person_created',{relationship_type:input.relationshipType,birth_time_quality:input.birthTimeStatus});
      navigate('/people');
    }catch(value){setMessage(safeMessage(value))}finally{setSaving(false)}
  }
  if(personId&&loading)return <AppShell><RelationshipSkeleton/></AppShell>;
  if(error)return <AppShell><StateMessage title="This private profile is unavailable" text={error}/></AppShell>;
  return <AppShell><Page eyebrow={existing?'EDIT PRIVATE PERSON':'ADD A PRIVATE PERSON'} title={existing?existing.displayName:'Who would you like to understand?'}/>
    <form className="stack-form person-form" onSubmit={submit}>
      <div className="private-notice"><LockKeyhole/><p>This profile is private to you. AstroMatch does not notify this person.</p></div>
      <label>Private display name or alias<input name="displayName" defaultValue={existing?.displayName} maxLength={100} required/></label>
      <div className="form-pair"><label>Relationship<select name="relationshipType" defaultValue={existing?.relationshipType??'partner'}>{['partner','spouse','crush','ex','friend','custom'].map(value=><option key={value} value={value}>{titleCase(value)}</option>)}</select></label><label>Pronouns <span>optional</span><input name="pronouns" defaultValue={existing?.pronouns??''}/></label></div>
      <label>Date of birth<input type="date" name="birthDate" defaultValue={existing?.birthDate} required/></label>
      <fieldset><legend>How certain is the birth time?</legend><div className="choice-row">{(['exact','approximate','unknown'] as const).map(value=><label key={value}><input type="radio" name="birthTimeStatus" checked={timeQuality===value} onChange={()=>setTimeQuality(value)}/>{titleCase(value)}</label>)}</div></fieldset>
      {timeQuality!=='unknown'&&<div className="form-pair"><label>Birth time<input type="time" name="birthTime" defaultValue={existing?.birthTime?.slice(0,5)??''} required/></label>{timeQuality==='approximate'&&<label>Accuracy window<select name="birthTimeAccuracyMinutes" defaultValue={existing?.birthTimeAccuracyMinutes??30}><option value="15">± 15 minutes</option><option value="30">± 30 minutes</option><option value="60">± 1 hour</option><option value="120">± 2 hours</option></select></label>}</div>}
      {timeQuality==='unknown'&&<div className="notice"><Sparkles/>We can still compare planetary dynamics. Time-dependent houses and rising-sign interactions will be excluded.</div>}
      <label>Birthplace<input name="birthPlaceLabel" defaultValue={existing?.birthPlaceLabel} placeholder="City, region, country" required/></label>
      <div className="form-triad"><label>Latitude<input type="number" step="any" min="-90" max="90" name="latitude" defaultValue={existing?.latitude} required/></label><label>Longitude<input type="number" step="any" min="-180" max="180" name="longitude" defaultValue={existing?.longitude} required/></label><label>Timezone<input name="timezone" list="relationship-timezones" defaultValue={existing?.timezone??Intl.DateTimeFormat().resolvedOptions().timeZone} required/></label></div>
      <datalist id="relationship-timezones">{Intl.supportedValuesOf('timeZone').map(value=><option key={value} value={value}/>)}</datalist>
      <label>Private note <span>optional</span><textarea name="notes" defaultValue={existing?.notes??''} maxLength={2000}/></label>
      {message&&<p role="alert" className="form-message">{message}</p>}<button className="button" disabled={saving}>{saving?'Saving privately…':'Save private person'}</button>
    </form>
  </AppShell>;
}

export function RelationshipsPage(){
  const {data:relationships,loading,error,retry}=useLoad(signal=>relationshipsApi.all(signal));
  async function archive(item:Relationship){if(!confirm('Archive this relationship analysis?'))return;await relationshipsApi.archive(item.id);track('relationship_archived');retry()}
  return <AppShell><Page eyebrow="RELATIONSHIPS" title="Your relationship space." action={<Link className="icon-button" to="/relationships/new" aria-label="Analyse a relationship"><Plus/></Link>}/>
    <p className="page-intro">Private dossiers for the connections you want to understand—not a public matches feed.</p>
    {loading?<RelationshipSkeleton/>:error?<StateMessage title="Your relationships couldn’t be loaded" text={error} action={<button className="button secondary" onClick={retry}>Retry</button>}/>:relationships?.length?<div className="relationship-ledger">{relationships.map(item=><article key={item.id}><Link to={`/relationships/${item.id}`}><div className="relationship-monogram"><span>You</span><span>{item.person?.displayName.slice(0,1)??'·'}</span></div><div><small>{titleCase(item.focus)} · {titleCase(item.status)}</small><h2>{item.person?.displayName??'Private relationship'}</h2><p>{item.qualitativeLabel??item.headline??statusCopy(item.status)}</p></div><Quality value={item.dataQuality??item.status}/>{typeof item.score==='number'&&<em>{Math.round(item.score)}</em>}</Link><button onClick={()=>void archive(item)} aria-label="Archive relationship"><Trash2/></button></article>)}</div>:<StateMessage title="Your relationship space is empty." text="Add someone privately, then create your first relationship analysis." action={<ButtonLink to="/relationships/new">Analyse a relationship</ButtonLink>}/>}
  </AppShell>;
}

export function NewRelationshipPage(){
  const navigate=useNavigate();
  const {data:people,loading,error}=useLoad(signal=>peopleApi.all(signal));
  const [phase,setPhase]=useState<'form'|'confirm'|'generating'>('form');
  const [personId,setPersonId]=useState('');
  const [focus,setFocus]=useState<MatchFocus>('general');
  const [message,setMessage]=useState('');
  useEffect(()=>track('relationship_creation_started'),[]);
  const person=people?.find(item=>item.id===personId);
  async function create(){
    if(!personId)return;setPhase('generating');setMessage('');
    track('relationship_created',{relationship_type:person?.relationshipType??'custom',analysis_focus:focus});
    track('compatibility_calculation_requested',{focus});
    try{
      const relationship=await relationshipsApi.create(personId,focus);
      const generated=await relationshipsApi.generate(relationship.id,crypto.randomUUID());
      track('compatibility_calculation_completed',{focus,data_quality:generated.dataQuality??'unknown'});
      navigate(`/relationships/${relationship.id}/report`);
    }catch(value){setPhase('confirm');setMessage(safeMessage(value));track('compatibility_calculation_failed',{error_category:value instanceof ApiError?value.code:'network'})}
  }
  if(loading)return <AppShell><RelationshipSkeleton/></AppShell>;
  if(error)return <AppShell><StateMessage title="We couldn’t prepare a new analysis" text={error}/></AppShell>;
  if(!people?.length)return <AppShell><Page eyebrow="NEW RELATIONSHIP" title="Begin with someone private."/><StateMessage title="Add a person first" text="AstroMatch needs their private birth profile before it can compare your charts." action={<ButtonLink to="/people/new">Add a private person</ButtonLink>}/></AppShell>;
  if(phase==='generating')return <AppShell><GenerationProgress/></AppShell>;
  return <AppShell><Page eyebrow="NEW RELATIONSHIP" title={phase==='confirm'?'Review before we begin':'What would you like to understand?'}/>
    {phase==='form'?<form className="relationship-builder" onSubmit={event=>{event.preventDefault();setPhase('confirm')}}>
      <label>Choose a private person<select value={personId} onChange={event=>setPersonId(event.target.value)} required><option value="">Select someone</option>{people.map(item=><option key={item.id} value={item.id}>{item.displayName} · {item.relationshipType}</option>)}</select></label>
      <fieldset><legend>Choose a focus</legend>{focusOptions.map(([value,label,description])=><label className={focus===value?'selected':''} key={value}><input type="radio" name="focus" value={value} checked={focus===value} onChange={()=>setFocus(value)}/><span><strong>{label}</strong><small>{description}</small></span></label>)}</fieldset>
      <button className="button" disabled={!personId}>Review analysis <ArrowRight/></button>
    </form>:<section className="generation-confirm"><p className="eyebrow">PRIVATE ANALYSIS</p><h2>You + {person?.displayName}</h2><dl><div><dt>Relationship</dt><dd>{titleCase(person?.relationshipType??'custom')}</dd></div><div><dt>Focus</dt><dd>{focusOptions.find(item=>item[0]===focus)?.[1]}</dd></div><div><dt>Birth-time quality</dt><dd>{titleCase(person?.birthTimeStatus??'unknown')}</dd></div></dl>{person?.birthTimeStatus==='unknown'&&<div className="notice"><Sparkles/>House and rising-sign interactions will not be included. Planetary compatibility can still be analysed.</div>}<p>Your saved details remain private. Generation may use your current AI allowance.</p>{message&&<p className="form-message" role="alert">{message}</p>}<div className="report-actions"><button className="button" onClick={()=>void create()}>Calculate compatibility</button><button className="button secondary" onClick={()=>setPhase('form')}>Go back</button></div></section>}
  </AppShell>;
}

export function RelationshipPage(){
  const {relationshipId=''}=useParams();
  const {data:item,loading,error,retry}=useLoad(signal=>relationshipsApi.get(relationshipId,signal),[relationshipId]);
  if(loading)return <AppShell><RelationshipSkeleton/></AppShell>;
  if(error||!item)return <AppShell><StateMessage title="This relationship is unavailable" text={error||'It may have been archived.'}/></AppShell>;
  return <AppShell><Page eyebrow="RELATIONSHIP" title={item.person?.displayName??'Private relationship'}/><section className="relationship-overview"><Quality value={item.dataQuality??item.status}/><h2>{item.headline??item.qualitativeLabel??statusCopy(item.status)}</h2><p>{statusCopy(item.status)}</p>{item.status==='ready'?<ButtonLink to={`/relationships/${item.id}/report`}>Open relationship report</ButtonLink>:<button className="button" onClick={async()=>{await relationshipsApi.generate(item.id,crypto.randomUUID());retry()}}>Generate report</button>}</section></AppShell>;
}

export function RelationshipReportPage(){
  const {relationshipId=''}=useParams();
  const {data:report,loading,error,retry}=useLoad(signal=>relationshipsApi.report(relationshipId,signal),[relationshipId]);
  useEffect(()=>{if(report)track('compatibility_report_viewed')},[report]);
  if(loading)return <AppShell><GenerationProgress reading/></AppShell>;
  if(error||!report)return <AppShell><Page eyebrow="RELATIONSHIP REPORT" title="The reading isn’t available yet."/><StateMessage title="We couldn’t finish this reading" text={error||'Your chart and relationship details are safe.'} action={<button className="button secondary" onClick={retry}>Try again</button>}/></AppShell>;
  return <AppShell><article className="editorial-report compatibility-report">
    <header className="report-opening"><p className="eyebrow">PRIVATE RELATIONSHIP DOSSIER</p><Quality value={report.dataQuality??'available'}/><h1>{report.headline??report.qualitativeLabel??'A relationship with its own language'}</h1><p>{report.summary??'Your backend-generated relationship interpretation is ready.'}</p>{typeof report.overallScore==='number'&&<div className="context-score"><strong>{Math.round(report.overallScore)}</strong><span>Supporting context—not a verdict</span></div>}</header>
    {report.strongestConnection&&<EditorialSection index="01" title="Strongest connection"><p>{report.strongestConnection}</p></EditorialSection>}
    {report.primaryFriction&&<EditorialSection index="02" title="Primary friction"><p>{report.primaryFriction}</p></EditorialSection>}
    {report.categories?.map((category,index)=><CategorySection key={category.key} category={category} index={String(index+3).padStart(2,'0')}/>)}
    {!!report.practicalGuidance?.length&&<EditorialSection index="G" title="Practical guidance"><ul>{report.practicalGuidance.map(item=><li key={item}>{item}</li>)}</ul></EditorialSection>}
    {!!report.reflectionPrompts?.length&&<section className="reflection-panel"><p className="eyebrow">REFLECTION PROMPTS</p>{report.reflectionPrompts.map(item=><h2 key={item}>{item}</h2>)}</section>}
    {!!report.factors?.length&&<Evidence factors={report.factors}/>}
    {!!report.limitations?.length&&<section className="report-limitations"><h2>What this reading cannot know</h2>{report.limitations.map(item=><p key={item}>{item}</p>)}</section>}
    {report.canRegenerate&&<section className="regeneration-notice"><RefreshCw/><div><h2>A refreshed report is available</h2><p>{report.regenerationReason}</p><button className="button secondary" onClick={()=>track('compatibility_report_regeneration_requested')}>Review regeneration</button></div></section>}
    <div className="private-notice"><LockKeyhole/><p>This report is private by default. Sharing must be deliberate, and birth details are excluded from share cards.</p></div><Disclaimer/>
  </article></AppShell>;
}

function CategorySection({category,index}:{category:CompatibilityCategory;index:string}){
  return <EditorialSection index={index} title={category.label}><div className="category-heading">{category.dataQuality&&<Quality value={category.dataQuality}/>} {typeof category.score==='number'&&<span>{Math.round(category.score)} · with context</span>}</div>{category.headline&&<h3>{category.headline}</h3>}<p>{category.interpretation}</p>{(category.supportingFactors?.length||category.challengingFactors?.length)?<details onToggle={event=>{if(event.currentTarget.open)track('compatibility_category_expanded',{category_key:category.key})}}><summary>View astrological evidence <ChevronDown/></summary><FactorList title="Supporting" factors={category.supportingFactors}/><FactorList title="Challenging" factors={category.challengingFactors}/></details>:null}</EditorialSection>;
}

function FactorList({title,factors}:{title:string;factors?:CompatibilityFactor[]}){if(!factors?.length)return null;return <div className="factor-list"><h4>{title}</h4>{factors.map((factor,index)=><p key={index}><strong>{factor.title??factor.label??[factor.planetA,factor.aspect,factor.planetB].filter(Boolean).join(' ')}</strong>{factor.interpretation??factor.description}{typeof factor.orb==='number'&&<small>{factor.orb.toFixed(2)}° orb</small>}</p>)}</div>}
function Evidence({factors}:{factors:CompatibilityFactor[]}){return <section className="evidence-section"><details><summary>Astrological basis <ChevronDown/></summary><FactorList title="Backend-provided factors" factors={factors}/></details></section>}
function EditorialSection({index,title,children}:{index:string;title:string;children:ReactNode}){return <section className="editorial-section"><span>{index}</span><div><h2>{title}</h2>{children}</div></section>}
function Quality({value}:{value:string}){return <span className="data-quality"><i/>{titleCase(value)}</span>}
function RelationshipSkeleton(){return <div className="relationship-skeleton" aria-label="Loading" role="status"><i/><i/><i/></div>}
function GenerationProgress({reading=false}:{reading?:boolean}){return <section className="generation-progress" aria-live="polite"><span/><p className="eyebrow">{reading?'OPENING YOUR REPORT':'CALCULATING PRIVATELY'}</p><h1>{reading?'Returning to the space between you…':'Reading the relationship between two charts…'}</h1><ol><li>Preparing both charts</li><li>Comparing major placements</li><li>Evaluating emotional and communication dynamics</li><li>Identifying strengths and friction</li><li>Writing your report</li></ol></section>}
function titleCase(value:string){return value.replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
function statusCopy(status:Relationship['status']){return {draft:'Ready to calculate when you are.',calculating:'Comparing both charts now.',compatibility_ready:'The deterministic comparison is ready.',generating_report:'Writing your private relationship report.',ready:'Your relationship report is ready.',failed:'We couldn’t finish this reading. Your saved details are safe.',stale:'Birth details changed. A refreshed report is available.'}[status]}
