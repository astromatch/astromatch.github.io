import { describe, expect, it } from 'vitest';
import { parseEnvironment } from './env';

describe('environment validation', () => {
  it('uses safe defaults for empty GitHub Actions variables', () => {
    const result = parseEnvironment({
      VITE_API_BASE_URL: '',
      VITE_ENABLE_ANALYTICS: '',
      VITE_ENABLE_DEV_FIXTURES: '',
    });

    expect(result.VITE_API_BASE_URL).toBe('https://api.astromatch.world');
    expect(result.VITE_ENABLE_ANALYTICS).toBe('false');
    expect(result.VITE_ENABLE_DEV_FIXTURES).toBe('false');
  });
});
