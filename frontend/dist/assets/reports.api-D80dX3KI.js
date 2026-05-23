import{c as r,l as o}from"./index-DrngEXqI.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t=[["path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",key:"i9b6wo"}],["line",{x1:"4",x2:"4",y1:"22",y2:"15",key:"1cm3nv"}]],i=r("flag",t),a={create:e=>o("/reports",{method:"POST",body:JSON.stringify(e)}),getAll:()=>o("/reports"),markReviewed:e=>o(`/reports/${e}/review`,{method:"PUT"})};export{i as F,a as r};
