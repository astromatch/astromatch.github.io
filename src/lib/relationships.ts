import { api } from './api';

export type BirthTimeQuality='exact'|'approximate'|'unknown';
export type PersonRelationship='partner'|'crush'|'spouse'|'ex'|'friend'|'custom';
export type MatchFocus='general'|'romantic'|'communication'|'long_term';
export type GenerationStatus='draft'|'calculating'|'compatibility_ready'|'generating_report'|'ready'|'failed'|'stale';

export interface PersonInput {
  displayName:string;
  pronouns:string|null;
  relationshipType:PersonRelationship;
  birthDate:string;
  birthTime:string|null;
  birthTimeStatus:BirthTimeQuality;
  birthTimeAccuracyMinutes:number|null;
  birthPlaceLabel:string;
  latitude:number;
  longitude:number;
  timezone:string;
  astrologySystem:'western_tropical';
  notes:string|null;
}

export interface PrivatePerson extends PersonInput {
  id:string;
  createdAt?:string;
  updatedAt?:string;
  chartStatus?:string;
  dataQuality?:string;
}

export interface CompatibilityFactor {
  title?:string;
  label?:string;
  description?:string;
  interpretation?:string;
  direction?:string;
  planetA?:string;
  planetB?:string;
  aspect?:string;
  orb?:number;
}

export interface CompatibilityCategory {
  key:string;
  label:string;
  score?:number;
  headline?:string;
  interpretation?:string;
  dataQuality?:string;
  supportingFactors?:CompatibilityFactor[];
  challengingFactors?:CompatibilityFactor[];
}

export interface CompatibilityReport {
  id?:string;
  status?:string;
  headline?:string;
  summary?:string;
  overallScore?:number;
  qualitativeLabel?:string;
  dataQuality?:string;
  strongestConnection?:string;
  primaryFriction?:string;
  categories?:CompatibilityCategory[];
  practicalGuidance?:string[];
  reflectionPrompts?:string[];
  factors?:CompatibilityFactor[];
  limitations?:string[];
  canRegenerate?:boolean;
  regenerationReason?:string;
}

export interface Relationship {
  id:string;
  personId:string;
  focus:MatchFocus;
  status:GenerationStatus;
  relationshipType?:PersonRelationship;
  person?:PrivatePerson;
  headline?:string;
  qualitativeLabel?:string;
  dataQuality?:string;
  score?:number;
  report?:CompatibilityReport;
  updatedAt?:string;
}

const record=(value:unknown):Record<string,unknown>=>typeof value==='object'&&value!==null?value as Record<string,unknown>:{};
const text=(value:unknown)=>typeof value==='string'?value:undefined;
const number=(value:unknown)=>typeof value==='number'?value:undefined;
const array=(value:unknown):unknown[]=>Array.isArray(value)?value:[];

export function normalizePerson(value:unknown):PrivatePerson {
  const item=record(value);
  return {
    id:text(item.id)??'',
    displayName:text(item.displayName)??text(item.display_name)??'Private person',
    pronouns:text(item.pronouns)??null,
    relationshipType:(text(item.relationshipType)??text(item.relationship_type)??'custom') as PersonRelationship,
    birthDate:text(item.birthDate)??text(item.birth_date)??'',
    birthTime:text(item.birthTime)??text(item.birth_time)??null,
    birthTimeStatus:(text(item.birthTimeStatus)??text(item.birth_time_status)??'unknown') as BirthTimeQuality,
    birthTimeAccuracyMinutes:number(item.birthTimeAccuracyMinutes)??number(item.birth_time_accuracy_minutes)??null,
    birthPlaceLabel:text(item.birthPlaceLabel)??text(item.birth_place_label)??'Private location',
    latitude:number(item.latitude)??0,
    longitude:number(item.longitude)??0,
    timezone:text(item.timezone)??'UTC',
    astrologySystem:'western_tropical',
    notes:text(item.notes)??null,
    createdAt:text(item.createdAt)??text(item.created_at),
    updatedAt:text(item.updatedAt)??text(item.updated_at),
    chartStatus:text(item.chartStatus)??text(item.chart_status),
    dataQuality:text(item.dataQuality)??text(item.data_quality),
  };
}

function normalizeCategory(value:unknown,index:number):CompatibilityCategory {
  const item=record(value);
  return {
    key:text(item.key)??text(item.category)??`category_${index}`,
    label:text(item.label)??text(item.title)??text(item.category)??`Category ${index+1}`,
    score:number(item.score),
    headline:text(item.headline),
    interpretation:text(item.interpretation)??text(item.description),
    dataQuality:text(item.dataQuality)??text(item.data_quality),
    supportingFactors:array(item.supportingFactors??item.supporting_factors).map(normalizeFactor),
    challengingFactors:array(item.challengingFactors??item.challenging_factors).map(normalizeFactor),
  };
}

