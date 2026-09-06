import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const captures = mkdtempSync(join(tmpdir(), '404-ground-detail-'));
let browser;
try {
  browser = await startBrowser();
  const { send } = browser;
  await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate(send, server.origin+'/404.html');
  await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'ground ready');
  const track = await evaluate(send, `(()=>{
    const symbol=document.querySelector('#bigfoot-track'),placement=document.querySelector('#forest-trail use[href="#bigfoot-track"]');
    const bed=document.querySelector('#trail-bed-outline'),vb=symbol.viewBox.baseVal;
    const w=placement.width.baseVal.value,h=placement.height.baseVal.value,s=Math.min(w/vb.width,h/vb.height);
    const matrix=placement.transform.baseVal.consolidate().matrix;
    const shapes=[symbol.querySelector('[data-region="sole-impression"]'),...symbol.querySelectorAll('[data-region="toe-impressions"] ellipse')];
    const outside=[];
    for(const shape of shapes)for(let i=0;i<32;i++){
      const p=shape.getPointAtLength(shape.getTotalLength()*i/32);
      const local=shape.transform.baseVal.consolidate();if(local){const q=p.matrixTransform(local.matrix);p.x=q.x;p.y=q.y;}
      const point=new DOMPoint(placement.x.baseVal.value+(w-vb.width*s)/2+p.x*s,placement.y.baseVal.value+(h-vb.height*s)/2+p.y*s).matrixTransform(matrix);
      if(!bed.isPointInFill(point))outside.push([point.x,point.y]);
    }
    return {toes:shapes.length-1,outside,instances:document.querySelectorAll('use[href="#bigfoot-track"]').length};
  })()`);
  assert.equal(track.toes,5,'five distinct toe impressions');
  assert.equal(track.instances,1,'one discoverable track, not a repeated pattern');
  assert.deepEqual(track.outside,[],'the complete sole and all toes fit inside the trail before clipping');
  await evaluate(send, `portfolioWeather.setLocationCondition('clear');const proof=document.createElement('div');proof.id='ground-proof';proof.style.cssText='position:fixed;left:0;top:0;width:360px;height:230px;background:white;z-index:1000';document.body.append(proof)`);
  for (const [id, viewBox, conditions] of [['forest-trail','0 0 700 430',['wet','snow','drought']],['pine-needle-mat','0 0 94 32',['wet','snow']],['gravel-patch','0 0 104 34',['wet','snow','drought']],['bigfoot-track','0 0 52 96',['wet','snow','drought']]]) {
    const [,,w,h] = viewBox.split(' ').map(Number);
    await evaluate(send, `document.querySelector('#ground-proof').innerHTML='<svg width="350" height="220" viewBox="${viewBox}"><use class="terrain-asset" data-detail="rich" href="#${id}" width="${w}" height="${h}"/></svg>'`);
    const paint = async (name, detail='rich', condition='none') => {
      await evaluate(send, `(()=>{const use=document.querySelector('#ground-proof use');use.dataset.detail='${detail}';for(const name of ['wet','snow','drought'])use.style.setProperty('--asset-'+name+'-opacity',name==='${condition}'?'1':'0')})()`);
      await finishFiniteAnimations(send, '#ground-proof');
      const shot = await send('Page.captureScreenshot', {format:'png',clip:{x:0,y:0,width:350,height:220,scale:1}});
      writeFileSync(join(captures,id+'-'+name+'.png'),Buffer.from(shot.data,'base64'));
      return evaluate(send, `new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=350;c.height=220;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,350,220).data;let hash=2166136261;for(const value of pixels)hash=Math.imul(hash^value,16777619);resolve(hash)};img.onerror=reject;img.src='data:image/png;base64,${shot.data}'})`, {awaitPromise:true});
    };
    const plain = await paint('simple','simple');
    const rich = await paint('rich');
    assert.notEqual(rich,plain,id+' detail tiers change rendered instances');
    for (const condition of conditions) assert.notEqual(await paint(condition,'rich',condition),rich,id+' '+condition+' deposits change rendered instances');
  }
  await evaluate(send, `document.querySelector('#ground-proof').remove()`);
  for (const width of [1440,390]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:false});
    for (const condition of ['clear','rainy','snowy','drought']) {
      await evaluate(send, `portfolioWeather.setLocationCondition('${condition}')`);
      await finishFiniteAnimations(send,'.cryptid-camp');
      const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
      writeFileSync(join(captures,width+'-'+condition+'.png'),Buffer.from(shot.data,'base64'));
    }
  }
  console.log('Ground captures: '+captures);
} finally { await browser?.close(); await server.close(); }
