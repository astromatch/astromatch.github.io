import { api } from './api';

export type NextOnboardingStep = 'complete_profile' | 'create_birth_profile' | null;

export interface AccountState {
  id: string;
  profile_status: 'incomplete' | 'profile_complete' | 'complete';
  onboarding_completed: boolean;
  next_step: NextOnboardingStep;
  user_profile?: {
    first_name?: string | null;
    preferred_name?: string | null;
    date_of_birth?: string | null;
    country_code?: string | null;
    timezone?: string | null;
    locale?: string | null;
  } | null;
}

export interface ProfileInput {
  first_name?: string;
  preferred_name?: string;
  date_of_birth: string;
  country_code: string;
  timezone: string;
  locale: string;
}

export interface BirthProfileInput {
  display_name: string;
  pronouns?: string | null;
  birth_date: string;
  birth_time?: string | null;
  birth_time_status: 'exact' | 'approximate' | 'unknown';
  birth_time_accuracy_minutes?: number | null;
  birth_place_label: string;
  latitude: number;
  longitude: number;
  timezone: string;
  astrology_system: 'western_tropical';
}

export const accountApi = {
  get: () => api<AccountState>('/api/v1/me'),
  updateProfile: (profile: ProfileInput) => api<AccountState>('/api/v1/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }),
  completeProfile: () => api<AccountState>('/api/v1/me/profile/complete', { method: 'POST' }),
  createBirthProfile: (profile: BirthProfileInput) => api('/api/v1/me/birth-profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  }),
};

export function routeForAccount(account: AccountState) {
  if (account.onboarding_completed && account.profile_status === 'complete') return '/home';
  if (account.next_step === 'create_birth_profile' || account.profile_status === 'profile_complete') {
    return '/onboarding/birth-profile';
  }
  return '/onboarding/profile';
}
