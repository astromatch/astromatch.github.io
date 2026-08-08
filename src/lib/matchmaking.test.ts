import { beforeEach, describe, expect, it, vi } from 'vitest';

const {apiMock}=vi.hoisted(()=>({apiMock:vi.fn()}));
vi.mock('./api',async importOriginal=>{
  const actual=await importOriginal<typeof import('./api')>();
  return {...actual,api:apiMock,idempotencyHeaders:()=>({'Idempotency-Key':'test-key'})};
});

import { matchmakingApi } from './matchmaking';

describe('matchmaking API contract',()=>{
  beforeEach(()=>apiMock.mockReset());
  it('writes a like with server-resolved first-move input and idempotency',async()=>{
    apiMock.mockResolvedValue({decision:'like'});
    await matchmakingApi.decide('candidate-1','like',true);
    expect(apiMock).toHaveBeenCalledWith('/api/v1/discovery/introductions/candidate-1/decision',{
      method:'PUT',headers:{'Idempotency-Key':'test-key'},body:JSON.stringify({decision:'like',allow_match_to_message_first:true}),
    });
  });
  it('does not attach first-move data to a pass',async()=>{
    apiMock.mockResolvedValue({decision:'pass'});
    await matchmakingApi.decide('candidate-1','pass',true);
    expect(apiMock).toHaveBeenCalledWith('/api/v1/discovery/introductions/candidate-1/decision',expect.objectContaining({body:JSON.stringify({decision:'pass'})}));
  });
});
