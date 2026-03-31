import{c as r,f as t,g as a}from"./index-BLgzYGjl.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],h=r("refresh-cw",o),i="http://localhost:5000/api",d={getMine:()=>t("/users/me/certificates"),getById:e=>t(`/users/me/certificates/${e}`),retry:e=>t(`/users/me/certificates/${e}/retry`,{method:"POST"}),downloadPdf:async e=>{const c=a(),s=await fetch(`${i}/users/me/certificates/${e}/pdf`,{headers:c?{Authorization:`Bearer ${c}`}:{},cache:"no-store",credentials:"include"});if(!s.ok)throw new Error("Failed to fetch PDF");return s.blob()}};export{h as R,d as c};
