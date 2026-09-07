# Documentation

Portfolio content generation and browser interaction contracts.

## Start here

| Need | Owning document |
| --- | --- |
| Use the project | [README.md](../README.md) |
| Change the repository | [AGENTS.md](../AGENTS.md) |
| Deliver or recover | [RELEASING.md](../RELEASING.md) |
| Plan substantial changes | [.specify/memory/project-guide.md](../.specify/memory/project-guide.md) |
| Non-negotiable constraints | [.specify/memory/constitution.md](../.specify/memory/constitution.md) |

## Architecture

[Project data](../data/projects.json), [theme data](../data/themes.json), and [the site
builder](../scripts/build-site.mjs) own generated surfaces. Browser controllers own interaction and
preference state. [Appearance architecture](../README.md#appearance-architecture) explains
controller relationships. [Tests](../tests/README.md) distinguish source assertions from browser
evidence.

## Deployment and recovery

[RELEASING.md](../RELEASING.md) owns Pages delivery and recovery. The [deployment
workflow](../.github/workflows/deploy-pages.yml) stages an allowlisted public artifact. Adding a
repository document does not automatically add it to the published site. Regenerate changed inputs
and inspect the artifact before deployment.

## Database and state

There is no server database. Git owns editorial content, generated files derive from it, and browser
preferences are optional local state. Preserve useful navigation and theme behavior when browser
storage or other optional APIs fail.

## Documentation maintenance

Keep decisions, invariants, failure modes, and recovery requirements in the owning document. Link to
commands, defaults, schemas, and generated catalogs instead of copying them. Change the owner and
affected references together. Update this index when adding or moving a guide, and verify relative
links and heading anchors. Historical specs and audits describe their recorded revision, not current
runtime proof. A topic without an implementation stays explicitly unimplemented.

## Topic guides

- [Editor setup](../.vscode/README.md)
- [License scope and attribution](../THIRD_PARTY_NOTICES.md)
- [Development container](../.devcontainer/README.md)
