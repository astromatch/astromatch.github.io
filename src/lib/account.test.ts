import { describe, expect, it } from 'vitest';
import { routeForAccount, type AccountState } from './account';

const account = (values: Partial<AccountState>): AccountState => ({
  id: 'internal-account-id',
  profile_status: 'incomplete',
  onboarding_completed: false,
  next_step: 'complete_profile',
  ...values,
});

describe('account routing', () => {
  it('routes incomplete accounts to profile completion', () => {
    expect(routeForAccount(account({}))).toBe('/onboarding/profile');
  });

  it('routes profile-complete accounts to birth-profile creation', () => {
    expect(routeForAccount(account({
      profile_status: 'profile_complete',
      next_step: 'create_birth_profile',
    }))).toBe('/onboarding/birth-profile');
  });

  it('routes fully onboarded accounts to the dashboard', () => {
    expect(routeForAccount(account({
      profile_status: 'complete',
      onboarding_completed: true,
      next_step: null,
    }))).toBe('/home');
  });
});
