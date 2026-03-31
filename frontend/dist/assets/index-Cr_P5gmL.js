import{c as d}from"./index-BLgzYGjl.js";import{a as u}from"./vendor-react-CYWQxdZQ.js";import{d as h}from"./index-wfdoCELi.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],S=d("check",b);function y(r){const[e,o]=u.useState(void 0);return h(()=>{if(r){o({width:r.offsetWidth,height:r.offsetHeight});const n=new ResizeObserver(t=>{if(!Array.isArray(t)||!t.length)return;const f=t[0];let i,s;if("borderBoxSize"in f){const c=f.borderBoxSize,a=Array.isArray(c)?c[0]:c;i=a.inlineSize,s=a.blockSize}else i=r.offsetWidth,s=r.offsetHeight;o({width:i,height:s})});return n.observe(r,{box:"border-box"}),()=>n.unobserve(r)}else o(void 0)},[r]),e}function g(r){const e=u.useRef({value:r,previous:r});return u.useMemo(()=>(e.current.value!==r&&(e.current.previous=e.current.value,e.current.value=r),e.current.previous),[r])}export{S as C,y as a,g as u};
