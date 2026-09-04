import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluate, navigate } from './lib/browser-test.mjs';
import { startUI } from './lib/ui-fixture.mjs';

const scripts = ['theme-data', 'appearance-controller', 'ui-overlay', 'appearance-picker', 'command-palette'].map((name) => readFileSync(new URL(`../assets/${name}.js`, import.meta.url), 'utf8')).join('\n');
const ui = await startUI();
const { send } = ui;
async function mount(body, projects = []) {
  await navigate(send, 'data:text/html,<!doctype html><html><head><title>Command fixture</title></head><body></body></html>');
  await evaluate(send, `document.body.innerHTML=${JSON.stringify(body)};window.portfolioProjects=${JSON.stringify(projects)};${scripts}`);
}
try {
  await test('optional contact commands appear only when matching links exist', async () => {
    await mount('<main tabindex="-1"></main>');
    let names = await ui.open();
    assert.equal(names.includes('Email Michael'), false);
    assert.equal(names.includes('Download résumé'), false);
    await mount('<main tabindex="-1"><a href="mailto:portfolio@example.test">Email</a><a href="https://example.test/resume.pdf">Résumé</a></main>');
    names = await ui.open();
    assert.equal(names.includes('Email Michael'), true);
    assert.equal(names.includes('Download résumé'), true);
    await ui.closeCommands();
  });
  await test('project labels and descriptions render as text even when they contain HTML syntax', async () => {
    const label = 'Fish & <chips> "project"';
    const detail = '<img src=x onerror="window.injected=true">';
    await mount('<main tabindex="-1"></main>', [{ name: label, caseLabel: label, commandDetail: detail, slug: 'fish', repository: 'https://example.test/repo' }]);
    await ui.open('@ fish');
    const state = await evaluate(send, `({labels:[...document.querySelectorAll('.command-results b')].map(node=>node.textContent),details:[...document.querySelectorAll('.command-results small')].map(node=>node.textContent),unsafe:document.querySelectorAll('.command-results img,.command-results script,.command-results chips').length,highlighted:[...document.querySelector('.command-results b').querySelectorAll('mark')].map(node=>node.textContent).join('')})`);
    assert.ok(state.labels.includes(label));
    assert.ok(state.details.includes(detail));
    assert.equal(state.unsafe, 0);
    assert.equal(state.highlighted, 'Fish');
    await ui.closeCommands();
  });
  await test('project-site commands are optional and external destinations are announced', async () => {
    await mount('<main tabindex="-1"></main>', [
      { name: 'One', caseLabel: 'One case study', commandDetail: 'First', slug: 'one', repository: 'https://example.test/one', site: 'https://example.test/docs' },
      { name: 'Two', caseLabel: 'Two case study', commandDetail: 'Second', slug: 'two', repository: 'https://example.test/two' },
    ]);
    const names = await ui.open();
    assert.equal(names.includes('One project site'), true);
    assert.equal(names.includes('Two project site'), false);
    const accessibility = await evaluate(send, `Object.fromEntries([...document.querySelectorAll('.command-results [role="option"]')].filter(node=>['One repository','One case study'].includes(node.querySelector('b').textContent)).map(node=>[node.querySelector('b').textContent,node.textContent.includes('opens an external site')]))`);
    assert.deepEqual(accessibility, { 'One case study': false, 'One repository': true });
    await ui.closeCommands();
  });
  assert.deepEqual(ui.errors, []);
} finally { await ui.close(); }
