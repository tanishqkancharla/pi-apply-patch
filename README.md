# pi-apply-patch

Pi extension that registers a Codex-style `apply_patch` tool and automatically swaps it with the built-in `edit` tool based on the selected model.

GitHub: https://github.com/tanishqkancharla/pi-apply-patch

- GPT/Codex/o-series models: `apply_patch` active, `edit` inactive
- Other models: `edit` active, `apply_patch` inactive

## Install

Install from GitHub:

```bash
pi install https://github.com/tanishqkancharla/pi-apply-patch
```

Or install as a local Pi package:

```json
{
  "packages": ["../../Documents/Projects/pi-apply-patch"]
}
```

## Development

```bash
npm install
npm run typecheck
```

The package is source-distributed as a Pi extension. Pi loads `extensions/index.ts`, which imports the patch parser/applier from `src/patch.ts`.
