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
  const token=await auth?.currentUser?.getIdToken();
  const requestId=crypto.randomUUID();
  try{
    const response=await fetch(`${env.VITE_API_BASE_URL}${path}`,{
      ...options,
      headers:requestHeaders(options,token,requestId),
    });
    const body=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=body?.error;
      throw new ApiError(
        codes[response.status]??(response.status>=500?'SERVER_ERROR':'VALIDATION_ERROR'),
        error?.message??friendly(response.status),
        response.status,
        error?.fields,
        body?.meta?.requestId??requestId,
      );
    }
    return (body?.data??body) as T;
  }catch(error){
    if(error instanceof ApiError)throw error;
    if((error as Error).name==='AbortError')throw error;
    throw new ApiError('NETWORK_ERROR','AstroMatch could not connect. Please try again.',0);
  }
}

function friendly(status:number){if(status===401)return 'Your session has expired. Please sign in again.';if(status===429)return 'You’ve reached the current limit. Please try again later.';if(status>=500)return 'AstroMatch is having a quiet moment. Please try again.';return 'We could not complete that request.'}
