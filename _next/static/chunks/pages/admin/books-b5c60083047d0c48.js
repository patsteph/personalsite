(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[238],{412:(e,t,s)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/admin/books",function(){return s(8299)}])},7746:(e,t,s)=>{"use strict";s.d(t,{A:()=>r});var n=s(7876),o=s(4232),a=s(1660),l=s(5176);function r(e){var t,s;let{existingBook:r,onSuccess:i}=e,[d,c]=(0,o.useState)((null==r?void 0:r.isbn)||""),[u,m]=(0,o.useState)((null==r?void 0:r.status)||"toRead"),[b,x]=(0,o.useState)((null==r?void 0:r.notes)||""),[g,h]=(0,o.useState)(r||null),[f,p]=(0,o.useState)(!1),[v,y]=(0,o.useState)(""),[j,N]=(0,o.useState)(""),{t:w}=(0,l.Bd)(),k=async()=>{if(!d){y("Please enter an ISBN");return}p(!0),y("");try{let e=await (0,a.xj)(d);e?h(e):y("Book not found. Please check the ISBN and try again.")}catch(e){console.error("Error looking up book:",e),y("Error looking up book. Please try again.")}finally{p(!1)}},S=async()=>{if(!g){y("Please look up a book first");return}p(!0),y("");try{let e={...g,...void 0!==g.averageRating?{}:{averageRating:null},status:u,notes:b,dateAdded:new Date().toISOString()};if(void 0!==e.averageRating){let t=Number(e.averageRating);if(isNaN(t))throw Error("Rating must be a valid number");t<0||t>5?(console.warn("Rating outside normal range: ".concat(t,", adjusting to limit")),e.averageRating=Math.max(0,Math.min(5,t))):e.averageRating=t}else e.averageRating=void 0;console.log("Formatted book data:",e),await (0,a.bp)(e),N("Book added successfully!"),c(""),m("toRead"),x(""),h(null),i&&i()}catch(e){console.error("Error adding book:",e),y("Error adding book: ".concat(e instanceof Error?e.message:"Please try again."))}finally{p(!1)}},R=async()=>{if(!r){y("No book to update");return}p(!0),y("");try{await (0,a.r3)(r.id,{status:u,notes:b}),N("Book updated successfully!"),i&&i()}catch(e){console.error("Error updating book:",e),y("Error updating book. Please try again.")}finally{p(!1)}},B=async()=>{if(r&&confirm("Are you sure you want to delete this book?")){p(!0),y("");try{await (0,a.HA)(r.id),N("Book deleted successfully!"),i&&i()}catch(e){console.error("Error deleting book:",e),y("Error deleting book. Please try again.")}finally{p(!1)}}};return(0,n.jsxs)("div",{className:"bg-white rounded-lg shadow p-6",children:[(0,n.jsx)("h2",{className:"text-xl font-bold text-accent mb-6",children:w("admin.bookManagement",r?"Edit Book":"Add New Book")}),v&&(0,n.jsx)("div",{className:"bg-red-100 text-red-700 p-3 rounded mb-4",children:v}),j&&(0,n.jsx)("div",{className:"bg-green-100 text-green-700 p-3 rounded mb-4",children:j}),(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:w("admin.isbn","ISBN:")}),(0,n.jsxs)("div",{className:"flex",children:[(0,n.jsx)("input",{type:"text",value:d,onChange:e=>c(e.target.value),disabled:!!r,className:"\n              flex-grow px-3 py-2 border border-gray-300 rounded-l-md \n              focus:outline-none focus:ring-steel-blue focus:border-steel-blue\n              ".concat(r?"bg-gray-100":"","\n            "),placeholder:"Enter ISBN"}),!r&&(0,n.jsx)("button",{type:"button",onClick:k,disabled:f||!d,className:"\n                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded-r-md\n                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n                ".concat(f||!d?"opacity-70 cursor-not-allowed":"","\n              "),children:f?"Loading...":w("admin.lookup","Lookup")})]})]}),g&&(0,n.jsx)("div",{className:"mb-6 p-4 bg-light-accent rounded-lg",children:(0,n.jsxs)("div",{className:"flex items-start",children:[(null===(t=g.imageLinks)||void 0===t?void 0:t.thumbnail)&&(0,n.jsx)("img",{src:g.imageLinks.thumbnail,alt:"Cover of ".concat(g.title),className:"w-20 h-auto mr-4"}),(0,n.jsxs)("div",{children:[(0,n.jsx)("h3",{className:"font-bold text-lg",children:g.title}),(0,n.jsx)("p",{className:"text-sm",children:null===(s=g.authors)||void 0===s?void 0:s.join(", ")}),g.categories&&(0,n.jsx)("p",{className:"text-xs text-gray-600 mt-1",children:g.categories.join(", ")})]})]})}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"status",className:"block text-sm font-medium text-gray-700 mb-1",children:w("admin.status","Reading Status:")}),(0,n.jsxs)("select",{id:"status",value:u,onChange:e=>m(e.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",children:[(0,n.jsx)("option",{value:"read",children:w("books.read","Read")}),(0,n.jsx)("option",{value:"reading",children:w("books.reading","Currently Reading")}),(0,n.jsx)("option",{value:"toRead",children:w("books.toRead","Want to Read")})]})]}),(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsx)("label",{htmlFor:"notes",className:"block text-sm font-medium text-gray-700 mb-1",children:w("admin.notes","Your Notes:")}),(0,n.jsx)("textarea",{id:"notes",value:b,onChange:e=>x(e.target.value),rows:4,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",placeholder:"Your thoughts about this book..."})]}),(0,n.jsx)("div",{className:"flex justify-between",children:r?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("button",{type:"button",onClick:R,disabled:f,className:"\n                bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded\n                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n                ".concat(f?"opacity-70 cursor-not-allowed":"","\n              "),children:f?"Saving...":w("admin.update","Update Book")}),(0,n.jsx)("button",{type:"button",onClick:B,disabled:f,className:"\n                bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded\n                transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600\n                ".concat(f?"opacity-70 cursor-not-allowed":"","\n              "),children:f?"Deleting...":w("admin.delete","Delete Book")})]}):(0,n.jsx)("button",{type:"button",onClick:S,disabled:f||!g,className:"\n              bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded\n              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n              ".concat(f||!g?"opacity-70 cursor-not-allowed":"","\n            "),children:f?"Adding...":w("admin.add","Add to Collection")})})]})}},7964:(e,t,s)=>{"use strict";s.d(t,{J:()=>n});let n="/personalsite"},8299:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>g});var n=s(7876),o=s(4232),a=s(9099),l=s(8230),r=s.n(l),i=s(1816),d=s(870),c=s(7964);function u(e){let{onSuccess:t}=e,[s,l]=(0,o.useState)(""),[r,i]=(0,o.useState)(""),[u,m]=(0,o.useState)(""),[b,x]=(0,o.useState)(!1),{signIn:g}=(0,d.A)(),h=(0,a.useRouter)(),f=async e=>{if(e.preventDefault(),!s||!r){m("Please enter both email and password");return}x(!0),m("");try{await g(s,r),t&&t(),h.push("".concat(c.J,"/admin"))}catch(e){console.error("Login error:",e),m("Invalid email or password")}finally{x(!1)}};return(0,n.jsxs)("div",{className:"max-w-md mx-auto bg-white rounded-lg shadow p-8",children:[(0,n.jsx)("h2",{className:"text-2xl font-bold text-accent mb-6",children:"Admin Login"}),(0,n.jsxs)("form",{onSubmit:f,children:[u&&(0,n.jsx)("div",{className:"bg-red-100 text-red-700 p-3 rounded mb-4",children:u}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{htmlFor:"email",className:"block text-sm font-medium text-gray-700 mb-1",children:"Email"}),(0,n.jsx)("input",{id:"email",type:"email",value:s,onChange:e=>l(e.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",required:!0})]}),(0,n.jsxs)("div",{className:"mb-6",children:[(0,n.jsx)("label",{htmlFor:"password",className:"block text-sm font-medium text-gray-700 mb-1",children:"Password"}),(0,n.jsx)("input",{id:"password",type:"password",value:r,onChange:e=>i(e.target.value),className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-steel-blue focus:border-steel-blue",required:!0})]}),(0,n.jsx)("button",{type:"submit",disabled:b,className:"\n            w-full bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded\n            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue\n            ".concat(b?"opacity-70 cursor-not-allowed":"","\n          "),children:b?"Signing in...":"Sign In"})]})]})}var m=s(7746),b=s(1660),x=s(5176);function g(){let{user:e,loading:t}=(0,d.A)(),s=(0,a.useRouter)(),{t:l}=(0,x.Bd)(),[c,g]=(0,o.useState)(!0),[h,f]=(0,o.useState)([]),[p,v]=(0,o.useState)(null),[y,j]=(0,o.useState)(!1);(0,o.useEffect)(()=>{!t&&(g(!1),e&&N())},[t,e]);let N=async()=>{try{let e=await (0,b.zy)();f(e)}catch(e){console.error("Error loading books:",e)}},w=()=>{N(),v(null),j(!1)},k=async e=>{try{let t=await (0,b.QC)(e);t&&(v(t),j(!1))}catch(e){console.error("Error fetching book:",e)}};return c?(0,n.jsx)(i.A,{section:"admin",children:(0,n.jsx)("div",{className:"flex justify-center items-center py-16",children:(0,n.jsx)("div",{className:"inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"})})}):e?(0,n.jsxs)(i.A,{section:"admin",title:"Book Management",children:[(0,n.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,n.jsx)("h1",{className:"text-3xl md:text-4xl font-bold text-accent",children:"Book Management"}),(0,n.jsxs)(r(),{href:"/admin",className:"inline-flex items-center text-steel-blue hover:text-accent transition-colors",children:[(0,n.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-4 w-4 mr-1",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,n.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})}),"Back to Dashboard"]})]}),(0,n.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-8",children:[(0,n.jsx)("div",{className:"md:col-span-1",children:(0,n.jsxs)("div",{className:"bg-white rounded-lg shadow p-4",children:[(0,n.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,n.jsxs)("h2",{className:"text-xl font-bold text-steel-blue",children:["Books (",h.length,")"]}),(0,n.jsx)("button",{onClick:()=>{v(null),j(!0)},className:"text-steel-blue hover:text-accent text-sm",children:"+ Add New Book"})]}),h.length>0?(0,n.jsx)("div",{className:"space-y-3 max-h-96 overflow-y-auto pr-2",children:h.map(e=>(0,n.jsxs)("div",{className:"\n                      p-3 rounded-lg cursor-pointer transition-colors\n                      ".concat((null==p?void 0:p.id)===e.id?"bg-light-accent border-l-4 border-steel-blue":"hover:bg-gray-50","\n                    "),onClick:()=>k(e.id),children:[(0,n.jsx)("div",{className:"font-medium truncate",children:e.title}),(0,n.jsx)("div",{className:"text-sm text-gray-600 truncate",children:e.authors.join(", ")}),(0,n.jsx)("div",{className:"flex mt-1",children:(0,n.jsx)("span",{className:"\n                        text-xs px-2 py-0.5 rounded-full\n                        ".concat("read"===e.status?"bg-green-100 text-green-800":"","\n                        ").concat("reading"===e.status?"bg-blue-100 text-blue-800":"","\n                        ").concat("toRead"===e.status?"bg-yellow-100 text-yellow-800":"","\n                      "),children:"read"===e.status?"Read":"reading"===e.status?"Reading":"To Read"})})]},e.id))}):(0,n.jsx)("div",{className:"text-center py-8 text-gray-500",children:"No books in your collection yet."})]})}),(0,n.jsx)("div",{className:"md:col-span-2",children:y?(0,n.jsx)(m.A,{onSuccess:w}):p?(0,n.jsx)(m.A,{existingBook:p,onSuccess:w}):(0,n.jsx)("div",{className:"bg-white rounded-lg shadow p-6 flex items-center justify-center h-64",children:(0,n.jsxs)("div",{className:"text-center text-gray-500",children:[(0,n.jsx)("p",{className:"mb-4",children:"Select a book to edit or add a new one."}),(0,n.jsx)("button",{onClick:()=>j(!0),className:"bg-steel-blue hover:bg-accent text-white font-medium py-2 px-4 rounded transition-colors",children:"Add New Book"})]})})})]})]}):(0,n.jsxs)(i.A,{section:"admin",children:[(0,n.jsx)("h1",{className:"text-3xl md:text-4xl font-bold text-accent mb-8",children:l("admin.login","Admin Login")}),(0,n.jsx)(u,{onSuccess:()=>{s.reload()}})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[25,974,636,593,792],()=>t(412)),_N_E=e.O()}]);