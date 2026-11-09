import {z} from 'zod';
import {caseSchema,experienceSchema} from './schemas';
export const publicPortfolioSchema=z.object({activityEnabled:z.boolean().optional(),name:z.string().min(1).max(300),targetTitle:z.string().max(300),valueProp:z.string().max(300),domain:z.string().max(300),about:z.string().max(30000),email:z.union([z.string().email().max(300),z.literal('')]),contactUrl:z.string().max(300),openToWork:z.boolean(),skills:z.array(z.string().max(300)).max(80),experience:z.array(experienceSchema).max(40).optional(),cases:z.array(caseSchema).min(1).max(20)}).strict();
export const publicationInputSchema=z.object({slug:z.string().regex(/^[a-z0-9][a-z0-9-]{2,29}$/),key:z.string().max(200).optional(),mode:z.enum(['public','link','review']),data:publicPortfolioSchema,days:z.number().int().min(1).max(180),checks:z.object({contact:z.boolean(),confidential:z.boolean(),accuracy:z.boolean()}).strict()}).strict();
export function validateCloudPublication(raw:unknown){
  const input=publicationInputSchema.parse(raw),data=input.data;
  if(['admin','api','www','support','pmforge','login','signup','auth','settings','security','help','terms','privacy'].includes(input.slug))throw Error('That handle is reserved.');
  if(input.mode!=='review'&&(!input.checks.contact||!input.checks.confidential||!input.checks.accuracy||data.cases.some(c=>!c.reviewed||!c.problem||!c.metric||!c.tradeoff||!c.decision||c.kind==='production'&&!c.realWorkConfirmed)))throw Error('Complete the publication checklist and select a reviewed case.');
  if(data.cases.some(c=>c.confidentiality==='private'||c.ready===false||['interview','project'].includes(c.origin)&&c.kind!=='simulation'||c.kind==='production'&&!c.realWorkConfirmed))throw Error('Practice must remain labeled as simulation; private and unfinished work cannot be published.');
  if(new TextEncoder().encode(JSON.stringify(data)).length>1000000)throw Error('Trim the snapshot below 1 MB.');
  data.cases=data.cases.map(c=>({...c,ownerId:''}));
  return input;
}
