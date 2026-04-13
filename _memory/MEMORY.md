# Memory — 24 Stories Project

## ⚠ NEXT SESSION — START HERE
- [Build status](session_start_master_architecture.md) — **master-architecture.html DONE v3.1. 18-item build order: items 1–9 done, 10–18 TODO. Next: finish email proofread (item 8), then items 10–18 in order.**

## ⚠ SESSIONS 2026-04-10 / 2026-04-11 — ALL DECISIONS LOCKED (READ FIRST)
- [The Final Offer](offer_final.md) — **load this at every session start. Trigger: "the offer". R6,795 once-off. Single product. All wording decisions inside.**
- [v3 Architecture Pivot](project_v3_pivot.md) — **master reference. Updated 2026-04-11. Once-off payment model, book production, email status, build order.**
- [Library Decisions](library_decisions.md) — **load before any library.html work. All structure, access, photo, book prep, and user role decisions locked 2026-04-11.**
- [Library Config Checklist](library_config_checklist.md) — ⚠ **raise automatically when Make scenarios are being built or library.html is being wired to live data.** Airtable key, base ID, 4 Make webhooks, formula field.
- [Email Flow v3.1](email_flow_v3.md) — **load at start of any email session.** New numbering 1–16. All content updated. Trigger: "emails"
- [Pricing Logic](project_pricing.md) — full cost build-up, extra copies model, escalation path. Trigger: "pricing"
- [v3 Flow Decisions](flow_v3_decisions.md) — cradle-to-grave flow. Locked 2026-04-06. Still valid.
- [Prompts v3](prompts_v3.md) — 26-week prompt schedule. Locked 2026-04-06. Airtable Prompts table DONE.

## Status as of 2026-04-12 (updated end of session 5)
- **Price locked: R6,795 once-off upfront. Single offer. Book always included.**
- **Payment model: once-off via PayFast. No monthly subscription.**
- **No public beta. 5–6 free testers (accelerated trial), then straight to paid launch.**
- **Mock paywall on website during testing period.**
- **Wording: "The stories only they can tell." Straddle gift + self-purchase. Book not memoir.**
- **Key differentiators: (1) human editing by Tamara, (2) stories go out to family as written each week.**
- **Prompts: OtherAngles field — short keywords only (e.g. "Heirlooms, Traits, Family Lore"). Not full alternative prompts. Format: "Prepare a five-minute story about [subject]."**
- **Airtable Prompts table: DONE. WeekName, Theme, PromptText, OtherAngles. 26 rows entered.**
- **Library: all 26 prompts unlocked from day one (pay-upfront). No prompt lock logic. See library_decisions.md.**
- **Library access: URL-based (library.html?id=SUB001). Link in every email. "Resend link" form on main site.**
- **No client proof for book — library IS the proof.**
- **Book: PHYSICAL printed hardcover. Local SA printer + Courier Guy. Up to 3 weeks delivery from print. NOT digital PDF.**
- **Book title: default "The Collected Stories of [FirstName] [Surname]" — subscriber-editable in library. Airtable field: BookTitle (Subscribers table).**
- **Cover logic LOCKED: Portrait photo = inside cover page. Cover image = front cover (portrait as fallback only). Never conflate the two in copy.**
- **Book summary: Tamara writes custom per subscriber at week 26. Entered in Airtable (BookSummary field). Read-only in library.**
- **Book automation: deferred. Build full offer flow now; add book automation later without disruption.**
- **Extra copies: R1,200 each. Ordered via library → Make sends PayFast link → payment → email-14 fires.**
- **GoDaddy/SPF: resolved. include:mailjet confirmed intact. No further action.**
- **Refund policy: NON-REFUNDABLE. Disclosed at checkout with explicit checkbox. Pause option offered instead (up to 12 months from start date, email hello@ to request). See email_flow_v3.md.**
- **Make only creates Airtable record AFTER PayFast payment_status = COMPLETE. Never before.**
- **Payment failure emails: CUT. No drip sequence needed under once-off model.**

## Project Files

### 24 Stories Website
- `/Users/tamararothbart/24stories-website/index.html` — main site (FAQ fully updated to v3.1; resend form added — awaiting hero images)
- `/Users/tamararothbart/24stories-website/tell.html` — story submission page (updated to v3.1 prompt structure — see URL params below)
- `/Users/tamararothbart/24stories-website/master-architecture.html` — v3.1 DONE (rebuilt 2026-04-12). 18-item build order. Items 1–9 done, 10–18 TODO.
- Domain: 24stories.co.za — Netlify (resilient-eclair-c46b34.netlify.app)

