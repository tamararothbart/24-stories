---
name: Master Project Schema — 24 Stories
description: Full project management schema across all open streams, dependencies, and what can be actioned independently
type: project
---

**Last updated: 2026-03-23**
**Build deadline: 30 April 2026 | Launch: 8 June 2026 at 7pm SAST**

---

## NEXT BACKEND SESSION — Start Here

Work through in this order:

1. **Redeploy to Netlify** — drag 24stories-website folder onto Netlify deploy area (resilient-eclair-c46b34). Subscription form is already wired to Make webhook. Test a live submission end-to-end after deployment.
2. **Scenario 5 errors** — user has 3 error messages from Make to share. Fix reminder emails.
3. **Scenario 4 — Alt 1 & Alt 2** — add to Mailjet email HTML + update tell.html button URL to pass alt1 and alt2 as URL params. tell.html already receives them — no changes needed there.
4. **Scenario 3 — Family email delivery** — fix "Missing value of required parameter 'id'" — Airtable Get Record not receiving Record ID from Watch Record.
   - **Also test: single-recipient edge case** — Scenario 3 uses Recipient 1–10 fields via split formula. If fewer than 10 emails are provided, empty slots may cause Mailjet to error. Test by submitting a story with only one recipient. If it errors, fix by adding an `ifempty` or conditional filter in Make to exclude blank recipient fields.
5. **Airtable — add new fields** (can be done any session, no dependencies):
   - Stories table: `ImageURL`, `Caption` (one image + caption per story)
   - Stories table: `AudioURL` (Cloudinary URL of original voice recording — for QR codes in book)
   - Stories table: `PromptNumber` field if not already present (links story to correct prompt slot)
   - Subscribers table: `CoverImageURL`, `Dedication` (for Legacy Book cover)
   - Subscribers table: `BookUpgrade` (yes/no — has subscriber paid for book)
   - Subscribers table: `StoriesComplete` (count or boolean — triggered when prompt 26 submitted)
   - Subscribers table: `PhoneNumber` (for WhatsApp prompt delivery and future outbound calls)
   - Subscribers table: `FamilyHelperEmail` (optional — person who helps storyteller click links in early weeks)
   - Subscribers table: `GeneratedPrompt` (AI-personalised prompt overrides standard prompt if populated)
6. **Cloudinary account** — set up free account for image storage (tamara to do, ~10 min)
7. **my-stories.html** — build subscriber personal page:
   - Accessed via unique link with subscriber ID in URL: `?id={{subscriber_record_id}}`
   - Link included in every prompt email ("View your stories")
   - **Cover section (top):** upload cover photo + write dedication → saves to Subscribers table
   - **26 story cards (below):** one per prompt (24 stories + 2 wisdom prompts)
     - Submitted stories: show prompt text, story text, image upload slot, caption field, save button
     - Future/unsubmitted prompts: shown as placeholders — locked, no upload available yet
   - Images upload to Cloudinary → URL saved to Airtable Stories table (ImageURL field)
   - Captions saved to Airtable Stories table (Caption field)
   - Subscriber can return and update images/captions at any time
8. **Book template** — HTML/CSS compiled to PDF. Pulls all 26 stories + images from Airtable for a given subscriber. Custom cover. Manual trigger by Tamara during beta.
9. **Scenario 2 update** — image upload webhook: when subscriber uploads image via my-stories.html, Make receives image URL + story record ID and saves to correct Airtable Stories record.

---

## STREAM A — Make Automation

| Task | Status | Blocked by |
|---|---|---|
| Scenario 4 — Alt 1 & Alt 2 in prompt email + tell.html button URL | To do | Nothing |
| Scenario 5 — Reminder emails (3 errors) | Broken | User to share error messages |
| Scenario 3 — Family email delivery error | To do | Nothing |
| Scenario 3 — Single-recipient edge case test | To do | Scenario 3 fixed first |
| Scenario 2 — Image upload webhook (update) | To do | my-stories.html build |

---

## STREAM B — Website

