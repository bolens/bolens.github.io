import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluate } from './lib/browser-test.mjs';
import { startUI } from './lib/ui-fixture.mjs';

const source = readFileSync(new URL('../assets/trail-glyphs.js', import.meta.url), 'utf8');
const ui = await startUI();
const { send } = ui;
const enhance = (html, result) => evaluate(send, `(()=>{document.body.innerHTML=${JSON.stringify(html)};${source}\nreturn (${result})})()`);
try {
  await ui.load();
  const labels = [
    ['Selected work', 'trailhead'], ['Project index', 'trailhead'], ['Working set', 'compass'],
    ['Approach', 'compass'], ['Currently', 'clock'], ['Field notes', 'journal'],
    ['Get in touch', 'radio'], ['Follow the work', 'repository'], ['Off the clock', 'owl'],
    ['Observe', 'binoculars'], ['Restrain', 'cairn'], ['Recover', 'shelter'],
    ['About Michael', 'backpack'], ['Linux systems builder', 'pine'],
  ];
  await test('known section labels gain the expected decorative glyph without changing their text', async () => {
    const state = await enhance(labels.map(([label]) => `<p class="eyebrow">${label}</p>`).join(''), `[...document.querySelectorAll('.eyebrow')].map(node=>({text:node.textContent,href:node.querySelector('use').getAttribute('href'),hidden:node.querySelector('svg').getAttribute('aria-hidden'),focusable:node.querySelector('svg').getAttribute('focusable')}))`);
    assert.deepEqual(state, labels.map(([text, name]) => ({ text, href: `/assets/trail-glyphs.svg#glyph-${name}`, hidden: 'true', focusable: 'false' })));
  });
  await test('chapter identity takes precedence over label text', async () => {
    const ids = ['condition', 'cause', 'correction', 'confirm'];
    const state = await enhance(ids.map((id) => `<section id="${id}"><p class="eyebrow">About</p></section>`).join(''), `[...document.querySelectorAll('use')].map(node=>node.getAttribute('href'))`);
    assert.deepEqual(state, ['binoculars', 'map', 'switchback', 'summit'].map((name) => `/assets/trail-glyphs.svg#glyph-${name}`));
  });
  await test('case categories map to domain glyphs and unknown categories get the generic trailhead', async () => {
    const categories = ['Infrastructure', 'Security', 'Desktop', 'Gaming', 'Steam', 'Other'];
    const state = await enhance(categories.map((label) => `<header class="case-intro"><p class="eyebrow">${label}</p></header>`).join(''), `[...document.querySelectorAll('use')].map(node=>node.getAttribute('href'))`);
    assert.deepEqual(state, ['globe', 'shield', 'microphone', 'command', 'wrench', 'trailhead'].map((name) => `/assets/trail-glyphs.svg#glyph-${name}`));
  });
  await test('existing glyphs, status markers, and unrecognized labels are preserved', async () => {
    const state = await enhance('<p class="eyebrow"><svg class="trail-glyph" id="existing"></svg>About</p><p class="eyebrow"><span class="status-dot"></span>Currently</p><p class="eyebrow">Unrecognized label</p>', `[...document.querySelectorAll('.eyebrow')].map(node=>({text:node.textContent,svg:node.querySelectorAll('svg').length,status:!!node.querySelector('.status-dot')}))`);
    assert.deepEqual(state, [{ text: 'About', svg: 1, status: false }, { text: 'Currently', svg: 0, status: true }, { text: 'Unrecognized label', svg: 0, status: false }]);
    assert.equal(await evaluate(send, `document.querySelector('#existing')!==null`), true);
  });
  await test('decorative direction markers become matching arrows while ordinary text stays intact', async () => {
    const arrows = ['→', '↗', '↑', '↖', '←', '↙', '↓', '↘'];
    const state = await enhance(arrows.map((arrow) => `<span aria-hidden="true">${arrow}</span>`).join('')+'<span aria-hidden="true" id="literal">Keep me</span><span id="accessible">→</span>', `[...document.querySelectorAll('.trail-arrow use')].map(node=>node.getAttribute('href'))`);
    assert.deepEqual(state, ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'].map((name) => `/assets/trail-glyphs.svg#glyph-arrow-${name}`));
    assert.deepEqual(await evaluate(send, `[document.querySelector('#literal').textContent,document.querySelector('#accessible').textContent]`), ['Keep me', '→']);
  });
  await test('unknown facts and extra field notes retain their text without invented glyphs', async () => {
    const state = await enhance('<dl class="case-facts"><dt>Role</dt><dt>Coverage</dt><dt>Unknown</dt></dl><div class="about-field-notes"><dl><dt>One</dt><dt>Two</dt><dt>Three</dt><dt>Four</dt></dl></div>', `[...document.querySelectorAll('dt')].map(node=>({text:node.textContent,href:node.querySelector('use')?.getAttribute('href')??null}))`);
    assert.deepEqual(state, [['Role','role'],['Coverage','layers'],['Unknown',null],['One','pine'],['Two','compass'],['Three','fire'],['Four',null]].map(([text,name])=>({text,href:name?`/assets/trail-glyphs.svg#glyph-${name}`:null})));
  });
  assert.deepEqual(ui.errors, []);
} finally { await ui.close(); }
