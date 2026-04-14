import{c as n,g as a,k as i}from"./index-CpZSoyBR.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]],p=n("video",d),l="http://localhost:5000/api",u={getResources:e=>a(`/lessons/${e}/resources`),uploadFile:async(e,s,o)=>{const t=new FormData;t.append("title",s),t.append("file",o);const r=await fetch(`${l}/lessons/${e}/resources/file`,{method:"POST",headers:{Authorization:`Bearer ${i()}`},body:t,credentials:"include"});if(!r.ok){const c=await r.json().catch(()=>({}));throw new Error(c.message||"Upload failed")}return r.json()},addLink:(e,s,o)=>a(`/lessons/${e}/resources/link`,{method:"POST",body:JSON.stringify({title:s,url:o})}),deleteResource:e=>a(`/lessons/resources/${e}`,{method:"DELETE"})};export{p as V,u as l};
