import { afterEach, describe, expect, it, vi } from 'vitest';
import { wakeBackend } from './backendWake';

describe('backend wake-up',()=>{
  afterEach(()=>vi.unstubAllGlobals());

  it('calls the documented public health endpoint without blocking',()=>{
    const fetchMock=vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch',fetchMock);
    expect(wakeBackend()).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('https://astromatch-api-k996.onrender.com/health',{
      method:'GET',
      cache:'no-store',
      headers:{Accept:'application/json'},
    });
  });
});
