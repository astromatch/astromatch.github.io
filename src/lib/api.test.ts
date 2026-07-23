import { describe, expect, it } from 'vitest';
import { ApiError, requestHeaders } from './api';

describe('API errors',()=>{
  it('retains safe structured details',()=>{
    const error=new ApiError('VALIDATION_ERROR','Check the form',422,{birthDate:'Required'},'request-1');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fields?.birthDate).toBe('Required');
    expect(error.requestId).toBe('request-1');
  });
});

describe('API request headers',()=>{
  it('does not label an empty POST body as JSON',()=>{
    const headers=requestHeaders({method:'POST'},'token','request-1');
    expect(headers.has('Content-Type')).toBe(false);
  });

  it('sets JSON content type when a request has a body',()=>{
    const headers=requestHeaders({method:'PATCH',body:JSON.stringify({name:'Deepak'})},'token','request-1');
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});
