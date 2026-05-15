import{j as e}from"./vendor-mui-Cuki3Png.js";import{f as y,u as v,a as r,L as c}from"./vendor-react-CLr-4wL2.js";import{c as l,u as k,M as w,l as C,G as A,L as M,m as L,n as _,d as $,e as z}from"./index-gNXL1cyH.js";import{e as S}from"./enrollments.api-y-bhiWy3.js";import{F as O}from"./flag-BkJFTGTS.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],I=l("bell",D);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],P=l("credit-card",E);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z",key:"hod4my"}],["path",{d:"M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z",key:"w4yl2u"}],["path",{d:"M3 5a2 2 0 0 0 2 2h3",key:"f2jnh7"}],["path",{d:"M3 3v13a2 2 0 0 0 2 2h3",key:"k8epm1"}]],G=l("folder-tree",F);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],h=l("settings",U);function Z({children:x}){const t=y(),p=v(),{user:s,logout:f}=k(),[o,i]=r.useState(!1),[g,u]=r.useState(0),d=[{name:"Catégories",href:"/admin/categories",icon:G},{name:"Messages de contact",href:"/admin/contact-messages",icon:w},{name:"Signalements",href:"/admin/reports",icon:O},{name:"Paiements",href:"/admin/payments",icon:P},{name:"Paramètres",href:"/admin/settings",icon:h}],b=d.some(a=>t.pathname===a.href),[m,N]=r.useState(b);r.useEffect(()=>{S.getAll().then(a=>u(a.filter(n=>n.status==="PENDING").length)).catch(()=>{})},[t.pathname]);const j=[{name:"Tableau de bord",href:"/admin",icon:L},{name:"Demandes d'inscription",href:"/admin/enrollment-requests",icon:I,badge:g},{name:"Utilisateurs",href:"/admin/users",icon:_},{name:"Cours",href:"/admin/courses",icon:$}];return e.jsxs("div",{className:"min-h-screen flex flex-col bg-accent/30",children:[e.jsx("header",{className:"bg-white border-b border-border sticky top-0 z-40",children:e.jsx("div",{className:"px-4 sm:px-6 lg:px-8",children:e.jsxs("div",{className:"flex justify-between items-center h-16",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("button",{className:"lg:hidden p-2",onClick:()=>i(!o),children:e.jsx(C,{className:"w-6 h-6"})}),e.jsxs(c,{to:"/",className:"flex items-center gap-2",children:[e.jsx(A,{className:"w-8 h-8 text-primary"}),e.jsx("span",{className:"font-semibold text-xl",children:"Iz Academy"})]}),e.jsx("span",{className:"hidden sm:inline px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm",children:"Administrateur"})]}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 bg-accent rounded-lg",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0",children:((s==null?void 0:s.name)||"A").charAt(0).toUpperCase()}),e.jsx("span",{className:"hidden sm:inline",children:(s==null?void 0:s.name)||"Admin"})]}),e.jsx("button",{onClick:()=>{f(),p("/login")},className:"p-2 hover:bg-accent rounded-lg transition",title:"Déconnexion",children:e.jsx(M,{className:"w-5 h-5"})})]})]})})}),e.jsxs("div",{className:"flex flex-1",children:[e.jsx("aside",{className:`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-border
            transform transition-transform duration-300 ease-in-out lg:translate-x-0
            ${o?"translate-x-0":"-translate-x-full"}
            mt-16 lg:mt-0
          `,children:e.jsxs("nav",{className:"p-4 space-y-2",children:[j.map(a=>{const n=t.pathname===a.href;return e.jsxs(c,{to:a.href,className:`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${n?"bg-primary text-primary-foreground":"text-foreground hover:bg-accent"}
                  `,onClick:()=>i(!1),children:[e.jsx(a.icon,{className:"w-5 h-5"}),e.jsx("span",{className:"flex-1",children:a.name}),a.badge&&a.badge>0?e.jsx("span",{className:`text-xs font-bold rounded-full px-2 py-0.5 ${n?"bg-white/30 text-white":"bg-red-500 text-white"}`,children:a.badge}):null]},a.name)}),e.jsxs("div",{children:[e.jsxs("button",{type:"button",onClick:()=>N(a=>!a),className:`
                  flex w-full items-center gap-3 px-4 py-3 rounded-lg text-left transition
                  text-foreground hover:bg-accent
                `,children:[e.jsx(h,{className:"w-5 h-5"}),e.jsx("span",{className:"flex-1",children:"Configuration"}),e.jsx(z,{className:`w-4 h-4 transition-transform ${m?"rotate-180":""}`})]}),m?e.jsx("div",{className:"mt-2 space-y-1",children:d.map(a=>{const n=t.pathname===a.href;return e.jsxs(c,{to:a.href,className:`
                          flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition
                          ${n?"bg-primary text-primary-foreground":"text-foreground hover:bg-accent"}
                        `,onClick:()=>i(!1),children:[e.jsx(a.icon,{className:"w-4 h-4"}),e.jsx("span",{children:a.name})]},a.name)})}):null]})]})}),o&&e.jsx("div",{className:"fixed inset-0 bg-black/50 z-20 lg:hidden",onClick:()=>i(!1)}),e.jsx("main",{className:"flex-1 p-4 sm:p-6 lg:p-8",children:x})]})]})}export{Z as A};
