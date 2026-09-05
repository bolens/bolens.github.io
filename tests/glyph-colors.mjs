import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {startUI} from './lib/ui-fixture.mjs';
import {evaluate,hoverElement,finishFiniteAnimations} from './lib/browser-test.mjs';
const sprite=readFileSync(new URL('../assets/trail-glyphs.svg',import.meta.url),'utf8');
test('every UI symbol contains both base and accent artwork',()=>{
  const symbols=[...sprite.matchAll(/<symbol id="(glyph-[^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g)];
  assert.ok(symbols.length>0);
  for(const [,name,body] of symbols) {
    assert.match(body,/\bglyph-(primary|secondary)\b/,name);
    assert.match(body,/\bglyph-(accent|warm|cool)\b/,name);
  }
});
const ui=await startUI();const {send}=ui;
const inspect=`(()=>{const failures=[];const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]};const nodes=[...document.querySelectorAll('svg:has(>use[href*="#glyph-"])')];for(const svg of nodes){const probe=document.createElementNS('http://www.w3.org/2000/svg','path');svg.append(probe);const colors=['primary','secondary','accent','warm','cool'].map(role=>{probe.style.stroke='var(--glyph-'+role+')';return getComputedStyle(probe).stroke});probe.remove();let surface=svg.parentElement;while(surface&&rgba(getComputedStyle(surface).backgroundColor)[3]!==255)surface=surface.parentElement;const background=surface&&rgba(getComputedStyle(surface).backgroundColor).join();const invisible=background&&colors.some(color=>rgba(color).join()===background);if(invisible||new Set(colors).size!==2||colors[0]!==colors[1]||colors[2]!==colors[3]||colors[2]!==colors[4])failures.push({glyph:svg.querySelector('use').getAttribute('href'),placement:svg.parentElement.className,colors,background})}return {count:nodes.length,failures}})()`;
try {
  for(const route of ['/','/about/','/work/','/case-studies/uddns/','/case-studies/privacy-devices/','/case-studies/aur-response-toolkit/','/case-studies/launch-layer/','/case-studies/millennium-helpers/']) {
    await test(`${route} keeps two glyph colors across every palette in day and night`,async()=>{
      await ui.load(route);
      const palettes=await evaluate(send,'Object.keys(portfolioThemeData.palettes)');
      for(const mode of ['day','night'])for(const palette of palettes){
        await evaluate(send,`portfolioAppearance.setTheme('${mode}');portfolioAppearance.setPalette('${palette}');portfolioAppearance.setMotion('reduced')`);
        const result=await evaluate(send,inspect);
        assert.ok(result.count>0);assert.deepEqual(result.failures,[],JSON.stringify({route,mode,palette}));
      }
    });
  }
  for(const [route,selectors] of [['/',['.button','.nav-cta','.project-link']],['/about/',['.about-field-notes dl div','.availability .button']],['/work/',['.work-reset','.index-list a']]]) {
    await test(`${route} interactive glyphs stay two-colored on hover and keyboard focus`,async()=>{
      for(const mode of ['day','night']) {
        await ui.load(route);await evaluate(send,`portfolioAppearance.setTheme('${mode}')`);
        for(const selector of selectors){
          await hoverElement(send,selector);await finishFiniteAnimations(send,'html');
          assert.deepEqual((await evaluate(send,inspect)).failures,[],`${selector} hover ${mode}`);
          if(selector.includes('button')||selector.includes('cta')||selector.includes('reset')||selector.includes(' a')){
            await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await ui.key('Tab','Tab');
            await evaluate(send,`document.querySelector(${JSON.stringify(selector)}).focus({preventScroll:true})`);await finishFiniteAnimations(send,'html');
            assert.deepEqual((await evaluate(send,inspect)).failures,[],`${selector} focus ${mode}`);
          }
        }
        await ui.open();await hoverElement(send,'.command-palette .overlay-close');await finishFiniteAnimations(send,'.command-palette .overlay-close');
        assert.deepEqual((await evaluate(send,inspect)).failures,[],`close button ${mode}`);
        await ui.closeCommands();
      }
    });
  }
  assert.deepEqual(ui.errors,[]);
}finally{await ui.close()}
