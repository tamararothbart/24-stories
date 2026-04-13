---
name: 24 Stories — v3.1 Architecture (final)
description: All confirmed decisions from sessions 2026-04-06 and 2026-04-10. Payment model, book production, offer structure, email status, build order.
type: project
originSessionId: 4f091a65-6943-4839-bc63-4a2f26f75ebe
---
# 24 Stories — v3.1 Architecture (final)

**Last updated: 2026-04-12**
**Status: Architecture locked. Pricing locked. Emails 1–16 v3.1 ready — awaiting Tamara proofread. Build sequence confirmed.**

---

## The Offer — Single Product

**R6,795 — once-off upfront payment. Everything included.**

- 26 weekly story prompts (with alternative angles — not full alternative prompts, just alt words/framings)
- Professional editing on every story
- Stories shared with family each week via automated email
- Story Library (token-based portal) with photo upload per story
- One professionally designed, printed hardcover Legacy Book
- Delivered to door (Courier Guy)
- Extra copies: R1,200 each, ordered at proof stage

No monthly subscription. No tiers. No upgrades. No book-only option at launch.

---

## Payment Model

- **Once-off upfront via PayFast** — single transaction at signup
- No recurring debit orders
- No failed payment flow needed
- Cancellation/refund: manual, handled by Tamara via hello@24stories.co.za
- Refund policy TBC — document before launch

---

## Pre-Launch Testing (not a beta offering)

- 5–6 people will test the product for free (accelerated free trial, not public)
- Mock paywall in place on website during testing period
- No public beta pricing. Launch directly with R6,795 paid offering.
- Feedback from testers used to refine before launch.

---

## Gift vs Self-Purchase — Wording Decision

**Straddle both. Do not pick a side.**

- All competitors (StoryWorth, Remento, Circa Legacy) use receiver/storyteller-focused language that works for both audiences
- "Their stories" = parent's stories (gift buyer) OR own stories (self-buyer)
- **Approved hero copy:** "The stories only they can tell." — works for both
- Signup form already has two paths: "I'm giving this as a gift" / "I'm telling my own story"
- Do not change the hero copy without discussing first

---

## Subscriber Roles

**Storyteller** — primary. Receives all prompt emails, owns Story Library.
**Story Helper** — optional. Receives same prompts (Make filter: StoryHelperEmail not empty). Same library token.
**Gift Giver** — optional. Receives Email 2 only. On FamilyEmails list.
**Family** — receive Email 6 (story delivery) only.

---

## Story Library (library.html)

**See library_decisions.md for full locked spec. Summary:**

- URL-based access: library.html?id=SUB001 — subscriber ID in URL param
- Library link in footer of every email. "Resend my library link" form on main site.
- **All 26 prompts unlocked from day one** — pay-upfront model, no lock logic needed
- Stories read-only for subscribers. Only Tamara edits (via Airtable EditedText field). Corrections via hello@.
- Photo upload any time, any week, even without a story. Replacement allowed with warning.
- Family delivery still weekly via Make schedule regardless of when story was recorded.
- Book prep section: Portrait, Cover image, Dedication (subscriber-editable), Book summary (Tamara writes at week 26, read-only)
- **Library IS the proof** — no separate client proof for book design
- Three user types: Storyteller, Story Helper (same URL), Tamara (via URL from Airtable)
- Technical: Airtable API (read-only key) for reads; Make webhook for writes

---

## Signup Form

Collects: Storyteller name/email, Story Helper (optional), Gift Giver (optional), Family email list.
**No delivery address at signup** — collected in book onboarding form (needed for courier).

---

## Book Production — Process (Tamara Only, MVP)

1. Export 26 stories + captions + image URLs from Airtable
2. Designer fills in book template — Canva vs Reedsy NOT locked yet (pending StoryWorth automation research)
3. Add cover photo, portrait, dedication, title from library book prep fields
4. Export as print-ready PDF
5. Send to local SA printer (~R1,100 per book)
6. **Set BookSentToPrintDate in Airtable** — this triggers Make to send email-12 to subscriber (allow up to 3 weeks for delivery)
7. Courier Guy delivery (~R150)

**No Blurb API** — too expensive at current volume. Revisit at 50+ books/year.
**Book automation deferred** — Airtable fields exist and will sit empty until triggered. Adding automation later does not disrupt existing Make scenarios (clean separation at week 26).
**StoryWorth automation** — under research. If their fully automated book pipeline is replicable, this changes the book production approach.

---

## Book Onboarding Form (in library)

Three fields only:
1. Cover photo (optional)
2. Portrait photo (optional)
3. Dedication/epigraph (optional)
4. **Delivery address** (required — for Courier Guy)

