import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path,root),'utf8');
const worker = await import('data:text/javascript;base64,'+Buffer.from(read('worker.js')+'\nexport {hasAbusiveContent};').toString('base64'));
globalThis.crypto ??= webcrypto;
function store() {
 const data = new Map(); let alarm = null;
 const storage = {
  async get(k){return structuredClone(data.get(k));},
  async put(k,v){data.set(k,structuredClone(v));},
  async delete(k){for(const key of Array.isArray(k)?k:[k])data.delete(key);},
  async list({prefix='',limit=Infinity,startAfter=''}){return new Map([...data].filter(([k])=>k.startsWith(prefix)&&k>startAfter).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]));},
  async getAlarm(){return alarm;}, async setAlarm(t){alarm=t;}
 };
 let queue=Promise.resolve();
 const state={storage,blockConcurrencyWhile(fn){const p=queue.then(fn);queue=p.catch(()=>{});return p;}};
 const instance=new worker.ReviewsStore(state);
 return {instance,data,storage};
}
function request(path='',body={},ip='a',method='POST'){
 return new Request('https://site.test/api/reviews'+path,{method,headers:{'Content-Type':'application/json','X-Stat-Client':ip},...(method==='GET'?{}:{body:JSON.stringify(body)})});
}
async function review(instance){const r=await instance.fetch(request('',{name:'Reader',rating:5,review:'Helpful'}));assert.equal(r.status,201);return (await r.json()).review;}
test('legitimate names/words pass; standalone and spaced abuse blocked',()=>{
 for(const s of ['The branding is excellent','Brandi','Scunthorpe','This is a helpful archive'])assert.equal(worker.hasAbusiveContent(s),false,s);
 for(const s of ['randi','r a n d i','asshole','a s s h o l e'])assert.equal(worker.hasAbusiveContent(s),true,s);
});
test('malformed encoded route returns 400',async()=>{assert.equal((await store().instance.fetch(request('/%ZZ'))).status,400);});
test('reply throttle serializes simultaneous requests',async()=>{
 const {instance}=store();const item=await review(instance);
 const responses=await Promise.all([1,2].map(i=>instance.fetch(request('/'+item.id+'/reply',{name:'Reader',reply:'Reply '+i}))));
 assert.deepEqual(responses.map(r=>r.status),[201,429]);
});
test('50 replies preserved and overflow explicitly rejected',async()=>{
 const {instance,data}=store();const item=await review(instance);
 for(let i=0;i<50;i++)assert.equal((await instance.fetch(request('/'+item.id+'/reply',{name:'Reader',reply:'Reply '+i},'ip'+i))).status,201);
 assert.equal((await instance.fetch(request('/'+item.id+'/reply',{name:'Reader',reply:'Overflow'},'other'))).status,409);
 const saved=[...data.values()].find(v=>v?.id===item.id);assert.equal(saved.replies.length,50);assert.equal(saved.replies[0].reply,'Reply 0');
});
test('alarm removes expired legacy and reply throttle keys; keeps recent keys',async()=>{
 const {instance,storage,data}=store();await storage.put('throttle:old',Date.now()-130000);await storage.put('throttle:reply:recent',Date.now());
 await instance.alarm();assert.equal(data.has('throttle:old'),false);assert.equal(data.has('throttle:reply:recent'),true);assert.ok(await storage.getAlarm());
});
test('review validation and duplicate rate limiting remain active',async()=>{
 const {instance}=store();assert.equal((await instance.fetch(request('',{name:'Reader',rating:9}))).status,400);
 await review(instance);assert.equal((await instance.fetch(request('',{name:'Reader',rating:5}))).status,429);
});
test('legacy APK route redirects to canonical Android repository',async()=>{
 const res=await worker.default.fetch(new Request('https://site.test/downloads/stat-archive.apk'),{});
 assert.equal(res.status,302);assert.match(res.headers.get('location'),/statarchive-android/);assert.equal(res.headers.get('cache-control'),'no-store');
});
test('Notes subtitle preserves initial s and strips whitespace/delimiters',()=>{
 const source=read('assets/js/archive-ui.js');const expression=source.match(/const notesPrefix = (.*);/)[1];
 const context={notesBaseTitle:'Statistics — Notes',escapeRegExp:x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')};
 const regex=vm.runInNewContext(expression,context);
 assert.equal('Statistics — Notes - Chapter 1'.replace(regex,'').trim(),'Chapter 1');
 assert.equal('Statistics — Notes:statistics'.replace(regex,'').trim(),'statistics');
});
test('Full crop includes image edges; rotated default remains inset',()=>{
 const fn=read('assets/js/scanner.js').match(/function resetCrop\(draw\)\{[^\n]+/)[0];
 const context={state:{editor:{edit:{}}},position(){}};vm.runInNewContext(fn+';resetCrop(true)',context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.state.editor.edit.crop)),{x:0,y:0,w:1,h:1});
 vm.runInNewContext('resetCrop(false)',context);assert.equal(context.state.editor.edit.crop.x,.02);
});
test('all PDF document loads explicitly disable evaluation',()=>{
 const source=read('assets/js/preview.js');assert.equal((source.match(/getDocument\(/g)||[]).length,1);assert.match(source,/getDocument\(\{[\s\S]*?isEvalSupported:\s*false/);
});
function swHarness(fail='') {
 const handlers={}, maps=new Map();let offline=false,activated=false;
 const origin='https://site.test/';
 const key=x=>new URL(typeof x==='string'?x:x.url,origin).href;
 const caches={async keys(){return [...maps.keys()];},async delete(k){return maps.delete(k);},async open(name){if(!maps.has(name))maps.set(name,new Map());const m=maps.get(name);return {async match(req){return m.get(key(req))?.clone();},async put(req,res){m.set(key(req),res.clone());}};}};
 const context={URL,Request,Response,caches,console,self:{location:{href:origin,origin:origin.slice(0,-1)},addEventListener:(e,fn)=>handlers[e]=fn,async skipWaiting(){activated=true;},clients:{async claim(){}}},fetch:async req=>{if(offline||key(req).includes(fail)&&fail)throw Error('offline');return new Response(key(req).endsWith('index.html')||key(req)===origin?'<html><head></head><body></body></html>':'content');}};
 vm.runInNewContext(read('sw.js'),context);
 return {maps,get activated(){return activated;},offline(){offline=true;},async install(){let p;handlers.install({waitUntil(v){p=v;}});return p;},async fetch(path,navigate=false){let p;const req=new Request(new URL(path,origin));if(navigate)Object.defineProperty(req,'mode',{value:'navigate'});handlers.fetch({request:req,respondWith(v){p=v;},waitUntil(v){v.catch(()=>{});}});return p;}};
}
test('fresh precache serves versioned launch, scripts, scanner and PDF engine offline',async()=>{
 const sw=swHarness();await sw.install();sw.offline();
 for(const path of ['/launch.html?v=20260915-approved-v3','/assets/js/offline.js?v=anything','/assets/js/scanner.js','/assets/js/native-bridge.js?v=1','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'])assert.equal((await sw.fetch(path,path.includes('launch'))).status,200,path);
});
test('critical shell or external dependency failure prevents takeover',async()=>{
 for(const fail of ['core.js','pdf.worker.min.js']){const sw=swHarness(fail);await assert.rejects(sw.install());assert.equal(sw.activated,false);}
});
test('unrecognized query parameters are not silently ignored',async()=>{
 const sw=swHarness();await sw.install();sw.offline();assert.equal((await sw.fetch('/assets/js/offline.js?other=1')).status,0);
});
test('new native bridge waits for confirmed save and propagates cancellation',async()=>{
 const sent=[];const window={StatArchiveNative:{postMessage(m){sent.push(JSON.parse(m));}}};window.top=window;
 const context={window,Map,Promise,Date,JSON,Error,setTimeout,clearTimeout};vm.runInNewContext(read('assets/js/native-bridge.js'),context);
 assert.equal(window.AndroidBridge.getSavedPasscode,undefined);
 let resolved=false;const p=window.AndroidStreamBridge.finishBlobTransfer().then(()=>{resolved=true;});await Promise.resolve();assert.equal(resolved,false);
 window.StatArchiveNative.onmessage({data:JSON.stringify({id:sent[0].id,value:true})});await p;assert.equal(resolved,true);
 const cancel=window.AndroidStreamBridge.finishBlobTransfer();window.StatArchiveNative.onmessage({data:JSON.stringify({id:sent[1].id,error:'Save cancelled.'})});await assert.rejects(cancel,/cancelled/);
});
test('native adapter is not installed inside child frames',()=>{
 const window={top:{},StatArchiveNative:{postMessage(){throw Error('must not send');}}};vm.runInNewContext(read('assets/js/native-bridge.js'),{window});assert.equal(window.AndroidBridge,undefined);
});
function downloadHarness(bridge) {
 const source=read('assets/js/download-progress-canonical.js');
 const save=source.slice(source.indexOf('  async function saveAndroid('),source.indexOf('  function saveBrowser('));
 const transfer=source.slice(source.indexOf('  async function transfer('),source.indexOf('  window.statArchiveCanonicalDownload'));
 const results={marked:0,activity:0,status:[]};
 const context={window:{AndroidStreamBridge:bridge,incrementActivity(){results.activity++;}},hasStreamBridge:()=>true,isAndroid:()=>true,blobToBase64:async()=> 'YQ==',filenameOf:()=> 'file.pdf',markComplete(){results.marked++;},showStatus:(...args)=>results.status.push(args),console:{error(){}},Error};
 vm.runInNewContext(save+transfer+';this.run=transfer;',context);
 return {results,run:()=>context.run({_offlineBlob:new Blob(['a'],{type:'application/pdf'})})};
}
test('canonical download does not mark/count before native save acknowledgement',async()=>{
 let finish;const gate=new Promise(r=>finish=r);
 const h=downloadHarness({protocolVersion:2,beginBlobTransfer:async()=>true,appendBlobChunk:async()=>true,finishBlobTransfer:()=>gate});
 const result=h.run();await new Promise(r=>setImmediate(r));assert.equal(h.results.marked,0);assert.equal(h.results.activity,0);
 finish(true);assert.equal(await result,true);assert.equal(h.results.marked,1);assert.equal(h.results.activity,1);
});
test('cancelled native save never marks or increments downloads',async()=>{
 const h=downloadHarness({protocolVersion:2,beginBlobTransfer:async()=>true,appendBlobChunk:async()=>true,finishBlobTransfer:async()=>{throw Error('Save cancelled.');},cancelBlobTransfer:async()=>true});
 assert.equal(await h.run(),false);assert.equal(h.results.marked,0);assert.equal(h.results.activity,0);
});
test('legacy picker acknowledgement is not counted as completed saving',async()=>{
 const h=downloadHarness({beginBlobTransfer:()=>true,appendBlobChunk:()=>true,finishBlobTransfer:()=>true});
 assert.equal(await h.run(),false);assert.equal(h.results.marked,0);assert.equal(h.results.activity,0);
});
test('failed stream chunk aborts transfer without opening picker',async()=>{
 let cancelled=false,finished=false;
 const h=downloadHarness({protocolVersion:2,beginBlobTransfer:async()=>true,appendBlobChunk:async()=>false,finishBlobTransfer:async()=>{finished=true;},cancelBlobTransfer:async()=>{cancelled=true;}});
 assert.equal(await h.run(),false);assert.equal(cancelled,true);assert.equal(finished,false);assert.equal(h.results.marked,0);
});
