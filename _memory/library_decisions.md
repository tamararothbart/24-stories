---
name: 24 Stories — library.html Decisions (locked 2026-04-11)
description: All confirmed decisions for library.html — structure, access, content, user roles, photo handling, book prep, family delivery.
type: project
originSessionId: 4f091a65-6943-4839-bc63-4a2f26f75ebe
---
# 24 Stories — library.html Decisions

**Locked: 2026-04-11. Build ready to proceed.**

---

## Purpose

The library exists for three reasons:
1. Subscribers can upload or update photos at any time — without having to retrieve old prompt emails
2. Story Helper can access photos on behalf of the storyteller
3. Subscribers (and Tamara) can review all edited stories and book prep content before the book goes to print — the library IS the proof. No separate client proof step.

---

## Access Model

- URL-based: `library.html?id=SUB001` — subscriber ID in URL param
- The URL is the key. No password system. No login page.
- **Library link appears in every email** — welcome, every weekly prompt, every reminder. Quiet footer line: "Your story library: [link]"
- **"Resend my library link" form on main site** — subscriber enters email, Make looks up their ID and emails them the link. Safety net for subscribers who lose the URL (core demographic: 70+ year olds).
- Welcome email includes one clear line explaining how to retrieve the link if lost.

## Who Accesses

- **Storyteller** — their unique URL
- **Story Helper** — receives the same URL (included in their welcome email, email-3)
- **Tamara (editor)** — accesses any subscriber's library via their URL, which she has in Airtable. No separate admin view needed at this stage.

---

## Prompts — All 26 Unlocked from Day One

Pay-upfront model. No prompt lock logic. Subscriber can work through prompts at their own pace. Make still sends prompts on the weekly schedule — the library does not replace the email prompts. Accelerated prompts no longer needed.

---

## Family Delivery — Still Weekly

Even if the storyteller records all stories in advance, Make sends to family on the weekly schedule. Family receives stories as instalments — this is a feature, not a limitation. No change to Make scenario logic.

---

## Story Slots — 26 Cards

Each story card shows:
- Week number, WeekName, Theme
- Prompt text (for reference)
- Story status (see below)
- Photo upload (always available — even if no story yet)
- Caption (always editable)

### Story Status States

1. **Empty** — no story recorded yet. Shows "Record this story" button → links to tell.html with all URL params pre-filled.
2. **Awaiting edit** — story submitted, Tamara has not yet entered EditedText in Airtable. Shows note: "Your story is being edited. It will appear here soon."
3. **Edited** — EditedText is present in Airtable. Shows the edited story text.

### Story Editing Rules

- Stories are **read-only** for subscribers and Story Helpers.
- Only Tamara edits — via Airtable (EditedText field in Stories table).
- If a subscriber needs a factual correction: they email hello@24stories.co.za. Tamara makes the change in Airtable. Library updates automatically.
- Do not promote this as a feature. It is a quiet fallback.
- No unlock/re-record system needed.

### Photo Handling

- Subscribers can upload a photo for any week at any time, even if no story exists for that week.
- Photos uploaded on tell.html carry through to the library automatically (same Airtable record).
- **If a photo already exists and they attempt to upload a new one: replace, with a warning.** Show: "This will replace your existing photo." They confirm, it replaces. Never block a replacement.
- Caption is always editable (separate from photo upload).

---

## Mark as Complete — LOCKED 2026-04-12

A prominent "Mark as Complete" button sits at the bottom of the book preparation section.

**What it does:**
- Sets `BookFormCompleted` date in Airtable (Subscribers table) — triggers Make to notify Tamara
- Locks the library: no further stories, photographs, captions, or book details can be added
- Starts the 8-week delivery clock

**Before pressing:** Subscriber sees a clear warning modal:
*"Once you mark your library as complete, your book goes straight to production. No further stories, photographs, or changes can be added. Your 8-week delivery window begins from this moment."*
Requires explicit confirmation to proceed.

**No hard deadline.** Subscriber presses when ready — no system-imposed cutoff. The sooner they press, the sooner the book arrives. Emails 10 and 11 are reminders.

**Tamara alert:** Make notifies Tamara (via email or Airtable notification) when `BookFormCompleted` is set — this is her signal that a book is ready for design.

**No per-story "no image" checkbox.** The warning on Complete is sufficient — subscriber takes responsibility for missing items at the point of pressing Complete.

---

## Book Preparation Section (at bottom of library)

Five fields, in order:

1. **Book title** — editable text field. Default pre-populated on load: "The Collected Stories of [StorytellerFirstName] [StorytellerSurname]". Subscriber may keep, adjust, or replace entirely. Saved to Airtable (field: BookTitle, Subscribers table). Only saved on edit — not written if subscriber never touches it. Editor can assist if subscriber wants guidance.
2. **Portrait photo** — appears on the INSIDE cover page of the book. Used as front cover only if no separate cover image is uploaded. NOT automatically the front cover.
3. **Cover image** — optional. The front cover photograph. If not provided, portrait is used as default front cover (or title typography only — subscriber can email hello@ to specify preference).
4. **Dedication** — subscriber writes this (text field, editable)
5. **Book summary** — written by Tamara at week 26, custom per subscriber based on their stories. Entered in Airtable (field: BookSummary, in Subscribers table). Displayed read-only in library. If subscriber wants a word changed, they email hello@24stories.co.za. Do not use a generic template — the summary is personal and is part of the premium service.

**Cover logic (locked):** Portrait = inside cover page. Cover image = front cover (portrait as fallback). These are separate. Do not describe them as interchangeable in copy.

---

## Technical Architecture

- **Reading data**: Airtable API called directly from the browser (read-only API key). Fetches Stories records for this subscriber ID.
- **Writing data** (photo uploads, caption edits, book prep fields): submits to Make webhook, which updates Airtable.
- Hosted on Netlify as a static page. No backend required.
- Read-only API key in browser is acceptable at this scale — data is not sensitive.

---

## What the Library Replaces

- **No separate client proof** for book design. Library is the proof. Subscriber checks all stories, photos, captions, book prep content in library before print is triggered.
- **No book-onboarding.html page** — book prep fields live in the library itself.

---

## Build Order Context

Library is built before emails are updated, because:
- Emails need to describe the library accurately
- Once library is built, we know exactly what to write

After library:
1. Update all emails (library link in footer of every email; accurate library description in welcome email)
2. Add "Resend my library link" to website (simple form — won't function until Make is built)
3. Update master-architecture.html
4. Reset Airtable to final schema
5. Build Make scenarios last
