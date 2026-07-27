import { beforeEach, describe, expect, it, vi } from 'vitest';

const {apiMock}=vi.hoisted(()=>({apiMock:vi.fn()}));
vi.mock('./api',async importOriginal=>{
  const actual=await importOriginal<typeof import('./api')>();
  return {...actual,api:apiMock};
});

import { normalizePerson, normalizeRelationship, normalizeReport, peopleApi, relationshipsApi } from './relationships';

describe('relationship API boundary',()=>{
  beforeEach(()=>apiMock.mockReset());

  it('normalizes camelCase and snake_case person fields',()=>{
    expect(normalizePerson({id:'p1',display_name:'M',relationship_type:'friend',birth_time_status:'unknown'})).toMatchObject({
      id:'p1',displayName:'M',relationshipType:'friend',birthTimeStatus:'unknown',
    });
  });

  it('normalizes explicit relationship status without inferring from report fields',()=>{
    expect(normalizeRelationship({id:'m1',person_id:'p1',status:'generating_report',report:{headline:'Not ready'}}).status).toBe('generating_report');
  });

  it('normalizes report categories and technical factors',()=>{
    const report=normalizeReport({overall_score:81,categories:[{key:'communication',label:'Communication',supporting_factors:[{planet_a:'Mercury',planet_b:'Moon',aspect:'trine',orb:2.1}]}]});
    expect(report.overallScore).toBe(81);
    expect(report.categories?.[0].supportingFactors?.[0]).toMatchObject({planetA:'Mercury',planetB:'Moon',aspect:'trine',orb:2.1});
  });

  it('uses documented People endpoints',async()=>{
    apiMock.mockResolvedValueOnce([]);
    await peopleApi.all();
    expect(apiMock).toHaveBeenCalledWith('/api/v1/people',{signal:undefined});
  });

  it('sends an idempotency key for expensive generation',async()=>{
    apiMock.mockResolvedValueOnce({id:'m1',personId:'p1',status:'ready'});
    await relationshipsApi.generate('m1','stable-key');
    expect(apiMock).toHaveBeenCalledWith('/api/v1/matches/m1/generate',{
      method:'POST',
      headers:{'Idempotency-Key':'stable-key'},
    });
  });
});
