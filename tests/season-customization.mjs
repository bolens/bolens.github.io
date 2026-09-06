import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { startSiteServer } from './lib/site-server.mjs';
import { evaluate, navigate, waitFor, finishFiniteAnimations } from './lib/browser-test.mjs';

const artifactDir = mkdtempSync(join(tmpdir(), '404-seasons-'));
console.log('Season captures: ' + artifactDir);
const server = await startSiteServer(new URL('..', import.meta.url).pathname);
const errors = [];
let browser;
try {
  browser = await startBrowser(message => {
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  });
  const { send } = browser;
  await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const key = async key => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key });
  };
  const capture = async name => {
    const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    writeFileSync(join(artifactDir, name + '.png'), Buffer.from(shot.data, 'base64'));
  };
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await navigate(send, server.origin + '/404.html');
    await waitFor(send, `document.querySelector('.hybrid-effects-ready')&&!document.documentElement.classList.contains('is-loading')`, 'season scene ready');
    assert.equal(await evaluate(send, `document.querySelectorAll('input[name="portfolio-scene-season"]').length`), 5);
    assert.equal(await evaluate(send, `document.querySelectorAll('input[name="portfolio-moon-phase"]:not(:disabled)').length`), 9);
    await evaluate(send, `portfolioAppearance.setTheme('day');portfolioSceneTime.setTime('day');portfolioWeather.setLocationCondition('clear');portfolioWeather.setEnvironment({temperatureC:18,fireflyHabitat:false});portfolioAppearancePicker.open();document.querySelector('input[name="portfolio-scene-season"][value="default"]').focus()`);
    for (const season of ['spring', 'summer', 'autumn', 'winter', 'default']) {
      await key('ArrowRight');
      assert.deepEqual(await evaluate(send, `({season:portfolioWeather.environment.season,temperature:portfolioWeather.environment.temperatureC,habitat:portfolioWeather.environment.fireflyHabitat,weather:portfolioWeather.condition,time:portfolioSceneTime.time,checked:document.querySelector('input[name="portfolio-scene-season"]:checked').value})`), {
        season: season === 'default' ? null : season, temperature: 18, habitat: false, weather: 'clear', time: 'day', checked: season,
      });
    }
    await evaluate(send, `document.querySelector('input[name="portfolio-moon-phase"][value="automatic"]').focus()`);
    for (const phase of [0, .125, .25, .375, .5, .625, .75, .875]) {
      await key('ArrowRight');
      assert.equal(await evaluate(send, `portfolioSceneTime.state.moonPhase`), phase);
      assert.equal(await evaluate(send, `portfolioSceneTime.state.moonSource`), 'override');
    }
    await key('ArrowRight');
    assert.equal(await evaluate(send, `portfolioSceneTime.state.moonSource`), 'fixed');
    await evaluate(send, `portfolioSceneTime.setMoonPhase(.3);portfolioWeather.setEnvironment({season:'autumn',temperatureC:18,fireflyHabitat:true})`);
    assert.deepEqual(await evaluate(send, `({custom:document.querySelector('input[name="portfolio-moon-phase"]:checked').value,disabled:document.querySelector('input[name="portfolio-moon-phase"]:checked').disabled,season:document.querySelector('input[name="portfolio-scene-season"]:checked').value})`), { custom: 'custom', disabled: true, season: 'autumn' });
    await evaluate(send, `document.querySelector('input[name="portfolio-scene-season"][value="default"]').click()`);
    assert.equal(await evaluate(send, `portfolioSceneTime.state.moonPhase`), .3);
    await evaluate(send, `portfolioWeather.setEnvironment({season:'winter'});document.querySelector('input[name="portfolio-moon-phase"][value="automatic"]').click()`);
    assert.equal(await evaluate(send, `portfolioWeather.environment.season`), 'winter');
    await evaluate(send, `document.querySelector('input[name="portfolio-moon-phase"][value="0.875"]').focus()`);
    const control = await evaluate(send, `(()=>{const el=document.activeElement,b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,label:el.closest('label').textContent.trim(),legend:el.closest('fieldset').querySelector('legend').textContent,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
    assert.ok(control.top >= 0 && control.bottom <= height && control.left >= 0 && control.right <= width);
    assert.match(control.label, /Waning crescent/); assert.match(control.legend, /moon/i); assert.equal(control.overflow, false);
    await capture('controls-' + width);
    await evaluate(send, `portfolioAppearancePicker.close();portfolioWeather.setEnvironment(null)`);
    await finishFiniteAnimations(send, '.cryptid-camp');
    // Paint actual <use> copies. Computed styles on hidden symbol definitions
    // alone cannot detect selectors that fail inside SVG instance trees.
    await evaluate(send, `(()=>{const proof=document.createElement('div');proof.id='season-paint-proof';proof.style.cssText='position:fixed;left:0;top:0;width:160px;height:200px;background:white;z-index:1000';proof.innerHTML='<svg width="150" height="190" viewBox="0 0 150 190"><use href="#aspen-copse" width="150" height="190"/></svg>';document.body.append(proof)})()`);
    const paints = {};
    for (const season of ['summer', 'autumn', 'winter']) {
      await evaluate(send, `portfolioWeather.setEnvironment({season:'${season}'})`);
      await finishFiniteAnimations(send, '#season-paint-proof');
      const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 150, height: 115, scale: 1 } });
      paints[season] = await evaluate(send, `new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=150;canvas.height=115;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const d=ctx.getImageData(0,0,150,115).data;let ink=0,gold=0,green=0;for(let i=0;i<d.length;i+=4){if(Math.min(d[i],d[i+1],d[i+2])<220)ink++;if(d[i]>d[i+1]+12&&d[i+1]>d[i+2]+12)gold++;if(d[i+1]>d[i]+12)green++;}resolve({ink,gold,green})};image.onerror=reject;image.src='data:image/png;base64,${shot.data}'})`, { awaitPromise: true });
    }
    assert.ok(paints.winter.ink < paints.summer.ink * .65, JSON.stringify(paints));
    assert.ok(paints.autumn.gold > paints.summer.gold + 500, JSON.stringify(paints));
    assert.ok(paints.summer.green > paints.autumn.green + 500, JSON.stringify(paints));
    await evaluate(send, `document.querySelector('#season-paint-proof').remove()`);
    const matrix = [];
    const catalog = await evaluate(send, '({seasons:[null,...portfolioWeather.seasons],conditions:portfolioWeather.conditions})');
    // Bound each style flush independently instead of blocking one browser
    // command on all 55 full-scene changes under concurrent test load.
    for (const season of catalog.seasons) for (const condition of catalog.conditions) {
      matrix.push(await evaluate(send, `(()=>{
        const season=${JSON.stringify(season)},condition=${JSON.stringify(condition)};
        portfolioWeather.setEnvironment({season});portfolioWeather.setLocationCondition(condition);
        const style=s=>getComputedStyle(document.querySelector(s));
        const leaves=['#aspen-copse [data-region="leaf-clusters"]','#aspen-copse [data-region="leaf-shadow"]','#aspen-copse [data-region="leaf-highlights"]','#aspen-copse [data-region="leaf-speckles"]','#aspen-copse [data-region="leaf-veins"]','#willow-clump [data-region="willow-leaves"]','#willow-clump [data-region="leaf-shadow"]','#willow-clump [data-region="leaf-veins"]','#berry-shrub [data-region="leaf-mass"]','#berry-shrub [data-region="leaf-highlights"]','#berry-shrub [data-region="leaf-veins"]','#berry-shrub [data-region="wet-leaf-edges"]'];
        return {season,condition,dom:document.documentElement.dataset.sceneSeason,hidden:leaves.map(s=>style(s).display==='none'),trunk:style('#aspen-copse [data-region="tapered-trunks"]').display,branches:style('#berry-shrub [data-region="shrub-branches"]').display,petals:style('#wildflower-clump [data-region="petals"]').display,stalks:style('#wildflower-clump [data-region="flower-stalks"]').display};
      })()`));
    }
    assert.equal(matrix.length, 55);
    for (const row of matrix) {
      assert.equal(row.dom, row.season || 'default');
      assert.ok(row.hidden.every(value => value === (row.season === 'winter')), JSON.stringify(row));
      assert.notEqual(row.trunk, 'none'); assert.notEqual(row.branches, 'none'); assert.notEqual(row.stalks, 'none');
      assert.equal(row.petals === 'none', ['autumn', 'winter'].includes(row.season));
    }
    await evaluate(send, `portfolioWeather.setLocationCondition('clear');portfolioSceneTime.setTime('day')`);
    let anchors;
    const colors = [];
    for (const season of [null, 'spring', 'summer', 'autumn', 'winter']) {
      await evaluate(send, `portfolioWeather.setEnvironment({season:${JSON.stringify(season)}})`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      const state = await evaluate(send, `(()=>{const s=getComputedStyle(document.querySelector('#grass-tuft [data-region="upright-blades"]'));return {grass:s.stroke,anchors:[...document.querySelectorAll('.camp-tent,.campfire,.river-water')].map(n=>[n.getAttribute('transform'),n.getAttribute('x'),n.getAttribute('y')]),running:document.querySelector('.cryptid-camp').getAnimations({subtree:true}).filter(a=>a.playState==='running').length,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
      colors.push(state.grass);
      assert.equal(state.anchors.length, 3, 'tent, fire and river anchors are present');
      if (anchors) assert.deepEqual(state.anchors, anchors); else anchors = state.anchors;
      assert.equal(state.running, 0); assert.equal(state.overflow, false);
      await capture('scene-' + width + '-' + (season || 'default'));
    }
    assert.equal(new Set(colors).size, 5, 'default and four seasonal grass materials differ');
    const ground = await evaluate(send, `(()=>{portfolioWeather.setEnvironment({season:'winter'});portfolioSceneTime.setTime('day');const stop=document.querySelector('#forest-floor-depth stop');const day=getComputedStyle(stop).stopColor;portfolioSceneTime.setTime('night');return {day,night:getComputedStyle(stop).stopColor,opacity:getComputedStyle(stop).stopOpacity}})()`);
    assert.notEqual(ground.day, ground.night); assert.equal(ground.opacity, '1');
    for (const [season, condition, time] of [['autumn', 'rainy', 'evening'], ['winter', 'snowy', 'night'], ['spring', 'drought', 'day']]) {
      await evaluate(send, `portfolioWeather.setEnvironment({season:'${season}'});portfolioWeather.setLocationCondition('${condition}');portfolioSceneTime.setTime('${time}')`);
      await finishFiniteAnimations(send, '.cryptid-camp');
      await capture(width + '-' + season + '-' + condition + '-' + time);
    }
    await navigate(send, server.origin + '/');
    assert.equal(await evaluate(send, `document.querySelectorAll('input[name="portfolio-scene-season"],input[name="portfolio-moon-phase"]').length`), 0);
  }
  assert.deepEqual(errors, []);
} finally { await browser?.close(); await server.close(); }
