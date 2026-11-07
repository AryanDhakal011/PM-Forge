"use client";
import dynamic from "next/dynamic";
import Loading from "./Loading";
const Experience=dynamic(()=>import('./Experience'),{ssr:false,loading:Loading});
export default function Client(){return <Experience/>;}
