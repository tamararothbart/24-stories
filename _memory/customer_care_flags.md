---
name: Customer Care — Known Issues and Fallbacks
description: Flagged edge cases and problem-solving notes for customer care. Not on the website. Handle via hello@24stories.co.za.
type: project
originSessionId: 0e25d345-75a8-4323-8f7d-1395e723049d
---
# Customer Care — Known Issues and Fallbacks

## Recording / Transcription Failure

**What happens:** If the audio upload to Cloudinary or the Whisper transcription call fails, the page shows an error: "Something went wrong — please try again or switch to typing." It drops back to the record button.

**Current error handling:** Minimal. The storyteller sees a generic error and is told to try again or type instead.

**Proposed fallback (not yet on site — to be decided):**
- Ask the storyteller to record using their phone's Voice Memos / Voice Recorder app
- Send the audio file to hello@24stories.co.za
- Tamara transcribes manually (or uses a separate tool) and enters the text into Airtable

**Why this matters:** Elderly or less tech-confident users may not know what to do with a technical error. A warm, clear fallback instruction prevents story loss and reduces abandonment.

**To do:** Decide whether to add a fallback instruction to the error message on the page, or handle entirely via email. Consider adding to the "Before you begin" section or the error state copy.

---

## Shipping — Flags for Website and Email (raise when working on these)

**Website FAQ** — DONE (2026-04-11). International delivery entry added. Book FAQ updated to mention free delivery and extra copies pricing tiers.

**Website plan card** — DONE (2026-04-11). "Delivered to your door" updated to "Free delivery within South Africa".

**Email-20 (book dispatch)** — ⚠ still to do. Add line: *"Your book is on its way — delivered to your door, on us."* Raise when working on emails.

**Library delivery address field** — DONE (2026-04-11).

---

## How Recording Actually Works (for Tamara's reference)

- Audio is captured via MediaRecorder in the browser — no real-time transcription
- On stop: audio uploads to Cloudinary, then sent to Netlify function (Whisper transcription)
- Wait is ~15 seconds **after stopping** — not during speaking
- Transcribed text appears in an editable textarea — storyteller can correct before submitting
