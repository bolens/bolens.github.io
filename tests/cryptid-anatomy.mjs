import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const html = readFileSync(resolve(import.meta.dirname, '..', '404.html'), 'utf8');

test('the grey alien keeps a lanky readable silhouette', () => {
  const alien = html.match(/<g class="camper alien scene-layer"[\s\S]*?<g class="roasting-arm arm-alien">/)?.[0] ?? '';
  assert.match(alien, /data-anatomy="lanky-grey"/);
  assert.match(alien, /class="alien-torso" data-region="narrow-torso"/);
  assert.match(alien, /class="alien-limbs" data-region="long-slender-limbs"/);
  assert.equal([...alien.matchAll(/class="alien-eye"/g)].length, 2);
  assert.equal([...alien.matchAll(/<g class="alien-limbs"[^>]*><path/g)].length, 1);
  assert.equal([...alien.matchAll(/<path d="m(?:509|487|482|503) /g)].length, 4);
});

test('cryptid facial landmarks remain visible above their supporting planes', () => {
  const moth = html.slice(html.indexOf('<g class="camper mothman scene-layer"'), html.indexOf('<g class="camper dogman scene-layer"'));
  assert.ok(moth.indexOf('data-region="red-eye-discs"') > moth.indexOf('data-region="recessed-facial-disc"'));
  assert.equal([...moth.matchAll(/class="moth-wing wing-/g)].length, 2);
  const dog = html.slice(html.indexOf('<g class="camper dogman scene-layer"'));
  assert.ok(dog.indexOf('data-region="projecting-canine-muzzle"') > dog.indexOf('data-region="canine-face-planes"'));
  for (const region of ['broad-shoulder-mantle', 'crested-skull', 'left-almond-eye', 'right-almond-eye', 'vestigial-nose-and-mouth']) {
    assert.ok(html.includes(`data-region="${region}"`), `${region} must remain independently addressable`);
  }
});
