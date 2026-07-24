import { beforeEach, describe, expect, it, vi } from 'vitest';

const {apiMock}=vi.hoisted(()=>({apiMock:vi.fn()}));
vi.mock('./api',async importOriginal=>{
  const actual=await importOriginal<typeof import('./api')>();
  return {...actual,api:apiMock};
});

import { birthProfilesApi, type BirthProfileInput } from './birthProfiles';

const input:BirthProfileInput={
  display_name:'Deepak',
  relationship_type:'self',
  birth_date:'1996-08-27',
  birth_time:null,
  birth_time_precision:'unknown',
  timezone:'Asia/Kolkata',
  country:'IN',
  city:'Mumbai',
  latitude:19.076,
  longitude:72.8777,
  is_primary:true,
  notes:null,
};

describe('birth profile API contract',()=>{
  beforeEach(()=>apiMock.mockReset());

  it('creates a profile with the documented snake_case payload',async()=>{
    apiMock.mockResolvedValue({profile:{id:'profile-1',...input},active_chart_id:'chart-1'});
    await birthProfilesApi.create(input);
    expect(apiMock).toHaveBeenCalledWith('/api/v1/birth-profiles',{
      method:'POST',
      body:JSON.stringify(input),
    });
  });

  it('loads the generated chart by profile id',async()=>{
    apiMock.mockResolvedValue({});
    await birthProfilesApi.chart('profile-1');
    expect(apiMock).toHaveBeenCalledWith('/api/v1/birth-profiles/profile-1/chart');
  });

  it('recalculates using the birth profile id and no request body',async()=>{
    apiMock.mockResolvedValue({});
    await birthProfilesApi.recalculate('birth-profile-id');
    expect(apiMock).toHaveBeenCalledWith('/api/v1/birth-profiles/birth-profile-id/recalculate',{
      method:'POST',
    });
  });
});
