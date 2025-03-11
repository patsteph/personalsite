(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[238],{412:(e,t,s)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/books",function(){return s(4671)}])},4671:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>x});var n=s(7876),o=s(4232),a=s(9099),l=s(8230),r=s.n(l),i=s(1816),d=s(5960),c=s(7746),u=s(870),m=s(1660),b=s(5176);function x(){let{user:e,loading:t}=(0,u.A)(),s=(0,a.useRouter)(),{t:l}=(0,b.Bd)(),[x,g]=(0,o.useState)(!0),[h,f]=(0,o.useState)([]),[p,y]=(0,o.useState)(null),[j,N]=(0,o.useState)(!1);(0,o.useEffect)(()=>{!t&&(g(!1),e&&v())},[t,e]);let v=async()=>{try{let e=await (0,m.zy)();f(e)}catch(e){console.error("Error loading books:",e)}},w=()=>{v(),y(null),N(!1)},k=async e=>{try{let t=await (0,m.QC)(e);t&&(y(t),N(!1))}catch(e){console.error("Error fetching book:",e)}};return x?(0,n.jsx)(i.A,{section:"admin",children:(0,n.jsx)("div",{className:"flex justify-center items-center py-16",children:(0,n.jsx)("div",{className:"inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"})})}):e?(0,n.jsxs)(i.A,{section:"admin",title:"Book Management",children:[(0,n.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,n.jsx)("h1",{className:"text-3xl md:text-4xl font-bold text-accent",children:"Book Management"}),(0,n.jsxs)(r(),{href:"/admin",className:"inline-flex items-center text-steel-blue hover:text-accent transition-colors",children:[(0,n.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-4 w-4 mr-1",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,n.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})}),"Back to Dashboard"]})]}),(0,n.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-8",children:[(0,n.jsx)("div",{className:"md:col-span-1",children:(0,n.jsxs)("div",{className:"bg-white rounded-lg shadow p-4",children:[(0,n.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,n.jsxs)("h2",{className:"text-xl font-bold text-steel-blue",children:["Books (",h.length,")"]}),(0,n.jsx)("button",{onClick:()=>{y(null),N(!0)},className:"text-steel-blue hover:text-accent text-sm",children:"+ Add New Book"})]}),h.length>0?(0,n.jsx)("div",{className:"space-y-3 max-h-96 overflow-y-auto pr-2",children:h.map(e=>(0,n.jsxs)("div",{className:"\n                      p-3 rounded-lg cursor-pointer transition-colors\n                      ".concat((null==p?void 0:p.id)===e.id?"bg-light-accent border-l-4 border-steel-blue":"hover:bg-gray-50","\n                    "),onClick:()=>k(e.id),children:[(0,n.jsx)("div",{className:"font-medium truncate",children:e.title}),(0,n.jsx)("div",{className:"text-sm text-gray-600 truncate",children:e.authors.join(", ")}),(0,n.jsx)("div",{className:"flex mt-1",children:(0,n.jsx)("span",{className:"\n                        text-xs px-2 py-0.5 rounded-full\n                        ".concat("read"===e.status?"bg-green-100 text-green-800":"","\n                        ").concat("reading"===e.status?"bg-blue-100 text-blue-800":"","\n                        ").concat("toRead"===e.status?"bg-yellow-100 text-yellow-800":"","\n                      "),children:"read"===e.status?"Read":"reading"===e.status?"Reading":"To Read"})})]},e.id))}):(0,n.jsx)("div",{className:"text-center py-8 text-gray-500",children:"No books in your collection yet."})]})}),(0,n.jsx)("div",{className:"md:col-span-2",children:j?(0,n.jsx)(c.A,{onSuccess:w}):p?(0,n.jsx)(c.A,{existingBook:p,onSuccess:w}):(0,n.jsx)("div",{className:"bg-white rounded-lg shadow p-6 flex items-center justify-center h-64",children:(0,n.jsxs)("div",{className:"text-center text-gray-500",children:[(0,n.jsx)("p",{className:"mb-4",children:"Select a book to edit or add a new one."}),(0,n.jsx)("button",{onClick:()=>N(!0),className:"bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors",children:"Add New Book"})]})})})]})]}):(0,n.jsxs)(i.A,{section:"admin",children:[(0,n.jsx)("h1",{className:"text-3xl md:text-4xl font-bold text-accent mb-8",children:l("admin.login","Admin Login")}),(0,n.jsx)(d.A,{onSuccess:()=>{s.reload()}})]})}},5960:(e,t,s)=>{"use strict";s.d(t,{A:()=>i});var n=s(7876),o=s(4232),a=s(870),l=s(9099),r=s(7964);function i(e){let{onSuccess:t}=e,[s,i]=(0,o.useState)(""),[d,c]=(0,o.useState)(""),[u,m]=(0,o.useState)(""),[b,x]=(0,o.useState)(!1),{signIn:g}=(0,a.A)(),h=(0,l.useRouter)(),f=async e=>{if(e.preventDefault(),!s||!d){m("Please enter both email and password");return}x(!0),m("");try{await g(s,d),t&&t(),h.push("".concat(r.J,"/admin"))}catch(e){console.error("Login error:",e),m("Invalid email or password")}finally{x(!1)}};return(0,n.jsxs)("div",{className:"max-w-md mx-auto bg-white rounded-lg shadow p-8",children:[(0,n.jsx)("h2",{className:"text-2xl font-bold text-accent mb-6",children:"Admin Login"}),(0,n.jsxs)("form",{onSubmit:f,children:[u&&(0,n.jsx)("div",{className:"bg-red-100 text-red-700 p-3 rounded mb-4",children:u}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"email",className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),(0,n.jsx)("input",{id:"email",type:"email",value:s,onChange:e=>i(e.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",required:!0})]}),(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsx)("label",{htmlFor:"password",className:"block text-sm font-medium text-gray-700 mb-1",children:"Password"}),(0,n.jsx)("input",{id:"password",type:"password",value:d,onChange:e=>c(e.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",required:!0})]}),(0,n.jsx)("button",{type:"submit",disabled:b,className:"\n            w-full bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded\n            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n            ".concat(b?"opacity-70 cursor-not-allowed":"","\n          "),children:b?"Signing in...":"Sign In"})]})]})}},7746:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var n=s(7876),o=s(4232),a=s(1660),l=s(5176);function r(e){var t,s;let{existingBook:r,onSuccess:i}=e,[d,c]=(0,o.useState)((null==r?void 0:r.isbn)||""),[u,m]=(0,o.useState)((null==r?void 0:r.status)||"toRead"),[b,x]=(0,o.useState)((null==r?void 0:r.notes)||""),[g,h]=(0,o.useState)(r||null),[f,p]=(0,o.useState)(!1),[y,j]=(0,o.useState)(""),[N,v]=(0,o.useState)(""),{t:w}=(0,l.Bd)(),k=async()=>{if(!d){j("Please enter an ISBN");return}p(!0),j("");try{let e=await (0,a.xj)(d);e?h(e):j("Book not found. Please check the ISBN and try again.")}catch(e){console.error("Error looking up book:",e),j("Error looking up book. Please try again.")}finally{p(!1)}},S=async()=>{if(!g){j("Please look up a book first");return}p(!0),j("");try{let e={...g,status:u,notes:b,dateAdded:new Date().toISOString()};await (0,a.bp)(e),v("Book added successfully!"),c(""),m("toRead"),x(""),h(null),i&&i()}catch(e){console.error("Error adding book:",e),j("Error adding book. Please try again.")}finally{p(!1)}},B=async()=>{if(!r){j("No book to update");return}p(!0),j("");try{await (0,a.r3)(r.id,{status:u,notes:b}),v("Book updated successfully!"),i&&i()}catch(e){console.error("Error updating book:",e),j("Error updating book. Please try again.")}finally{p(!1)}},A=async()=>{if(r&&confirm("Are you sure you want to delete this book?")){p(!0),j("");try{await (0,a.HA)(r.id),v("Book deleted successfully!"),i&&i()}catch(e){console.error("Error deleting book:",e),j("Error deleting book. Please try again.")}finally{p(!1)}}};return(0,n.jsxs)("div",{className:"bg-white rounded-lg shadow p-6",children:[(0,n.jsx)("h2",{className:"text-xl font-bold text-accent mb-6",children:w("admin.bookManagement",r?"Edit Book":"Add New Book")}),y&&(0,n.jsx)("div",{className:"bg-red-100 text-red-700 p-3 rounded mb-4",children:y}),N&&(0,n.jsx)("div",{className:"bg-green-100 text-green-700 p-3 rounded mb-4",children:N}),(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:w("admin.isbn","ISBN:")}),(0,n.jsxs)("div",{className:"flex",children:[(0,n.jsx)("input",{type:"text",value:d,onChange:e=>c(e.target.value),disabled:!!r,className:"\n              flex-grow px-3 py-2 border border-gray-300 rounded-l-md \n              focus:outline-none focus:ring-steel-blue focus:border-steel-blue\n              ".concat(r?"bg-gray-100":"","\n            "),placeholder:"Enter ISBN"}),!r&&(0,n.jsx)("button",{type:"button",onClick:k,disabled:f||!d,className:"\n                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded-r-md\n                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n                ".concat(f||!d?"opacity-70 cursor-not-allowed":"","\n              "),children:f?"Loading...":w("admin.lookup","Lookup")})]})]}),g&&(0,n.jsx)("div",{className:"mb-6 p-4 bg-light-accent rounded-lg",children:(0,n.jsxs)("div",{className:"flex items-start",children:[(null===(t=g.imageLinks)||void 0===t?void 0:t.thumbnail)&&(0,n.jsx)("img",{src:g.imageLinks.thumbnail,alt:"Cover of ".concat(g.title),className:"w-20 h-auto mr-4"}),(0,n.jsxs)("div",{children:[(0,n.jsx)("h3",{className:"font-bold text-lg",children:g.title}),(0,n.jsx)("p",{className:"text-sm",children:null===(s=g.authors)||void 0===s?void 0:s.join(", ")}),g.categories&&(0,n.jsx)("p",{className:"text-xs text-gray-600 mt-1",children:g.categories.join(", ")})]})]})}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"status",className:"block text-sm font-medium text-gray-700 mb-1",children:w("admin.status","Reading Status:")}),(0,n.jsxs)("select",{id:"status",value:u,onChange:e=>m(e.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",children:[(0,n.jsx)("option",{value:"read",children:w("books.read","Read")}),(0,n.jsx)("option",{value:"reading",children:w("books.reading","Currently Reading")}),(0,n.jsx)("option",{value:"toRead",children:w("books.toRead","Want to Read")})]})]}),(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsx)("label",{htmlFor:"notes",className:"block text-sm font-medium text-gray-700 mb-1",children:w("admin.notes","Your Notes:")}),(0,n.jsx)("textarea",{id:"notes",value:b,onChange:e=>x(e.target.value),rows:4,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",placeholder:"Your thoughts about this book..."})]}),(0,n.jsx)("div",{className:"flex justify-between",children:r?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("button",{type:"button",onClick:B,disabled:f,className:"\n                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded\n                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n                ".concat(f?"opacity-70 cursor-not-allowed":"","\n              "),children:f?"Saving...":w("admin.update","Update Book")}),(0,n.jsx)("button",{type:"button",onClick:A,disabled:f,className:"\n                bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded\n                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600\n                ".concat(f?"opacity-70 cursor-not-allowed":"","\n              "),children:f?"Deleting...":w("admin.delete","Delete Book")})]}):(0,n.jsx)("button",{type:"button",onClick:S,disabled:f||!g,className:"\n              bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded\n              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n              ".concat(f||!g?"opacity-70 cursor-not-allowed":"","\n            "),children:f?"Adding...":w("admin.add","Add to Collection")})})]})}},7964:(e,t,s)=>{"use strict";s.d(t,{J:()=>n});let n="/personalsite"}},e=>{var t=t=>e(e.s=t);e.O(0,[25,974,636,593,792],()=>t(412)),_N_E=e.O()}]);