import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Camera, MapPin, Pencil, Plus, Save, Sparkles, Star, Trash2, X } from 'lucide-react';
import { AppShell } from './components';
import { ProfileTabs } from './ProfileTabs';
import { accountApi, type AccountState } from './lib/account';
import { ApiError } from './lib/api';
import { datingProfileApi, type DatingPhoto, type DatingProfile, type DatingPrompt, type DatingQuestion, type ProfileVisibility } from './lib/datingProfile';
import { auth } from './lib/firebase';

const promptIdeas=['The quickest way to my heart is…','A perfect Sunday looks like…','I’ll never stop talking about…'];
const questionIdeas=['What are you looking for right now?','What makes a relationship feel safe?'];
const emptyProfile:DatingProfile={username:null,bio:null,max_distance_km:null,preferences:{},hobbies:[],interests:[],visibility:'matches',discovery_paused:false,prompts:[],questions:[],photos:[]};
const commaList=(value:FormDataEntryValue|null)=>String(value??'').split(',').map(item=>item.trim()).filter(Boolean);

function errorMessage(error:unknown,fallback:string){
  return error instanceof ApiError?error.message:error instanceof Error?error.message:fallback;
}

export function DatingProfilePage(){
  const [account,setAccount]=useState<AccountState|null>(null);
  const [profile,setProfile]=useState<DatingProfile>(emptyProfile);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [editing,setEditing]=useState(false);
  const [message,setMessage]=useState('');
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const [prompts,setPrompts]=useState<DatingPrompt[]>([]);
  const [questions,setQuestions]=useState<DatingQuestion[]>([]);
  const fileInput=useRef<HTMLInputElement>(null);

  async function load(){
    setLoading(true);
    setMessage('');
    try{
      const [accountState,datingState]=await Promise.all([accountApi.get(),datingProfileApi.get()]);
      setAccount(accountState);
      setProfile({...emptyProfile,...datingState});
      setPrompts(datingState.prompts??[]);
      setQuestions(datingState.questions??[]);
    }catch(error){
      setMessage(errorMessage(error,'We couldn’t load your dating profile.'));
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{void load()},[]);

  const accountProfile=account?.profile;
  const name=accountProfile?.preferred_name??accountProfile?.first_name??auth?.currentUser?.displayName??'Your profile';
  const username=profile.username?`@${profile.username}`:'Your dating profile';
  const interestedIn=profile.preferences?.interested_in??[];
  const allInterests=[...profile.hobbies,...profile.interests];
  const displayPrompts:DatingPrompt[]=profile.prompts.length?profile.prompts:promptIdeas.map((prompt,position)=>({prompt,answer:'',position}));
  const displayQuestions:DatingQuestion[]=profile.questions.length?profile.questions:questionIdeas.map((question,position)=>({question,answer:'',position}));

  function updatePrompt(index:number,field:'prompt'|'answer',value:string){
    setPrompts(items=>items.map((item,itemIndex)=>itemIndex===index?{...item,[field]:value}:item));
  }

  function updateQuestion(index:number,field:'question'|'answer',value:string){
    setQuestions(items=>items.map((item,itemIndex)=>itemIndex===index?{...item,[field]:value}:item));
  }

  async function saveProfile(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(saving)return;
    setSaving(true);
    setMessage('');
    setFieldErrors({});
    const form=new FormData(event.currentTarget);
    const normalizedPrompts=prompts.filter(item=>item.prompt.trim()||item.answer.trim()).map((item,position)=>({...item,prompt:item.prompt.trim(),answer:item.answer.trim(),position}));
    const normalizedQuestions=questions.filter(item=>item.question.trim()||item.answer.trim()).map((item,position)=>({...item,question:item.question.trim(),answer:item.answer.trim(),position}));
    try{
      const updated=await datingProfileApi.patch({
        username:String(form.get('username')).trim()||null,
        bio:String(form.get('bio')).trim()||null,
        max_distance_km:form.get('max_distance_km')?Number(form.get('max_distance_km')):null,
        preferences:{...profile.preferences,interested_in:commaList(form.get('interested_in'))},
        hobbies:commaList(form.get('hobbies')),
        interests:commaList(form.get('interests')),
        visibility:String(form.get('visibility')) as ProfileVisibility,
        discovery_paused:form.get('discovery_paused')==='on',
        prompts:normalizedPrompts,
        questions:normalizedQuestions,
      });
      setProfile({...emptyProfile,...updated});
      setPrompts(updated.prompts??normalizedPrompts);
      setQuestions(updated.questions??normalizedQuestions);
      setEditing(false);
      setMessage('Dating profile saved.');
    }catch(error){
      if(error instanceof ApiError)setFieldErrors(error.fields??{});
      setMessage(errorMessage(error,'We couldn’t save your dating profile.'));
    }finally{
      setSaving(false);
    }
  }

  async function uploadPhoto(file:File){
    if(uploading||profile.photos.length>=6)return;
    setUploading(true);
    setMessage('');
    try{
      await datingProfileApi.uploadPhoto(file);
      await load();
      setMessage('Photo added.');
    }catch(error){
      setMessage(errorMessage(error,'We couldn’t upload that photo.'));
    }finally{
      setUploading(false);
      if(fileInput.current)fileInput.current.value='';
    }
  }

  async function updatePhoto(photoId:string,patch:{alt?:string|null;is_primary?:boolean}){
    setMessage('');
    try{
      await datingProfileApi.updatePhoto(photoId,patch);
      await load();
    }catch(error){
      setMessage(errorMessage(error,'We couldn’t update that photo.'));
    }
  }

  async function deletePhoto(photo:DatingPhoto){
    if(!confirm('Remove this profile photo?'))return;
    setMessage('');
    try{
      await datingProfileApi.deletePhoto(photo.id);
      await load();
    }catch(error){
      setMessage(errorMessage(error,'We couldn’t remove that photo.'));
    }
  }

  async function movePhoto(index:number,direction:-1|1){
    const nextIndex=index+direction;
    if(nextIndex<0||nextIndex>=profile.photos.length)return;
    const reordered=[...profile.photos];
    [reordered[index],reordered[nextIndex]]=[reordered[nextIndex],reordered[index]];
    setProfile(current=>({...current,photos:reordered.map((photo,position)=>({...photo,position}))}));
    try{
      await datingProfileApi.orderPhotos(reordered.map(photo=>photo.id));
    }catch(error){
      setMessage(errorMessage(error,'We couldn’t reorder your photos.'));
      await load();
    }
  }

  return <AppShell>
    <section className="dating-profile">
      <header className="dating-profile-head">
        <div className="profile-avatar">{profile.photos[0]?<img src={profile.photos[0].url} alt={profile.photos[0].alt??name}/>:<span>{name.charAt(0).toUpperCase()}</span>}</div>
        <p className="eyebrow">{profile.discovery_paused?'DISCOVERY PAUSED':'YOUR DATING PROFILE'}</p>
        <h1>{name}</h1>
        <p>{username} · {profile.visibility}</p>
      </header>
      <ProfileTabs/>
      {loading&&<p role="status" className="profile-status">Loading your profile…</p>}
      {message&&<p role="status" className="form-message">{message}</p>}
      {Object.keys(fieldErrors).length>0&&<ul className="field-errors">{Object.entries(fieldErrors).map(([field,error])=><li key={field}><strong>{field.replaceAll('_',' ')}</strong>: {error}</li>)}</ul>}

      {!loading&&editing&&<form className="dating-edit-form" onSubmit={saveProfile}>
        <div className="profile-section-head"><div><span>EDIT</span><h2>Shape your profile</h2></div><button type="button" onClick={()=>setEditing(false)}><X/> Close</button></div>
        <div className="dating-form-grid">
          <label>Username<input name="username" defaultValue={profile.username??''} placeholder="yourname"/></label>
          <label>Maximum distance (km)<input name="max_distance_km" type="number" min="1" max="1000" defaultValue={profile.max_distance_km??''}/></label>
          <label className="full">Bio<textarea name="bio" defaultValue={profile.bio??''} maxLength={2000} rows={4}/></label>
          <label>Interested in <small>comma separated</small><input name="interested_in" defaultValue={interestedIn.join(', ')}/></label>
          <label>Hobbies <small>comma separated</small><input name="hobbies" defaultValue={profile.hobbies.join(', ')}/></label>
          <label>Interests <small>comma separated</small><input name="interests" defaultValue={profile.interests.join(', ')}/></label>
          <label>Visibility<select name="visibility" defaultValue={profile.visibility}><option value="public">Public</option><option value="matches">Matches only</option><option value="private">Private</option></select></label>
          <label className="consent"><input name="discovery_paused" type="checkbox" defaultChecked={profile.discovery_paused}/> Pause discovery</label>
        </div>

        <fieldset className="collection-editor"><legend>Dating prompts</legend>{prompts.map((item,index)=><div key={item.id??index}><input value={item.prompt} onChange={event=>updatePrompt(index,'prompt',event.target.value)} placeholder={promptIdeas[index]??'Write a prompt'}/><textarea value={item.answer} onChange={event=>updatePrompt(index,'answer',event.target.value)} placeholder="Your answer"/><button type="button" onClick={()=>setPrompts(items=>items.filter((_,itemIndex)=>itemIndex!==index))}><Trash2/> Remove</button></div>)}<button type="button" className="button secondary" onClick={()=>setPrompts(items=>[...items,{prompt:promptIdeas[items.length]??'',answer:'',position:items.length}])} disabled={prompts.length>=3}><Plus/> Add prompt</button></fieldset>

        <fieldset className="collection-editor"><legend>Questions and answers</legend>{questions.map((item,index)=><div key={item.id??index}><input value={item.question} onChange={event=>updateQuestion(index,'question',event.target.value)} placeholder={questionIdeas[index]??'Write a question'}/><textarea value={item.answer} onChange={event=>updateQuestion(index,'answer',event.target.value)} placeholder="Your answer"/><button type="button" onClick={()=>setQuestions(items=>items.filter((_,itemIndex)=>itemIndex!==index))}><Trash2/> Remove</button></div>)}<button type="button" className="button secondary" onClick={()=>setQuestions(items=>[...items,{question:questionIdeas[items.length]??'',answer:'',position:items.length}])} disabled={questions.length>=5}><Plus/> Add question</button></fieldset>

        <button className="button" disabled={saving}><Save/>{saving?'Saving…':'Save dating profile'}</button>
      </form>}

      {!loading&&<div className="dating-profile-body">
        <section className="profile-section">
          <div className="profile-section-head"><div><span>01</span><h2>Your photos</h2></div><button type="button" onClick={()=>fileInput.current?.click()} disabled={uploading||profile.photos.length>=6}><Camera/> {uploading?'Uploading…':'Add photo'}</button></div>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" onChange={event=>{const file=event.target.files?.[0];if(file)void uploadPhoto(file)}}/>
          <div className="photo-manager">{profile.photos.map((photo,index)=><article key={photo.id}><figure><img src={photo.url} alt={photo.alt??`${name} photo ${index+1}`}/>{photo.is_primary&&<span>PRIMARY</span>}</figure><input aria-label={`Alt text for photo ${index+1}`} defaultValue={photo.alt??''} placeholder="Describe this photo" onBlur={event=>{if(event.target.value!==(photo.alt??''))void updatePhoto(photo.id,{alt:event.target.value||null})}}/><div><button type="button" onClick={()=>movePhoto(index,-1)} disabled={!index} aria-label="Move photo left"><ArrowLeft/></button><button type="button" onClick={()=>movePhoto(index,1)} disabled={index===profile.photos.length-1} aria-label="Move photo right"><ArrowRight/></button>{!photo.is_primary&&<button type="button" onClick={()=>updatePhoto(photo.id,{is_primary:true})}><Star/> Primary</button>}<button type="button" onClick={()=>deletePhoto(photo)}><Trash2/> Remove</button></div></article>)}{profile.photos.length<6&&<button type="button" className="photo-placeholder" onClick={()=>fileInput.current?.click()} disabled={uploading}><Plus/><span>Add photo</span><small>JPEG, PNG, WebP, AVIF or HEIC · 10 MB max</small></button>}</div>
        </section>

        <section className="profile-section">
          <div className="profile-section-head"><div><span>02</span><h2>A little about you</h2></div><button type="button" onClick={()=>setEditing(true)}><Pencil/> Edit</button></div>
          <p className={profile.bio?'profile-bio':'profile-empty'}>{profile.bio??'Add a short introduction that sounds like you—not a résumé.'}</p>
        </section>

        <section className="profile-section">
          <div className="profile-section-head"><div><span>03</span><h2>Prompts with personality</h2></div><Sparkles/></div>
          <div className="prompt-stack">{displayPrompts.map((item,index)=><article key={item.id??index}><small>{item.prompt}</small><p className={item.answer?'':'profile-empty'}>{item.answer||'Add an answer that gives someone an easy opening message.'}</p></article>)}</div>
        </section>

        <section className="profile-section">
          <div className="profile-section-head"><div><span>04</span><h2>Questions worth answering</h2></div></div>
          <div className="qa-grid">{displayQuestions.map((item,index)=><article key={item.id??index}><small>{item.question}</small><p className={item.answer?'':'profile-empty'}>{item.answer||'Not answered yet'}</p></article>)}</div>
        </section>

        <section className="profile-section preference-grid">
          <article><MapPin/><small>DISTANCE</small><strong>{profile.max_distance_km?`Within ${profile.max_distance_km} km`:'Set your preferred distance'}</strong></article>
          <article><Sparkles/><small>INTERESTED IN</small><strong>{interestedIn.length?interestedIn.join(', '):'Tell us who you would like to meet'}</strong></article>
        </section>

        <section className="profile-section">
          <div className="profile-section-head"><div><span>05</span><h2>Hobbies & interests</h2></div></div>
          {allInterests.length?<div className="interest-cloud">{allInterests.map(interest=><span key={interest}>{interest}</span>)}</div>:<div className="interest-cloud empty"><span>Travel</span><span>Live music</span><span>Cooking</span><span>Books</span><small>Choose the ones that feel like you.</small></div>}
        </section>
      </div>}
    </section>
  </AppShell>;
}
