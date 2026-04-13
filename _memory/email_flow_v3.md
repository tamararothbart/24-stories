---
name: 24 Stories — Email Flow v3.1 (definitive)
description: Complete ordered email flow for v3.1. New numbering 1–16. All stale emails deleted. Active emails listed with trigger sequence. Load at start of any email session.
type: project
originSessionId: 4f091a65-6943-4839-bc63-4a2f26f75ebe
---
# 24 Stories — Email Flow v3.1

**Last updated: 2026-04-11**

---

## EMAIL NUMBERING — v3.1 FINAL

16 active emails. Old numbering (with gaps) is gone. Files are 1–16 with no gaps.
9 retired emails deleted: email-10, 11, 12, 14, 15, 23, 24, 25, 26 (old numbering).

---

## ACTIVE EMAILS — In trigger order

### A. SIGNUP (all fire simultaneously on PayFast confirmation)

**email-1-storyteller-welcome.html**
- Trigger: PayFast payment confirmed
- Recipient: Storyteller
- Purpose: welcome, library description, library link
- ✅ PROOFED & LOCKED 2026-04-12. Subheadings added (Your First Prompt / Your Story Library / Your Story Helper). Library block in red. Photo upload clarified (library = gap-fill, not first call). "all 26 chapters" throughout.

**email-2-giftgiver-confirmation.html**
- Trigger: PayFast payment confirmed (filter: GiftGiverEmail ≠ StorytellerEmail)
- Recipient: Gift Giver only
- Purpose: confirms gift, manages expectations
- ✅ PROOFED & LOCKED 2026-04-12. "all 26 chapters" updated. Redundant legacy line removed. T&C moved from body to small grey footer disclaimer.

**email-3-storyhelper-welcome.html**
- Trigger: PayFast payment confirmed (filter: StoryHelperEmail not empty AND ≠ GiftGiverEmail AND ≠ StorytellerEmail)
- Recipient: Story Helper
- Purpose: role explanation, library access
- ✅ PROOFED & LOCKED 2026-04-12. Opening line updated to work for gift and self-subscription. Library note moved into "Add a photograph" bullet. Library block red. Prompts-guidelines paragraph removed.

---

### B. WEEK 1

**email-4-week1-prompt.html**
- Trigger: Make sends on week 1 scheduled day
- Recipient: Storyteller + Story Helper (separate sends)
- Purpose: Week 1 prompt with tell.html link + How It Works block
- ✅ PROOFED & LOCKED 2026-04-12. "How it works" updated: photo/caption point added (upload at time of telling or later via library). "26 chapters" corrected. Library block in place.

---

### C. DAY 4 REMINDER (repeats every week if no story submitted)

**email-5-day4-reminder.html**
- Trigger: 4 days after prompt, if no story submitted
- Recipient: Storyteller + Story Helper (separate sends)
- Purpose: gentle nudge, repeats current prompt
- ✅ PROOFED & LOCKED 2026-04-12. "your family is waiting" → "your family would love to read it". Library block in place. EXISTS IN MAKE — needs v3.1 rebuild.

---

### D. STORY SUBMITTED → EDITED → SENT (fires when Tamara edits story in Airtable)

**email-6-storyteller-story-confirmation.html**
- Trigger: Tamara edits story in Airtable → Make sends
- Recipient: Storyteller only
- Purpose: confirms story has been edited and sent to family
- ✅ PROOFED & LOCKED 2026-04-12. No changes needed.

**email-7-family-story-delivery.html**
- Trigger: same as above — fires alongside email-6
- Recipient: Family list (all FamilyEmails, up to 10)
- Purpose: delivers the edited story to family
- No library block — family recipients only
- ✅ PROOFED & LOCKED 2026-04-12. No changes needed.

---

### E. WEEKS 2–26 (repeats weekly)

**email-8-regular-prompt.html**
- Trigger: Make sends weekly on schedule, weeks 2–26
- Recipient: Storyteller + Story Helper (separate sends)
- Purpose: weekly prompt with tell.html link
- ✅ PROOFED & LOCKED 2026-04-12. Full prompt structure added (WeekName, Theme, Prompt, Other Angles). Photo/caption messaging corrected. Sign-off added. WeekName + Theme added to variables.

---

### F. WEEK 26 — BOOK PRODUCTION

**email-9-book-onboarding-week26.html**
- Trigger: week 26 prompt sent → Make fires
- Recipient: Storyteller
- Purpose: signals book production phase, directs to library book prep
- ✅ PROOFED & LOCKED 2026-04-12. 4-step list (fill stories, add photos, complete book details incl. title, mark complete). "No deadline — sooner you press, sooner book arrives." "Five minutes" line removed. Title field: default shown, subscriber can replace.

