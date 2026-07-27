import { env } from './env';

export function wakeBackend(){
  void fetch(`${env.VITE_API_BASE_URL}/health`,{
    method:'GET',
    cache:'no-store',
    headers:{Accept:'application/json'},
  }).catch(()=>undefined);
}
