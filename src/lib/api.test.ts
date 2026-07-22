import { describe, expect, it } from 'vitest'; import { ApiError } from './api';
describe('API errors',()=>{it('retains safe structured details',()=>{const error=new ApiError('VALIDATION_ERROR','Check the form',422,{birthDate:'Required'},'request-1');expect(error.code).toBe('VALIDATION_ERROR');expect(error.fields?.birthDate).toBe('Required');expect(error.requestId).toBe('request-1')})});
