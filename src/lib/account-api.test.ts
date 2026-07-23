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
      date_of_birth:'1990-01-01',
      country_code:'IN',
      timezone:'Asia/Kolkata',
      locale:'en-IN',
    };

    await accountApi.completeProfile(profile);

    expect(apiMock).toHaveBeenCalledWith('/api/v1/me/profile/complete',{
      method:'POST',
      body:JSON.stringify(profile),
    });
  });
});
