import gsap from 'gsap';
export const motionTokens={micro:.16,ui:.24,card:.4,panel:.52,spectacle:1.2,ease:'power2.inOut'};
export class MotionManager{
 private registry=new Map<string,(root:Element)=>gsap.core.Timeline>();private active=new Set<gsap.Context>();spectacles=0;loops=0;tier:'high'|'medium'|'low'='high';
 registerTimeline(name:string,factory:(root:Element)=>gsap.core.Timeline){this.registry.set(name,factory)}
 names(){return [...this.registry.keys()]}
 run(name:string,root:Element,reduced=false,spectacle=false){if(reduced)return()=>{};if(spectacle&&this.spectacles>=6)return()=>{};const factory=this.registry.get(name);if(!factory)return()=>{};if(spectacle)this.spectacles++;const ctx=gsap.context(()=>factory(root),root);this.active.add(ctx);return()=>{ctx.revert();this.active.delete(ctx)}}
 loop(allow:boolean){if(!allow||this.loops>=2)return false;this.loops++;return true}endLoop(){this.loops=Math.max(0,this.loops-1)}
 frame(ms:number){this.tier=ms>22?'low':ms>12?'medium':'high';return this.tier}
 dispose(){this.active.forEach(c=>c.revert());this.active.clear();this.loops=0}
}
export function createMotion(){const m=new MotionManager();for(const name of ['scene','portrait','chip','fuse-wipe','pro-move','hub-flip','dry-run','coin-press','reveal','heist','water'])m.registerTimeline(name,root=>gsap.timeline().fromTo(root.querySelectorAll('[data-motion]'),{opacity:0,y:name==='fuse-wipe'?0:10},{opacity:1,y:0,duration:.4,stagger:.06,clearProps:'transform,opacity'}));return m}
