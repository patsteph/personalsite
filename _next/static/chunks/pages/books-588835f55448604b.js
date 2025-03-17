(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[566],{1940:(e,t,s)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/books",function(){return s(4019)}])},4019:(e,t,s)=>{"use strict";s.r(t),s.d(t,{__N_SSG:()=>m,default:()=>g});var a=s(7876),l=s(4747),r=s(4232),o=s(1660);function n(e){var t,s;let{book:l,onClick:o}=e,n=l.imageLinks&&(l.imageLinks.thumbnail||l.imageLinks.smallThumbnail);return(0,r.useMemo)(()=>{let e={Fiction:"#3498db","Science Fiction":"#9b59b6",Fantasy:"#8e44ad",Mystery:"#34495e",Thriller:"#2c3e50",Romance:"#e74c3c",Horror:"#c0392b",Biography:"#f1c40f",History:"#f39c12",Business:"#2ecc71","Self-help":"#27ae60",Computers:"#1abc9c",Programming:"#16a085",Science:"#3498db",Mathematics:"#2980b9",Philosophy:"#7f8c8d",Religion:"#bdc3c7",Travel:"#e67e22",Cooking:"#d35400"};if(l.categories){for(let t of l.categories)if(e[t])return e[t]}let t=Math.abs(l.title.split("").reduce((e,t)=>t.charCodeAt(0)+((e<<5)-e),0)%360);return"hsl(".concat(t,", 70%, 45%)")},[l.title,l.categories]),(0,r.useMemo)(()=>l.pageCount?Math.max(20,Math.min(40,l.pageCount/30)):30,[l.pageCount]),(0,a.jsxs)("div",{className:"h-40 w-28 cursor-pointer transition-transform duration-300 flex flex-col items-center rounded overflow-hidden shadow-md select-none m-1",onClick:o,onMouseOver:e=>{e.currentTarget.style.transform="translateY(-10px)"},onMouseOut:e=>{e.currentTarget.style.transform="translateY(0)"},title:"".concat(l.title," by ").concat(l.authors.join(", ")),children:[(0,a.jsx)("div",{className:"relative w-full h-32 bg-gray-200 flex items-center justify-center overflow-hidden",children:n?(0,a.jsx)("div",{className:"w-full h-full bg-cover bg-center",style:{backgroundImage:"url(".concat((null===(t=l.imageLinks)||void 0===t?void 0:t.thumbnail)||(null===(s=l.imageLinks)||void 0===s?void 0:s.smallThumbnail),")")}}):(0,a.jsx)("div",{className:"w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-300 p-2",children:(0,a.jsx)("p",{className:"text-xs text-center font-medium text-gray-700 line-clamp-3",children:l.title})})}),(0,a.jsxs)("div",{className:"w-full p-1 bg-white text-center",children:[(0,a.jsx)("h4",{className:"text-xs font-medium text-gray-800 truncate",children:l.title}),(0,a.jsx)("p",{className:"text-[10px] text-gray-600 truncate",children:l.authors&&l.authors.length>0?l.authors[0]:"Unknown Author"})]})]})}var i=s(3721),d=s(4587),c=s.n(d);function x(e){var t;let{book:s,onClose:l}=e,{t:r}=(0,i.Bd)(),o=(null===(t=s.imageLinks)||void 0===t?void 0:t.thumbnail)||"https://placehold.co/400x600/e0e0e0/808080?text=No+Cover+Available";return(0,a.jsx)("div",{className:"bg-white rounded-lg p-6 shadow-md mt-8 animate-fadeIn",children:(0,a.jsxs)("div",{className:"flex flex-col md:flex-row gap-6",children:[(0,a.jsx)("div",{className:"w-40 h-60 bg-gray-100 flex-shrink-0 mx-auto md:mx-0",children:(0,a.jsx)("div",{className:"relative w-full h-full",children:(0,a.jsx)(c(),{src:o,alt:"Cover of ".concat(s.title),width:160,height:240,quality:85,priority:!0,className:"rounded object-cover w-full h-full",sizes:"(max-width: 768px) 160px, 160px",style:{maxWidth:"100%",height:"auto",objectFit:"cover"}})})}),(0,a.jsxs)("div",{className:"flex-grow",children:[(0,a.jsxs)("div",{className:"flex justify-between items-start",children:[(0,a.jsx)("h2",{className:"text-2xl font-bold text-accent",children:s.title}),l&&(0,a.jsx)("button",{onClick:l,className:"text-gray-400 hover:text-gray-600","aria-label":"Close",children:(0,a.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,a.jsx)("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),(0,a.jsx)("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),(0,a.jsxs)("p",{className:"text-lg mb-2",children:[r("books.by","by")," ",s.authors.join(", ")]}),s.categories&&(0,a.jsx)("p",{className:"text-sm text-gray-600 mb-1",children:s.categories.join(", ")}),void 0!==s.averageRating&&(0,a.jsxs)("p",{className:"text-sm text-gray-600 mb-4",children:[s.averageRating.toFixed(1)," / 5",s.ratingsCount&&" (".concat(s.ratingsCount," ratings)")]}),(0,a.jsxs)("div",{className:"mb-4",children:[(0,a.jsx)("span",{className:"text-sm font-semibold mr-2",children:r("books.status","Status:")}),(0,a.jsx)("span",{className:"\n              px-3 py-1 rounded-full text-xs font-medium\n              ".concat("read"===s.status?"bg-green-100 text-green-800":"","\n              ").concat("reading"===s.status?"bg-blue-100 text-blue-800":"","\n              ").concat("toRead"===s.status?"bg-yellow-100 text-yellow-800":"","\n            "),children:(e=>{switch(e){case"read":return r("books.read","Read");case"reading":return r("books.reading","Currently Reading");case"toRead":return r("books.toRead","Want to Read");default:return e}})(s.status)})]}),(0,a.jsx)("div",{className:"my-4",children:(0,a.jsx)("p",{className:"text-gray-700",children:s.description||"No description available."})}),s.notes&&(0,a.jsxs)("div",{className:"mt-4 bg-light-accent p-4 rounded-lg",children:[(0,a.jsx)("h3",{className:"font-semibold text-lg mb-2",children:r("books.myNotes","My Notes")}),(0,a.jsx)("p",{className:"italic",children:s.notes})]}),(0,a.jsxs)("div",{className:"mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600",children:[s.publisher&&(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"font-semibold",children:"Publisher:"})," ",s.publisher]}),s.publishedDate&&(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"font-semibold",children:"Published:"})," ",s.publishedDate]}),s.pageCount&&(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"font-semibold",children:"Pages:"})," ",s.pageCount]}),s.isbn&&(0,a.jsxs)("div",{children:[(0,a.jsx)("span",{className:"font-semibold",children:"ISBN:"})," ",s.isbn]})]})]})]})})}var h=s(9448);function u(e){let{initialBooks:t,booksPerShelf:s=16}=e,[l,d]=(0,r.useState)(t||[]),[c,u]=(0,r.useState)(null),[m,g]=(0,r.useState)("all"),[b,f]=(0,r.useState)("title"),[v,p]=(0,r.useState)(!t),{t:j}=(0,i.Bd)(),{user:y}=(0,h.As)();(0,r.useEffect)(()=>{!async function(){p(!0);try{let e=await (0,o.zy)();console.log("Loaded books:",e),d(e)}catch(e){console.error("Error loading books:",e)}finally{p(!1)}}()},[]);let N=(0,r.useMemo)(()=>{let e=[...l];return"all"!==m&&(e=e.filter(e=>e.status===m)),e.sort((e,t)=>{var s,a,l;if("title"===b)return e.title.localeCompare(t.title);if("author"===b)return(null===(s=e.authors[0])||void 0===s?void 0:s.localeCompare(t.authors[0]||""))||0;if("genre"===b)return((null===(a=e.categories)||void 0===a?void 0:a[0])||"").localeCompare((null===(l=t.categories)||void 0===l?void 0:l[0])||"");if("rating"===b){let s=e.userRating||e.averageRating||0;return(t.userRating||t.averageRating||0)-s}return 0}),e},[l,m,b]),k=Math.max(1,Math.ceil(N.length/12)),w=e=>{let t=12*e;return N.slice(t,t+12)};return(0,a.jsxs)("div",{className:"space-y-8",children:[(0,a.jsx)("div",{className:"flex flex-wrap items-center justify-between gap-4",children:(0,a.jsxs)("div",{className:"flex flex-wrap gap-4",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("label",{htmlFor:"book-filter",className:"text-sm font-medium",children:j("books.view","View:")}),(0,a.jsxs)("select",{id:"book-filter",value:m,onChange:e=>g(e.target.value),className:"px-3 py-2 rounded border border-steel-blue bg-linen text-sm",children:[(0,a.jsx)("option",{value:"all",children:j("books.all","All Books")}),(0,a.jsx)("option",{value:"read",children:j("books.read","Read")}),(0,a.jsx)("option",{value:"reading",children:j("books.reading","Currently Reading")}),(0,a.jsx)("option",{value:"toRead",children:j("books.toRead","Want to Read")})]})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("label",{htmlFor:"book-sort",className:"text-sm font-medium",children:j("books.sortBy","Sort By:")}),(0,a.jsxs)("select",{id:"book-sort",value:b,onChange:e=>f(e.target.value),className:"px-3 py-2 rounded border border-steel-blue bg-linen text-sm",children:[(0,a.jsx)("option",{value:"title",children:j("books.title","Title")}),(0,a.jsx)("option",{value:"author",children:j("books.author","Author")}),(0,a.jsx)("option",{value:"genre",children:j("books.genre","Genre")}),(0,a.jsx)("option",{value:"rating",children:j("books.rating","Rating")})]})]})]})}),v?(0,a.jsxs)("div",{className:"py-12 text-center",children:[(0,a.jsx)("div",{className:"inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-steel-blue border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"}),(0,a.jsx)("p",{className:"mt-2 text-gray-600",children:"Loading books..."})]}):(0,a.jsxs)(a.Fragment,{children:[Array.from({length:k}).map((e,t)=>{let s=w(t);return(0,a.jsx)("div",{className:"min-h-[11rem] bg-amber-900 rounded relative flex flex-wrap items-end justify-center px-2 py-2 shadow-lg after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:-mb-2 after:bg-amber-950 after:rounded-b",children:s.map(e=>(0,a.jsx)(n,{book:e,onClick:()=>u(e)},e.id))},"shelf-".concat(t))}),c&&(0,a.jsx)(x,{book:c,onClose:()=>u(null)}),0===N.length&&(0,a.jsxs)("div",{className:"py-12 text-center",children:[(0,a.jsx)("p",{className:"text-xl text-gray-700",children:"No books found in your collection."}),(0,a.jsx)("p",{className:"mt-2 text-gray-600",children:"Add some books to see them on your shelves!"})]})]})]})}var m=!0;function g(e){let{initialBooks:t,initialStats:s}=e,{t:n}=(0,i.Bd)(),[d,c]=(0,r.useState)(s);return(0,r.useEffect)(()=>{(async function(){try{let e=await (0,o.rd)();c(e)}catch(e){console.error("Error refreshing book stats:",e)}})()},[]),(0,a.jsxs)(l.A,{section:"books",children:[(0,a.jsx)("h1",{className:"text-3xl md:text-4xl font-bold text-accent mb-3",children:n("books.title","My Book Collection")}),(0,a.jsxs)("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3 mb-8",children:[(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4 text-center",children:[(0,a.jsx)("div",{className:"text-3xl font-bold text-steel-blue",children:d.total}),(0,a.jsx)("div",{className:"text-sm text-gray-600",children:n("books.totalBooks","Total Books")})]}),(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4 text-center",children:[(0,a.jsx)("div",{className:"text-3xl font-bold text-green-600",children:d.read}),(0,a.jsx)("div",{className:"text-sm text-gray-600",children:n("books.read","Read")})]}),(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4 text-center",children:[(0,a.jsx)("div",{className:"text-3xl font-bold text-blue-600",children:d.reading}),(0,a.jsx)("div",{className:"text-sm text-gray-600",children:n("books.reading","Currently Reading")})]}),(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow p-4 text-center",children:[(0,a.jsx)("div",{className:"text-3xl font-bold text-yellow-600",children:d.toRead}),(0,a.jsx)("div",{className:"text-sm text-gray-600",children:n("books.toRead","Want to Read")})]})]}),(0,a.jsx)("div",{className:"bg-white rounded-lg shadow p-6 mb-8",children:(0,a.jsx)("p",{className:"text-steel-blue leading-relaxed",children:"Browse my virtual bookshelf to see what I've been reading. I believe in continuous learning and often find inspiration in books related to technology, leadership, and business strategy. You can filter by reading status or sort by different criteria to explore the collection."})}),(0,a.jsx)(u,{initialBooks:t,booksPerShelf:16})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[593,223,299,137,789,636,792],()=>t(1940)),_N_E=e.O()}]);