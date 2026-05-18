# pi-apply-patch

<img width="1680" height="720" alt="tanishqk_The_Diff_a_menacing_comic-book_supervillain_with_a_p_9fd06ba2-52eb-425e-8a21-b1ba672eb37e_0" src="https://github.com/user-attachments/assets/ebafed90-bc13-482a-941c-1a521155d792" />


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
