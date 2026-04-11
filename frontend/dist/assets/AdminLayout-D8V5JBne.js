import{j as e}from"./vendor-mui-DvdvL9v7.js";import{f as g,u,a as r,L as o}from"./vendor-react-CLr-4wL2.js";import{c as t,u as b,m as y,G as N,L as j,n as v,o as k,d as w,M as A}from"./index-C5oDludu.js";import{e as C}from"./enrollments.api-C0urNbd5.js";import{F as M}from"./flag-DqHRnQRT.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],_=t("bell",L);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]],S=t("credit-card",z);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=[["path",{d:"M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z",key:"hod4my"}],["path",{d:"M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z",key:"w4yl2u"}],["path",{d:"M3 5a2 2 0 0 0 2 2h3",key:"f2jnh7"}],["path",{d:"M3 3v13a2 2 0 0 0 2 2h3",key:"k8epm1"}]],D=t("folder-tree",$);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],I=t("settings",E);function U({children:d}){const c=g(),m=u(),{user:s,logout:h}=b(),[i,l]=r.useState(!1),[x,p]=r.useState(0);r.useEffect(()=>{C.getAll().then(a=>p(a.filter(n=>n.status==="PENDING").length)).catch(()=>{})},[c.pathname]);const f=[{name:"Tableau de bord",href:"/admin",icon:v},{name:"Demandes d'inscription",href:"/admin/enrollment-requests",icon:_,badge:x},{name:"Utilisateurs",href:"/admin/users",icon:k},{name:"Cours",href:"/admin/courses",icon:w},{name:"Catégories",href:"/admin/categories",icon:D},{name:"Messages contact",href:"/admin/contact-messages",icon:A},{name:"Signalements",href:"/admin/reports",icon:M},{name:"Paiements",href:"/admin/payments",icon:S},{name:"Paramètres",href:"/admin/settings",icon:I}];return e.jsxs("div",{className:"min-h-screen flex flex-col bg-accent/30",children:[e.jsx("header",{className:"bg-white border-b border-border sticky top-0 z-40",children:e.jsx("div",{className:"px-4 sm:px-6 lg:px-8",children:e.jsxs("div",{className:"flex justify-between items-center h-16",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("button",{className:"lg:hidden p-2",onClick:()=>l(!i),children:e.jsx(y,{className:"w-6 h-6"})}),e.jsxs(o,{to:"/",className:"flex items-center gap-2",children:[e.jsx(N,{className:"w-8 h-8 text-primary"}),e.jsx("span",{className:"font-semibold text-xl",children:"Iz Academy"})]}),e.jsx("span",{className:"hidden sm:inline px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm",children:"Administrateur"})]}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 bg-accent rounded-lg",children:[e.jsx("div",{className:"w-7 h-7 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0",children:((s==null?void 0:s.name)||"A").charAt(0).toUpperCase()}),e.jsx("span",{className:"hidden sm:inline",children:(s==null?void 0:s.name)||"Admin"})]}),e.jsx("button",{onClick:()=>{h(),m("/login")},className:"p-2 hover:bg-accent rounded-lg transition",title:"Déconnexion",children:e.jsx(j,{className:"w-5 h-5"})})]})]})})}),e.jsxs("div",{className:"flex flex-1",children:[e.jsx("aside",{className:`
            fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-border
            transform transition-transform duration-300 ease-in-out lg:translate-x-0
            ${i?"translate-x-0":"-translate-x-full"}
            mt-16 lg:mt-0
          `,children:e.jsx("nav",{className:"p-4 space-y-2",children:f.map(a=>{const n=c.pathname===a.href;return e.jsxs(o,{to:a.href,className:`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${n?"bg-primary text-primary-foreground":"text-foreground hover:bg-accent"}
                  `,onClick:()=>l(!1),children:[e.jsx(a.icon,{className:"w-5 h-5"}),e.jsx("span",{className:"flex-1",children:a.name}),a.badge&&a.badge>0?e.jsx("span",{className:`text-xs font-bold rounded-full px-2 py-0.5 ${n?"bg-white/30 text-white":"bg-red-500 text-white"}`,children:a.badge}):null]},a.name)})})}),i&&e.jsx("div",{className:"fixed inset-0 bg-black/50 z-20 lg:hidden",onClick:()=>l(!1)}),e.jsx("main",{className:"flex-1 p-4 sm:p-6 lg:p-8",children:d})]})]})}export{U as A,_ as B};
