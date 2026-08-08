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
  it('reports with an idempotency key and interaction context',async()=>{
    apiMock.mockResolvedValue({id:'report-1',status:'open'});
    await matchmakingApi.report('candidate-1','match','match-1','harassment','Repeated unwanted contact');
    expect(apiMock).toHaveBeenCalledWith('/api/v1/safety/reports',{
      method:'POST',headers:{'Idempotency-Key':'test-key'},body:JSON.stringify({reported_user_id:'candidate-1',category:'harassment',details:'Repeated unwanted contact',context_type:'match',context_id:'match-1'}),
    });
  });
  it('supports private hides and durable notification reads',async()=>{
    apiMock.mockResolvedValue(undefined);
    await matchmakingApi.hide('candidate-1');
    await matchmakingApi.markNotificationRead('notification-1');
    expect(apiMock).toHaveBeenNthCalledWith(1,'/api/v1/safety/hides/candidate-1',{method:'PUT'});
    expect(apiMock).toHaveBeenNthCalledWith(2,'/api/v1/matchmaking/notifications/notification-1/read',{method:'PUT'});
  });
});
