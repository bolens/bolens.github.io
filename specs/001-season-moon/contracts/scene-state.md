# Season and moon state contract

## Environment

`window.portfolioWeather.setEnvironment(input)` replaces the whole optional
environment. A non-array object is accepted. Other inputs reset all fields.

| Field | Valid input | Invalid or omitted |
| --- | --- | --- |
| temperatureC | Finite number, -90 through 60 inclusive | null |
| season | spring, summer, autumn, winter | null |
| fireflyHabitat | Boolean true or false | null |

Fields normalize independently. Strings are not coerced to numbers or booleans.
The returned weather snapshot and its environment are frozen. The environment
getter returns that normalized environment. No caller object is retained.

`fireflyEligibility` is 0 if winter, explicitly unsuitable habitat, or a known
temperature below 12 or above 32 applies. Otherwise it is 1. It multiplies,
and never overrides, existing time/weather eligibility in SVG and canvas.
Eligibility 1 does not guarantee visible insects.

The root `data-scene-firefly-eligibility` is committed before weather subscribers
and the `portfolio-weather-change` event. Environment updates use the existing
weather notification path. Palette/condition changes do not erase environment.
Clearing environment does not clear a weather override. No location request,
provider fetch, persistence, or new timer is introduced.

## Lunar phase

`window.portfolioSceneTime.setMoonPhase(value)` accepts only finite numbers in
[0,1]. Value 1 normalizes to 0. All other inputs release the override.
The returned frozen time snapshot and `state` getter include:

| Field | Meaning |
| --- | --- |
| moonPhase | Cycle fraction in [0,1) |
| moonIllumination | Lit fraction in [0,1] |
| moonSource | override, fixed, or clock |

Precedence is explicit phase override, otherwise full moon for fixed scene/time,
otherwise approximate date-based phase for automatic time. Phase reset does not
reset time. Time/appearance changes do not erase a phase override.

The mean cycle is 29.530588 days from 2000-01-06 18:15 UTC. Dates before the epoch
wrap into [0,1). Illumination is (1 - cos(phase * 2 pi)) / 2. The clock remains the
existing time owner with its existing minute refresh; refresh expects a valid
Date. Invalid Date handling is not added by this feature.

The time owner publishes `data-scene-moon-source`, `--scene-moon-light`, and
`--scene-moon-shadow-path` before its existing notifications. The named
`moon-terminator` region covers the dark part of the existing opaque orb.
Night/twilight multiply moon-derived surface/shadow strength by illumination.
Day/morning/evening sunlight is unchanged. Phase does not change orb position,
physical placement bounds, or the weather layer ordering.

## Compatibility and limits

The APIs remain optional browser globals initialized after their existing
dependencies. Static no-JavaScript output retains the representative full moon.
The estimate is not a moonrise, orientation, eclipse, or local-visibility model.
Provider integration and UI controls for these new fields are not implemented.