---

## Email Status — v3.1 FINAL (updated 2026-04-12)

**16 active emails, numbered 1–16 with no gaps. All old numbering obsolete.**
**9 retired emails deleted. Payment failure emails cut (once-off model — not needed).**

| # | File | Recipient | Trigger | Status |
|---|---|---|---|---|
| 1 | email-1-storyteller-welcome | Storyteller | PayFast confirmed | v3.1 ready — awaiting Make build |
| 2 | email-2-giftgiver-confirmation | Gift Giver | PayFast confirmed | v3.1 ready — awaiting Make build |
| 3 | email-3-storyhelper-welcome | Story Helper | PayFast confirmed | v3.1 ready — awaiting Make build |
| 4 | email-4-week1-prompt | Storyteller + Helper | Week 1 scheduled | v3.1 ready — awaiting Make build |
| 5 | email-5-day4-reminder | Storyteller + Helper | Day 4, no story | EXISTS IN MAKE — needs v3.1 update (OtherAngles, library block) |
| 6 | email-6-storyteller-story-confirmation | Storyteller | After Tamara edits | v3.1 ready — awaiting Make build |
| 7 | email-7-family-story-delivery | Family | After Tamara edits | EXISTS IN MAKE — v3.1 content ok |
| 8 | email-8-regular-prompt | Storyteller + Helper | Weeks 2–26 | v3.1 ready — awaiting Make build |
| 9 | email-9-book-onboarding-week26 | Storyteller | Prompt 26 sent | v3.1 ready — awaiting Make build |
| 10 | email-10-book-onboarding-reminder | Storyteller | Day 3 + 7 after Email 9 | v3.1 ready — awaiting Make build |
| 11 | email-11-book-onboarding-overdue | Storyteller | Day 14 after Email 9 | v3.1 ready — awaiting Make build |
| 12 | email-12-book-delivery-confirmation | Storyteller | BookSentToPrintDate set | v3.1 ready — awaiting Make build |
| 13 | email-13-late-delivery-apology | Storyteller/GiftGiver | Manual | v3.1 ready — manual template |
| 14 | email-14-extra-copies-confirmation | Buyer | Extra copies PayFast | v3.1 ready — awaiting Make build |
| 15 | email-15-cancellation | Subscriber | Manual | v3.1 ready — manual template |
| 16 | email-16-refund-confirmation | Buyer | Manual (exceptional only) | v3.1 ready — manual template |

---

## Airtable Schema — v3.1 (4 tables)

**Table 1 — Subscribers**
StorytellerFirstName, StorytellerSurname, StorytellerEmail, StoryHelperName, StoryHelperEmail, GiftGiverName, GiftGiverEmail, FamilyEmails, DeliveryAddress, DeliveryPhone (mobile number shared with courier), Phone, SubscriptionStartDate, Status (Active/Complete/Cancelled), PromptNumber, LibraryToken, BookFormCompleted (date — subscriber presses Complete; triggers Make to alert Tamara), BookTitle (subscriber-editable; default "The Collected Stories of [FirstName] [Surname]"), CoverPhotoURL, PortraitPhotoURL, DedicationText, BookSummary (written by Tamara at week 26 — custom per subscriber, read-only in library), BookCompiledDate, BookSentToPrintDate (date — Tamara sets when book goes to printer; triggers Make to send email-12. BookDispatchedDate removed — no longer used as email trigger.), BookProductionStatus (formula field — auto-derived: "In Design" if BookFormCompleted filled + BookCompiledDate empty; "Ready for Print" if BookCompiledDate filled + BookSentToPrintDate empty; "At Printer" if BookSentToPrintDate filled), PauseStartDate (date — Tamara sets when pause begins), IsPaused (checkbox — Tamara ticks to pause prompt schedule; Make watches this field to stop sending prompts), IsResumed (checkbox — Tamara ticks when subscriber resumes; Make watches this to restart prompt schedule from correct week), Status (Active / Paused / Complete / Cancelled)

**Airtable view to build: "Books in Production"**
- Filter: BookFormCompleted is not empty
- Sort: BookFormCompleted ascending (longest waiting first)
- Fields shown: StorytellerFirstName, BookProductionStatus, BookFormCompleted, BookCompiledDate, BookSentToPrintDate

