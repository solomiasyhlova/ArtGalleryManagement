---
name: list-components
description: List project components
argument-hint: [subdirectory]
---

## Task

List all React component files (.tsx, .ts) in `client/src/components/` (and pages in `client/src/pages/`). Skip `components/ui/` (generated shadcn/ui) unless it is requested as the subdirectory.

If a [subdirectory] is provided via $ARGUMENTS, only list files in `client/src/components/<subdirectory>`.

## Output Format

- Numbered list of files with relative paths
- Brief one-line description of each (infer from filename)
- Summary count at the end

If no files found, say "No components found."
