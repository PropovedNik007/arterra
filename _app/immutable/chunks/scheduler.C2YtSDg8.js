function A(){}const rt=t=>t;function P(t,e){for(const n in e)t[n]=e[n];return t}function q(t){return t()}function st(){return Object.create(null)}function H(t){t.forEach(q)}function L(t){return typeof t=="function"}function lt(t,e){return t!=t?e==e:t!==e||t&&typeof t=="object"||typeof t=="function"}let m;function ot(t,e){return t===e?!0:(m||(m=document.createElement("a")),m.href=e,t===m.href)}function ut(t){return Object.keys(t).length===0}function B(t,...e){if(t==null){for(const c of e)c(void 0);return A}const n=t.subscribe(...e);return n.unsubscribe?()=>n.unsubscribe():n}function at(t,e,n){t.$$.on_destroy.push(B(e,n))}function ft(t,e,n,c){if(t){const i=C(t,e,n,c);return t[0](i)}}function C(t,e,n,c){return t[1]&&c?P(n.ctx.slice(),t[1](c(e))):n.ctx}function _t(t,e,n,c){if(t[2]&&c){const i=t[2](c(n));if(e.dirty===void 0)return i;if(typeof i=="object"){const o=[],r=Math.max(e.dirty.length,i.length);for(let l=0;l<r;l+=1)o[l]=e.dirty[l]|i[l];return o}return e.dirty|i}return e.dirty}function dt(t,e,n,c,i,o){if(i){const r=C(e,n,c,o);t.p(r,i)}}function ht(t){if(t.ctx.length>32){const e=[],n=t.ctx.length/32;for(let c=0;c<n;c++)e[c]=-1;return e}return-1}function mt(t){const e={};for(const n in t)n[0]!=="$"&&(e[n]=t[n]);return e}function pt(t,e){const n={};e=new Set(e);for(const c in t)!e.has(c)&&c[0]!=="$"&&(n[c]=t[c]);return n}function yt(t){const e={};for(const n in t)e[n]=!0;return e}function bt(t){return t&&L(t.destroy)?t.destroy:A}const M=["",!0,1,"true","contenteditable"];let y=!1;function gt(){y=!0}function xt(){y=!1}function R(t,e,n,c){for(;t<e;){const i=t+(e-t>>1);n(i)<=c?t=i+1:e=i}return t}function z(t){if(t.hydrate_init)return;t.hydrate_init=!0;let e=t.childNodes;if(t.nodeName==="HEAD"){const s=[];for(let u=0;u<e.length;u++){const a=e[u];a.claim_order!==void 0&&s.push(a)}e=s}const n=new Int32Array(e.length+1),c=new Int32Array(e.length);n[0]=-1;let i=0;for(let s=0;s<e.length;s++){const u=e[s].claim_order,a=(i>0&&e[n[i]].claim_order<=u?i+1:R(1,i,T=>e[n[T]].claim_order,u))-1;c[s]=n[a]+1;const k=a+1;n[k]=s,i=Math.max(k,i)}const o=[],r=[];let l=e.length-1;for(let s=n[i]+1;s!=0;s=c[s-1]){for(o.push(e[s-1]);l>=s;l--)r.push(e[l]);l--}for(;l>=0;l--)r.push(e[l]);o.reverse(),r.sort((s,u)=>s.claim_order-u.claim_order);for(let s=0,u=0;s<r.length;s++){for(;u<o.length&&r[s].claim_order>=o[u].claim_order;)u++;const a=u<o.length?o[u]:null;t.insertBefore(r[s],a)}}function F(t,e){t.appendChild(e)}function I(t){if(!t)return document;const e=t.getRootNode?t.getRootNode():t.ownerDocument;return e&&e.host?e:t.ownerDocument}function wt(t){const e=j("style");return e.textContent="/* empty */",U(I(t),e),e.sheet}function U(t,e){return F(t.head||t,e),e.sheet}function W(t,e){if(y){for(z(t),(t.actual_end_child===void 0||t.actual_end_child!==null&&t.actual_end_child.parentNode!==t)&&(t.actual_end_child=t.firstChild);t.actual_end_child!==null&&t.actual_end_child.claim_order===void 0;)t.actual_end_child=t.actual_end_child.nextSibling;e!==t.actual_end_child?(e.claim_order!==void 0||e.parentNode!==t)&&t.insertBefore(e,t.actual_end_child):t.actual_end_child=e.nextSibling}else(e.parentNode!==t||e.nextSibling!==null)&&t.appendChild(e)}function vt(t,e,n){y&&!n?W(t,e):(e.parentNode!==t||e.nextSibling!=n)&&t.insertBefore(e,n||null)}function Et(t){t.parentNode&&t.parentNode.removeChild(t)}function kt(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function j(t){return document.createElement(t)}function G(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function v(t){return document.createTextNode(t)}function Nt(){return v(" ")}function At(){return v("")}function Ct(t,e,n,c){return t.addEventListener(e,n,c),()=>t.removeEventListener(e,n,c)}function E(t,e,n){n==null?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}const J=["width","height"];function K(t,e){const n=Object.getOwnPropertyDescriptors(t.__proto__);for(const c in e)e[c]==null?t.removeAttribute(c):c==="style"?t.style.cssText=e[c]:c==="__value"?t.value=t[c]=e[c]:n[c]&&n[c].set&&J.indexOf(c)===-1?t[c]=e[c]:E(t,c,e[c])}function jt(t,e){for(const n in e)E(t,n,e[n])}function Q(t,e){Object.keys(e).forEach(n=>{V(t,n,e[n])})}function V(t,e,n){const c=e.toLowerCase();c in t?t[c]=typeof t[c]=="boolean"&&n===""?!0:n:e in t?t[e]=typeof t[e]=="boolean"&&n===""?!0:n:E(t,e,n)}function Dt(t){return/-/.test(t)?Q:K}function Ot(t){return t.dataset.svelteH}function St(t){return Array.from(t.childNodes)}function X(t){t.claim_info===void 0&&(t.claim_info={last_index:0,total_claimed:0})}function D(t,e,n,c,i=!1){X(t);const o=(()=>{for(let r=t.claim_info.last_index;r<t.length;r++){const l=t[r];if(e(l)){const s=n(l);return s===void 0?t.splice(r,1):t[r]=s,i||(t.claim_info.last_index=r),l}}for(let r=t.claim_info.last_index-1;r>=0;r--){const l=t[r];if(e(l)){const s=n(l);return s===void 0?t.splice(r,1):t[r]=s,i?s===void 0&&t.claim_info.last_index--:t.claim_info.last_index=r,l}}return c()})();return o.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1,o}function O(t,e,n,c){return D(t,i=>i.nodeName===e,i=>{const o=[];for(let r=0;r<i.attributes.length;r++){const l=i.attributes[r];n[l.name]||o.push(l.name)}o.forEach(r=>i.removeAttribute(r))},()=>c(e))}function Tt(t,e,n){return O(t,e,n,j)}function Pt(t,e,n){return O(t,e,n,G)}function Y(t,e){return D(t,n=>n.nodeType===3,n=>{const c=""+e;if(n.data.startsWith(c)){if(n.data.length!==c.length)return n.splitText(c.length)}else n.data=c},()=>v(e),!0)}function qt(t){return Y(t," ")}function Z(t,e){e=""+e,t.data!==e&&(t.data=e)}function $(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function Ht(t,e,n){~M.indexOf(n)?$(t,e):Z(t,e)}function Lt(t,e,n,c){n==null?t.style.removeProperty(e):t.style.setProperty(e,n,"")}function Bt(t,e,n){t.classList.toggle(e,!!n)}function tt(t,e,{bubbles:n=!1,cancelable:c=!1}={}){return new CustomEvent(t,{detail:e,bubbles:n,cancelable:c})}function Mt(t,e){const n=[];let c=0;for(const i of e.childNodes)if(i.nodeType===8){const o=i.textContent.trim();o===`HEAD_${t}_END`?(c-=1,n.push(i)):o===`HEAD_${t}_START`&&(c+=1,n.push(i))}else c>0&&n.push(i);return n}function Rt(t,e){return new t(e)}let p;function b(t){p=t}function d(){if(!p)throw new Error("Function called outside component initialization");return p}function zt(t){d().$$.on_mount.push(t)}function Ft(t){d().$$.after_update.push(t)}function It(t){d().$$.on_destroy.push(t)}function Ut(){const t=d();return(e,n,{cancelable:c=!1}={})=>{const i=t.$$.callbacks[e];if(i){const o=tt(e,n,{cancelable:c});return i.slice().forEach(r=>{r.call(t,o)}),!o.defaultPrevented}return!0}}function Wt(t,e){return d().$$.context.set(t,e),e}function Gt(t){return d().$$.context.get(t)}function Jt(t,e){const n=t.$$.callbacks[e.type];n&&n.slice().forEach(c=>c.call(this,e))}const h=[],N=[];let _=[];const x=[],S=Promise.resolve();let w=!1;function et(){w||(w=!0,S.then(ct))}function Kt(){return et(),S}function nt(t){_.push(t)}function Qt(t){x.push(t)}const g=new Set;let f=0;function ct(){if(f!==0)return;const t=p;do{try{for(;f<h.length;){const e=h[f];f++,b(e),it(e.$$)}}catch(e){throw h.length=0,f=0,e}for(b(null),h.length=0,f=0;N.length;)N.pop()();for(let e=0;e<_.length;e+=1){const n=_[e];g.has(n)||(g.add(n),n())}_.length=0}while(h.length);for(;x.length;)x.pop()();w=!1,g.clear(),b(t)}function it(t){if(t.fragment!==null){t.update(),H(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(nt)}}function Vt(t){const e=[],n=[];_.forEach(c=>t.indexOf(c)===-1?e.push(c):n.push(c)),n.forEach(c=>c()),_=e}export{Gt as $,P as A,K as B,dt as C,ht as D,_t as E,pt as F,mt as G,yt as H,G as I,Pt as J,I as K,wt as L,H as M,L as N,nt as O,tt as P,st as Q,ct as R,ut as S,Vt as T,p as U,b as V,q as W,h as X,et as Y,gt as Z,xt as _,Nt as a,Jt as a0,jt as a1,Ct as a2,Wt as a3,Ut as a4,Dt as a5,bt as a6,ot as a7,kt as a8,Bt as a9,Ht as aa,It as ab,Qt as ac,St as b,Tt as c,Y as d,j as e,Et as f,qt as g,W as h,vt as i,Z as j,at as k,rt as l,At as m,A as n,Ft as o,zt as p,E as q,Lt as r,lt as s,v as t,N as u,Rt as v,Kt as w,Mt as x,Ot as y,ft as z};