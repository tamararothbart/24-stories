# 24 Stories TextEdit

Automated structural editing for submitted 24 Stories stories.

---

## What It Does

When a subscriber submits a story, the TextEdit engine edits it in the background and writes a clean, titled version back to Airtable — ready for Tamara's final review.

The original is always preserved. Tamara works from the TextEdit version, making any corrections, then approves for sending.

**Time saved:** TextEdit does the heavy lifting. Tamara should spend no more than ten minutes on any story.

---

## Output

For every story, TextEdit produces only:

```
TITLE:
[content-based title]

EDITED STORY:
[edited story]
```

Nothing else. No commentary, notes, analysis, or flags.

---

## How It Works

**Trigger:** `text-edit-queue.js` runs every 5 minutes as a Netlify scheduled function.

**Condition:** It finds Stories records where `StoryText` is set but `ChapterTitle` is empty — meaning the story has been submitted but not yet AI-edited.

**Process:**
1. Fetches the story from Airtable
2. Sends it to Claude with the full editorial system prompt
3. Parses the output (TITLE: / EDITED STORY: format)
4. Writes `ChapterTitle` + `EditedText` back to Airtable

**Airtable fields:**

| Field | Role |
|-------|------|
| `StoryText` | Original submission — never modified |
| `EditedText` | AI-edited version — Tamara's working copy |
| `ChapterTitle` | Generated title — also used as the "processed" signal |

---

## Airtable Workflow for Tamara

1. Subscriber submits story
2. You receive the story alert email (existing flow)
3. Open Airtable — within 5 minutes, `EditedText` and `ChapterTitle` are populated
4. Review `EditedText` — make any corrections
5. Compare to `StoryText` if you want to check the original
6. Tick `SendToFamily` when you're happy — sends the story (existing flow)

---

## Architecture

```
netlify/functions/text-edit-queue.js    — the runtime (scheduled function)
text-editor/
  prompts/
    system-editor-prompt.md             — full editorial system prompt (reference)
    title-extraction-prompt.md          — title rules
    editing-boundaries.md               — what editor may/may not do (with examples)
  tests/
    sample-inputs/                      — four test stories covering key edge cases
    sample-outputs/                     — (add expected outputs here after first QA run)
    regression-tests.md                 — pass/fail criteria for each test
  README.md                             — this file
```

The operative system prompt lives inside `text-edit-queue.js`. The `prompts/` directory is reference and version control — it documents the editorial standard without requiring the function to read from disk.

---

## Editorial Standard

The TextEdit editor is a **structural and light line-editing aid**, not a rewriting engine.

It edits for:
- Clarity
- Structure
- Readability
- Opening strength
- Flow and paragraphing
- Title
- Ending

It preserves:
- Truth
- Voice
- Personality
- Phrasing
- Emotional restraint
- South African idiom and cultural language
- The storyteller's natural rhythm

It never invents. Every edited story must feel like: *"This sounds like me, only clearer."*

The editorial model is informed by the best standards of personal storytelling: strong hook, clear arc, lived truth, compression, and voice preservation.

---

## Reverting to the Original

If the AI edit is not right — if the voice is off or the original is better in a section — Tamara can always refer back to `StoryText` and copy from it directly into `EditedText`.

---

## Running Tests

Open each file in `tests/sample-inputs/` and paste the story text into a Claude prompt that uses the system prompt from `prompts/system-editor-prompt.md`. Check the output against the pass criteria in `tests/regression-tests.md`.

Save expected outputs to `tests/sample-outputs/` after the first successful QA run.

---

## Re-triggering TextEdit

TextEdit will not re-run on a story once `ChapterTitle` is set. To re-run it on a specific story, clear the `ChapterTitle` field in Airtable. The queue will pick it up within 5 minutes.

Note: clearing `ChapterTitle` will also overwrite the current `EditedText`. Only do this if you want a fresh AI edit.