**Table 2 — Stories**
StoryID, SubscriberID (linked), PromptNumber, StoryText, StoryImageURL, StoryImageCaption, SubmissionDate, WeekTheme, EditedText (Tamara's edited version)

**Table 3 — Prompts**
PromptNumber (1–26), WeekName, Theme, PromptText, OtherAngles (short keyword alternatives — e.g. "Heirlooms, Traits, Family Lore" — not full alternative prompts)

Prompt format: "Prepare a five-minute story about [subject]."
OtherAngles format: comma-separated keywords only.

**Table 4 — Payments**
SubscriberID (linked), PayFastTransactionID, Amount, Date, Status

---

## Pages — v3.1

**Not needed at launch:** review.html, book.html (extra copies handled manually)
**Still to build:** library.html, "Resend my library link" on main site

---

## DNS / SPF

- TXT @ record: `v=spf1 include:secureserver.net include:spf.titan.email include:spf.mailjet.com ~all`
- dc-77d78235e8._spfm intact — do not touch
- **GoDaddy resolved** — confirmed include:mailjet not deleted. SPF is correct. No further action needed.

---

## Make Scenarios — on hold

All on hold until: (a) Titan SPF resolved, (b) Airtable rebuilt.

### Scenario list (build order TBD)

| # | Name | Trigger | Purpose |
|---|---|---|---|
| 1 | Signup | PayFast COMPLETE | Create Airtable record, send emails 1, 2, 3 |
| 2 | Signup — Story Helper filter | Same as Scenario 1 | Send email-3 only if StoryHelperEmail not empty |
| 3 | Week 1 Prompt | Scheduled | Send email-4 to Storyteller + Helper |
| 4 | Prompt Delivery (weeks 2–26) | Scheduled daily | Send email-8 on each subscriber's delivery day |
| 5 | Day 4 Reminder | Scheduled daily | Send email-5 if no story submitted by day 4 |
| 6 | Story Edited | Airtable: EditedText filled | Send email-6 (Storyteller) + email-7 (Family) |
| 7 | Resend Library Link | Webhook (index.html form) | Look up subscriber by email, send library URL |
| 8 | Book Onboarding | Prompt 26 sent | Send email-9; schedule Scenario 9 reminders |
| 9 | Book Onboarding Reminders | Day 3 + Day 7 post-email-9 | Send email-10; Day 14 send email-11 if still empty |
| 10 | **Daily Book Production Alert** | **Scheduled daily (8am)** | **Check all books in production. Send alert to Tamara only if any book is overdue. Two tiers: Yellow (42+ days since BookFormCompleted, BookSentToPrintDate empty) and Red (49+ days). Email lists: subscriber name, date pressed Complete, days elapsed, current stage. No email sent on quiet days.** |
| 11 | Book Sent to Print | Airtable: BookSentToPrintDate filled | Send email-12 to Storyteller (+ manual Gift Giver copy) |
| 12 | Extra Copies | PayFast COMPLETE (extra copies) | Send email-14 to buyer |
| 13 | **Pause Expiry Reminder** | **Daily check: IsPaused = true AND 12 months from SubscriptionStartDate approaching** | **Send reminder to subscriber to email hello@ to resume. Tamara then unticks IsPaused, ticks IsResumed, restarts Make schedule manually.** |

---

## Launch Dates

Build deadline: 30 April 2026 | Launch: 8 June 2026 at 7pm SAST

---

## Build Order (updated 2026-04-12)

Book production automation is deferred — it is isolated at week 26 and can be added later without disrupting anything.

1. ~~Update website pricing + FAQ to v3.1~~ — DONE
2. ~~Audit all emails against v3.1 offer~~ — DONE
3. ~~Update Airtable Prompts table: WeekName, Theme, PromptText, OtherAngles (26 rows)~~ — DONE
4. ~~Edit tell.html~~ — DONE (v3.1 prompt structure, URL params updated)
5. ~~Build library.html~~ — DONE
6. ~~Update all emails to v3.1 (1–16, library blocks, correct numbering)~~ — DONE
7. ~~Add "Resend my library link" form to index.html~~ — DONE
8. **Proofread emails 1–16** — IN PROGRESS (Tamara's pass)
9. Update master-architecture.html to v3.1
10. Reset Airtable to final v3.1 schema (4 tables, exact field names locked before Make build)
    — Add BookProductionStatus formula field to Subscribers table
    — Build "Books in Production" view in Subscribers table
11. Produce locked Airtable field name document + Make scenario module maps (12 scenarios)
12. Prepare Make-ready paste content for every email (subject lines + HTML with Make syntax)
13. Verify Mailjet domain verification (stories@24stories.co.za DKIM live on GoDaddy)
14. Build Make scenarios 1–12 — working from maps, pasting pre-prepared content
    — Scenario 10 (Daily Book Production Alert): yellow alert 42+ days, red alert 49+ days; no email on quiet days

GoDaddy / SPF: resolved. No action needed.
