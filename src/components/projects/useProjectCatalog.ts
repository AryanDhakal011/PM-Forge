"use client";
import {useEffect,useState} from 'react';
import type {Manifest} from '../../../platform/core';
import {mayEnter} from '../../../platform/services';
import type {Flags,SaveRecord} from '../../../platform/services';
type Catalog={manifests:Manifest[];flags:Flags;lint:Record<string,boolean>};
export function useProjectCatalog(){const [catalog,setCatalog]=useState<Catalog|null>(null),[runs,setRuns]=useState<SaveRecord[]>([]);useEffect(()=>{let cancelled=false;const refresh=async()=>{try{const {cachedJson,projectSaves}=await import('../../../platform/services/store');const result=await cachedJson<Catalog>('catalog','/api/project-platform');const records=await projectSaves.list();if(!cancelled){setCatalog(result.data);setRuns(records)}}catch{}};void refresh();window.addEventListener('focus',refresh);window.addEventListener('pmforge:project-saved',refresh);return()=>{cancelled=true;window.removeEventListener('focus',refresh);window.removeEventListener('pmforge:project-saved',refresh)}},[]);return {catalog,platformRuns:runs,enterable:(id:string)=>{const m=catalog?.manifests.find(m=>m.id===id);return !!m&&!!catalog&&mayEnter(m,catalog.lint,catalog.flags)}}}
