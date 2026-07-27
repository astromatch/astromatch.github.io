import { describe, expect, it } from 'vitest';
import { sanitizeAnalyticsParams } from './analytics';

describe('analytics privacy boundary',()=>{
  it('removes sensitive identifiers and birth data',()=>{
    expect(sanitizeAnalyticsParams({
      relationship_type:'partner',
      analysis_focus:'general',
      person_id:'private-uuid',
      birth_date:'1990-01-01',
      private_alias:'Sam',
      data_quality:'high',
    })).toEqual({
      relationship_type:'partner',
      analysis_focus:'general',
      data_quality:'high',
    });
  });

  it('redacts UUIDs embedded in route paths',()=>{
    expect(sanitizeAnalyticsParams({page_path:'/relationships/293424c5-6bc3-4cae-9b7e-e1448433d094/report'})).toEqual({
      page_path:'/relationships/:private/report',
    });
  });
});
