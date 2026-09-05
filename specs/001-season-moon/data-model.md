# Season and moon entities

- Environment owns three optional values: temperatureC, season, fireflyHabitat.
  Unknown means null, not an inferred local value. Weather condition/source and
  environment remain independent.
- Firefly eligibility is a derived 0/1 gate, not a density or motion setting.
  Existing atmosphere/time state may still exclude insects when the gate is 1.
- Lunar state owns cycle fraction, illumination, and source. The time controller
  owns the date and optional override. Renderers consume the committed state.

Validation, replacement/reset behavior, notification order, and consumer
variables are defined once in [contracts/scene-state.md](contracts/scene-state.md).
No database or persistent schema is introduced.
