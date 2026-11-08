"use client";
import {useEffect} from "react";
import {useSettings} from "@/components/providers/SettingsProvider";
import {clockStoryFrame} from "@/lib/landing-story";

/** One scoped controller. Native scrolling; no pinning, polling loop, or React updates per frame. */
export function StorybookMotion(){
  const {reducedMotion}=useSettings();
  useEffect(()=>{
    const root=document.querySelector<HTMLElement>('[data-testid="lightweight-landing"]');
    if(!root)return;
    const clock=root.querySelector<HTMLElement>('[data-story-clock]');
    const hour=root.querySelector<HTMLElement>('[data-clock-hour]'),minute=root.querySelector<HTMLElement>('[data-clock-minute]');
    const labels=[root.querySelector<HTMLElement>('[data-clock-day]'),root.querySelector<HTMLElement>('[data-clock-time]'),root.querySelector<HTMLElement>('[data-clock-dial]')];
    const writeClock=(progress:number)=>{
      const frame=clockStoryFrame(progress);
      [frame.day,frame.time,frame.time].forEach((text,i)=>{const node=labels[i];if(node&&node.textContent!==text)node.textContent=text});
      if(hour)hour.style.transform=`rotate(${frame.hourDegrees}deg)`;
      if(minute)minute.style.transform=`rotate(${frame.minuteDegrees}deg)`;
    };
    writeClock(1);
    if(reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let cancelled=false,dispose=()=>{};
    const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){e.target.setAttribute('data-seen','true');observer.unobserve(e.target)}},{threshold:.08});
    root.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));
    void Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([{default:gsap},{ScrollTrigger}])=>{
      if(cancelled)return;
      gsap.registerPlugin(ScrollTrigger);
      root.dataset.storybook='true';
      const context=gsap.context(()=>{
        const chapters=Array.from(root.querySelectorAll<HTMLElement>('[data-story-section]'));
        const chapter=(el:HTMLElement)=>gsap.timeline({defaults:{ease:'power2.out',duration:.65},scrollTrigger:{trigger:el,start:'top 88%',end:'top 36%',scrub:.25,invalidateOnRefresh:true}})
          .fromTo(el,{'--chapter-turn':0},{'--chapter-turn':1,ease:'none',duration:1},0);
        for(const section of chapters){
          const kind=section.dataset.storySection;
          if(kind==='hero'){
            gsap.fromTo(section.querySelector('h1'),{y:0},{y:()=>innerWidth<768?-12:-24,ease:'none',scrollTrigger:{trigger:section,start:'top top',end:'bottom 15%',scrub:.25}});
            continue;
          }
          const tl=chapter(section);
          const heading=section.querySelector('h2');
          if(heading)tl.fromTo(heading,{y:18,rotation:-.5},{y:0,rotation:0},0);
          if(kind==='monday'){
            const state={value:0};
            tl.fromTo(clock,{y:22,rotation:-8,scale:.96},{y:0,rotation:0,scale:1},0)
              .to(state,{value:1,duration:1,ease:'none',onUpdate:()=>writeClock(state.value)},0)
              .fromTo(section.querySelectorAll('[data-story-notes]>span'),{x:22,y:12,rotation:4,opacity:.6},{x:0,y:0,rotation:0,opacity:1,stagger:.12},.45);
          }else if(kind==='first-decision'){
            const scene=gsap.timeline({defaults:{ease:'power2.out',duration:.65},scrollTrigger:{trigger:section.querySelector('[data-testid="landing-decision-demo"]'),start:'top 90%',end:'top 38%',scrub:.25,invalidateOnRefresh:true}});
            scene.fromTo(section.querySelector('[data-story-signal="0"]'),{x:-22,y:8},{x:0,y:0},0)
              .fromTo(section.querySelector('[data-story-signal="1"]'),{x:22,y:8},{x:0,y:0},.2)
              .fromTo(section.querySelector('[data-story-signal="2"]'),{y:12,scale:.96},{y:0,scale:1},.42)
              .fromTo(section.querySelector('[data-story-chart-line]'),{strokeDasharray:1,strokeDashoffset:1},{strokeDashoffset:0,ease:'none',duration:.9},.1)
              .fromTo(section.querySelector('[data-story-release-mark]'),{opacity:.25},{opacity:.6},.5);
          }else if(kind==='how-it-works'){
            section.querySelectorAll('[data-story-journey]>a').forEach((card,i)=>gsap.fromTo(card,{y:22,rotation:i===1?0:(i-1)*2},{y:0,rotation:0,ease:'power2.out',force3D:false,scrollTrigger:{trigger:card,start:'top 92%',end:'top 65%',scrub:.25}}));
          }else if(kind==='proof'){
            const paper=section.querySelector('[data-story-portfolio]');
            const scene=gsap.timeline({defaults:{ease:'power2.out',duration:.65},scrollTrigger:{trigger:paper,start:'top 90%',end:'top 38%',scrub:.25,invalidateOnRefresh:true}});
            scene.fromTo(paper,{y:28,rotation:2,scale:.97,transformOrigin:'15% 25%'},{y:0,rotation:0,scale:1},.1)
              .fromTo(section.querySelectorAll('[data-story-portfolio] dl>div'),{x:16,opacity:.65},{x:0,opacity:1,stagger:.09},.25);
            tl.fromTo(section.querySelectorAll('[data-story-stamps]>span'),{scale:1.12,rotation:-5},{scale:1,rotation:0,stagger:.12},.45);
          }else if(kind==='practice'){
            section.querySelectorAll('[data-story-scenarios]>a').forEach((card,i)=>gsap.fromTo(card,{y:24,rotation:(i-1)*2,x:(i-1)*12},{y:0,rotation:0,x:0,ease:'power2.out',force3D:false,scrollTrigger:{trigger:card,start:'top 92%',end:'top 62%',scrub:.25}}));
          }else if(kind==='simulations'){
            section.querySelectorAll<HTMLElement>('[data-story-projects]>a').forEach((card,i)=>{
              gsap.fromTo(card,{y:26,rotation:i%2?-3:3,scale:.98},{y:0,rotation:0,scale:1,ease:'power2.out',force3D:false,scrollTrigger:{trigger:card,start:'top 92%',end:'top 58%',scrub:.25,invalidateOnRefresh:true}});
            });
          }else if(kind==='trust'){
            section.querySelectorAll(':scope>div>div>svg').forEach(icon=>gsap.fromTo(icon,{rotation:-18,scale:.75},{rotation:0,scale:1,ease:'power2.out',force3D:false,scrollTrigger:{trigger:icon.parentElement,start:'top 90%',end:'top 65%',scrub:.25}}));
          }else if(kind==='help'){
            tl.fromTo(section.querySelectorAll('details'),{x:i=>i%2?10:-10},{x:0,stagger:.07},.1);
          }else if(kind==='closing'){
            tl.fromTo(section.querySelector('[data-clock-ending]'),{y:18,rotation:-10},{y:0,rotation:0},0)
              .fromTo(section.querySelector('[data-clock-ending]>i'),{rotation:-360},{rotation:0,transformOrigin:'bottom',duration:1},0);
          }else if(kind==='footer'){
            const wordmark=section.querySelector('[data-story-wordmark]');
            gsap.fromTo(wordmark,{y:22},{y:0,ease:'power2.out',scrollTrigger:{trigger:wordmark,start:'top 96%',end:'top 75%',scrub:.25}});
          }
        }
        gsap.fromTo(root.querySelector('[data-journey-progress]'),{scaleX:0},{scaleX:1,ease:'none',scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub:.2}});
      },root);
      let refreshTimer=0;
      const resize=new ResizeObserver(()=>{clearTimeout(refreshTimer);refreshTimer=window.setTimeout(()=>{if(!cancelled)ScrollTrigger.refresh()},100)});
      resize.observe(root);
      void document.fonts.ready.then(()=>{if(!cancelled)ScrollTrigger.refresh()});
      dispose=()=>{clearTimeout(refreshTimer);resize.disconnect();context.revert();delete root.dataset.storybook;writeClock(1)};
    }).catch(()=>{delete root.dataset.storybook;writeClock(1)});
    return()=>{cancelled=true;observer.disconnect();dispose();writeClock(1)};
  },[reducedMotion]);
  return null;
}
