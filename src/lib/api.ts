import { auth } from './firebase';
import { env } from './env';

export type ApiErrorCode='VALIDATION_ERROR'|'UNAUTHENTICATED'|'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'RATE_LIMITED'|'SERVER_ERROR'|'NETWORK_ERROR';
export class ApiError extends Error { constructor(public code:ApiErrorCode,message:string,public status:number,public fields?:Record<string,string>,public requestId?:string){super(message)} }
const codes:Record<number,ApiErrorCode>={400:'VALIDATION_ERROR',401:'UNAUTHENTICATED',403:'FORBIDDEN',404:'NOT_FOUND',409:'CONFLICT',422:'VALIDATION_ERROR',429:'RATE_LIMITED'};

export function requestHeaders(options:RequestInit,token:string|undefined,requestId:string){
  const headers=new Headers(options.headers);
  if(options.body!=null&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');
  headers.set('X-Request-ID',requestId);
  if(token)headers.set('Authorization',`Bearer ${token}`);
  return headers;
}

export async function api<T>(path:string,options:RequestInit={}){
  const requestId=crypto.randomUUID();
  const isGet=(options.method??'GET').toUpperCase()==='GET';
  const maxAttempts=isGet?3:1;
  let forceTokenRefresh=false;
  for(let attempt=0;attempt<maxAttempts;attempt++){
    const token=await auth?.currentUser?.getIdToken(forceTokenRefresh);
    try{
      const response=await fetch(`${env.VITE_API_BASE_URL}${path}`,{
        ...options,
        headers:requestHeaders(options,token,requestId),
      });
      if(response.status===401&&!forceTokenRefresh&&auth?.currentUser){
        forceTokenRefresh=true;
        attempt--;
        continue;
      }
      const body=await response.json().catch(()=>({}));
      if(!response.ok){
        const error=body?.error;
        const apiError=new ApiError(
          codes[response.status]??(response.status>=500?'SERVER_ERROR':'VALIDATION_ERROR'),
          error?.message??friendly(response.status),
          response.status,
          error?.fields,
          body?.meta?.requestId??requestId,
        );
        if(isGet&&(response.status===500||response.status===503)&&attempt<maxAttempts-1){
          await retryDelay(attempt);
          continue;
        }
        throw apiError;
      }
      return (body?.data??body) as T;
    }catch(error){
      if(error instanceof ApiError)throw error;
      if((error as Error).name==='AbortError')throw error;
      if(isGet&&attempt<maxAttempts-1){
        await retryDelay(attempt);
        continue;
      }
      throw new ApiError('NETWORK_ERROR','AstroMatch could not connect. Please try again.',0);
    }
  }
  throw new ApiError('NETWORK_ERROR','AstroMatch could not connect. Please try again.',0);
}

const retryDelay=(attempt:number)=>new Promise(resolve=>setTimeout(resolve,250*(2**attempt)));

function friendly(status:number){if(status===401)return 'Your session has expired. Please sign in again.';if(status===429)return 'You’ve reached the current limit. Please try again later.';if(status>=500)return 'AstroMatch is having a quiet moment. Please try again.';return 'We could not complete that request.'}
