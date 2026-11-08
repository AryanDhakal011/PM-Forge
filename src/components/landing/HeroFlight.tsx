"use client";
import {useEffect,useRef} from 'react';
import {useSettings} from '@/components/providers/SettingsProvider';
import s from './LightLanding.module.css';
export function HeroFlight(){
 const plane=useRef<SVGSVGElement>(null);const {reducedMotion}=useSettings();
 useEffect(()=>{const root=plane.current?.parentElement;if(!root||reducedMotion)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){root.dataset.introReady='true';observer.disconnect()}},{threshold:.12});observer.observe(root);return()=>observer.disconnect()},[reducedMotion]);
 function replay(){const root=plane.current?.parentElement;if(!root||reducedMotion)return;for(const a of root.getAnimations({subtree:true})){if(a.effect instanceof KeyframeEffect&&a.effect.target instanceof Element&&(a.effect.target.hasAttribute('data-paper')||a.effect.target===plane.current)){a.cancel();a.play()}}}
 return <><svg ref={plane} className={s.heroPlane} data-hero-plane viewBox="0 0 70 42" aria-hidden="true"><path d="M4 20 66 4 48 38 35 28 26 38 21 26Z" fill="#fdfcf4" stroke="#203d2d" strokeWidth="2"/><path d="M26 38 66 4 35 28Z" fill="#efbd85" stroke="#203d2d" strokeWidth="2"/></svg><button className={s.flightReplay} disabled={reducedMotion} onClick={replay} aria-label="Replay the card entrance">{reducedMotion?'Motion reduced':'Replay the fold ↗'}</button></>;
}
