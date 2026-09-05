import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../404.html", import.meta.url), "utf8");
const symbolPattern = /<symbol\s+id="([^"]+)"([^>]*)>([\s\S]*?)<\/symbol>/g;
const symbols = [...html.matchAll(symbolPattern)].map(([, id, attributes, body]) => ({
  id,
  attributes,
  body,
}));

const regionNamePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

test("every reusable landscape symbol publishes stable named regions", () => {
  assert.equal(symbols.length, 65, "expected the complete reusable 404 asset library");

  for (const { id, attributes } of symbols) {
    const manifest = attributes.match(/\bdata-regions="([^"]+)"/)?.[1];
    assert.ok(manifest, `${id} must declare data-regions`);

    const regions = manifest.split(",");
    assert.ok(regions.length >= 2, `${id} should expose more than one named region`);
    assert.equal(new Set(regions).size, regions.length, `${id} region names must be unique`);

    for (const region of regions) {
      assert.match(region, regionNamePattern, `${id} has an invalid region name: ${region}`);
    }
  }
});

test("shared terrain conditions expose addressable weather regions", () => {
  const conditions = symbols.find(({ id }) => id === "terrain-condition-marks");
  assert.ok(conditions, "terrain-condition-marks symbol is required");

  const declared = conditions.attributes.match(/\bdata-regions="([^"]+)"/)?.[1].split(",");
  const addressable = [...conditions.body.matchAll(/\bdata-region="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(addressable, declared);
});

test("named editing regions resolve to unique elements in migrated glyphs", () => {
  for (const id of ["evergreen-shrub", "berry-shrub", "fern-spray", "wildflower-clump", "reed-clump", "camp-tent-shell", "alpine-boulder", "trail-camera"]) {
    const symbol = symbols.find(candidate => candidate.id === id);
    const declared = symbol.attributes.match(/data-regions="([^"]+)"/)[1].split(",");
    const targets = [...symbol.body.matchAll(/\bdata-region="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(targets).size, targets.length, `${id} has ambiguous editing targets`);
    assert.deepEqual([...targets].sort(), [...declared].sort(), `${id} manifest must match addressable geometry`);
    assert.match(symbol.body, /<use href="#terrain-condition-marks"[^>]*data-region="conditions"/);
  }
});

test("condition-aware assets name their shared condition region", () => {
  const conditionAwareIds = [
    "alpine-boulder", "river-stone", "fern-spray", "berry-shrub", "evergreen-shrub",
    "fire-ring-stone", "fire-bed", "moss-clump", "woodland-debris", "ground-sprig",
    "grass-tuft", "pine-needle-mat", "gravel-patch",
    "fungi-cluster", "fly-agaric", "shelf-fungi", "pinecone-sprig", "wildflower-clump",
    "fallen-branch", "reed-clump", "trail-boots", "camp-storage", "river-ripple",
    "water-foam", "firefly-pair", "coal-piece", "ash-scatter", "ember-spark",
    "camp-tent-shell", "camp-stove", "toasted-marshmallow", "camp-snack-plate",
    "scout-ufo", "sleeping-roll", "camp-lantern",
    "trail-camera", "camp-windhound", "tent-camper", "river-current",
    "riverbank-profile", "exposed-root", "river-pebble-cluster",
    "forest-trail", "bare-tree", "aspen-copse", "willow-clump", "tree-stump",
  ];

  for (const id of conditionAwareIds) {
    const symbol = symbols.find((candidate) => candidate.id === id);
    assert.ok(symbol, `${id} symbol is required`);
    assert.match(symbol.attributes, /\bdata-regions="[^"]*\bconditions\b[^"]*"/);
    assert.match(symbol.body, /<use\s+href="#terrain-condition-marks"/);
  }
});
