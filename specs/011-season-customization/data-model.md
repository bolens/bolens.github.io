# State model

- `environment.season`: `null | spring | summer | autumn | winter`, validated by
  the existing environment replacement API. DOM default is the literal `default`.
- `portfolioWeather.seasons`: frozen ordered catalog of the four non-null values.
- Season control: `default` translates to null; selection preserves current
  `temperatureC` and `fireflyHabitat`. External replacement still resets omitted fields.
- Moon presets: 0, .125, .25, .375, .5, .625, .75, .875; automatic passes null
  to `setMoonPhase`. Existing normalization and lunar illumination stay unchanged.
- Custom moon: any valid override not exactly in the catalog; read-only display,
  replaced by choosing a preset or automatic. No rounding of underlying state.
- CSS seasonal color and visibility tokens are derived presentation, not new state.

Transitions are synchronous through existing controllers. Season notifications
include committed DOM state; weather/theme updates do not reset environment.
No new storage, timers, network requests, or random values.
