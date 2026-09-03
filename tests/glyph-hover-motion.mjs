import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { startBrowser } from './lib/cdp-browser.mjs';
import { waitFor } from './lib/browser-test.mjs';
import { startSiteServer } from './lib/site-server.mjs';

const root = resolve(import.meta.dirname, '..');
const server = await startSiteServer(root);
const browser = await startBrowser(() => {});
const { send } = browser;
const captureEvidence = process.argv.includes('--capture-evidence');
const glyphs = {
  trailhead: null, compass: null, map: null, cairn: null,
  switchback: null, shelter: null, lantern: null, binoculars: null,
  fire: null, pine: null, summit: null, boot: 'glyph-boot-step', stars: null,
  'arrow-east': 'glyph-arrow-glide', 'arrow-north-east': 'glyph-arrow-glide', 'arrow-north': 'glyph-arrow-glide', 'arrow-north-west': 'glyph-arrow-glide',
  'arrow-west': 'glyph-arrow-glide', 'arrow-south-west': 'glyph-arrow-glide', 'arrow-south': 'glyph-arrow-glide', 'arrow-south-east': 'glyph-arrow-glide',
  waypoint: null, search: null, close: null, command: null,
  keyboard: null, palette: null, role: null, layers: null, repository: null, backpack: null,
  shield: null, terminal: null, network: null, wrench: null,
  cloud: null, database: null, lock: null, refresh: null, package: null, bug: null, monitor: null, code: null,
  mug: null, river: null, flag: null, 'first-aid': null,
  journal: null, beacon: null, 'trail-camera': null, carabiner: null,
  headlamp: null, cabin: null, 'trail-blaze': null, radio: null,
  filter: null, sort: null, clock: null, globe: null,
  microphone: null, key: null, bell: null, 'hard-drive': null,
  owl: null, trout: null, canoe: null, mushroom: null,
  marshmallow: null, 'paw-print': null, pinecone: null, snowshoe: null,
};
const internalMotions = {
  trailhead: ['--glyph-trailhead-motion', 'glyph-trailhead-sign-flip'],
  compass: ['--glyph-compass-motion', 'glyph-compass-spin'],
  fire: ['--glyph-fire-motion', 'glyph-fire-flicker'],
  binoculars: ['--glyph-binocular-motion', 'glyph-binoculars-zoom'],
  summit: ['--glyph-summit-motion', 'glyph-summit-snow'],
  switchback: ['--glyph-switchback-motion', 'glyph-switchback-trace', 960],
  cairn: ['--glyph-cairn-top-motion', 'glyph-cairn-top-stack'],
  shelter: ['--glyph-shelter-motion', 'glyph-shelter-pitch'],
  map: ['--glyph-map-left-motion', 'glyph-map-left-unfold'],
  pine: ['--glyph-pine-motion', 'glyph-pine-canopy-sway'],
  search: ['--glyph-search-motion', 'glyph-search-scan-sweep'],
  waypoint: ['--glyph-waypoint-motion', 'glyph-waypoint-center-pulse'],
  close: ['--glyph-close-motion', 'glyph-close-center-snap'],
  stars: ['--glyph-stars-motion', 'glyph-star-a-twinkle'],
  command: ['--glyph-command-motion', 'glyph-command-chevron-type'],
  keyboard: ['--glyph-keyboard-motion', 'glyph-keyboard-key-a-tap'],
  palette: ['--glyph-palette-motion', 'glyph-palette-dot-a-mix'],
  role: ['--glyph-role-motion', 'glyph-role-nod'],
  layers: ['--glyph-layers-motion', 'glyph-layers-top-settle'],
  repository: ['--glyph-repository-motion', 'glyph-repository-write'],
  backpack: ['--glyph-backpack-motion', 'glyph-backpack-pack'],
  lantern: ['--glyph-lantern-motion', 'glyph-lantern-glow'],
  shield: ['--glyph-shield-motion', 'glyph-shield-check-draw'],
  terminal: ['--glyph-terminal-motion', 'glyph-terminal-cursor-run'],
  network: ['--glyph-network-motion', 'glyph-network-link-a-draw'],
  wrench: ['--glyph-wrench-motion', 'glyph-wrench-tighten'],
  cloud: ['--glyph-cloud-motion', 'glyph-cloud-drop-a-fall'],
  database: ['--glyph-database-motion', 'glyph-database-row-a-read'],
  lock: ['--glyph-lock-motion', 'glyph-lock-release'],
  refresh: ['--glyph-refresh-motion', 'glyph-refresh-cycle'],
  package: ['--glyph-package-motion', 'glyph-package-fold-close'],
  bug: ['--glyph-bug-motion', 'glyph-bug-inspect'],
  monitor: ['--glyph-monitor-motion', 'glyph-monitor-cursor-blink'],
  code: ['--glyph-code-motion', 'glyph-code-slash-compile'],
  mug: ['--glyph-mug-motion', 'glyph-mug-steam-rise'],
  river: ['--glyph-river-motion', 'glyph-river-current-flow'],
  flag: ['--glyph-flag-motion', 'glyph-flag-wave'],
  'first-aid': ['--glyph-first-aid-motion', 'glyph-first-aid-pulse'],
  journal: ['--glyph-journal-motion', 'glyph-journal-check-draw'],
  beacon: ['--glyph-beacon-motion', 'glyph-beacon-ring-a-pulse'],
  'trail-camera': ['--glyph-trail-camera-motion', 'glyph-trail-camera-shutter'],
  carabiner: ['--glyph-carabiner-motion', 'glyph-carabiner-gate-open'],
  headlamp: ['--glyph-headlamp-motion', 'glyph-headlamp-beam-shine'],
  cabin: ['--glyph-cabin-motion', 'glyph-cabin-smoke-a-rise'],
  'trail-blaze': ['--glyph-trail-blaze-motion', 'glyph-trail-blaze-paint'],
  radio: ['--glyph-radio-motion', 'glyph-radio-note-a-float'],
  filter: ['--glyph-filter-motion', 'glyph-filter-particle-a-drop'],
  sort: ['--glyph-sort-motion', 'glyph-sort-bar-a-settle'],
  clock: ['--glyph-clock-motion', 'glyph-clock-minute-sweep'],
  globe: ['--glyph-globe-motion', 'glyph-globe-route-draw'],
  microphone: ['--glyph-microphone-motion', 'glyph-microphone-level-a-rise'],
  key: ['--glyph-key-motion', 'glyph-key-pin-set'],
  bell: ['--glyph-bell-motion', 'glyph-bell-clapper-swing'],
  'hard-drive': ['--glyph-hard-drive-motion', 'glyph-hard-drive-arm-seek'],
  owl: ['--glyph-owl-motion', 'glyph-owl-eye-a-blink'],
  trout: ['--glyph-trout-motion', 'glyph-trout-tail-flick'],
  canoe: ['--glyph-canoe-motion', 'glyph-canoe-paddle-dip'],
  mushroom: ['--glyph-mushroom-motion', 'glyph-mushroom-spore-a-float'],
  marshmallow: ['--glyph-marshmallow-motion', 'glyph-marshmallow-toast-draw'],
  'paw-print': ['--glyph-paw-print-motion', 'glyph-paw-pad-land'],
  pinecone: ['--glyph-pinecone-motion', 'glyph-pinecone-scale-a-open'],
  snowshoe: ['--glyph-snowshoe-motion', 'glyph-snowshoe-binding-tighten'],
};
const secondaryMotions = {
  cairn: [['--glyph-cairn-middle-motion', 'glyph-cairn-middle-stack'], ['--glyph-cairn-upper-motion', 'glyph-cairn-upper-stack']],
  map: [['--glyph-map-right-motion', 'glyph-map-right-unfold'], ['--glyph-map-route-motion', 'glyph-map-route-reveal']],
  layers: [['--glyph-layers-middle-motion', 'glyph-layers-middle-settle'], ['--glyph-layers-bottom-motion', 'glyph-layers-bottom-settle']],
  network: [['--glyph-network-link-b-motion', 'glyph-network-link-b-draw'], ['--glyph-network-link-c-motion', 'glyph-network-link-c-draw'], ['--glyph-network-node-a-motion', 'glyph-network-node-ping-a'], ['--glyph-network-node-b-motion', 'glyph-network-node-ping-b'], ['--glyph-network-node-c-motion', 'glyph-network-node-ping-c']],
  cloud: [['--glyph-cloud-drop-b-motion', 'glyph-cloud-drop-b-fall'], ['--glyph-cloud-drop-c-motion', 'glyph-cloud-drop-c-fall']],
  database: [['--glyph-database-row-b-motion', 'glyph-database-row-b-read']],
  code: [['--glyph-code-left-motion', 'glyph-code-left-compile'], ['--glyph-code-right-motion', 'glyph-code-right-compile']],
  stars: [['--glyph-stars-b-motion', 'glyph-star-b-twinkle'], ['--glyph-stars-c-motion', 'glyph-star-c-twinkle'], ['--glyph-stars-d-motion', 'glyph-star-d-twinkle'], ['--glyph-stars-e-motion', 'glyph-star-e-twinkle']],
  command: [['--glyph-command-cursor-motion', 'glyph-command-cursor-blink']],
  keyboard: [['--glyph-keyboard-key-b-motion', 'glyph-keyboard-key-b-tap'], ['--glyph-keyboard-space-motion', 'glyph-keyboard-space-tap']],
  palette: [['--glyph-palette-dot-b-motion', 'glyph-palette-dot-b-mix'], ['--glyph-palette-dot-c-motion', 'glyph-palette-dot-c-mix'], ['--glyph-palette-dot-d-motion', 'glyph-palette-dot-d-mix']],
  beacon: [['--glyph-beacon-ring-b-motion', 'glyph-beacon-ring-b-pulse']],
  cabin: [['--glyph-cabin-smoke-b-motion', 'glyph-cabin-smoke-b-rise']],
  'trail-camera': [['--glyph-trail-camera-flash-motion', 'glyph-trail-camera-flash-pop']],
  'trail-blaze': [['--glyph-trail-blaze-b-motion', 'glyph-trail-blaze-paint-b'], ['--glyph-trail-blaze-c-motion', 'glyph-trail-blaze-paint-c']],
  radio: [['--glyph-radio-note-b-motion', 'glyph-radio-note-b-float']],
  filter: [['--glyph-filter-particle-b-motion', 'glyph-filter-particle-b-drop']],
  sort: [['--glyph-sort-bar-b-motion', 'glyph-sort-bar-b-settle'], ['--glyph-sort-bar-c-motion', 'glyph-sort-bar-c-settle']],
  clock: [['--glyph-clock-hour-motion', 'glyph-clock-hour-nudge']],
  microphone: [['--glyph-microphone-level-b-motion', 'glyph-microphone-level-b-rise'], ['--glyph-microphone-level-c-motion', 'glyph-microphone-level-c-rise']],
  'hard-drive': [['--glyph-hard-drive-light-motion', 'glyph-hard-drive-light-blink']],
  key: [['--glyph-key-spark-motion', 'glyph-key-spark-pop']],
  bell: [['--glyph-bell-sound-a-motion', 'glyph-bell-sound-a-ring'], ['--glyph-bell-sound-b-motion', 'glyph-bell-sound-b-ring']],
  owl: [['--glyph-owl-eye-b-motion', 'glyph-owl-eye-b-blink']],
  trout: [['--glyph-trout-bubble-motion', 'glyph-trout-bubble-rise']],
  canoe: [['--glyph-canoe-ripple-motion', 'glyph-canoe-ripple-spread']],
  mushroom: [['--glyph-mushroom-spore-b-motion', 'glyph-mushroom-spore-b-float']],
  marshmallow: [['--glyph-marshmallow-spark-motion', 'glyph-marshmallow-spark-pop']],
  'paw-print': [['--glyph-paw-toe-a-motion', 'glyph-paw-toe-a-land'], ['--glyph-paw-toe-b-motion', 'glyph-paw-toe-b-land'], ['--glyph-paw-toe-c-motion', 'glyph-paw-toe-c-land'], ['--glyph-paw-toe-d-motion', 'glyph-paw-toe-d-land']],
  pinecone: [['--glyph-pinecone-scale-b-motion', 'glyph-pinecone-scale-b-open'], ['--glyph-pinecone-scale-c-motion', 'glyph-pinecone-scale-c-open']],
};
const allInternalMotions = Object.values(internalMotions).map(([property, name, duration = 680]) => [property, name, duration])
  .concat(Object.values(secondaryMotions).flat().map(([property, name]) => [property, name, 680]));
