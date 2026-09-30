"use client";
import {useEffect} from "react";
import {apiRequest} from "@/lib/api";
export function registrarCampanha(id,tipo){if(id)apiRequest("/campanhas/"+id+"/eventos",{method:"POST",body:JSON.stringify({tipo})}).catch(()=>{});}
export function VisibilidadeCampanhas({campanhas}){
 useEffect(()=>{
  const timers=new Map();
  const observer=new IntersectionObserver(entries=>{for(const e of entries){
   clearTimeout(timers.get(e.target));
   if(e.isIntersecting&&e.intersectionRatio>=.5)timers.set(e.target,setTimeout(()=>{if(document.visibilityState==="visible"){registrarCampanha(e.target.dataset.campanhaId,"IMPRESSION");observer.unobserve(e.target);}},1000));
  }},{threshold:.5});
  document.querySelectorAll("[data-campanha-id]").forEach(el=>observer.observe(el));
  return()=>{observer.disconnect();timers.forEach(clearTimeout);};
 },[campanhas]);
 return null;
}
