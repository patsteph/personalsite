(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[615],{1816:(e,s,l)=>{"use strict";l.d(s,{A:()=>u});var t=l(7876),a=l(4232),n=l(7328),c=l.n(n),i=l(9099),o=l(8230),r=l.n(o),d=l(4587),x=l.n(d),m=l(7254);function h(e){let{currentSection:s}=e,{t:l}=(0,m.B)(),a=[{section:"welcome",label:l("nav.welcome","Welcome"),href:"/"},{section:"blog",label:l("nav.blog","Blog"),href:"/blog"},{section:"cv",label:l("nav.cv","CV"),href:"/cv"},{section:"books",label:l("nav.books","Books"),href:"/books"},{section:"contact",label:l("nav.contact","Contact"),href:"/contact"}];return(0,t.jsxs)("aside",{className:"bg-light-accent p-6 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col",children:[(0,t.jsxs)("div",{className:"profile flex flex-col items-center mb-8",children:[(0,t.jsx)("div",{className:"w-[150px] h-[150px] rounded-full overflow-hidden border-4 border-steel-blue mb-4",children:(0,t.jsx)(x(),{src:"/images/profile.jpg",alt:"Profile Photo",width:150,height:150,className:"object-cover w-full h-full",priority:!0})}),(0,t.jsx)("h2",{className:"text-xl font-semibold mb-1",children:"Your Name"}),(0,t.jsx)("p",{className:"text-sm opacity-80",children:"Senior Engineering Manager"})]}),(0,t.jsx)("nav",{className:"flex-grow mb-8",children:(0,t.jsx)("ul",{className:"space-y-2",children:a.map(e=>{let{section:l,label:a,href:n}=e;return(0,t.jsx)("li",{children:(0,t.jsx)(r(),{href:n,className:"\n                  block px-4 py-2 rounded-lg transition-all duration-200\n                  ".concat(s===l?"bg-opacity-20 bg-steel-blue transform translate-x-1":"hover:bg-opacity-10 hover:bg-steel-blue hover:translate-x-1","\n                "),children:a})},l)})})}),(0,t.jsx)("div",{className:"social-icons flex justify-center space-x-4"})]})}function u(e){let{children:s,title:l,description:n,section:o,headerImage:r}=e;(0,i.useRouter)();let{t:d}=(0,m.B)(),x={welcome:d("welcome.title","Welcome"),blog:d("blog.title","Blog"),cv:d("cv.title","Curriculum Vitae"),books:d("books.title","My Book Collection"),contact:d("contact.title","Contact"),admin:d("admin.login","Admin")},[u,g]=(0,a.useState)(()=>localStorage.getItem("preferred_language")||"en"),b=l||x[o];return(0,t.jsxs)("div",{className:"min-h-screen bg-linen text-steel-blue",children:[(0,t.jsxs)(c(),{children:[(0,t.jsx)("title",{children:"".concat(b," | Your Name")}),(0,t.jsx)("meta",{name:"description",content:n||"Senior Engineering Manager personal website - ".concat(b," section")}),(0,t.jsx)("link",{rel:"icon",href:"/favicon.ico"}),(0,t.jsx)("meta",{name:"viewport",content:"width=device-width, initial-scale=1"})]}),(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-4",children:[(0,t.jsx)(h,{currentSection:o}),(0,t.jsxs)("main",{className:"md:col-span-3 flex flex-col min-h-screen",children:[(0,t.jsx)("header",{className:"w-full",children:(0,t.jsx)("div",{className:"w-full h-[200px] overflow-hidden",children:(0,t.jsx)("img",{src:r||"/images/headers/".concat(o,".jpg"),alt:"".concat(b," Header"),className:"w-full h-full object-cover transition-opacity duration-500",width:"800",height:"200"})})}),(0,t.jsx)("div",{className:"flex-grow p-6 md:p-8",children:s}),(0,t.jsxs)("footer",{className:"bg-light-accent p-4 flex justify-between items-center",children:[(0,t.jsx)("div",{className:"language-selector",children:(0,t.jsxs)("select",{defaultValue:"en",onChange:e=>{let s=e.target.value;localStorage.setItem("preferred_language",s)},className:"px-3 py-1 rounded border border-steel-blue bg-linen text-steel-blue",children:[(0,t.jsx)("option",{value:"en",children:"English"}),(0,t.jsx)("option",{value:"es",children:"Espa\xf1ol"}),(0,t.jsx)("option",{value:"de",children:"Deutsch"}),(0,t.jsx)("option",{value:"ja",children:"日本語"}),(0,t.jsx)("option",{value:"uk",children:"Українська"})]})}),(0,t.jsxs)("div",{className:"copyright text-sm",children:["\xa9 ",new Date().getFullYear()," Your Name"]})]})]})]})]})}},3646:(e,s,l)=>{"use strict";l.r(s),l.d(s,{__N_SSG:()=>d,default:()=>x});var t=l(7876),a=l(1816),n=l(7254);function c(e){let{about:s}=e,{t:l}=(0,n.B)();return(0,t.jsxs)("section",{className:"mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-accent mb-4",children:l("cv.about","About Me")}),(0,t.jsx)("div",{className:"bg-white rounded-lg shadow p-6",children:(0,t.jsx)("p",{className:"text-steel-blue leading-relaxed",children:s})})]})}function i(e){let{experience:s}=e,{t:l}=(0,n.B)();return(0,t.jsxs)("section",{className:"mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-accent mb-4",children:l("cv.experience","Experience")}),(0,t.jsx)("div",{className:"space-y-4",children:s.map((e,s)=>(0,t.jsxs)("div",{className:"bg-white rounded-lg shadow p-6",children:[(0,t.jsx)("h3",{className:"text-xl font-semibold text-steel-blue",children:e.title}),(0,t.jsxs)("div",{className:"text-gray-600 mb-2",children:[e.company," | ",e.location," | ",e.period]}),(0,t.jsx)("p",{className:"text-gray-700 mt-3",children:e.description})]},s))})]})}function o(e){let{skills:s}=e,{t:l}=(0,n.B)();return(0,t.jsxs)("section",{className:"mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-accent mb-4",children:l("cv.skills","Skills")}),(0,t.jsx)("div",{className:"bg-white rounded-lg shadow p-6",children:(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:s.map((e,s)=>(0,t.jsx)("span",{className:"bg-light-accent text-steel-blue px-3 py-1 rounded-full text-sm",children:e},s))})})]})}function r(e){let{education:s,certifications:l}=e,{t:a}=(0,n.B)();return(0,t.jsxs)("section",{className:"mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-accent mb-4",children:a("cv.education","Education & Training")}),(0,t.jsx)("div",{className:"space-y-4 mb-6",children:s.map((e,s)=>(0,t.jsxs)("div",{className:"bg-white rounded-lg shadow p-6",children:[(0,t.jsx)("h3",{className:"text-xl font-semibold text-steel-blue",children:e.degree}),(0,t.jsxs)("div",{className:"text-gray-600",children:[e.institution," | ",e.location," | ",e.year]})]},s))}),l&&l.length>0&&(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-xl font-semibold text-accent mb-3",children:"Certifications"}),(0,t.jsx)("div",{className:"space-y-2",children:l.map((e,s)=>(0,t.jsxs)("div",{className:"bg-white rounded-lg shadow p-4",children:[(0,t.jsx)("div",{className:"font-medium",children:e.name}),(0,t.jsx)("div",{className:"text-sm text-gray-600",children:e.year})]},s))})]})]})}var d=!0;function x(e){let{cvData:s}=e,{t:l}=(0,n.B)();return(0,t.jsxs)(a.A,{section:"cv",children:[(0,t.jsx)("h1",{className:"text-3xl md:text-4xl font-bold text-accent mb-8",children:l("cv.title","Curriculum Vitae")}),(0,t.jsx)(c,{about:s.about}),(0,t.jsx)(i,{experience:s.experience}),(0,t.jsx)(o,{skills:s.skills}),(0,t.jsx)(r,{education:s.education,certifications:s.certifications}),s.publications&&s.publications.length>0&&(0,t.jsxs)("section",{className:"mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-accent mb-4",children:"Publications"}),(0,t.jsx)("div",{className:"bg-white rounded-lg shadow p-6",children:(0,t.jsx)("ul",{className:"space-y-3",children:s.publications.map((e,s)=>(0,t.jsxs)("li",{children:[(0,t.jsx)("div",{className:"font-medium text-steel-blue",children:e.title}),(0,t.jsxs)("div",{className:"text-sm text-gray-600",children:[e.publisher,", ",e.year]})]},s))})})]}),s.languages&&s.languages.length>0&&(0,t.jsxs)("section",{className:"mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-accent mb-4",children:"Languages"}),(0,t.jsx)("div",{className:"bg-white rounded-lg shadow p-6",children:(0,t.jsx)("div",{className:"flex flex-wrap gap-4",children:s.languages.map((e,s)=>(0,t.jsxs)("div",{className:"bg-light-accent rounded-lg px-4 py-2",children:[(0,t.jsx)("span",{className:"font-medium",children:e.name}),(0,t.jsxs)("span",{className:"text-sm text-gray-600 ml-2",children:["(",e.proficiency,")"]})]},s))})})]}),(0,t.jsx)("div",{className:"mt-8 text-center",children:(0,t.jsxs)("a",{href:"/files/cv.pdf",download:!0,className:"inline-block bg-steel-blue hover:bg-accent text-white font-medium py-2 px-6 rounded transition-colors",children:[l("cv.download","Download CV"),(0,t.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-4 w-4 ml-1 inline",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"})})]})})]})}},7254:(e,s,l)=>{"use strict";l.d(s,{B:()=>n});var t=l(4232);let a={en:{"nav.welcome":"Welcome","nav.blog":"Blog","nav.cv":"CV","nav.books":"Books","nav.contact":"Contact"},es:{"nav.welcome":"Bienvenido","nav.blog":"Blog","nav.cv":"Curr\xedculum","nav.books":"Libros","nav.contact":"Contacto"}};function n(){let[e,s]=(0,t.useState)("en");return(0,t.useEffect)(()=>{{let e=localStorage.getItem("preferred_language");e&&a[e]&&s(e)}},[]),{t:(0,t.useCallback)((s,l)=>(a[e]||a.en)[s]||l||s,[e]),locale:e,setLanguage:s}}},8062:(e,s,l)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/cv",function(){return l(3646)}])}},e=>{var s=s=>e(e.s=s);e.O(0,[326,636,593,792],()=>s(8062)),_N_E=e.O()}]);