import{a as b}from"./chunk-6Y74RCRE.js";import{b as x,c as _,d as w,l as C}from"./chunk-YX2Y3P52.js";import"./chunk-2ZIUISY6.js";import{Da as g,Ta as c,Ua as n,Va as t,Wa as s,ab as f,da as p,kb as d,oa as m,pb as h,qb as M,ra as a,rb as u}from"./chunk-JW7PUQO7.js";import"./chunk-HZ6M6AS2.js";var y=class l{md=`# Welcome to Toolverse

A **modern**, _all-in-one_ utility hub.

## Features
- 50+ tools
- 100% client-side
- Free forever

\`\`\`js
console.log('Hello, world!');
\`\`\`

> "Tools that respect your privacy."

[Visit](https://example.com)
`;html=p("");constructor(){this.render()}async render(){let{marked:r}=await import("./chunk-OEDVBD46.js");this.html.set(r.parse(this.md))}static \u0275fac=function(o){return new(o||l)};static \u0275cmp=g({type:l,selectors:[["app-text-markdown"]],decls:11,vars:2,consts:[["title","Markdown Editor","subtitle","Live-preview Markdown editor with full GFM syntax support.","icon","MD","color","from-cyan-500 to-blue-600"],[1,"max-w-7xl","mx-auto","px-4","sm:px-6","lg:px-8","pb-16"],[1,"grid","lg:grid-cols-2","gap-4"],[1,"card","p-4"],[1,"text-xs","font-semibold","text-slate-500","uppercase","mb-2"],[1,"input","font-mono","text-xs","h-[600px]",3,"ngModelChange","ngModel"],[1,"prose","prose-sm","dark:prose-invert","max-w-none","h-[600px]","overflow-auto","p-3","rounded-lg","bg-slate-50","dark:bg-slate-800/40",3,"innerHTML"]],template:function(o,e){o&1&&(s(0,"app-section-header",0),n(1,"section",1)(2,"div",2)(3,"div",3)(4,"div",4),d(5,"Markdown"),t(),n(6,"textarea",5),u("ngModelChange",function(i){return M(e.md,i)||(e.md=i),i}),f("ngModelChange",function(){return e.render()}),t()(),n(7,"div",3)(8,"div",4),d(9,"Preview"),t(),s(10,"div",6),t()()()),o&2&&(a(6),h("ngModel",e.md),a(4),c("innerHTML",e.html(),m))},dependencies:[C,x,_,w,b],styles:["[_nghost-%COMP%]     .prose h1{font-size:1.6em;font-weight:700;margin:.8em 0 .4em}[_nghost-%COMP%]     .prose h2{font-size:1.3em;font-weight:700;margin:.8em 0 .4em}[_nghost-%COMP%]     .prose h3{font-size:1.1em;font-weight:600;margin:.8em 0 .4em}[_nghost-%COMP%]     .prose p{margin:.5em 0}[_nghost-%COMP%]     .prose code{background:#7f7f7f26;padding:1px 5px;border-radius:4px;font-family:monospace}[_nghost-%COMP%]     .prose pre{background:#0f172a;color:#f1f5f9;padding:12px;border-radius:8px;overflow-x:auto}[_nghost-%COMP%]     .prose pre code{background:transparent;padding:0}[_nghost-%COMP%]     .prose blockquote{border-left:3px solid #cbd5e1;padding-left:12px;color:#64748b;margin:.5em 0}[_nghost-%COMP%]     .prose ul, .prose[_ngcontent-%COMP%]   ol[_ngcontent-%COMP%]{padding-left:22px;margin:.5em 0}[_nghost-%COMP%]     .prose ul{list-style:disc}[_nghost-%COMP%]     .prose ol{list-style:decimal}[_nghost-%COMP%]     .prose a{color:#3a5cff;text-decoration:underline}[_nghost-%COMP%]     .prose table{border-collapse:collapse;width:100%;margin:.5em 0}[_nghost-%COMP%]     .prose th, .prose[_ngcontent-%COMP%]   td[_ngcontent-%COMP%]{border:1px solid #cbd5e1;padding:6px 10px}[_nghost-%COMP%]     .prose img{max-width:100%}"]})};export{y as TextMarkdown};
