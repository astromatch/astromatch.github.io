import { useCallback, useEffect, useState } from 'react';
import { Ban, Heart, Pause, Play, ShieldCheck, Sparkles, UserRoundCheck, X } from 'lucide-react';
import { AppShell, Page } from './components';
import { ApiError } from './lib/api';
import { matchmakingApi, type DatingMatch, type Introduction } from './lib/matchmaking';
import './matchmaking.css';

const messageFor=(error:unknown)=>error instanceof ApiError?error.message:'Something interrupted discovery. Please try again.';

export function MatchmakingPage(){
  const [introductions,setIntroductions]=useState<Introduction[]>([]);
  const [matches,setMatches]=useState<DatingMatch[]>([]);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState('');
  const [tab,setTab]=useState<'discover'|'matches'>('discover');
  const [allowFirst,setAllowFirst]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true);setMessage('');
    const [introResult,matchResult]=await Promise.allSettled([matchmakingApi.introductions(),matchmakingApi.matches()]);
    if(introResult.status==='fulfilled')setIntroductions(introResult.value.items);
    else setMessage(messageFor(introResult.reason));
    if(matchResult.status==='fulfilled')setMatches(matchResult.value.items);
    setLoading(false);
  },[]);
  useEffect(()=>{void load()},[load]);

  async function activate(){try{await matchmakingApi.activate();await load()}catch(error){setMessage(messageFor(error))}}
  async function pause(){try{await matchmakingApi.pause();setIntroductions([]);setMessage('Discovery paused. Your existing matches remain available.')}catch(error){setMessage(messageFor(error))}}
  async function decide(person:Introduction,decision:'like'|'pass'){
    try{
      const result=await matchmakingApi.decide(person.user_id,decision,allowFirst);
      setIntroductions(items=>items.filter(item=>item.user_id!==person.user_id));
      if(result.match){setMatches(items=>[result.match!,...items.filter(item=>item.id!==result.match!.id)]);setMessage(`You and ${person.display_name} matched.`)}
    }catch(error){setMessage(messageFor(error))}
  }
  async function unmatch(match:DatingMatch){if(!confirm(`Unmatch ${match.other_display_name}?`))return;try{await matchmakingApi.unmatch(match.id);setMatches(items=>items.filter(item=>item.id!==match.id))}catch(error){setMessage(messageFor(error))}}
  async function block(match:DatingMatch){if(!confirm(`Block ${match.other_display_name}? They will no longer be able to discover or contact you.`))return;try{await matchmakingApi.block(match.other_user_id);setMatches(items=>items.filter(item=>item.id!==match.id))}catch(error){setMessage(messageFor(error))}}

  return <AppShell><div className="matchmaking-page">
    <Page eyebrow="CURATED MATCHMAKING" title="Thoughtful introductions" action={<button className="quiet-action" onClick={pause}><Pause/> Pause</button>}/>
    <p className="matchmaking-intro">A small daily set chosen within both people’s boundaries. Astrology adds context—it never overrides your preferences.</p>
    <nav className="matchmaking-tabs"><button className={tab==='discover'?'active':''} onClick={()=>setTab('discover')}>Discover <span>{introductions.length}</span></button><button className={tab==='matches'?'active':''} onClick={()=>setTab('matches')}>Matches <span>{matches.length}</span></button></nav>
    {message&&<p role="status" className="matchmaking-message">{message}</p>}
    {loading&&<p role="status">Preparing today’s introductions…</p>}
    {!loading&&tab==='discover'&&<>
      <label className="first-move-choice"><input type="checkbox" checked={allowFirst} onChange={event=>setAllowFirst(event.target.checked)}/><span><strong>They may message first if we match</strong><small>Turn this off when you prefer to make the first move yourself.</small></span></label>
      <div className="introduction-grid">{introductions.map(person=><article className="introduction-card" key={person.user_id}>
        <div className="introduction-photo">{person.photo_url?<img src={person.photo_url} alt={person.display_name}/>:<UserRoundCheck/>}<span>{person.distance_km} km away</span></div>
        <div className="introduction-copy"><p className="eyebrow">{person.relationship_intent.replaceAll('_',' ')}</p><h2>{person.display_name}, {person.age}</h2><p>{person.bio}</p><div className="intro-themes">{person.explanation_themes.map(theme=><span key={theme}><Sparkles/>{theme}</span>)}</div><div className="intro-interests">{person.interests.slice(0,5).map(interest=><span key={interest}>{interest}</span>)}</div></div>
        <div className="introduction-actions"><button aria-label={`Pass on ${person.display_name}`} onClick={()=>decide(person,'pass')}><X/></button><button className="like" aria-label={`Like ${person.display_name}`} onClick={()=>decide(person,'like')}><Heart/></button></div>
      </article>)}</div>
      {!introductions.length&&<div className="matchmaking-empty"><Sparkles/><h2>Your daily set is clear</h2><p>We’ll show new people when mutually eligible profiles are available.</p><button className="button secondary" onClick={activate}><Play/> Activate or refresh discovery</button></div>}
    </>}
    {!loading&&tab==='matches'&&<div className="dating-match-list">{matches.map(match=><article key={match.id}><div>{match.other_photo_url?<img src={match.other_photo_url} alt=""/>:<Heart/>}</div><section><small>MATCHED</small><h2>{match.other_display_name}</h2><p>{match.can_current_user_initiate?'You may make the first move.':'They have the first move.'} Messaging opens in the next matchmaking milestone.</p></section><aside><button onClick={()=>unmatch(match)}>Unmatch</button><button onClick={()=>block(match)}><Ban/> Block</button></aside></article>)}{!matches.length&&<div className="matchmaking-empty"><ShieldCheck/><h2>No mutual matches yet</h2><p>Your likes stay private unless the other person likes you too.</p></div>}</div>}
  </div></AppShell>;
}
