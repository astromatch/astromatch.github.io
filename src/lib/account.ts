import { api } from './api';

export type NextOnboardingStep = 'complete_profile' | 'create_birth_profile' | null;

export interface AccountState {
  id: string;
  profile_status: 'incomplete' | 'profile_complete' | 'complete';
  onboarding_completed: boolean;
  next_step: NextOnboardingStep;
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    preferred_name?: string | null;
    gender?: string | null;
    pronouns?: string | null;
    date_of_birth?: string | null;
    relationship_status?: string | null;
    looking_for?: string | null;
    country_code?: string | null;
    timezone?: string | null;
    locale?: string | null;
    bio?: string | null;
  } | null;
}

export interface ProfileInput {
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  gender?: string | null;
  pronouns?: string | null;
  date_of_birth: string;
  relationship_status?: string | null;
  looking_for?: string | null;
  country_code: string;
  timezone: string;
  locale: string;
  bio?: string | null;
}

export interface BirthProfileInput {
  displayName: string;
  pronouns?: string | null;
  birthDate: string;
  birthTime?: string | null;
  birthTimeStatus: 'exact' | 'approximate' | 'unknown';
  birthTimeAccuracyMinutes?: number | null;
  birthPlaceLabel: string;
  latitude: number;
  longitude: number;
  timezone: string;
  astrologySystem: 'western_tropical';
}

export const accountApi = {
  get: () => api<AccountState>('/api/v1/me'),
  updateProfile: (profile: ProfileInput) => api<AccountState>('/api/v1/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }),
  completeProfile: (profile: ProfileInput) => api<AccountState>('/api/v1/me/profile/complete', {
    method: 'POST',
    body: JSON.stringify(profile),
  }),
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
