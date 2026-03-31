import{c as a,g as t}from"./index-BLgzYGjl.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],l=a("circle-check",n);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],p=a("circle-plus",s);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]],y=a("image",d);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}],["path",{d:"M13 6h8",key:"15sg57"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 18h8",key:"oe0vm4"}]],m=a("list-checks",i),r="http://localhost:5000/api",k={uploadVideo:async c=>{const e=new FormData;e.append("video",c);const o=await fetch(`${r}/uploads/video`,{method:"POST",headers:{Authorization:`Bearer ${t()}`},body:e,credentials:"include"});if(!o.ok)throw new Error("Upload failed");return o.json()},uploadThumbnail:async c=>{const e=new FormData;e.append("image",c);const o=await fetch(`${r}/uploads/thumbnail`,{method:"POST",headers:{Authorization:`Bearer ${t()}`},body:e,credentials:"include"});if(!o.ok)throw new Error("Upload failed");return o.json()}};export{l as C,y as I,m as L,p as a,k as u};
