# Regression Tests — 24 Stories TextEdit

Each test verifies that the editor behaves correctly for a specific edge case. Run manually by pasting sample-input text into the editing engine and checking the output against the criteria below.

---

## Test 1 — Buried Hook (`test-1-buried-hook.txt`)

**Edge case:** Hook is buried in paragraph 3. Story starts with two paragraphs of background.

Pass criteria:
- [ ] Opens close to the moment of the commotion — not with "I grew up in Kimberley"
- [ ] Background is compressed into no more than two establishing sentences
- [ ] Mr Pietersen and the condensed milk biscuit are both kept
- [ ] Title does not contain "First Job", "Job", "Work", or "Municipality"
- [ ] Title comes from specific story content
- [ ] Weak oral ending ("I don't know if that's interesting") is removed
- [ ] No invented facts, scenes, or dialogue

---

## Test 2 — Comic Story (`test-2-comic-story.txt`)

**Edge case:** Dry, deadpan voice. Punchline exists. Must not be sentimentalised.

Pass criteria:
- [ ] Voice remains dry and deadpan — not warmed up
- [ ] "Very dignified, if a caravan can be dignified" is preserved
- [ ] "Not bad for thirty years old" punchline is kept
- [ ] "We waited three hours for the AA" is kept as the closing beat
- [ ] No lesson about family, holidays, or childhood added
- [ ] No warmth or nostalgia added beyond what is in the original
- [ ] Title comes from a specific comic image in the story
- [ ] Weak opener ("Okay so this is maybe not a very serious story") is removed

---

## Test 3 — Grief Story (`test-3-grief-story.txt`)

**Edge case:** Quiet portrait of loss. No redemption arc supplied. Must not add closure.

Pass criteria:
- [ ] The teapot is central and preserved
- [ ] "Her presence was a kind of warmth" is kept as the storyteller's own phrasing
- [ ] "I don't think I've ever understood someone so well without them having said very much to me" is preserved as the ending
- [ ] No grief language added beyond what was supplied
- [ ] No closure, healing, or tribute framing added
- [ ] Does not read like a eulogy
- [ ] Title does not use "Grandmother", "Gogo", or "Loss"
- [ ] Title comes from a specific image in the story (teapot, five o'clock, the kitchen)

---

## Test 4 — Fragmented Memory (`test-4-fragmented-memory.txt`)

**Edge case:** No arc, no incident. Mood piece only. Must not be overbuilt.

Pass criteria:
- [ ] No false arc imposed (no return, no loss framing, no lesson)
- [ ] The windmill and its sound are clearly present
- [ ] "I thought it was the loneliest sound I'd ever heard but not in a bad way" is kept verbatim or near-verbatim
- [ ] Fragmented opening sentences are smoothed into readable prose without losing the meditative quality
- [ ] Story is not expanded — it remains a fragment
- [ ] No sensory details added (what Aunt Sannie was cooking, what the farm looked like)
- [ ] Title does not use "Farm", "Eastern Cape", or "Place I Remember"
- [ ] Title comes from the windmill or the central image

---

## Universal Checks (all tests)

For every test, verify:
- [ ] Output contains ONLY `TITLE:` and `EDITED STORY:` — nothing else
- [ ] No editor's notes, analysis, or commentary in output
- [ ] No banned phrases used (see editing-boundaries.md)
- [ ] No dialogue invented
- [ ] No facts added
- [ ] South African / British English spelling throughout
- [ ] Past tense maintained
- [ ] Short to medium paragraphs