### tell.html — URL Param Structure (v3.1) — LOCKED
Make builds the prompt link per subscriber per week using these params (use + for spaces, not %20):
- `id` — SubscriberID
- `week` — week number (e.g. `2`)
- `weekname` — overarching idea (e.g. `Youthful+Imaginings`)
- `theme` — theme keyword (e.g. `Beginnings`)
- `prompt` — full prompt text (e.g. `Prepare+a+five-minute+story+about...`)
- `angles` — OtherAngles comma-separated (e.g. `Compromise,+Rite+of+Passage`)

**No more alt1 / alt2 params — removed.** **No decodeURIComponent calls** — URLSearchParams already decodes.

### Email Folder — v3.1 FINAL (2026-04-11)
`/Users/tamararothbart/24stories-website/24stories-emails/`

**16 active emails, numbered 1–16 with no gaps. 9 retired emails deleted.**

| # | File | Recipient | Trigger |
|---|---|---|---|
| 1 | email-1-storyteller-welcome | Storyteller | PayFast confirmed |
| 2 | email-2-giftgiver-confirmation | Gift Giver | PayFast confirmed |
| 3 | email-3-storyhelper-welcome | Story Helper | PayFast confirmed |
| 4 | email-4-week1-prompt | Storyteller + Helper | Week 1 scheduled |
| 5 | email-5-day4-reminder | Storyteller + Helper | Day 4, no story |
| 6 | email-6-storyteller-story-confirmation | Storyteller | After Tamara edits |
| 7 | email-7-family-story-delivery | Family | After Tamara edits |
| 8 | email-8-regular-prompt | Storyteller + Helper | Weeks 2–26 |
| 9 | email-9-book-onboarding-week26 | Storyteller | Prompt 26 sent |
| 10 | email-10-book-onboarding-reminder | Storyteller | Day 3 + 7 post-wk26 |
| 11 | email-11-book-onboarding-overdue | Storyteller | Day 14 post-wk26 |
| 12 | email-12-book-delivery-confirmation | Storyteller | BookSentToPrintDate set (Tamara) |
| 13 | email-13-late-delivery-apology | Storyteller/GiftGiver | Manual |
| 14 | email-14-extra-copies-confirmation | Buyer | Extra copies PayFast |
| 15 | email-15-pause-confirmation | Subscriber | Manual (Tamara sends after pause request) |
| 16 | email-16-refund-confirmation | Buyer | Manual (exceptional only) |

Design standard: 17px body, 30px h1, 14px bold gold labels, 15px footer #444, gold links underlined, "Hello..." greeting, "With warmth, The 24 Stories Team" sign-off, logo on every email.

Library block standard (all Storyteller/Story Helper emails): gold label + gold CTA button + raw URL below.

### Other Projects
- `/Users/tamararothbart/lifelegacy-website/index.html` — Life Legacy main site
- `/Users/tamararothbart/print-kit/story-starter-kit.html` — 54 print cards

## Brand
- Fonts: Cormorant Garamond, Playfair Display, Inter (website); Georgia serif (emails)
- Colors: charcoal #1A1A1A, gold #B8976A, cream #F7F5F2
- Currency: South African Rand (R). Tone: premium, intimate, serif-led, short sentences. No emojis.

## Email System
- Automated sender: stories@24stories.co.za (Mailjet)
- Customer service: hello@24stories.co.za (Titan) — manual only, never in automation
- Make filter rule: StoryHelperEmail not empty before every Story Helper Mailjet module

## Pricing — LOCKED
- **R6,795 once-off. Single offer. Book included. Extra copies R1,200 each.**
- All old pricing obsolete: R280, R285, R875, R900, R5,500, R5,795, R6,580, R1,200/month — do not reference.
- Future price increase: R6,500 after 10–20 subscribers + proof of concept.

## Make Scenarios — on hold
- On hold until: Airtable rebuilt to v3.1
- Payment failure scenarios: CUT — not needed under once-off model
- Airtable base name: "52stories" (old name, correct base)
- Global Make filter rule: StoryHelperEmail not empty before every Story Helper module
- ⚠ **[Prompt pace changes](make_prompt_pace.md) — READ THIS when building prompt scenarios or touching PromptNumber/frequency.**

