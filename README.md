# pi-apply-patch

Pi extension that registers a Codex-style `apply_patch` tool and automatically swaps it with the built-in `edit` tool based on the selected model.

GitHub: https://github.com/tanishqkancharla/pi-apply-patch

- GPT/Codex/o-series models: `apply_patch` active, `edit` inactive
- Other models: `edit` active, `apply_patch` inactive

Install as a local Pi package:

```json
{
  "packages": ["../../Documents/Projects/pi-apply-patch"]
}
```
