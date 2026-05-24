import{c as i,j as n,v as s,p as o}from"./index-bHL-R4Qf.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],p=i("image",d);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}],["path",{d:"M13 6h8",key:"15sg57"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 18h8",key:"oe0vm4"}]],u=i("list-checks",c);function h({className:a,...e}){return n.jsx("textarea",{"data-slot":"textarea",className:s("resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",a),...e})}const r="http://localhost:5000/api",m={uploadVideo:async a=>{const e=new FormData;e.append("video",a);const t=await fetch(`${r}/uploads/video`,{method:"POST",headers:{Authorization:`Bearer ${o()}`},body:e,credentials:"include"});if(!t.ok)throw new Error("Upload failed");return t.json()},uploadThumbnail:async a=>{const e=new FormData;e.append("image",a);const t=await fetch(`${r}/uploads/thumbnail`,{method:"POST",headers:{Authorization:`Bearer ${o()}`},body:e,credentials:"include"});if(!t.ok)throw new Error("Upload failed");return t.json()}};export{p as I,u as L,h as T,m as u};
