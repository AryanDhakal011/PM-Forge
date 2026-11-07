"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {setScrollInstance} from '@/lib/scrollTo';
export function SmoothScroll(){const path=usePathname();useEffect(()=>{setScrollInstance(null);document.documentElement.classList.remove('lenis','lenis-smooth','is-loading');const old=history.scrollRestoration;history.scrollRestoration='manual';let second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{if(location.hash){document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()}else window.scrollTo({top:0,left:0,behavior:'instant'})})});return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);history.scrollRestoration=old}},[path]);return null}
