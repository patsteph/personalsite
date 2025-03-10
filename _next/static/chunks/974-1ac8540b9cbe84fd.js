"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[974],{1660:(e,t,r)=>{r.d(t,{HA:()=>c,QC:()=>h,bp:()=>s,r3:()=>i,xj:()=>n,zy:()=>a});var l=r(6746),o=r(2009);async function a(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"all",t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"title";try{var r,a;let n=(0,o.rJ)(l.db,"books"),s=(0,o.P)(n);"all"!==e&&(s=(0,o.P)(s,(0,o._M)("status","==",e)));let i=(await (0,o.GG)(s)).docs.map(e=>({id:e.id,...e.data()}));return r=i,a=t,i=[...r].sort((e,t)=>{switch(a){case"title":return e.title.localeCompare(t.title);case"author":return(e.authors[0]||"").localeCompare(t.authors[0]||"");case"genre":var r,l;return((null===(r=e.categories)||void 0===r?void 0:r[0])||"").localeCompare((null===(l=t.categories)||void 0===l?void 0:l[0])||"");case"rating":let o=e.averageRating||0;return(t.averageRating||0)-o;default:return 0}})}catch(e){throw console.error("Error fetching books:",e),e}}async function n(e){try{let t=await fetch("https://www.googleapis.com/books/v1/volumes?q=isbn:".concat(e)),r=await t.json();if(!r.items||0===r.items.length)return null;let l=r.items[0].volumeInfo;return{title:l.title||"Unknown Title",authors:l.authors||["Unknown Author"],publisher:l.publisher,publishedDate:l.publishedDate,description:l.description,pageCount:l.pageCount,categories:l.categories,imageLinks:l.imageLinks,averageRating:l.averageRating,ratingsCount:l.ratingsCount,isbn:e}}catch(e){return console.error("Error fetching book by ISBN:",e),null}}async function s(e){try{return(await (0,o.gS)((0,o.rJ)(l.db,"books"),e)).id}catch(e){throw console.error("Error adding book:",e),e}}async function i(e,t){try{let r=(0,o.H9)(l.db,"books",e);await (0,o.mZ)(r,t)}catch(e){throw console.error("Error updating book:",e),e}}async function c(e){try{let t=(0,o.H9)(l.db,"books",e);await (0,o.kd)(t)}catch(e){throw console.error("Error deleting book:",e),e}}async function h(e){try{let t=(0,o.H9)(l.db,"books",e),r=await (0,o.x7)(t);if(!r.exists())return null;return{id:r.id,...r.data()}}catch(e){return console.error("Error fetching book by ID:",e),null}}},1816:(e,t,r)=>{r.d(t,{A:()=>g});var l=r(7876),o=r(7328),a=r.n(o),n=r(9099),s=r(8230),i=r.n(s),c=r(4587),h=r.n(c),d=r(5176);function u(e){let{currentSection:t}=e,{t:r}=(0,d.Bd)(),o=[{section:"welcome",label:r("nav.welcome","Welcome"),href:"/"},{section:"blog",label:r("nav.blog","Blog"),href:"/blog"},{section:"cv",label:r("nav.cv","CV"),href:"/cv"},{section:"books",label:r("nav.books","Books"),href:"/books"},{section:"contact",label:r("nav.contact","Contact"),href:"/contact"}];return(0,l.jsxs)("aside",{className:"bg-light-accent p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col",children:[(0,l.jsxs)("div",{className:"profile flex flex-col items-center mb-8",children:[(0,l.jsx)("div",{className:"w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-steel-blue mb-4",children:(0,l.jsx)(h(),{src:"/personalsite/images/profile.jpg",alt:"Profile Photo",width:150,height:150,className:"object-cover w-full h-full",priority:!0})}),(0,l.jsx)("h2",{className:"text-xl font-semibold mb-1",children:"Patrick Stephens"}),(0,l.jsx)("p",{className:"text-sm opacity-80",children:"Senior Engineering Manager"})]}),(0,l.jsx)("nav",{className:"flex-grow mb-8",children:(0,l.jsx)("ul",{className:"space-y-2",children:o.map(e=>{let{section:r,label:o,href:a}=e;return(0,l.jsx)("li",{children:(0,l.jsx)(i(),{href:a,className:"\n                  block px-4 py-2 rounded-lg transition-all duration-200\n                  ".concat(t===r?"bg-opacity-20 bg-steel-blue transform translate-x-1":"hover:bg-opacity-10 hover:bg-steel-blue hover:translate-x-1","\n                "),children:o})},r)})})}),(0,l.jsxs)("div",{className:"social-icons flex justify-center space-x-4",children:[(0,l.jsx)("a",{href:"https://github.com/patsteph",target:"_blank",rel:"noopener noreferrer","aria-label":"GitHub Profile",className:"text-steel-blue hover:text-accent transition-colors",children:(0,l.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",fill:"currentColor",viewBox:"0 0 16 16",children:(0,l.jsx)("path",{d:"M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"})})}),(0,l.jsx)("a",{href:"https://linkedin.com/in/patrickjstephens/",target:"_blank",rel:"noopener noreferrer","aria-label":"LinkedIn Profile",className:"text-steel-blue hover:text-accent transition-colors",children:(0,l.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",fill:"currentColor",viewBox:"0 0 16 16",children:(0,l.jsx)("path",{d:"M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"})})}),(0,l.jsx)("a",{href:"https://twitter.com/StephensCisco",target:"_blank",rel:"noopener noreferrer","aria-label":"Twitter Profile",className:"text-steel-blue hover:text-accent transition-colors",children:(0,l.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",fill:"currentColor",viewBox:"0 0 16 16",children:(0,l.jsx)("path",{d:"M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"})})}),(0,l.jsx)("a",{href:"https://bsky.app/profile/stephenspatrickj/",target:"_blank",rel:"noopener noreferrer","aria-label":"Bluesky Profile",className:"text-steel-blue hover:text-accent transition-colors",children:(0,l.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",fill:"currentColor",viewBox:"0 0 16 16",children:(0,l.jsx)("path",{d:"M13.5 8a.5.5 0 0 1-.5.5H2a.5.5 0 0 1 0-1h11a.5.5 0 0 1 .5.5zm0-4a.5.5 0 0 1-.5.5H2a.5.5 0 0 1 0-1h11a.5.5 0 0 1 .5.5zm0 8a.5.5 0 0 1-.5.5H2a.5.5 0 0 1 0-1h11a.5.5 0 0 1 .5.5z"})})})]})]})}function g(e){let{children:t,title:r,description:o,section:s,headerImage:i}=e;(0,n.useRouter)();let{t:c,language:h,setLanguage:g}=(0,d.Bd)(),m={welcome:c("welcome.title","Welcome"),blog:c("blog.title","Blog"),cv:c("cv.title","Curriculum Vitae"),books:c("books.title","My Book Collection"),contact:c("contact.title","Contact"),admin:c("admin.login","Admin")},p=r||m[s],b=o||"Senior Engineering Manager personal website - ".concat(p," section");return(0,l.jsxs)("div",{className:"min-h-screen bg-linen text-steel-blue",children:[(0,l.jsxs)(a(),{children:[(0,l.jsx)("title",{children:"".concat(p," | Patrick Stephens")}),(0,l.jsx)("meta",{name:"description",content:b}),(0,l.jsx)("link",{rel:"icon",href:"/favicon.ico"}),(0,l.jsx)("meta",{name:"viewport",content:"width=device-width, initial-scale=1"}),(0,l.jsx)("meta",{property:"og:title",content:"".concat(p," | Patrick Stephens")}),(0,l.jsx)("meta",{property:"og:description",content:b}),(0,l.jsx)("meta",{property:"og:type",content:"website"}),(0,l.jsx)("meta",{charSet:"utf-8"})]}),(0,l.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4",children:[(0,l.jsx)(u,{currentSection:s}),(0,l.jsxs)("main",{className:"md:col-span-3 flex flex-col min-h-screen",children:[(0,l.jsx)("header",{className:"w-full",children:(0,l.jsx)("div",{className:"w-full h-[200px] overflow-hidden",children:(0,l.jsx)("img",{src:i||"/personalsite/images/headers/".concat(s,".jpg"),alt:"".concat(p," Header"),className:"w-full h-full object-cover transition-opacity duration-500",width:"800",height:"200"})})}),(0,l.jsx)("div",{className:"flex-grow p-6 md:p-8",children:t}),(0,l.jsxs)("footer",{className:"bg-light-accent p-4 flex justify-between items-center",children:[(0,l.jsx)("div",{className:"language-selector",children:(0,l.jsx)("select",{value:h,onChange:e=>{g(e.target.value)},className:"px-3 py-1 rounded border border-steel-blue bg-linen text-steel-blue",children:Object.entries(d.Yj).map(e=>{let[t,r]=e;return(0,l.jsx)("option",{value:t,children:r},t)})})}),(0,l.jsxs)("div",{className:"copyright text-sm",children:["\xa9 ",new Date().getFullYear()," Your Name"]})]})]})]})]})}}}]);