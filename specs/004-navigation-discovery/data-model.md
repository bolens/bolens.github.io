# State and ownership: Navigation and project discovery

## Entity 1

Work filter state: q, language, type, sort; URL is the shareable representation.

## Entity 2

Update cache: savedAt and repository records keyed by repository URL; pushed_at is preferred when parseable, then updated_at.

## Entity 3

Chapter state: ordered sections, current reading line, selected chapter, and cancellable pending alignment.

## Transitions and boundaries

Work query fields are q, language, type, and sort. Default sort is featured; name-asc, name-desc, and updated are supported. Filter changes replace URL state rather than creating navigation history per keystroke. The GitHub metadata boundary accepts only usable array records and parseable dates; tests provide controlled responses.

See [plan.md](plan.md) for source owners and [spec.md](spec.md) for acceptance
rules. These are existing browser/file contracts, not a new database schema.