**email-10-book-onboarding-reminder.html**
- Trigger: Day 3 + Day 7 after email-9, while BookFormCompleted = empty
- Recipient: Storyteller
- Purpose: reminder to complete book prep in library
- ✅ PROOFED & LOCKED 2026-04-12. H1: "Your Story Library is incomplete." Body rewritten. ReminderNumber variable removed — both sends use identical content. "Five minutes" removed. hello@ contact line added.

**email-11-book-onboarding-overdue.html**
- Trigger: Day 14 after email-9, BookFormCompleted still empty
- Recipient: Storyteller
- Purpose: firm but warm — after this, Scenario 9 stops, Tamara handles manually
- ✓ "Legacy Book" label updated

**email-12-book-delivery-confirmation.html**
- Trigger: Make fires when Tamara sets BookSentToPrintDate in Airtable
- Recipient: Storyteller (+ Gift Giver separately if gifted — Tamara sends manually from hello@)
- Purpose: book has gone to print, allow up to 3 weeks for delivery
- ✅ PROOFED & LOCKED 2026-04-12. "Your book" replaces [StorytellerFirstName]'s throughout. "Up to three weeks" delivery. BookDispatchedDate removed — BookSentToPrintDate is the trigger field.

---

### G. EXTRA COPIES

**email-14-extra-copies-confirmation.html**
- Trigger: Make fires when extra copies PayFast payment confirmed
- Recipient: Buyer (Storyteller or Gift Giver)
- Flow: subscriber requests via library → Make sends PayFast link (R1,200 × Quantity) → payment → this email
- ✓ Full rewrite v3.1; old R850 pricing and book.html references removed

---

### H. EXCEPTION HANDLING (manual — sent by Tamara from hello@)

**email-13-late-delivery-apology.html**
- Manual. Sent if courier delays.
- ✓ No changes needed

**email-15-pause-confirmation.html**
- Manual. Tamara sends after receiving pause request from subscriber.
- ✅ REWRITTEN v3.1 (2026-04-12). Cancellation email replaced entirely with pause confirmation.
- Tamara actions: set PauseStartDate, tick IsPaused checkbox in Airtable. Make stops prompts when IsPaused = true. Fill [PauseExpiryDate] (12 months from SubscriptionStartDate) before sending.
- To resume: subscriber emails hello@. Tamara unticks IsPaused, ticks IsResumed, restarts Make schedule manually.
- Pause policy: up to 12 months from subscription start date. Library stays accessible. Resume by emailing hello@.

**email-16-refund-confirmation.html**
- Manual. Exceptional circumstances only (non-refundable policy).
- ✅ PROOFED & LOCKED 2026-04-12. No changes needed.

---

## REFUND / PAUSE POLICY — LOCKED 2026-04-11

- **Purchase is non-refundable.** Disclosed at checkout with checkbox: "I understand this purchase is non-refundable."
- **Pause option:** one pause allowed, up to 12 months from subscription start date. Subscriber emails hello@ to request.
- During pause: weekly prompt emails stop; library remains accessible.
- Resumption: Tamara adjusts Make schedule manually to resume from correct week.
- Email-2 (Gift Giver) includes T&C note referencing pause option.
- No automated pause logic in Make at this stage — Tamara manages manually.

---

## PAYMENT FAILURE — DECISION

Payment failure emails (old 10, 11, 12) cut entirely.
Reason: Once-off payment model. If PayFast fails at checkout, subscriber simply doesn't get access — no record is created in Airtable (Make only creates record on PayFast COMPLETE status). PayFast handles its own failed transaction notifications. No drip sequence needed.

---

## LIBRARY LINK — Standard block in all Storyteller/Story Helper emails

All applicable emails now have a prominent library block before the sign-off:
- Gold "YOUR STORY LIBRARY" label
- Gold CTA button: "Open your library →"
- Raw URL below button for copy/forwarding

Email-7 (Family Story Delivery) and email-13 (Late Delivery Apology) excluded — wrong recipient type.

---

## EMAIL DESIGN STANDARD (all emails)

- Body: 17px Georgia serif
- H1: 30px
- Gold labels: 14px bold
- Footer: 15px #444
- Gold links, underlined
- Greeting: "Hello [FirstName]..."
- Sign-off: "With warmth, The 24 Stories Team"
- Logo on every email
- Sender: stories@24stories.co.za (Mailjet, automated)
- Customer service replies: hello@24stories.co.za (Titan, manual only — never in automation)

---

## NEXT SESSION TRIGGER

Say **"emails"** to load this flow. Emails 1–16 are ready for proofreading in order.
Next build step: Add "Resend my library link" form to main website (index.html).
