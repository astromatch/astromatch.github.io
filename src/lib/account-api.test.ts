import { beforeEach, describe, expect, it, vi } from 'vitest';

const {apiMock}=vi.hoisted(()=>({apiMock:vi.fn()}));
vi.mock('./api',()=>({api:apiMock}));

import { accountApi, type ProfileInput } from './account';

describe('account API contract',()=>{
  beforeEach(()=>apiMock.mockReset());

  it('sends the profile body when completing the profile step',async()=>{
    apiMock.mockResolvedValue({});
    const profile:ProfileInput={
      preferred_name:'Deepak',
      gender:'man',
      pronouns:null,
      date_of_birth:'1990-01-01',
    };

    await accountApi.updateProfile(profile);
    await accountApi.completeProfile(profile);

    expect(apiMock).toHaveBeenNthCalledWith(1,'/api/v1/me/profile',{
      method:'PATCH',
      body:JSON.stringify(profile),
    });
    expect(apiMock).toHaveBeenNthCalledWith(2,'/api/v1/me/profile/complete',{
      method:'POST',
      body:JSON.stringify(profile),
    });
    for(const [,options] of apiMock.mock.calls){
      const body=JSON.parse(String((options as RequestInit).body));
      expect(body).not.toHaveProperty('country_code');
      expect(body).not.toHaveProperty('timezone');
      expect(body).not.toHaveProperty('locale');
      expect(body).not.toHaveProperty('email');
    }
  });
});
