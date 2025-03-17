(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[636],{92:(e,t,o)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/_app",function(){return o(4529)}])},3611:(e,t,o)=>{"use strict";o.d(t,{DT:()=>m,j2:()=>u}),o(4232);var a=o(6042),s=o(9834),r=o(2964),i=o(7964);let n=null,l=null,d=null,{app:c,auth:u,firestore:g}=(()=>{if((0,a.Dk)().length>0)n=(0,a.Dk)()[0];else{var e,t,o,c;let s=i.CN;if((null===(t=window.SECURE_CONFIG)||void 0===t?void 0:null===(e=t.firebase)||void 0===e?void 0:e.apiKey)?(console.log("Using Firebase config from SECURE_CONFIG"),s={apiKey:window.SECURE_CONFIG.firebase.apiKey,authDomain:window.SECURE_CONFIG.firebase.authDomain,projectId:window.SECURE_CONFIG.firebase.projectId,storageBucket:window.SECURE_CONFIG.firebase.storageBucket,messagingSenderId:window.SECURE_CONFIG.firebase.messagingSenderId,appId:window.SECURE_CONFIG.firebase.appId,measurementId:window.SECURE_CONFIG.firebase.measurementId}):(null===(c=window.runtimeConfig)||void 0===c?void 0:null===(o=c.firebase)||void 0===o?void 0:o.apiKey)&&(console.log("Using Firebase config from runtimeConfig"),s={apiKey:window.runtimeConfig.firebase.apiKey||"",authDomain:window.runtimeConfig.firebase.authDomain||"",projectId:window.runtimeConfig.firebase.projectId||"",storageBucket:window.runtimeConfig.firebase.storageBucket||"",messagingSenderId:window.runtimeConfig.firebase.messagingSenderId||"",appId:window.runtimeConfig.firebase.appId||"",measurementId:window.runtimeConfig.firebase.measurementId}),console.log("Firebase initialization with projectId:",s.projectId||"unknown"),s.projectId)try{n=(0,a.Wp)(s),console.log("Firebase initialized successfully")}catch(e){console.error("Error initializing Firebase:",e)}else console.warn("Missing Firebase config, not initializing Firebase")}return n&&(l=(0,s.xI)(n),d=(0,r.aU)(n)),{app:n,auth:l,firestore:d}})();function m(){var e;return(null===(e=window.runtimeConfig)||void 0===e?void 0:e.basePath)?window.runtimeConfig.basePath:"/personalsite"}Promise.resolve()},3721:(e,t,o)=>{"use strict";o.d(t,{Yj:()=>u,Dv:()=>b,Bd:()=>S});var a=o(7876),s=o(4232);let r=JSON.parse('{"common":{"title":"Personal Website","navigation":{"home":"Home","blog":"Blog","books":"Books","cv":"CV","contact":"Contact"},"buttons":{"readMore":"Read More","submit":"Submit","cancel":"Cancel","save":"Save","delete":"Delete","edit":"Edit","back":"Back","next":"Next"},"footer":{"copyright":"\xa9 2023 All Rights Reserved","privacyPolicy":"Privacy Policy","termsOfService":"Terms of Service"}},"home":{"welcome":"Welcome to my website","intro":"I\'m a software developer passionate about creating beautiful and functional web applications","latestPosts":"Latest Posts","featuredProjects":"Featured Projects"},"blog":{"title":"Blog","readTime":"{{time}} min read","publishedOn":"Published on {{date}}","categories":"Categories","tags":"Tags","relatedPosts":"Related Posts","comments":"Comments","noComments":"No comments yet","leaveComment":"Leave a comment"},"books":{"title":"My Book Collection","totalBooks":"Total Books: {{count}}","status":{"read":"Read","reading":"Currently Reading","toRead":"To Read"},"bookDetails":{"author":"Author","isbn":"ISBN","publishedDate":"Published","pages":"Pages","genre":"Genre","rating":"Rating"},"stats":{"total":"Total Books","read":"Books Read","reading":"Currently Reading","toRead":"To Read"}},"cv":{"title":"Curriculum Vitae","sections":{"education":"Education","experience":"Professional Experience","skills":"Skills","projects":"Projects","certifications":"Certifications","languages":"Languages"},"download":"Download PDF"},"contact":{"title":"Contact Me","form":{"name":"Name","email":"Email","subject":"Subject","message":"Message","submit":"Send Message"},"success":"Your message has been sent successfully!","error":"There was an error sending your message. Please try again.","required":"This field is required","invalidEmail":"Please enter a valid email address"},"admin":{"login":{"title":"Admin Login","email":"Email","password":"Password","submit":"Login","error":"Invalid email or password","forgotPassword":"Forgot Password?"},"dashboard":{"title":"Admin Dashboard","welcome":"Welcome back","stats":"Website Statistics","manageContent":"Manage Content"},"books":{"addBook":"Add Book","editBook":"Edit Book","deleteBook":"Delete Book","confirmDelete":"Are you sure you want to delete this book?","form":{"title":"Title","author":"Author","isbn":"ISBN","publishedDate":"Published Date","pages":"Pages","genre":"Genre","status":"Status","rating":"Rating","coverImage":"Cover Image URL","description":"Description"}}},"errors":{"404":{"title":"Page Not Found","message":"The page you are looking for does not exist","backToHome":"Back to Home"},"500":{"title":"Server Error","message":"Something went wrong on our end","tryAgain":"Please try again"}}}'),i=JSON.parse('{"common":{"title":"[ES] Personal Website","navigation":{"home":"[ES] Home","blog":"[ES] Blog","books":"[ES] Books","cv":"[ES] CV","contact":"[ES] Contact"},"buttons":{"readMore":"[ES] Read More","submit":"[ES] Submit","cancel":"[ES] Cancel","save":"[ES] Save","delete":"[ES] Delete","edit":"[ES] Edit","back":"[ES] Back","next":"[ES] Next"},"footer":{"copyright":"[ES] \xa9 2023 All Rights Reserved","privacyPolicy":"[ES] Privacy Policy","termsOfService":"[ES] Terms of Service"}},"home":{"welcome":"[ES] Welcome to my website","intro":"[ES] I\'m a software developer passionate about creating beautiful and functional web applications","latestPosts":"[ES] Latest Posts","featuredProjects":"[ES] Featured Projects"},"blog":{"title":"[ES] Blog","readTime":"[ES] {{time}} min read","publishedOn":"[ES] Published on {{date}}","categories":"[ES] Categories","tags":"[ES] Tags","relatedPosts":"[ES] Related Posts","comments":"[ES] Comments","noComments":"[ES] No comments yet","leaveComment":"[ES] Leave a comment"},"books":{"title":"[ES] My Book Collection","totalBooks":"[ES] Total Books: {{count}}","status":{"read":"[ES] Read","reading":"[ES] Currently Reading","toRead":"[ES] To Read"},"bookDetails":{"author":"[ES] Author","isbn":"[ES] ISBN","publishedDate":"[ES] Published","pages":"[ES] Pages","genre":"[ES] Genre","rating":"[ES] Rating"},"stats":{"total":"[ES] Total Books","read":"[ES] Books Read","reading":"[ES] Currently Reading","toRead":"[ES] To Read"}},"cv":{"title":"[ES] Curriculum Vitae","sections":{"education":"[ES] Education","experience":"[ES] Professional Experience","skills":"[ES] Skills","projects":"[ES] Projects","certifications":"[ES] Certifications","languages":"[ES] Languages"},"download":"[ES] Download PDF"},"contact":{"title":"[ES] Contact Me","form":{"name":"[ES] Name","email":"[ES] Email","subject":"[ES] Subject","message":"[ES] Message","submit":"[ES] Send Message"},"success":"[ES] Your message has been sent successfully!","error":"[ES] There was an error sending your message. Please try again.","required":"[ES] This field is required","invalidEmail":"[ES] Please enter a valid email address"},"admin":{"login":{"title":"[ES] Admin Login","email":"[ES] Email","password":"[ES] Password","submit":"[ES] Login","error":"[ES] Invalid email or password","forgotPassword":"[ES] Forgot Password?"},"dashboard":{"title":"[ES] Admin Dashboard","welcome":"[ES] Welcome back","stats":"[ES] Website Statistics","manageContent":"[ES] Manage Content"},"books":{"addBook":"[ES] Add Book","editBook":"[ES] Edit Book","deleteBook":"[ES] Delete Book","confirmDelete":"[ES] Are you sure you want to delete this book?","form":{"title":"[ES] Title","author":"[ES] Author","isbn":"[ES] ISBN","publishedDate":"[ES] Published Date","pages":"[ES] Pages","genre":"[ES] Genre","status":"[ES] Status","rating":"[ES] Rating","coverImage":"[ES] Cover Image URL","description":"[ES] Description"}}},"errors":{"404":{"title":"[ES] Page Not Found","message":"[ES] The page you are looking for does not exist","backToHome":"[ES] Back to Home"},"500":{"title":"[ES] Server Error","message":"[ES] Something went wrong on our end","tryAgain":"[ES] Please try again"}}}'),n=JSON.parse('{"common":{"title":"[DE] Personal Website","navigation":{"home":"[DE] Home","blog":"[DE] Blog","books":"[DE] Books","cv":"[DE] CV","contact":"[DE] Contact"},"buttons":{"readMore":"[DE] Read More","submit":"[DE] Submit","cancel":"[DE] Cancel","save":"[DE] Save","delete":"[DE] Delete","edit":"[DE] Edit","back":"[DE] Back","next":"[DE] Next"},"footer":{"copyright":"[DE] \xa9 2023 All Rights Reserved","privacyPolicy":"[DE] Privacy Policy","termsOfService":"[DE] Terms of Service"}},"home":{"welcome":"[DE] Welcome to my website","intro":"[DE] I\'m a software developer passionate about creating beautiful and functional web applications","latestPosts":"[DE] Latest Posts","featuredProjects":"[DE] Featured Projects"},"blog":{"title":"[DE] Blog","readTime":"[DE] {{time}} min read","publishedOn":"[DE] Published on {{date}}","categories":"[DE] Categories","tags":"[DE] Tags","relatedPosts":"[DE] Related Posts","comments":"[DE] Comments","noComments":"[DE] No comments yet","leaveComment":"[DE] Leave a comment"},"books":{"title":"[DE] My Book Collection","totalBooks":"[DE] Total Books: {{count}}","status":{"read":"[DE] Read","reading":"[DE] Currently Reading","toRead":"[DE] To Read"},"bookDetails":{"author":"[DE] Author","isbn":"[DE] ISBN","publishedDate":"[DE] Published","pages":"[DE] Pages","genre":"[DE] Genre","rating":"[DE] Rating"},"stats":{"total":"[DE] Total Books","read":"[DE] Books Read","reading":"[DE] Currently Reading","toRead":"[DE] To Read"}},"cv":{"title":"[DE] Curriculum Vitae","sections":{"education":"[DE] Education","experience":"[DE] Professional Experience","skills":"[DE] Skills","projects":"[DE] Projects","certifications":"[DE] Certifications","languages":"[DE] Languages"},"download":"[DE] Download PDF"},"contact":{"title":"[DE] Contact Me","form":{"name":"[DE] Name","email":"[DE] Email","subject":"[DE] Subject","message":"[DE] Message","submit":"[DE] Send Message"},"success":"[DE] Your message has been sent successfully!","error":"[DE] There was an error sending your message. Please try again.","required":"[DE] This field is required","invalidEmail":"[DE] Please enter a valid email address"},"admin":{"login":{"title":"[DE] Admin Login","email":"[DE] Email","password":"[DE] Password","submit":"[DE] Login","error":"[DE] Invalid email or password","forgotPassword":"[DE] Forgot Password?"},"dashboard":{"title":"[DE] Admin Dashboard","welcome":"[DE] Welcome back","stats":"[DE] Website Statistics","manageContent":"[DE] Manage Content"},"books":{"addBook":"[DE] Add Book","editBook":"[DE] Edit Book","deleteBook":"[DE] Delete Book","confirmDelete":"[DE] Are you sure you want to delete this book?","form":{"title":"[DE] Title","author":"[DE] Author","isbn":"[DE] ISBN","publishedDate":"[DE] Published Date","pages":"[DE] Pages","genre":"[DE] Genre","status":"[DE] Status","rating":"[DE] Rating","coverImage":"[DE] Cover Image URL","description":"[DE] Description"}}},"errors":{"404":{"title":"[DE] Page Not Found","message":"[DE] The page you are looking for does not exist","backToHome":"[DE] Back to Home"},"500":{"title":"[DE] Server Error","message":"[DE] Something went wrong on our end","tryAgain":"[DE] Please try again"}}}'),l=JSON.parse('{"common":{"title":"[JA] Personal Website","navigation":{"home":"[JA] Home","blog":"[JA] Blog","books":"[JA] Books","cv":"[JA] CV","contact":"[JA] Contact"},"buttons":{"readMore":"[JA] Read More","submit":"[JA] Submit","cancel":"[JA] Cancel","save":"[JA] Save","delete":"[JA] Delete","edit":"[JA] Edit","back":"[JA] Back","next":"[JA] Next"},"footer":{"copyright":"[JA] \xa9 2023 All Rights Reserved","privacyPolicy":"[JA] Privacy Policy","termsOfService":"[JA] Terms of Service"}},"home":{"welcome":"[JA] Welcome to my website","intro":"[JA] I\'m a software developer passionate about creating beautiful and functional web applications","latestPosts":"[JA] Latest Posts","featuredProjects":"[JA] Featured Projects"},"blog":{"title":"[JA] Blog","readTime":"[JA] {{time}} min read","publishedOn":"[JA] Published on {{date}}","categories":"[JA] Categories","tags":"[JA] Tags","relatedPosts":"[JA] Related Posts","comments":"[JA] Comments","noComments":"[JA] No comments yet","leaveComment":"[JA] Leave a comment"},"books":{"title":"[JA] My Book Collection","totalBooks":"[JA] Total Books: {{count}}","status":{"read":"[JA] Read","reading":"[JA] Currently Reading","toRead":"[JA] To Read"},"bookDetails":{"author":"[JA] Author","isbn":"[JA] ISBN","publishedDate":"[JA] Published","pages":"[JA] Pages","genre":"[JA] Genre","rating":"[JA] Rating"},"stats":{"total":"[JA] Total Books","read":"[JA] Books Read","reading":"[JA] Currently Reading","toRead":"[JA] To Read"}},"cv":{"title":"[JA] Curriculum Vitae","sections":{"education":"[JA] Education","experience":"[JA] Professional Experience","skills":"[JA] Skills","projects":"[JA] Projects","certifications":"[JA] Certifications","languages":"[JA] Languages"},"download":"[JA] Download PDF"},"contact":{"title":"[JA] Contact Me","form":{"name":"[JA] Name","email":"[JA] Email","subject":"[JA] Subject","message":"[JA] Message","submit":"[JA] Send Message"},"success":"[JA] Your message has been sent successfully!","error":"[JA] There was an error sending your message. Please try again.","required":"[JA] This field is required","invalidEmail":"[JA] Please enter a valid email address"},"admin":{"login":{"title":"[JA] Admin Login","email":"[JA] Email","password":"[JA] Password","submit":"[JA] Login","error":"[JA] Invalid email or password","forgotPassword":"[JA] Forgot Password?"},"dashboard":{"title":"[JA] Admin Dashboard","welcome":"[JA] Welcome back","stats":"[JA] Website Statistics","manageContent":"[JA] Manage Content"},"books":{"addBook":"[JA] Add Book","editBook":"[JA] Edit Book","deleteBook":"[JA] Delete Book","confirmDelete":"[JA] Are you sure you want to delete this book?","form":{"title":"[JA] Title","author":"[JA] Author","isbn":"[JA] ISBN","publishedDate":"[JA] Published Date","pages":"[JA] Pages","genre":"[JA] Genre","status":"[JA] Status","rating":"[JA] Rating","coverImage":"[JA] Cover Image URL","description":"[JA] Description"}}},"errors":{"404":{"title":"[JA] Page Not Found","message":"[JA] The page you are looking for does not exist","backToHome":"[JA] Back to Home"},"500":{"title":"[JA] Server Error","message":"[JA] Something went wrong on our end","tryAgain":"[JA] Please try again"}}}'),d=JSON.parse('{"common":{"title":"[UK] Personal Website","navigation":{"home":"[UK] Home","blog":"[UK] Blog","books":"[UK] Books","cv":"[UK] CV","contact":"[UK] Contact"},"buttons":{"readMore":"[UK] Read More","submit":"[UK] Submit","cancel":"[UK] Cancel","save":"[UK] Save","delete":"[UK] Delete","edit":"[UK] Edit","back":"[UK] Back","next":"[UK] Next"},"footer":{"copyright":"[UK] \xa9 2023 All Rights Reserved","privacyPolicy":"[UK] Privacy Policy","termsOfService":"[UK] Terms of Service"}},"home":{"welcome":"[UK] Welcome to my website","intro":"[UK] I\'m a software developer passionate about creating beautiful and functional web applications","latestPosts":"[UK] Latest Posts","featuredProjects":"[UK] Featured Projects"},"blog":{"title":"[UK] Blog","readTime":"[UK] {{time}} min read","publishedOn":"[UK] Published on {{date}}","categories":"[UK] Categories","tags":"[UK] Tags","relatedPosts":"[UK] Related Posts","comments":"[UK] Comments","noComments":"[UK] No comments yet","leaveComment":"[UK] Leave a comment"},"books":{"title":"[UK] My Book Collection","totalBooks":"[UK] Total Books: {{count}}","status":{"read":"[UK] Read","reading":"[UK] Currently Reading","toRead":"[UK] To Read"},"bookDetails":{"author":"[UK] Author","isbn":"[UK] ISBN","publishedDate":"[UK] Published","pages":"[UK] Pages","genre":"[UK] Genre","rating":"[UK] Rating"},"stats":{"total":"[UK] Total Books","read":"[UK] Books Read","reading":"[UK] Currently Reading","toRead":"[UK] To Read"}},"cv":{"title":"[UK] Curriculum Vitae","sections":{"education":"[UK] Education","experience":"[UK] Professional Experience","skills":"[UK] Skills","projects":"[UK] Projects","certifications":"[UK] Certifications","languages":"[UK] Languages"},"download":"[UK] Download PDF"},"contact":{"title":"[UK] Contact Me","form":{"name":"[UK] Name","email":"[UK] Email","subject":"[UK] Subject","message":"[UK] Message","submit":"[UK] Send Message"},"success":"[UK] Your message has been sent successfully!","error":"[UK] There was an error sending your message. Please try again.","required":"[UK] This field is required","invalidEmail":"[UK] Please enter a valid email address"},"admin":{"login":{"title":"[UK] Admin Login","email":"[UK] Email","password":"[UK] Password","submit":"[UK] Login","error":"[UK] Invalid email or password","forgotPassword":"[UK] Forgot Password?"},"dashboard":{"title":"[UK] Admin Dashboard","welcome":"[UK] Welcome back","stats":"[UK] Website Statistics","manageContent":"[UK] Manage Content"},"books":{"addBook":"[UK] Add Book","editBook":"[UK] Edit Book","deleteBook":"[UK] Delete Book","confirmDelete":"[UK] Are you sure you want to delete this book?","form":{"title":"[UK] Title","author":"[UK] Author","isbn":"[UK] ISBN","publishedDate":"[UK] Published Date","pages":"[UK] Pages","genre":"[UK] Genre","status":"[UK] Status","rating":"[UK] Rating","coverImage":"[UK] Cover Image URL","description":"[UK] Description"}}},"errors":{"404":{"title":"[UK] Page Not Found","message":"[UK] The page you are looking for does not exist","backToHome":"[UK] Back to Home"},"500":{"title":"[UK] Server Error","message":"[UK] Something went wrong on our end","tryAgain":"[UK] Please try again"}}}'),c={en:"English",es:"Espa\xf1ol",de:"Deutsch",ja:"日本語",uk:"Українська"},u=c,g={en:r,es:i,de:n,ja:l,uk:d},m=(0,s.createContext)({t:e=>e,language:"en",changeLanguage:()=>{},setLanguage:()=>{},languages:c}),E=()=>{let e=localStorage.getItem("language");if(e&&g[e])return e;let t=navigator.language.split("-")[0];return g[t]?t:"en"},b=e=>{let{children:t}=e,[o,r]=(0,s.useState)("en");(0,s.useEffect)(()=>{r(E())},[]);let i=e=>{g[e]&&(r(e),localStorage.setItem("language",e))};return(0,a.jsx)(m.Provider,{value:{t:(e,t,a)=>{var s,r;let i=(null===(s=g[o])||void 0===s?void 0:s[e])||(null===(r=g.en)||void 0===r?void 0:r[e]);i||(i="string"==typeof t?t:e);let n="object"==typeof t?t:a;return n&&Object.entries(n).forEach(e=>{let[t,o]=e;i=i.replace(RegExp("{{".concat(t,"}}"),"g"),o)}),i},language:o,changeLanguage:i,setLanguage:i,languages:c},children:t})},S=()=>(0,s.useContext)(m)},4529:(e,t,o)=>{"use strict";o.r(t),o.d(t,{default:()=>n});var a=o(7876),s=o(9448),r=o(3721);function i(e){let{children:t}=e;return(0,a.jsx)(s.OJ,{children:(0,a.jsx)(r.Dv,{children:t})})}function n(e){let{Component:t,pageProps:o}=e;return(0,a.jsx)(i,{children:(0,a.jsx)(t,{...o})})}o(6048)},6048:()=>{},7964:(e,t,o)=>{"use strict";o.d(t,{CN:()=>r,Jp:()=>s});var a=o(5364);let s="/personalsite",r={apiKey:"AIzaSyD4a8iaxHP9xPGV5tR5LwvzDVa5Y9o5wGQ",authDomain:"personalsite-19189.firebaseapp.com",projectId:"personalsite-19189",storageBucket:"personalsite-19189.firebasestorage.app",messagingSenderId:"892517360036",appId:"1:892517360036:web:36dda234d9f3f79562e131",measurementId:""};a.env.NEXT_PUBLIC_CONTACT_EMAIL},9448:(e,t,o)=>{"use strict";o.d(t,{OJ:()=>g,As:()=>u});var a=o(7876),s=o(4232),r=o(9834),i=o(3611);async function n(e,t){try{if(!i.j2)throw Error("Firebase Auth is not initialized");return await (0,r.x9)(i.j2,e,t)}catch(e){throw console.error("API: Authentication error:",e),e}}async function l(){try{if(!i.j2){console.warn("Firebase Auth is not initialized, no need to sign out");return}return await (0,r.CI)(i.j2)}catch(e){throw console.error("API: Sign out error:",e),e}}async function d(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];try{if(!i.j2)return console.warn("Firebase Auth is not initialized"),null;let t=i.j2.currentUser;if(!t)return null;return await (0,r.p9)(t,e)}catch(e){return console.error("API: Error getting token:",e),null}}let c=(0,s.createContext)({user:null,loading:!0,isAuthenticated:!1,authError:null,signIn:async()=>{},signOut:async()=>{},refreshToken:async()=>null,resetAuthError:()=>{},recheckAuthState:async()=>!1});function u(){return(0,s.useContext)(c)}function g(e){let{children:t}=e,[o,u]=(0,s.useState)(null),[g,m]=(0,s.useState)(!0),[E,b]=(0,s.useState)(!1),[S,h]=(0,s.useState)(null),f=(0,s.useRef)(Date.now()),D=(0,s.useRef)(null),p=(0,s.useRef)(null),A=(0,s.useCallback)(()=>{f.current=Date.now()},[]),w=(0,s.useCallback)(()=>{Date.now()-f.current>36e5&&E&&(console.log("Session timeout due to inactivity"),y())},[E]),k=(0,s.useCallback)(async()=>{if(!o)return null;try{return A(),await d(!0)}catch(e){return console.error("Failed to refresh token:",e),null}},[o,A]);(0,s.useEffect)(()=>{let e=["mousedown","mousemove","keypress","scroll","touchstart"];return e.forEach(e=>{window.addEventListener(e,A)}),E&&(D.current=setInterval(k,6e5),p.current=setInterval(w,6e4)),()=>{e.forEach(e=>{window.removeEventListener(e,A)}),D.current&&clearInterval(D.current),p.current&&clearInterval(p.current)}},[E,k,A,w]),(0,s.useEffect)(()=>{if(!i.j2)return console.warn("Firebase Auth not initialized"),m(!1),()=>{};let e=(0,r.hg)(i.j2,e=>{u(e),b(!!e),m(!1),e&&A()});return()=>e()},[A]);let v=async()=>{if(o)try{return!!await k()}catch(e){console.error("Auth state check failed:",e)}return!1},P=async function(e,t){arguments.length>2&&void 0!==arguments[2]&&arguments[2];try{m(!0),h(null);let o=await n(e,t);u(o.user),b(!0),A(),sessionStorage.setItem("auth_success","true"),sessionStorage.setItem("auth_timestamp",new Date().toISOString())}catch(e){throw console.error("Authentication error:",e),h(e instanceof Error?e:Error("Authentication failed")),e}finally{m(!1)}},y=async()=>{try{m(!0),D.current&&(clearInterval(D.current),D.current=null),p.current&&(clearInterval(p.current),p.current=null),await l(),u(null),b(!1),sessionStorage.removeItem("auth_success"),sessionStorage.removeItem("auth_timestamp")}catch(e){console.error("Sign out error:",e),h(e instanceof Error?e:Error("Sign out failed"))}finally{m(!1)}};return(0,a.jsx)(c.Provider,{value:{user:o,loading:g,isAuthenticated:E,authError:S,signIn:P,signOut:y,refreshToken:k,resetAuthError:()=>{h(null)},recheckAuthState:v},children:t})}}},e=>{var t=t=>e(e.s=t);e.O(0,[593,299,137,789,792],()=>(t(92),t(8253))),_N_E=e.O()}]);