const motionDeclarations = allInternalMotions.map(([property, name, duration]) => `${property}:${name} ${duration}ms linear`).join(';');
const arrowVectors = {
  'arrow-east': [1, 0], 'arrow-north-east': [1, -1], 'arrow-north': [0, -1], 'arrow-north-west': [-1, -1],
  'arrow-west': [-1, 0], 'arrow-south-west': [-1, 1], 'arrow-south': [0, 1], 'arrow-south-east': [1, 1],
};
const sprite = await readFile(resolve(root, 'assets/trail-glyphs.svg'), 'utf8');
if (!/class="glyph-compass-housing"[\s\S]*class="glyph-accent glyph-compass-needle"/.test(sprite)) throw new Error('compass housing and needle must have independent geometry');
if (!/glyph-trailhead-post[\s\S]*glyph-trailhead-sign/.test(sprite)) throw new Error('trail sign and post must have independent geometry');
if (!/class="glyph-fire-logs"[\s\S]*class="glyph-accent glyph-fire-flame"/.test(sprite)) throw new Error('fire logs and flame must have independent geometry');
if (!/class="glyph-primary glyph-binocular-body"[\s\S]*class="glyph-binocular-lenses"/.test(sprite)) throw new Error('binocular body and lenses must have independent geometry');
if (!/class="glyph-primary glyph-summit-mountains"[\s\S]*class="glyph-cool glyph-summit-snow" pathLength="1"/.test(sprite)) throw new Error('summit terrain and snowcap must have independent geometry');
if (!/class="glyph-primary glyph-switchback-route" pathLength="1"/.test(sprite)) throw new Error('switchback route must support deterministic stroke tracing');
if (!/glyph-cairn-base[\s\S]*glyph-cairn-middle[\s\S]*glyph-cairn-upper[\s\S]*glyph-cairn-top/.test(sprite)) throw new Error('cairn stones must have independent stacking geometry');
if (!/glyph-shelter-canvas[\s\S]*glyph-shelter-stakes/.test(sprite)) throw new Error('shelter canvas and stakes must have independent geometry');
if (!/glyph-map-left[\s\S]*glyph-map-center[\s\S]*glyph-map-right[\s\S]*glyph-map-route" pathLength="1"/.test(sprite)) throw new Error('map panels and route must have independent unfolding geometry');
if (!/glyph-role-head[\s\S]*glyph-role-shoulders/.test(sprite) || !/glyph-layers-bottom[\s\S]*glyph-layers-middle[\s\S]*glyph-layers-top/.test(sprite) || !/glyph-repository-cover[\s\S]*glyph-repository-lines" pathLength="1"/.test(sprite)) throw new Error('field markers must animate internal geometry while their frames remain fixed');
if (!/glyph-backpack-body[\s\S]*glyph-backpack-flap/.test(sprite)) throw new Error('backpack body and flap must have independent geometry');
if (!/glyph-lantern-housing[\s\S]*glyph-lantern-flame[\s\S]*glyph-lantern-rays/.test(sprite)) throw new Error('lantern housing, flame, and rays must have independent geometry');
if (!/glyph-star-a[\s\S]*glyph-star-b[\s\S]*glyph-star-c[\s\S]*glyph-star-d[\s\S]*glyph-star-e/.test(sprite)) throw new Error('every star must twinkle independently while the constellation stays fixed');
if (!/glyph-waypoint-frame[\s\S]*glyph-waypoint-center/.test(sprite)) throw new Error('waypoint center must animate independently from its frame');
if (!/glyph-close-corners[\s\S]*glyph-close-center/.test(sprite)) throw new Error('close center must animate independently from its corner marks');
if (!/glyph-command-frame[\s\S]*glyph-command-chevron[\s\S]*glyph-command-cursor/.test(sprite)) throw new Error('command prompt details must animate independently from its frame');
if (!/glyph-keyboard-frame[\s\S]*glyph-keyboard-key-a[\s\S]*glyph-keyboard-key-b[\s\S]*glyph-keyboard-space/.test(sprite)) throw new Error('keyboard keys must animate independently from its frame');
if (!/glyph-palette-body[\s\S]*glyph-palette-dot-a[\s\S]*glyph-palette-dot-d/.test(sprite)) throw new Error('palette colors must animate independently from its body');
if (!/glyph-network-link-a[\s\S]*glyph-network-link-c[\s\S]*glyph-network-node-a[\s\S]*glyph-network-node-c/.test(sprite)) throw new Error('network links and nodes must connect independently');
if (!/glyph-cloud-drop-a[\s\S]*glyph-cloud-drop-b[\s\S]*glyph-cloud-drop-c/.test(sprite)) throw new Error('cloud drops must have independent falling geometry');
if (!/glyph-monitor-prompt[\s\S]*glyph-monitor-cursor/.test(sprite)) throw new Error('monitor prompt must remain fixed while its cursor blinks');
if (!/glyph-code-left[\s\S]*glyph-code-right[\s\S]*glyph-code-slash/.test(sprite)) throw new Error('code marks must compile as independent geometry');
if (!/glyph-pine-canopy[\s\S]*glyph-pine-trunk/.test(sprite)) throw new Error('pine canopy must sway independently from its trunk');
if (!/glyph-search-lens[\s\S]*glyph-search-handle[\s\S]*glyph-search-scan/.test(sprite)) throw new Error('search scan must move independently inside a fixed magnifier');
if (!/glyph-database-shell[\s\S]*glyph-database-row-a" pathLength="1"[\s\S]*glyph-database-row-b" pathLength="1"/.test(sprite)) throw new Error('database rows must read independently inside a fixed shell');
if (!/glyph-boot-body" d="[^"]*V12H7V3\.5Z/.test(sprite) || !/glyph-boot-laces[\s\S]*glyph-boot-tread/.test(sprite)) throw new Error('boot must have a closed rear contour with independent laces and tread');
if (!/@keyframes glyph-wrench-tighten\{42%\{transform:rotate\(32deg\) scale\(1\.35\)\}/.test(sprite)) throw new Error('wrench bolt must visibly turn instead of landing on a symmetric angle');
if (!/glyph-mug-body[\s\S]*glyph-mug-steam/.test(sprite)) throw new Error('mug steam must animate independently from the cup');
if (!/glyph-river-banks[\s\S]*glyph-river-current" pathLength="1"/.test(sprite)) throw new Error('river current must flow between fixed banks');
if (!/glyph-flag-pole[\s\S]*glyph-flag-cloth/.test(sprite)) throw new Error('flag cloth must wave independently from its pole');
if (!/glyph-first-aid-kit[\s\S]*glyph-first-aid-cross/.test(sprite)) throw new Error('first-aid cross must pulse independently from its kit');
if (!/glyph-journal-cover[\s\S]*glyph-journal-check" pathLength="1"/.test(sprite)) throw new Error('journal check must draw independently on its fixed cover');
if (!/glyph-beacon-base[\s\S]*glyph-beacon-ring-a[\s\S]*glyph-beacon-ring-b/.test(sprite)) throw new Error('beacon signal rings must pulse independently from its base');
if (!/glyph-trail-camera-body[\s\S]*glyph-trail-camera-shutter[\s\S]*glyph-trail-camera-flash/.test(sprite)) throw new Error('trail camera shutter and flash must animate independently from its housing');
if (!/glyph-carabiner-body[\s\S]*glyph-carabiner-gate/.test(sprite) || /glyph-carabiner-body[^>]*d="[^"]*m-7 9 7-7/.test(sprite)) throw new Error('carabiner body must leave a real gap for its animated gate');
if (!/glyph-headlamp-housing[\s\S]*glyph-headlamp-beam/.test(sprite)) throw new Error('headlamp beam must animate independently from its housing');
if (!/glyph-cabin-body[\s\S]*glyph-cabin-logs[\s\S]*glyph-cabin-smoke-a[\s\S]*glyph-cabin-smoke-b/.test(sprite)) throw new Error('log cabin courses must remain fixed while chimney smoke rises');
if (!/glyph-trail-blaze-tree[\s\S]*glyph-trail-blaze-paint-a" pathLength="1"[\s\S]*glyph-trail-blaze-paint-c" pathLength="1"/.test(sprite)) throw new Error('three paint strokes must form the blaze on a fixed tree');
if (!/glyph-radio-body[\s\S]*glyph-radio-note-a[\s\S]*glyph-radio-note-b/.test(sprite)) throw new Error('radio music notes must float independently from its body');
if (!/glyph-filter-frame[\s\S]*glyph-filter-particle-a[\s\S]*glyph-filter-particle-b/.test(sprite)) throw new Error('filter particles must pass through a fixed funnel');
if (!/glyph-sort-frame[\s\S]*glyph-sort-bar-a[\s\S]*glyph-sort-bar-c/.test(sprite)) throw new Error('sort bars must settle independently inside a fixed frame');
if (!/glyph-clock-face[\s\S]*glyph-clock-hour[\s\S]*glyph-clock-minute/.test(sprite)) throw new Error('clock hands must move independently from its face');
if (!/glyph-globe-frame[\s\S]*glyph-globe-route" pathLength="1"/.test(sprite)) throw new Error('globe route must trace independently across its frame');
if (!/glyph-microphone-body[\s\S]*glyph-microphone-level-a[\s\S]*glyph-microphone-level-c/.test(sprite)) throw new Error('microphone levels must animate independently from its body');
if (!/glyph-key-body[\s\S]*glyph-key-pin/.test(sprite)) throw new Error('key pin must set independently from its body');
if (!/glyph-bell-body[\s\S]*glyph-bell-clapper/.test(sprite)) throw new Error('bell clapper must swing independently inside its body');
if (!/glyph-hard-drive-body[\s\S]*glyph-hard-drive-arm[\s\S]*glyph-hard-drive-light/.test(sprite)) throw new Error('hard-drive arm and light must animate independently from its housing');
if (!/glyph-river-banks" d="M10 3[^"]*M14 3[^"]*8 18"/.test(sprite)) throw new Error('river banks must form a winding channel that widens toward the foreground');
if (!/glyph-carabiner-body" d="M16 4C10 1 5 5 5 11v3[^"]*"[\s\S]*glyph-carabiner-spine[\s\S]*glyph-carabiner-gate[\s\S]*glyph-carabiner-hinge/.test(sprite)) throw new Error('carabiner must use an asymmetric D-profile, fixed load-bearing spine, hinged gate, and exact closure');
if (!/glyph-trail-camera-flash" d="M19 1v4m-2-2h4m-3\.5-1\.5 3 3m0-3-3 3"/.test(sprite)) throw new Error('trail-camera flash must use four radial rays');
if (!/glyph-key-pin[\s\S]*glyph-key-spark/.test(sprite)) throw new Error('key unlock glint must animate independently from its body');
if (!/glyph-bell-clapper[\s\S]*glyph-bell-sound-a[\s\S]*glyph-bell-sound-b/.test(sprite)) throw new Error('bell sound ticks must follow its swinging clapper');
if (!/glyph-owl-body[\s\S]*glyph-owl-eye-a[\s\S]*glyph-owl-eye-b/.test(sprite)) throw new Error('owl eyes must blink independently from its body');
if (!/glyph-trout-body[\s\S]*glyph-trout-tail[\s\S]*glyph-trout-bubble/.test(sprite)) throw new Error('trout tail and bubble must animate independently from its body');
if (!/glyph-canoe-hull[\s\S]*glyph-canoe-paddle[\s\S]*glyph-canoe-ripple/.test(sprite)) throw new Error('canoe paddle and ripple must animate independently from its hull');
if (!/glyph-mushroom-body[\s\S]*glyph-mushroom-spore-a[\s\S]*glyph-mushroom-spore-b/.test(sprite)) throw new Error('mushroom spores must float independently from its body');
if (!/glyph-marshmallow-stick[\s\S]*glyph-marshmallow-toast" pathLength="1"[\s\S]*glyph-marshmallow-spark/.test(sprite)) throw new Error('marshmallow toast and spark must animate independently from its stick');
if (!/glyph-paw-pad[\s\S]*glyph-paw-toe-a[\s\S]*glyph-paw-toe-d/.test(sprite)) throw new Error('paw pad and toes must land independently');
if (!/glyph-pinecone-body[\s\S]*glyph-pinecone-scale-a[\s\S]*glyph-pinecone-scale-c/.test(sprite)) throw new Error('pinecone scales must open independently from its body');
if (!/glyph-snowshoe-frame[\s\S]*glyph-snowshoe-binding/.test(sprite)) throw new Error('snowshoe binding must tighten independently from its frame');
for (const glyph of ['shield', 'terminal', 'network', 'wrench']) if (!sprite.includes(`id="glyph-${glyph}"`)) throw new Error(`missing ${glyph} suite glyph`);
for (const glyph of ['cloud', 'database', 'lock', 'refresh', 'package', 'bug', 'monitor', 'code']) if (!sprite.includes(`id="glyph-${glyph}"`)) throw new Error(`missing ${glyph} suite glyph`);
for (const [, motion] of allInternalMotions) if (!sprite.includes(`@keyframes ${motion}`)) throw new Error(`${motion} must be defined inside the external sprite`);
const keyframeNames = [...sprite.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
const duplicateKeyframes = keyframeNames.filter((name, index) => keyframeNames.indexOf(name) !== index);
if (duplicateKeyframes.length) throw new Error(`sprite keyframes must be unique: ${[...new Set(duplicateKeyframes)].join(', ')}`);

const hover = async (selector) => {
  const point = await send('Runtime.evaluate', { expression: `(()=>{const element=document.querySelector(${JSON.stringify(selector)});element.scrollIntoView({block:'center',behavior:'instant'});const box=element.getBoundingClientRect();return {x:box.left+box.width/2,y:box.top+box.height/2}})()`, returnByValue: true });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point.result.value });
  await waitFor(send, `document.querySelector(${JSON.stringify(selector)}).matches(':hover')`, `${selector} hover state`);
};

try {
  await Promise.all(['Page.enable', 'Runtime.enable'].map((method) => send(method)));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${server.origin}/` });
  await waitFor(send, `document.readyState==='complete'&&!!window.portfolioAppearancePicker`, 'home glyph fixtures');

  const realContexts = [
    ['.hero-actions .button', '.hero-actions .button use', 'glyph-arrow-glide'],
    ['.principles li', '.principles li use', null, '--glyph-waypoint-motion', 'glyph-waypoint-center-pulse'],
    ['.section-heading .eyebrow', '.section-heading .eyebrow use', null],
  ];
  for (const [trigger, target, expected, internalProperty, internalName] of realContexts) {
    await hover(trigger);
    const animation = await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(target)}).getAnimations()[0]?.animationName`, returnByValue: true });
    if (expected === null) {
      const internal = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector(${JSON.stringify(target)})).getPropertyValue(${JSON.stringify(internalProperty || '--glyph-trailhead-motion')}).trim()`, returnByValue: true });
      const expectedInternal = internalName || 'glyph-trailhead-sign-flip';
      if ((animation.result.value && animation.result.value !== 'none') || !internal.result.value.startsWith(`${expectedInternal} 680ms`)) throw new Error(`${trigger} did not isolate ${expectedInternal}`);
    } else if (animation.result.value !== expected) throw new Error(`${trigger} did not trigger ${expected}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }
  await send('Runtime.evaluate', { expression: `portfolioAppearancePicker.open()` });
  await hover('.palette-picker summary');
  const paletteMotion = await send('Runtime.evaluate', { expression: `document.querySelector('.palette-picker summary use').getAnimations()[0]?.animationName`, returnByValue: true });
  if (paletteMotion.result.value && paletteMotion.result.value !== 'none') throw new Error('appearance summary must keep the palette body stationary');
  const paletteInternal = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector('.palette-picker summary use')).getPropertyValue('--glyph-palette-motion').trim()`, returnByValue: true });
  if (!paletteInternal.result.value.startsWith('glyph-palette-dot-a-mix 680ms')) throw new Error('appearance summary did not animate individual palette colors');
  await send('Runtime.evaluate', { expression: `portfolioAppearancePicker.close()` });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette').showModal()` });
  for (const [trigger, target, expected, internalProperty, internalName] of [
    ['.command-palette .overlay-heading', '.command-palette .overlay-heading-glyph use', null, '--glyph-command-motion', 'glyph-command-chevron-type'],
    ['.command-search', '.command-search-glyph use', null, '--glyph-search-motion', 'glyph-search-scan-sweep'],
    ['.command-palette .overlay-close', '.command-palette .overlay-close use', null, '--glyph-close-motion', 'glyph-close-center-snap'],
  ]) {
    await hover(trigger);
    const animation = await send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(target)}).getAnimations()[0]?.animationName`, returnByValue: true });
    if (expected === null) {
      const internal = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector(${JSON.stringify(target)})).getPropertyValue(${JSON.stringify(internalProperty)}).trim()`, returnByValue: true });
      if ((animation.result.value && animation.result.value !== 'none') || !internal.result.value.startsWith(`${internalName} 680ms`)) throw new Error(`${trigger} did not isolate ${internalName}`);
    } else if (animation.result.value !== expected) throw new Error(`${trigger} did not trigger ${expected}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }
  await send('Runtime.evaluate', { expression: `document.querySelector('.command-palette').close()` });

  await send('Page.navigate', { url: `${server.origin}/case-studies/uddns/` });
  await waitFor(send, `document.readyState==='complete'&&document.querySelectorAll('.case-facts dt').length===3`, 'case-study glyph fixtures');
  const factGlyphs = await send('Runtime.evaluate', { expression: `(()=>{const terms=[...document.querySelectorAll('.case-facts dt')];return {labels:terms.map((term)=>term.textContent.trim()),glyphs:terms.map((term)=>({hidden:term.querySelector('svg')?.getAttribute('aria-hidden'),focusable:term.querySelector('svg')?.getAttribute('focusable'),href:term.querySelector('use')?.getAttribute('href')}))}})()`, returnByValue: true });
  if (factGlyphs.result.value.labels.join('|') !== 'Role|Interfaces|Project' || factGlyphs.result.value.glyphs.some((glyph) => glyph.hidden !== 'true' || glyph.focusable !== 'false') || factGlyphs.result.value.glyphs.map((glyph) => glyph.href.split('#').pop()).join('|') !== 'glyph-role|glyph-layers|glyph-repository') throw new Error(`case fact glyph semantics failed: ${JSON.stringify(factGlyphs.result.value)}`);
  await hover('.case-facts div');
  const factMotion = await send('Runtime.evaluate', { expression: `(()=>{const use=document.querySelector('.case-facts use');return {outer:use.getAnimations()[0]?.animationName,inner:getComputedStyle(use).getPropertyValue('--glyph-role-motion').trim()}})()`, returnByValue: true });
  if ((factMotion.result.value.outer && factMotion.result.value.outer !== 'none') || !factMotion.result.value.inner.startsWith('glyph-role-nod 680ms')) throw new Error(`case fact glyph hover motion failed: ${JSON.stringify(factMotion.result.value)}`);

  await send('Page.navigate', { url: `${server.origin}/about/` });
  await waitFor(send, `document.readyState==='complete'&&document.querySelectorAll('.about-field-notes dt').length===3`, 'about glyph fixtures');
  const fieldGlyphs = await send('Runtime.evaluate', { expression: `(()=>{const terms=[...document.querySelectorAll('.about-field-notes dt')];return {labels:terms.map((term)=>term.textContent.trim()),intro:document.querySelector('.about-intro .trail-glyph use')?.getAttribute('href'),glyphs:terms.map((term)=>({hidden:term.querySelector('svg')?.getAttribute('aria-hidden'),focusable:term.querySelector('svg')?.getAttribute('focusable'),href:term.querySelector('use')?.getAttribute('href')}))}})()`, returnByValue: true });
  if (fieldGlyphs.result.value.labels.join('|') !== 'Preferred terrain|Working bias|Outside' || !fieldGlyphs.result.value.intro.endsWith('#glyph-backpack') || fieldGlyphs.result.value.glyphs.some((glyph) => glyph.hidden !== 'true' || glyph.focusable !== 'false') || fieldGlyphs.result.value.glyphs.map((glyph) => glyph.href.split('#').pop()).join('|') !== 'glyph-pine|glyph-compass|glyph-fire') throw new Error(`field-note glyph semantics failed: ${JSON.stringify(fieldGlyphs.result.value)}`);

  await send('Page.navigate', { url: `${server.origin}/` });
  await waitFor(send, `document.readyState==='complete'&&!!window.portfolioAppearancePicker`, 'home glyph gallery');

  await send('Runtime.evaluate', { expression: `(()=>{const gallery=document.createElement('section');gallery.id='glyph-motion-gallery';gallery.setAttribute('aria-label','Glyph motion test gallery');gallery.innerHTML=${JSON.stringify(Object.keys(glyphs).map((name) => `<button class="overlay-close glyph-explorer-item" data-glyph="${name}" aria-label="Animate ${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/trail-glyphs.svg#glyph-${name}"></use></svg><small>${name}</small></button>`).join(''))};gallery.style.cssText='position:fixed;z-index:100;inset:1rem;display:grid;grid-template-columns:repeat(7,1fr);gap:.65rem;padding:1rem;overflow:auto;background:var(--paper)';gallery.querySelectorAll('button').forEach((button)=>button.style.cssText='width:auto;height:5.4rem;border-radius:5px;display:grid;place-items:center;gap:.25rem');gallery.querySelectorAll('svg').forEach((svg)=>svg.style.cssText='width:2rem;height:2rem');gallery.querySelectorAll('small').forEach((label)=>label.style.cssText='font:600 10px var(--mono)');document.body.append(gallery)})()` });

  const idle = await send('Runtime.evaluate', { expression: `document.querySelectorAll('#glyph-motion-gallery use').length===${Object.keys(glyphs).length}&&[...document.querySelectorAll('#glyph-motion-gallery use')].every((use)=>use.getAnimations().length===0&&getComputedStyle(use).transform==='none')`, returnByValue: true });
  if (!idle.result.value) throw new Error('glyphs must remain static before hover');

  for (const [name, expectedAnimation] of Object.entries(glyphs)) {
    const selector = `[data-glyph="${name}"]`;
    await hover(selector);
    const state = await send('Runtime.evaluate', { expression: `(()=>{const use=document.querySelector(${JSON.stringify(`${selector} use`)});const animation=use.getAnimations()[0];if(!animation)return {missing:true};animation.pause();animation.currentTime=220;const first=getComputedStyle(use).transform;animation.currentTime=470;const second=getComputedStyle(use).transform;return {name:animation.animationName,duration:animation.effect.getTiming().duration,first,second}})()`, returnByValue: true });
    const value = state.result.value;
    if (expectedAnimation === null) {
      if (!value.missing && value.name !== 'none') throw new Error(`${name} must keep its outer symbol stationary: ${JSON.stringify(value)}`);
      const [property, expectedInternalMotion, expectedDuration = 680] = internalMotions[name];
      const internalMotion = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector(${JSON.stringify(`${selector} use`)})).getPropertyValue(${JSON.stringify(property)}).trim()`, returnByValue: true });
      if (!internalMotion.result.value.startsWith(`${expectedInternalMotion} ${expectedDuration}ms`)) throw new Error(`${name} did not trigger ${expectedInternalMotion} at ${expectedDuration}ms`);
      for (const [secondaryProperty, secondaryMotion] of secondaryMotions[name] ?? []) {
        const secondary = await send('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector(${JSON.stringify(`${selector} use`)})).getPropertyValue(${JSON.stringify(secondaryProperty)}).trim()`, returnByValue: true });
        if (!secondary.result.value.startsWith(`${secondaryMotion} 680ms`)) throw new Error(`${name} did not trigger secondary motion ${secondaryMotion}`);
      }
    } else if (value.missing || value.name !== expectedAnimation || value.duration !== 680 || value.first === 'none' || value.first === value.second) throw new Error(`${name} hover motion failed: ${JSON.stringify(value)}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }

  for (const [name, [expectedX, expectedY]] of Object.entries(arrowVectors)) {
    await hover(`[data-glyph="${name}"]`);
    const vector = await send('Runtime.evaluate', { expression: `(()=>{const animation=document.querySelector('[data-glyph="${name}"] use').getAnimations()[0];animation.pause();animation.currentTime=354;const matrix=new DOMMatrix(getComputedStyle(animation.effect.target).transform);return {x:matrix.e,y:matrix.f}})()`, returnByValue: true });
    const { x, y } = vector.result.value;
    if ((expectedX === 0 ? Math.abs(x) > .05 : Math.sign(x) !== expectedX) || (expectedY === 0 ? Math.abs(y) > .05 : Math.sign(y) !== expectedY)) throw new Error(`${name} moved against its direction: ${JSON.stringify(vector.result.value)}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  }

  await send('Runtime.evaluate', { expression: `document.querySelector('[data-glyph="compass"]').focus()` });
  const keyboardMotion = await send('Runtime.evaluate', { expression: `document.querySelector('[data-glyph="compass"] use').getAnimations()[0]?.animationName`, returnByValue: true });
  if (keyboardMotion.result.value && keyboardMotion.result.value !== 'none') throw new Error('keyboard focus must keep the compass housing stationary');

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await hover('[data-glyph="fire"]');
  const reduced = await send('Runtime.evaluate', { expression: `(()=>{const svg=document.querySelector('[data-glyph="fire"] svg');const use=svg.querySelector('use');return {visible:svg.getBoundingClientRect().width>0,duration:getComputedStyle(use).animationDuration,animations:use.getAnimations().length}})()`, returnByValue: true });
  if (!reduced.result.value.visible || (Number.parseFloat(reduced.result.value.duration) > .00001 && reduced.result.value.animations !== 0)) throw new Error(`reduced motion failed: ${JSON.stringify(reduced.result.value)}`);

  if (captureEvidence) {
    const evidenceDir = '/tmp/bolens-glyph-motion';
    mkdirSync(evidenceDir, { recursive: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Runtime.evaluate', { expression: `(()=>{
      const parsed=new DOMParser().parseFromString(${JSON.stringify(sprite)},'image/svg+xml');
      const style=document.createElement('style');
      style.textContent=[...parsed.querySelectorAll('style')].map((node)=>node.textContent).join('\\n');
      document.head.append(style);
      const gallery=document.createElement('section');
      gallery.id='glyph-phase-gallery';
      gallery.setAttribute('aria-label','Deterministic glyph animation phases');
      gallery.style.cssText='position:fixed;z-index:101;inset:1rem;display:grid;grid-template-columns:repeat(7,1fr);gap:.65rem;padding:1rem;overflow:auto;background:var(--paper)';
      for(const name of ${JSON.stringify(Object.keys(internalMotions))}){
        const symbol=parsed.querySelector('#glyph-'+name);
        const card=document.createElement('article');
        card.style.cssText='min-height:5.4rem;display:grid;place-items:center;gap:.25rem';
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox',symbol.getAttribute('viewBox')||'0 0 24 24');
        svg.setAttribute('aria-hidden','true');
        svg.setAttribute('style','width:2rem;height:2rem;${motionDeclarations}');
        svg.innerHTML=symbol.innerHTML;
        const label=document.createElement('small');
        label.textContent=name;
        label.style.cssText='font:600 10px var(--mono)';
        card.append(svg,label);
        gallery.append(card);
      }
      document.querySelector('#glyph-motion-gallery').remove();
      document.body.append(gallery);
    })()` });
    const phaseAudit = await send('Runtime.evaluate', { expression: `(()=>{
      const gallery=document.querySelector('#glyph-phase-gallery');
      const animations=gallery.getAnimations({subtree:true});
      const names=new Set(animations.map((animation)=>animation.animationName));
      const missing=${JSON.stringify(allInternalMotions.map(([, name]) => name))}.filter((name)=>!names.has(name));
      const fixed=['glyph-waypoint-frame','glyph-close-corners','glyph-compass-frame','glyph-fire-logs','glyph-pine-trunk'];
      const movingFixed=fixed.filter((className)=>gallery.querySelector('.'+className)?.getAnimations().length);
      animations.forEach((animation)=>{animation.pause();animation.currentTime=220});
      return {count:animations.length,missing,movingFixed};
    })()`, returnByValue: true });
    if (phaseAudit.result.value.missing.length || phaseAudit.result.value.movingFixed.length) throw new Error(`deterministic phase fixture failed: ${JSON.stringify(phaseAudit.result.value)}`);

    for (const [width, height, viewport] of [[1440, 1000, 'desktop'], [390, 844, 'mobile']]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
      await send('Runtime.evaluate', { expression: `(()=>{const gallery=document.querySelector('#glyph-phase-gallery');gallery.style.gridTemplateColumns='repeat(${width < 600 ? 3 : 7},1fr)';gallery.scrollTop=${width < 600 ? 'gallery.scrollHeight' : '0'};gallery.getAnimations({subtree:true}).forEach((animation)=>{animation.pause();animation.currentTime=220})})()` });
      const capture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`${evidenceDir}/${viewport}-phase-early.png`, Buffer.from(capture.data, 'base64'));
      await send('Runtime.evaluate', { expression: `document.querySelector('#glyph-phase-gallery').getAnimations({subtree:true}).forEach((animation)=>animation.currentTime=470)` });
      const lateCapture = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      writeFileSync(`${evidenceDir}/${viewport}-phase-late.png`, Buffer.from(lateCapture.data, 'base64'));
    }
  }

  console.log(`Glyph hover motion passed ${Object.keys(glyphs).length} glyphs, keyboard parity, idle-state, phase, and reduced-motion checks.`);
} finally {
  await browser.close();
  await server.close();
}
