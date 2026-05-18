import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { applyPatch } from "../src/patch.js";

const APPLY_PATCH_DESCRIPTION = `Apply a patch to one or more files using the Codex patch format.

You MUST read the file before applying a patch to it.

## Patch Format

The patch must be wrapped in \`*** Begin Patch\` and \`*** End Patch\` markers.

Each operation starts with one of three headers:
- \`*** Add File: <path>\` - create a new file. Every following line must start with \`+\`.
- \`*** Delete File: <path>\` - remove an existing file. Nothing follows.
- \`*** Update File: <path>\` - patch an existing file (optionally with a rename via \`*** Move to:\`).

### Grammar

\`\`\`
Patch       := Begin { FileOp } End
Begin       := "*** Begin Patch" NEWLINE
End         := "*** End Patch" NEWLINE
FileOp      := AddFile | DeleteFile | UpdateFile
AddFile     := "*** Add File: " path NEWLINE { "+" line NEWLINE }
DeleteFile  := "*** Delete File: " path NEWLINE
UpdateFile  := "*** Update File: " path NEWLINE [ MoveTo ] { Hunk }
MoveTo      := "*** Move to: " newPath NEWLINE
Hunk        := "@@" [ " " header ] NEWLINE { HunkLine } [ "*** End of File" NEWLINE ]
HunkLine    := (" " | "-" | "+") text NEWLINE
\`\`\`

## Context Rules

- By default, show **3 lines** of unchanged code immediately above and 3 lines immediately below each change.
- Treat 3 lines as a minimum, not a target. For large files, repeated code, or any edit that could plausibly match in multiple places, prefer **5-10 lines** of unchanged context on each side.
- If a change is within the chosen context window of a previous change, do NOT duplicate the first change's context-after lines in the second change's context-before lines.
- If 3 lines of context is insufficient to uniquely identify the location, use the \`@@\` operator to indicate the class or function the snippet belongs to.
- If a code block is repeated so many times that even a single \`@@\` header and 3 lines of context cannot uniquely identify it, use multiple \`@@\` statements to narrow the location.

## Additional Rules

- **When editing conflict markers**, ensure their length matches the file's existing marker length.
- For Add File: every content line MUST start with \`+\` (which gets stripped).
- For Update File hunks: lines start with \` \` (context), \`-\` (remove), or \`+\` (add).
- Use \`*** End of File\` marker to anchor changes at end of file.
- Multiple files can be patched in a single call.
- File paths can be relative or absolute.
- Don't use apply_patch for edits that an available linter or formatter could do based on the instructions in the user's AGENTS.md file.

## Reliability Tips (Hard Cases)

- Repeated blocks: include a unique \`@@ ...\` header, and add 5-10 or more context lines until the target is unique.
- If you only read part of a file, do not guess. Read more of the file and expand the context until the hunk can match only once.
- Indentation-sensitive files: keep indentation exactly as in the file. Do not reindent unrelated lines.
- Insert-only hunks: avoid unanchored insert-only hunks; include a nearby unchanged context line to show where to insert.
- Ambiguous matches are worse than verbose hunks. Prefer a longer patch over a shorter patch that could apply in multiple places.
- Whitespace drift: avoid changing internal spacing in context lines. Copy context lines from the file.
- CRLF files: keep line endings consistent with the file you're patching.`;

const APPLY_PATCH_PARAMETERS = {
  type: "object",
  properties: {
    patchText: {
      type: "string",
      description:
        "The patch text in Codex patch format (*** Begin Patch ... *** End Patch)",
    },
  },
  required: ["patchText"],
  additionalProperties: false,
} as const;

function getPatchText(args: Record<string, unknown> | undefined): string {
  if (typeof args?.patchText === "string") return args.patchText;
  if (typeof args?.patch === "string") return args.patch;
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function prefersApplyPatch(modelId: string | undefined): boolean {
  const id = modelId?.toLowerCase() ?? "";
  return (
    id.includes("gpt") ||
    id.includes("codex") ||
    id.includes("o1") ||
    id.includes("o3") ||
    id.includes("o4")
  );
}

function toolName(
  tool: string | { name?: string } | undefined,
): string | undefined {
  if (typeof tool === "string") return tool;
  return tool?.name;
}

function syncToolsForModel(
  pi: ExtensionAPI,
  modelId: string | undefined,
): void {
  const allToolNames = new Set(pi.getAllTools().map((tool) => tool.name));
  const activeToolNames = new Set(
    pi
      .getActiveTools()
      .map((tool) => toolName(tool))
      .filter((name): name is string => typeof name === "string"),
  );

  if (prefersApplyPatch(modelId)) {
    activeToolNames.delete("edit");
    if (allToolNames.has("apply_patch")) activeToolNames.add("apply_patch");
  } else {
    activeToolNames.delete("apply_patch");
    if (allToolNames.has("edit")) activeToolNames.add("edit");
  }

  pi.setActiveTools([...activeToolNames]);
}

export default function applyPatchExtension(pi: ExtensionAPI) {
  pi.registerTool({
    name: "apply_patch",
    label: "Apply Patch",
    description: APPLY_PATCH_DESCRIPTION,
    promptGuidelines: [
      "Use apply_patch for precise multi-line edits when it is active, and read existing files before patching them.",
    ],
    parameters: APPLY_PATCH_PARAMETERS,

    prepareArguments(args: unknown) {
      if (!isRecord(args)) return { patchText: "" };
      if (typeof args.patchText === "string")
        return { patchText: args.patchText };
      if (typeof args.patch === "string")
        return { patchText: args.patch };
      return { patchText: "" };
    },

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const patchText = getPatchText(params);
      const result = applyPatch(patchText, ctx.cwd);
      return {
        content: [{ type: "text", text: result.message }],
        details: { patchText, appliedHunks: result.appliedHunks },
      };
    },
  });

  pi.on("session_start", (_event, ctx) => {
    syncToolsForModel(pi, ctx.model?.id);
  });

  pi.on("model_select", (event) => {
    syncToolsForModel(pi, event.model?.id);
  });
}
