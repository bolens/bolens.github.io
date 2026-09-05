import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const html = readFileSync(resolve(import.meta.dirname, '..', '404.html'), 'utf8');

test('seated Bigfoot and dogman retain distinct reported body plans', () => {
  const bigfoot = html.slice(html.indexOf('<g class="camper bigfoot scene-layer"'), html.indexOf('<g class="camper alien scene-layer"'));
  for (const region of ['trapezius-fur','long-resting-arm','low-resting-hand']) assert.match(bigfoot, new RegExp(`data-region="${region}"`));
  assert.doesNotMatch(bigfoot, /10-9 9-8 11 9/, 'crown is rounded rather than a pointed hood');
  const dog = html.slice(html.indexOf('<g class="camper dogman scene-layer"'), html.indexOf('<g class="fire-rim-light"'));
  for (const region of ['deep-chest-tucked-waist','upright-canine-ears','raised-canine-hocks']) assert.match(dog, new RegExp(`data-region="${region}"`));
  assert.ok(dog.indexOf('raised-canine-hocks') < dog.indexOf('dogman-extremities'), 'paws overlap the lower hocks');
  assert.match(bigfoot, /class="bigfoot-feet"/);
  assert.match(dog, /class="roasting-arm arm-dogman"/);
});

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