## Airtable Schema — v3.1 (4 tables)
See project_v3_pivot.md for full field list.
1. Subscribers — includes DeliveryAddress, book production fields
2. Stories — includes EditedText field (Tamara's edits)
3. Prompts — 26 prompts + OtherAngles field (short keywords)
4. Payments — one record per PayFast transaction

## DNS / SPF
- TXT @: `v=spf1 include:secureserver.net include:spf.titan.email include:spf.mailjet.com ~all`
- dc-77d78235e8._spfm intact — do not touch
- **GoDaddy resolved — SPF correct, include:mailjet intact. No action needed.**

## Pages — v3.1
**Not needed:** review.html, book.html, book-onboarding.html
**Built:** "Resend my library link" form — live in index.html (`#resend-link` section). JS uses MAKE_WEBHOOK_URL_PLACEHOLDER — replace when Make scenario is built.

## Key Architecture Decisions — LOCKED
- Once-off upfront payment via PayFast (not monthly subscription)
- Make creates Airtable record ONLY on PayFast payment_status = COMPLETE
- Purchase is non-refundable — disclosed at checkout with checkbox
- Pause option: up to 12 months from start date, email hello@ to request
- All 26 prompts unlocked from day one in library
- Professional editing by Tamara on every story — core differentiator #1
- Stories go out to family as written each week — core differentiator #2
- Book is PHYSICAL (SA printer + Courier Guy). Up to 3 weeks delivery from print dispatch. No digital PDF.
- Book delivery email (email-12) triggered by Make when Tamara sets BookSentToPrintDate in Airtable (BookDispatchedDate removed)
- Book production automation deferred — isolated at week 26, add later without disruption
- No reviews collected at launch
- Cancellation/refund: manual via hello@. Pause option (up to 12 months from start). Email-15 is pause confirmation.

## Launch
- Build deadline: 30 April 2026 | Launch: 8 June 2026 at 7pm SAST
- Free testers: 5–6 people, accelerated trial, no charge, mock paywall on site

## Build Order (updated 2026-04-12, session 5) — 18 items
1. ~~Update website pricing + FAQ to v3.1~~ — DONE
2. ~~Audit all emails against v3.1 offer~~ — DONE
3. ~~Update Airtable Prompts table (26 rows)~~ — DONE
4. ~~Edit tell.html — v3.1 URL params~~ — DONE
5. ~~Build library.html~~ — DONE
6. ~~Update all emails to v3.1 (numbered 1–16)~~ — DONE
7. ~~Add "Resend my library link" form to index.html~~ — DONE
8. ~~Proofread emails 1–16~~ — DONE (2026-04-12, locked)
9. ~~Update master-architecture.html to v3.1~~ — DONE
10. **Fix library.html — add "Awaiting edit" story status** (StoryText filled, EditedText empty — currently shows "Not yet recorded" incorrectly)
11. **Resolve Prompts table field name: `Week` vs `PromptNumber`** — must be consistent before Airtable reset
12. **Confirm Scenario 13 Part B spec** — pause/unpause alert trigger mechanism + email content
13. Reset Airtable to final v3.1 schema (4 tables, all formula fields, "Books in Production" view)
14. Produce locked Airtable field name reference + Make scenario module maps (13 scenarios)
15. Prepare Make-ready email content — subject lines + HTML with Make syntax for all 16 emails
16. Verify Mailjet DKIM for stories@24stories.co.za on GoDaddy
17. Configure library.html for go-live (Airtable API key, base ID, 4 webhook URLs)
18. Build Make scenarios 1–13

## Customer Care Flags
- [Known issues and fallbacks](customer_care_flags.md) — recording failure fallback (voice memo → manual), error message copy TBD

## Build Flags
- [Make — Prompt Pace Changes](make_prompt_pace.md) — ⚠ raise whenever PromptNumber, prompt frequency, or Make scenario build comes up

## GitHub
- [GitHub Push Instructions](github_push_instructions.md) — step-by-step: create repo, first push, ongoing updates. Trigger: "push to GitHub" or "save to GitHub".

## User Preferences
- [Feedback: Make scenario fragility](feedback_make_scenario_fragility.md)
- South African English. No emojis. Concise serif-led copy.