function normalizeFactor(value:unknown):CompatibilityFactor {
  const item=record(value);
  return {
    title:text(item.title),
    label:text(item.label),
    description:text(item.description),
    interpretation:text(item.interpretation),
    direction:text(item.direction),
    planetA:text(item.planetA)??text(item.planet_a),
    planetB:text(item.planetB)??text(item.planet_b),
    aspect:text(item.aspect),
    orb:number(item.orb),
  };
}

export function normalizeReport(value:unknown):CompatibilityReport {
  const item=record(value);
  return {
    id:text(item.id),
    status:text(item.status),
    headline:text(item.headline)??text(item.overallHeadline)??text(item.overall_headline),
    summary:text(item.summary),
    overallScore:number(item.overallScore)??number(item.overall_score)??number(item.score),
    qualitativeLabel:text(item.qualitativeLabel)??text(item.qualitative_label),
    dataQuality:text(item.dataQuality)??text(item.data_quality),
    strongestConnection:text(item.strongestConnection)??text(item.strongest_connection),
    primaryFriction:text(item.primaryFriction)??text(item.primary_friction),
    categories:array(item.categories).map(normalizeCategory),
    practicalGuidance:array(item.practicalGuidance??item.practical_guidance).filter((x):x is string=>typeof x==='string'),
    reflectionPrompts:array(item.reflectionPrompts??item.reflection_prompts).filter((x):x is string=>typeof x==='string'),
    factors:array(item.factors).map(normalizeFactor),
    limitations:array(item.limitations).filter((x):x is string=>typeof x==='string'),
    canRegenerate:item.canRegenerate===true||item.can_regenerate===true,
    regenerationReason:text(item.regenerationReason)??text(item.regeneration_reason),
  };
}

export function normalizeRelationship(value:unknown):Relationship {
  const item=record(value);
  const personValue=item.person??item.private_person;
  const rawStatus=text(item.status)??text(item.report_status)??'draft';
  const allowed:GenerationStatus[]=['draft','calculating','compatibility_ready','generating_report','ready','failed','stale'];
  return {
    id:text(item.id)??'',
    personId:text(item.personId)??text(item.person_id)??text(record(personValue).id)??'',
    focus:(text(item.focus)??'general') as MatchFocus,
    status:allowed.includes(rawStatus as GenerationStatus)?rawStatus as GenerationStatus:'draft',
    relationshipType:(text(item.relationshipType)??text(item.relationship_type)) as PersonRelationship|undefined,
    person:personValue?normalizePerson(personValue):undefined,
    headline:text(item.headline),
    qualitativeLabel:text(item.qualitativeLabel)??text(item.qualitative_label),
    dataQuality:text(item.dataQuality)??text(item.data_quality),
    score:number(item.score),
    report:item.report?normalizeReport(item.report):undefined,
    updatedAt:text(item.updatedAt)??text(item.updated_at),
  };
}

function listPayload(value:unknown){
  if(Array.isArray(value))return value;
  const item=record(value);
  return array(item.items??item.people??item.matches??item.data);
}

export const relationshipQueryKeys={
  blueprint:['relationship-blueprint'] as const,
  people:['people'] as const,
  person:(id:string)=>['people',id] as const,
  relationships:['relationships'] as const,
  relationship:(id:string)=>['relationships',id] as const,
  report:(id:string)=>['relationships',id,'report'] as const,
};

export const peopleApi={
  async all(signal?:AbortSignal){return listPayload(await api<unknown>('/api/v1/people',{signal})).map(normalizePerson)},
  async get(id:string,signal?:AbortSignal){return normalizePerson(await api<unknown>(`/api/v1/people/${id}`,{signal}))},
  async create(input:PersonInput){return normalizePerson(await api<unknown>('/api/v1/people',{method:'POST',body:JSON.stringify(input)}))},
  async update(id:string,input:PersonInput){return normalizePerson(await api<unknown>(`/api/v1/people/${id}`,{method:'PUT',body:JSON.stringify(input)}))},
  archive:(id:string)=>api<void>(`/api/v1/people/${id}/archive`,{method:'POST'}),
};

export const relationshipsApi={
  async all(signal?:AbortSignal){return listPayload(await api<unknown>('/api/v1/matches',{signal})).map(normalizeRelationship)},
  async get(id:string,signal?:AbortSignal){return normalizeRelationship(await api<unknown>(`/api/v1/matches/${id}`,{signal}))},
  async create(personId:string,focus:MatchFocus){return normalizeRelationship(await api<unknown>('/api/v1/matches',{method:'POST',body:JSON.stringify({personId,focus})}))},
  async generate(id:string,idempotencyKey:string){return normalizeRelationship(await api<unknown>(`/api/v1/matches/${id}/generate`,{method:'POST',headers:{'Idempotency-Key':idempotencyKey}}))},
  async report(id:string,signal?:AbortSignal){return normalizeReport(await api<unknown>(`/api/v1/matches/${id}/report`,{signal}))},
  archive:(id:string)=>api<void>(`/api/v1/matches/${id}`,{method:'DELETE'}),
};
