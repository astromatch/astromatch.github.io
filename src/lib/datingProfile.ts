import { ApiError, api } from './api';

export type ProfileVisibility='public'|'matches'|'private';

export interface DatingPrompt {
  id?:string;
  prompt:string;
  answer:string;
  position:number;
}

export interface DatingQuestion {
  id?:string;
  question:string;
  answer:string;
  position:number;
}

export interface DatingPhoto {
  id:string;
  url:string;
  alt:string|null;
  position:number;
  is_primary:boolean;
}

export interface DatingPreferences {
  interested_in?:string[];
  [key:string]:unknown;
}

export interface DatingProfile {
  username:string|null;
  bio:string|null;
  max_distance_km:number|null;
  preferences:DatingPreferences;
  hobbies:string[];
  interests:string[];
  visibility:ProfileVisibility;
  discovery_paused:boolean;
  prompts:DatingPrompt[];
  questions:DatingQuestion[];
  photos:DatingPhoto[];
}

export interface DatingProfilePatch {
  username?:string|null;
  bio?:string|null;
  max_distance_km?:number|null;
  preferences?:DatingPreferences;
  hobbies?:string[];
  interests?:string[];
  visibility?:ProfileVisibility;
  discovery_paused?:boolean;
  prompts?:DatingPrompt[];
  questions?:DatingQuestion[];
}

interface UploadAuthorization {
  upload_url:string;
  fields:Record<string,string|number|boolean>;
}

interface CloudinaryResponse {
  public_id?:string;
  error?:{message?:string};
}

const acceptedTypes=new Set([
  'image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif',
]);
const acceptedExtensions=new Set(['jpg','jpeg','png','webp','avif','heic','heif']);
const maxPhotoBytes=10*1024*1024;

function retry503<T>(operation:()=>Promise<T>,attempt=0):Promise<T>{
  return operation().catch(async error=>{
    if(error instanceof ApiError&&error.status===503&&attempt<2){
      await new Promise(resolve=>setTimeout(resolve,300*(2**attempt)));
      return retry503(operation,attempt+1);
    }
    throw error;
  });
}

export function validateDatingPhoto(file:File){
  const extension=file.name.split('.').pop()?.toLowerCase()??'';
  if(!acceptedTypes.has(file.type)&&!acceptedExtensions.has(extension)){
    return 'Choose a JPEG, PNG, WebP, AVIF, or HEIC image.';
  }
  if(file.size>maxPhotoBytes)return 'Photos must be 10 MB or smaller.';
  return null;
}

export const datingProfileApi={
  get:()=>api<DatingProfile>('/api/v1/me/dating-profile'),
  patch:(patch:DatingProfilePatch)=>retry503(()=>api<DatingProfile>('/api/v1/me/dating-profile',{
    method:'PATCH',
    body:JSON.stringify(patch),
  })),
  updatePhoto:(photoId:string,patch:{alt?:string|null;is_primary?:boolean})=>retry503(()=>api<DatingPhoto>(`/api/v1/me/dating-profile/photos/${photoId}`,{
    method:'PATCH',
    body:JSON.stringify(patch),
  })),
  orderPhotos:(ids:string[])=>retry503(()=>api<DatingPhoto[]>('/api/v1/me/dating-profile/photos/order',{
    method:'PUT',
    body:JSON.stringify({photo_ids:ids}),
  })),
  deletePhoto:(photoId:string)=>retry503(()=>api<void>(`/api/v1/me/dating-profile/photos/${photoId}`,{method:'DELETE'})),
  async uploadPhoto(file:File,alt='Profile photo'){
    const validationError=validateDatingPhoto(file);
    if(validationError)throw new Error(validationError);
    const authorization=await retry503(()=>api<UploadAuthorization>('/api/v1/me/dating-profile/photos/upload-url',{method:'POST'}));
    const form=new FormData();
    Object.entries(authorization.fields).forEach(([key,value])=>form.append(key,String(value)));
    form.append('file',file);
    const cloudinaryResponse=await fetch(authorization.upload_url,{method:'POST',body:form});
    const cloudinaryBody=await cloudinaryResponse.json().catch(()=>({})) as CloudinaryResponse;
    if(!cloudinaryResponse.ok||!cloudinaryBody.public_id){
      throw new Error(cloudinaryBody.error?.message??'Photo upload failed.');
    }
    return retry503(()=>api<DatingPhoto>('/api/v1/me/dating-profile/photos',{
      method:'POST',
      body:JSON.stringify({public_id:cloudinaryBody.public_id,alt}),
    }));
  },
};
