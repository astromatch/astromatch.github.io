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
  country_code?: string;
  timezone?: string;
  locale?: string;
  bio?: string | null;
}

const timezoneAliases:Record<string,string>={
  'Asia/Calcutta':'Asia/Kolkata',
  'US/Eastern':'America/New_York',
  'US/Central':'America/Chicago',
  'US/Mountain':'America/Denver',
  'US/Pacific':'America/Los_Angeles',
};

const timezoneCountries:Record<string,string>={
  'Asia/Kolkata':'IN','Asia/Colombo':'LK','Asia/Kathmandu':'NP','Asia/Dhaka':'BD','Asia/Karachi':'PK',
  'Asia/Dubai':'AE','Asia/Singapore':'SG','Asia/Tokyo':'JP','Asia/Seoul':'KR','Asia/Shanghai':'CN','Asia/Hong_Kong':'HK',
  'Australia/Sydney':'AU','Pacific/Auckland':'NZ','Europe/London':'GB','Europe/Dublin':'IE','Europe/Paris':'FR','Europe/Berlin':'DE',
  'America/New_York':'US','America/Chicago':'US','America/Denver':'US','America/Los_Angeles':'US',
  'America/Toronto':'CA','America/Vancouver':'CA',
};

export function normalizeTimezone(value:string){
  return timezoneAliases[value]??value;
}

export function inferCountryCode(timezone:string,locale:string){
  const timezoneCountry=timezoneCountries[normalizeTimezone(timezone)];
  if(timezoneCountry)return timezoneCountry;
  try{return new Intl.Locale(locale).maximize().region??'US'}catch{return 'US'}
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
};

export function routeForAccount(account: AccountState) {
  if (account.onboarding_completed && account.profile_status === 'complete') return '/home';
  if (account.next_step === 'create_birth_profile' || account.profile_status === 'profile_complete') {
    return '/onboarding/birth-profile';
  }
  return '/onboarding/profile';
}
