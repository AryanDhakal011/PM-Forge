import {toolSchema,type Effect,type Definition,type RuntimeState,type ToolConfig} from '../core';
export {toolSchema};
import type {Action} from '../runtime';
export type Disposable={dispose:()=>void;serialize:()=>unknown;restore:(value:unknown)=>void;update?:(ctx:ToolContext)=>void};
export type ToolContext={definition:Definition;config:ToolConfig;state:Readonly<RuntimeState>;dispatch:(action:Action)=>void;emit:(event:string)=>void;a11y:{announce:(text:string)=>void};motion:{timeline:(name:string)=>void};rng:(key:string)=>number;size:{width:number;height:number};onComplete:(result:unknown)=>void;onProgress:(partial:unknown)=>void;registerKeyHandlers:(map:Record<string,()=>void>)=>()=>void;container:HTMLElement;restore:(value:unknown)=>void};
export type ToolModule={id:string;schema:typeof toolSchema;mount:(ctx:ToolContext)=>Disposable};
export const toolKinds=['EvidenceDrawers','ClueBoard','DragBins','TimelineScrubber','GraphView','MapCanvas','PlannerBoard','TugTriangle','SliderForecast','LedgerSankey','FrontierChart','GaugeMeter','SentenceBuilder','PosterComposer','SwitchConsole','WaveformRun','Gauntlet','CaseCards','LetterReader','StressTest','DecisionLog','PeopleSheet','AskMenu','DayPlanner','Inbox','CounterfactualPanel','EStop','LiveMediation','PartyFloor','DryRun','CoinPress','FraudRing','GuildVisit','LaunchNight','ArgumentDeck','Duel','TellNegotiation','KillSwitch','MetricAutopsy','ConfidenceBet','AllHands','HeistCrew','RadioRoom','MapShelters','RumorMill'] as const;
const registry=new Map<string,ToolModule>();
export function registerTool(module:ToolModule){if(registry.has(module.id))throw Error('Tool already registered: '+module.id);registry.set(module.id,module);return()=>registry.delete(module.id)}
export function getTool(id:string){return registry.get(id)}
export function registeredTools(){return [...registry.keys()]}
export function validateTool(config:unknown){const t=toolSchema.parse(config);if(!(toolKinds as readonly string[]).includes(t.kind))throw Error('Undeclared tool kind: '+t.kind);if(t.min>t.max)throw Error('Minimum exceeds capacity');if(new Set(t.items.map(i=>i.id)).size!==t.items.length)throw Error('Duplicate tool item');return t}
