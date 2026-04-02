import{c as t,h as r}from"./index-C_vc_aOj.js";import{j as n}from"./vendor-mui-DDkgRNzD.js";import{c as s}from"./utils-8MbsS78h.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],m=t("circle-plus",d);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],y=t("image",c);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}],["path",{d:"M13 6h8",key:"15sg57"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 18h8",key:"oe0vm4"}]],f=t("list-checks",l);function g({className:a,...e}){return n.jsx("textarea",{"data-slot":"textarea",className:s("resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",a),...e})}const i="http://localhost:5000/api",k={uploadVideo:async a=>{const e=new FormData;e.append("video",a);const o=await fetch(`${i}/uploads/video`,{method:"POST",headers:{Authorization:`Bearer ${r()}`},body:e,credentials:"include"});if(!o.ok)throw new Error("Upload failed");return o.json()},uploadThumbnail:async a=>{const e=new FormData;e.append("image",a);const o=await fetch(`${i}/uploads/thumbnail`,{method:"POST",headers:{Authorization:`Bearer ${r()}`},body:e,credentials:"include"});if(!o.ok)throw new Error("Upload failed");return o.json()}};export{m as C,y as I,f as L,g as T,k as u};