| Task | Status | Blocked by |
|---|---|---|
| Redeploy to Netlify | To do — next session | Nothing |
| Website copy | In progress — Tamara | Nothing |
| Hero photograph | In progress — Tamara | Favour/shoot (no budget) |
| Book mockup images | To do | Midjourney walk-through with Claude |
| Testimonial portrait photos | To do | Arrange actors/real people |
| my-stories.html build | To do | Airtable fields added first |
| Legacy Book sales page | To do | Book mockup image |
| Paywall installation (inactive during beta) | To do | Site stable |
| Mobile and desktop optimisation | To do | Site stable |
| SEO optimisation | To do | Site stable |

---

## STREAM C — Testing

| Task | Status | Blocked by |
|---|---|---|
| External beta testers — full flow test | To do | Make fixes + site deployed |
| Voice recording fix on external devices | To do | External testers |

---

## STREAM D — Book Product Backend

| Task | Status | Blocked by |
|---|---|---|
| Cloudinary account setup (free) | To do | Nothing — Tamara to do |
| Airtable: add ImageURL + Caption + AudioURL to Stories table | To do | Nothing — do now |
| Airtable: add CoverImageURL + Dedication to Subscribers table | To do | Nothing — do now |
| Airtable: add BookUpgrade + StoriesComplete to Subscribers table | To do | Nothing — do now |
| Airtable: add PhoneNumber + FamilyHelperEmail + GeneratedPrompt to Subscribers table | To do | Nothing — do now |
| tell.html: upload audio recording to Cloudinary at submission, save AudioURL to Airtable | To do | Cloudinary set up |
| my-stories.html — full build with cover section + 26 story cards | To do | Airtable fields ready + Cloudinary set up |
| Book template (HTML to PDF, 26 stories + images + QR codes from AudioURL) | To do | AudioURL populated in Airtable |
| Scenario 2 update — image + audio upload saves to correct Airtable record | To do | my-stories.html built |
| signup form: add PhoneNumber + FamilyHelperEmail fields | To do | Nothing |
| Scenario 4 update: send prompt via WhatsApp (360dialog) as well as email | To do | WhatsApp Business account + 360dialog setup |
| Scenario 4 update: add FamilyHelperEmail as CC recipient on prompt | To do | Airtable field added |
| suggest.html — simple family prompt suggestion form | To do | Nothing |
| Airtable: new SuggestedPrompts table (SubscriberID, SuggestedBy, Suggestion, DateSubmitted, Used) | To do | Nothing |
| Scenario 6 (new) — webhook receives prompt suggestion → saves to SuggestedPrompts table → notifies Tamara | To do | suggest.html built |
| Scenario 3 update: add "Suggest a story" link to family email footer | To do | suggest.html built |

## STREAM E — Pre-Beta (must be done before beta testing)

| Task | Status | Notes |
|---|---|---|
| Adaptive AI prompting — Claude API reads prior stories, generates personalised next prompt | To do | Medium build. Plugs into Scenario 4. Requires GeneratedPrompt field in Airtable. |
| Outbound simple call (Twilio) — Make triggers call with prompt, records response, transcribes via Whisper | To do | Medium build. Requires phone number field + Twilio account. |
| Conversational AI call (Vapi.ai / Bland.ai) — live AI voice agent conducts interview | To do | High build. 2–3 weeks. Requires voice agent tuning for warm, human feel. |

---

## What Can Be Done Right Now (no dependencies)

- Set up Cloudinary (free, ~10 minutes)
- Add all new Airtable fields (ImageURL, Caption, CoverImageURL, Dedication, BookUpgrade, StoriesComplete)
- Share Scenario 5 error messages with Claude
- Arrange actors/real people for hero photo and testimonial portraits
- Work on website copy

## Single Biggest Blocker

**Netlify redeployment** — needed before any live backend testing can happen.

---

## Notes

- Subscription form IS already wired to Make webhook in script.js — no relinking needed after deployment
- Total prompts per subscriber: 26 (24 stories + 2 wisdom/family message prompts)
- my-stories.html must show all 26 prompt slots, not just 24
- Hero photograph: no budget, calling in favours. Shoot brief saved in conversation.
- All 5 Make scenarios must stay ON — check toggles each session, they auto-deactivate on errors
- Make free trial auto-drops to Free plan — no action needed, nothing deleted
- Midjourney book mockup: Claude to walk Tamara through — she is a novice with the tool
- Testimonials and book covers use fictional names and actors for launch — replace with real ones as beta subscribers come in
