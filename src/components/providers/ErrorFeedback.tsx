"use client";
import {useEffect,useRef,useState} from "react";
import {isFailureMessage} from "@/lib/ui-feedback";
import {usePathname} from "next/navigation";
import styles from "./ErrorFeedback.module.css";
/** Visible recovery feedback for explicit failures, existing alert messages and uncaught failures. */
export function ErrorFeedback(){
  const [message,setMessage]=useState(""); const last=useRef({message:"",at:0}); const path=usePathname();
  useEffect(()=>{setMessage("");last.current={message:"",at:0}},[path]);
  useEffect(()=>{
    const show=(message:string)=>{const clean=message.trim().slice(0,600);if(!clean)return;if(last.current.message===clean&&Date.now()-last.current.at<2000)return;last.current={message:clean,at:Date.now()};setMessage(clean)};
    const explicit=(e:Event)=>show((e as CustomEvent).detail?.message||"Something could not finish. Please retry.");
    const unexpected=()=>show("Something could not finish. Keep this page open and retry your last action. If it keeps happening, export your work before reloading.");
    const inspect=(node:Node)=>{const element=node instanceof Element?node:node.parentElement;if(!element||element.closest("[data-error-popup]"))return;const alerts=[...(element.matches('[role="alert"],[role="status"]')?[element]:[]),...element.querySelectorAll('[role="alert"],[role="status"]')];const parent=element.closest('[role="alert"],[role="status"]');if(parent)alerts.push(parent);for(const alert of alerts){const text=alert.textContent||"";if(alert.getAttribute("role")==="alert"||isFailureMessage(text))show(text)}};
    const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')inspect(record.target);for(const node of record.addedNodes)inspect(node)}});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    window.addEventListener("pmforge:error",explicit);window.addEventListener("unhandledrejection",unexpected);window.addEventListener("error",unexpected);
    return()=>{observer.disconnect();window.removeEventListener("pmforge:error",explicit);window.removeEventListener("unhandledrejection",unexpected);window.removeEventListener("error",unexpected)};
  },[]);
  if(!message)return null;
  return <aside className={styles.popup} data-error-popup role="alert" aria-atomic="true"><div><strong>That didn’t finish</strong><p>{message}</p></div><button type="button" onClick={()=>setMessage("")} aria-label="Dismiss error notification">Dismiss</button></aside>;
}
