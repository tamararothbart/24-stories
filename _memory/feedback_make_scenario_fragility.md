---
name: Make Scenario Fragility — Diagnosis Protocol
description: How to diagnose and prevent Make scenario breakages — apply before editing any scenario and when troubleshooting unexpected errors
type: feedback
---

When a Make scenario breaks unexpectedly, check these three things IN ORDER before touching any modules:

1. **Check Airtable data first** — bad data (blank fields, mismatched values) causes most formula errors. Check the subscriber/record values before assuming Make is broken.
2. **Check Max consecutive errors** — Make auto-deactivates scenarios on repeated errors. Set to 10 in every scenario's settings (wrench icon, top right of canvas).
3. **Check badge module references** — badges silently break when modules are edited or re-numbered. If a field resolves empty, click the module's output bubble to see what it actually outputs, then re-map the badge via variable picker.

**Why:** Make's module numbering can shift when scenarios are edited, and badge references don't always update automatically. This caused 20+ hours of debugging on Scenario 5.

**How to apply:**
- Before editing any scenario, warn the user: "Editing modules can shift badge references — only change what's necessary."
- When a 422 Airtable formula error appears: check if the variable badge is resolving to empty (visible in the Input panel of the erroring module).
- When Mailjet says "Missing value of required parameter 'Email'": check the badge module number against the variable picker — the clock/schedule trigger counts as a module on canvas but NOT in the variable picker numbering.
- Adding text to email body content is safe — cosmetic only, no badge impact.
- Never re-select the Airtable table in a module to "refresh" it — this can reset output field mapping.

**Known Make quirks:**
- `!=` and `<>` get escaped by Make — always use `NOT(x = y)` instead
- `DATETIME_DIFF()` required for date arithmetic — `TODAY()-{Date}` does not work
- Variables in formulas must be inserted via variable picker (blue badges) — typed text doesn't work for new variables
- Fields with spaces in names need backtick notation: `{{2.\`Field Name\`}}` — must use variable picker
- Schedule/clock trigger appears as module 1 on canvas but is skipped in variable picker numbering
- If Search Records returns 0 bundles but downstream modules still run: check "Continue execution even with no results" checkbox in the module
