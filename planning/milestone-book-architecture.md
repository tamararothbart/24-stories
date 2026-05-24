# The Milestone Book — Full Architectural Document
**Status: Planning only. No build has started. Nothing in this document changes the live site, Airtable, or operations manual.**
**Last updated: 2026-05-24**

---

## 1. Product Overview

**The Milestone Book** — A collective tribute book for a person who matters. Up to 24 contributors each write one story about the same person. The gift giver commissions and organises it. Tamara edits every story. One beautifully printed hardcover is delivered to the gift giver to present.

### The Occasions
70th or 80th birthday · Retirement · 25th, 30th, 40th, 50th anniversary · Farewell · Tribute · Long service recognition

### Price
**R15,000 once-off.**
If the project does not reach print: **R7,500 refund + PDF of all submitted stories.**

---

## 2. Roles

| Role | Who | What they do |
|---|---|---|
| **Gift Giver** | Pays and organises | Commissions the book, provides honoree details, assembles contributor list, writes their own story, approves book details, presents the finished book |
| **Contributor** | Friend or family member | Receives an individual invitation, writes one story about the honoree, optionally uploads a photo |
| **Honoree** | The subject | Receives the book as a gift. Has no active role and knows nothing until the book is in their hands |
| **Tamara** | 24 Stories | Edits every story after go-ahead, compiles book, sends to print, ships to gift giver |

---

## 3. The One Prompt

> "Tell us one story — a moment, a memory, a time — that captures who [HonoreeName] is to you."

**Alt angles (displayed below prompt on submission page):**
A time they showed up for you. A time they made you laugh. Something only you know about them. The day you knew you could count on them.

Stories can be as short as half a page. There is no upper limit. A story can be told in 5 minutes.

---

## 4. Timeline — Full User Journey

### Pre-signup
- Gift giver discovers milestone.html
- Reads the qualifying checklist — confirms the project is viable before paying
- Has contributor list assembled: names, email addresses, mobile numbers. Minimum 10, maximum 24.

### Day 0 — Payment confirmed
- Project record created in Airtable (Status: Active)
- One Contributor record created per person on the list
- **M-1** fires to Gift Giver: welcome, dashboard link, deadline date, what happens next
- **M-2** fires to every contributor: individual invitation with personal note from gift giver, the prompt, their unique submission link, deadline date

### Days 1–28 — Collection period
- **M-5** fires every 3 days to contributors who have not yet submitted (days 3, 6, 9, 12, 15, 18, 21, 24, 27). Stops when they submit.
- **M-6** fires weekly to Gift Giver (days 7, 14, 21): names who have submitted, names still outstanding, page count estimate, deadline reminder
- **M-3** fires immediately when a contributor submits: "Your story is in — thank you."
- Gift Giver can log into milestone-library.html at any time to track progress

### Day 28 — Deadline
The system calculates estimated page count from total word count across all submitted stories.

**If estimated pages ≥ 80:**
- **M-7** fires to Gift Giver: "Deadline reached — everything looks good — please confirm go-ahead."
- Project Status → Awaiting Go-Ahead

**If estimated pages < 80:**
- **M-8** fires to Gift Giver: "Deadline reached — page count is below minimum — here are your options."
- Three options presented:
  1. Extend deadline by a set number of days — reminders continue, more stories can come in
  2. Open image submissions — invite contributors who have not written to submit a photo + caption instead (each photo page adds to page count)
  3. 50% refund + PDF — R7,500 refunded, PDF of all submitted stories delivered
- Gift Giver replies to hello@24stories.co.za with their choice
- Tamara actions the decision manually

### After go-ahead
- Tamara edits all stories
- **M-4** fires to each contributor: their edited story returned with a warm note
- Book prep section unlocks in milestone-library.html
- **M-9** fires to Gift Giver: book onboarding — portrait photo, book title, dedication, delivery address

### Book onboarding reminders
- Day 3 after M-9: **M-10** reminder if book form not completed
- Day 6 after M-9: **M-10** second reminder if still not completed
- Day 10 after M-9: **M-11** overdue alert to Gift Giver + Tamara alert to hello@

### Book production
- Tamara compiles book using all edited stories
- Sends to SA printer
- Sets dispatch date in Airtable
- **M-12** fires to Gift Giver: book dispatched, up to 4 weeks delivery

---

## 5. Pages — Spec

### milestone.html — Product landing page
**Purpose:** Introduce the product, qualify the gift giver, drive to signup.

**Sections:**
1. Hero: "Stories only the people who were there can tell." + subheading + "Start a Milestone Book" CTA
2. The occasions: birthday, retirement, anniversary, tribute — with short copy for each
3. How it works (3 steps): You commission it → They write their stories → We make the book
4. What's included: invitations, editing, dashboard, hardcover, delivery
5. **Qualifying section — "Before you sign up":** You will need: 10–24 people who are willing to write. Their names, email addresses, and mobile numbers. One month for stories to come in. If that's not in place yet, don't sign up yet.
6. Pricing: R15,000. Refund policy in plain language.
7. CTA → milestone-begin.html

**Nav:** Linked from main nav bar as "Milestone Books" (replaces Live Events slot)
**Brand:** Same fonts, colours, tone as 24stories.co.za. Separate page, same brand.

---

### milestone-begin.html — Sign-up form + payment
**Purpose:** Collect project details, contributor list, process payment.

**Section 1 — Project details:**
- Honoree first name (required)
- Honoree surname (required)
- Occasion (optional freetext — "What is the occasion?")
- Gift Giver name (required)
- Gift Giver email (required)
- Gift Giver mobile (required)
- Personal note to contributors (required — 2–4 sentences. Appears at the top of every invitation email. "Tell contributors why you're doing this and what the occasion is.")
- Deadline preference (date picker — default 28 days from today. Can be shortened. Cannot be less than 14 days.)

**Section 2 — Contributor list:**
- Dynamic add/remove rows
- Each row: Name (required), Email (required), Mobile (optional)
- Gift Giver is automatically added as contributor #1 (pre-filled, cannot be removed)
- Counter: "X of 24 contributors added (minimum 10 to proceed)"
- Pay button is disabled until 10+ contributors are in the list
- Note above Pay button: "By paying you confirm that all contributors have agreed to participate and that you have read the refund policy."

**Payment:**
- Pay button → milestone-checkout.js → PayFast one-off R15,000
- On return: shows confirmation state "Your project is live. Invitations are going out now."

---

### milestone-submit.html — Contributor submission page
**Purpose:** Each contributor writes and submits their story.
**URL:** `milestone-submit.html?project=[ProjectID]&contributor=[ContributorID]`

**States:**

**State 1 — Active (deadline not passed, no submission yet):**
- Heading: "Your story about [HonoreeName]"
- The prompt in full, displayed prominently
- Alt angles below prompt (smaller text)
- Deadline date: "Deadline: [Date]"
- Story input: typed textarea (primary)
- Voice recording option: same MediaRecorder component as tell.html
- Photo upload: Cloudinary, optional
- Caption field: appears after photo is uploaded, optional
- Submit button
- Note: "Your story will be edited by Tamara at 24 Stories before it appears in the final book."

**State 2 — Already submitted:**
- "Your story is in. Thank you."
- Submitted story displayed (read-only)
- No re-submission allowed

**State 3 — Deadline passed:**
- "The submission deadline for this project has passed."
- If they submitted: shows their story.
- If they did not submit: "Unfortunately the deadline has passed for this project."

**State 4 — Invalid link:**
- "This link is not valid. If you believe this is an error, please contact hello@24stories.co.za."

---

### milestone-library.html — Gift Giver dashboard
**Purpose:** Gift giver tracks contributor progress, views submitted stories, completes book prep.
**URL:** `milestone-library.html?id=[ProjectID]`
**Access:** URL-based (same model as library.html). No login.

**Section 1 — Summary strip (always visible at top):**
- "[N] of [N] stories submitted · Est. [N] pages · [N] pages to go · Deadline: [Date]"
- Page count progress bar: fills toward 80-page target
- Colour: green if ≥ 80 pages, amber if 60–79, red if < 60

**Section 2 — Contributor circles:**
- One circle per contributor, flexible grid (10–24)
- Each circle: contributor name + tick (submitted) or empty ring (pending)
- Click/tap to expand contributor card:
  - Story text (raw, as submitted — not edited)
  - Photo (if uploaded)
  - Caption (if provided)
  - Mobile number (for gift giver to chase directly)
- Submitted contributors: circle filled / solid
- Pending contributors: circle empty / dashed

**Section 3 — Book prep (hidden until GoAheadDate is set in Airtable):**
- Same structure as current library.html book prep:
  - Portrait photo (optional)
  - Book title (pre-filled: "Stories of [HonoreeName]" — editable)
  - Dedication (optional)
  - Delivery address (required)
  - Delivery phone (required)
  - Mark as Complete button

**Section 4 — Decision section (appears at deadline if page count < 80):**
- Message: "Your project has reached its deadline with an estimated [N] pages — below the 80-page minimum for hardcover printing."
- Three options displayed clearly
- Instruction to email hello@24stories.co.za with their choice

---

## 6. Email Flows — 12 Emails

All emails send FROM stories@24stories.co.za via Mailjet. No ReplyTo. Brand fonts: Georgia serif.

---

**M-1: Welcome — Gift Giver**
- **To:** GiftGiverEmail
- **Trigger:** Payment IPN confirmed
- **Subject:** "Your Milestone Book has begun — [HonoreeName]'s stories"
- **Content:**
  - Thank you — the project is live
  - Invitations have gone to all [N] contributors
  - Deadline: [Date]
  - Dashboard link button
  - What happens next (brief): stories come in over the next month, you can track progress in your dashboard, once the deadline passes we'll be in touch about next steps
  - Any questions: hello@24stories.co.za

---

**M-2: Contributor Invitation**
- **To:** Each contributor individually (one send per contributor)
- **Trigger:** Payment IPN confirmed (fires immediately after M-1)
- **Subject:** "[GiftGiverName] is putting something together — can you help?"
- **Content:**
  - Gift giver's personal note (written during setup — appears verbatim at top)
  - "We're helping [GiftGiverName] create a book of stories about [HonoreeName]. A beautifully printed book, given as a gift."
  - The prompt: "Tell us one story — a moment, a memory, a time — that captures who [HonoreeName] is to you."
  - Alt angles
  - "It takes about 5 minutes. You can type your story or record it by voice."
  - "Optional: add a photograph."
  - Submit button → unique submission link
  - Deadline: [Date]
  - "Questions? Email hello@24stories.co.za"

---

**M-3: Story Received — Contributor**
- **To:** Contributor who just submitted
- **Trigger:** Contributor submits via milestone-submit.html
- **Subject:** "Your story is in — thank you"
- **Content:**
  - Warm acknowledgment
  - "Your story will be part of a beautifully printed book."
  - "A professional editor will polish your story before it goes to print. You'll receive your edited version once the project closes."
  - No further action needed

---

**M-4: Edited Story — Contributor**
- **To:** Each contributor (one send per contributor)
- **Trigger:** Tamara sets GoAheadDate in Airtable (triggers batch send via milestone-reminders.js or a dedicated function)
- **Subject:** "Your story about [HonoreeName] — edited"
- **Content:**
  - "Your story has been gently edited and will appear in the final book."
  - Edited story text displayed in full
  - "Thank you for being part of this."
  - No links, no action needed

---

**M-5: Contributor Reminder**
- **To:** Contributors who have not submitted
- **Trigger:** Daily cron — every 3 days since InviteSentDate while SubmissionDate is empty
- **Subject:** "Still time — your story about [HonoreeName]"
- **Content:**
  - "There's still time to write your story."
  - Prompt repeated
  - Alt angles
  - "It takes about 5 minutes."
  - Submit button → unique submission link
  - Deadline: [Date]
- **Stops:** when contributor submits (SubmissionDate set)

---

**M-6: Weekly Status — Gift Giver**
- **To:** GiftGiverEmail
- **Trigger:** Daily cron — fires on days 7, 14, 21 from StartDate
- **Subject:** "[N] of [N] stories in — [HonoreeName]'s book"
- **Content:**
  - Submitted: [list of names]
  - Still to come: [list of names]
  - Estimated pages so far: [N] (target: 80)
  - Deadline: [Date]
  - Dashboard link

---

**M-7: Deadline Reached — Page Count OK**
- **To:** GiftGiverEmail
- **Trigger:** Daily cron on DeadlineDate — EstimatedPages ≥ 80
- **Subject:** "[HonoreeName]'s book is ready — your go-ahead needed"
- **Content:**
  - [N] stories submitted
  - Estimated pages: [N] — ready for print
  - "Please confirm your go-ahead by replying to this email or emailing hello@24stories.co.za."
  - "Once confirmed, we'll begin editing. Book prep details will follow."
  - Dashboard link

---

**M-8: Deadline Reached — Page Count Insufficient**
- **To:** GiftGiverEmail
- **Trigger:** Daily cron on DeadlineDate — EstimatedPages < 80
- **Subject:** "[HonoreeName]'s book — your decision needed"
- **Content:**
  - [N] stories submitted — estimated [N] pages
  - "The minimum for a hardcover book is 80 pages. Your project is currently estimated at [N] pages."
  - Three options:
    - **Option 1 — Extend the deadline:** Set a new date. Reminders continue to outstanding contributors.
    - **Option 2 — Add image pages:** We'll invite contributors who haven't written to submit a photo and caption instead. Each image adds a full page.
    - **Option 3 — PDF + partial refund:** We'll produce a PDF of all submitted stories and refund R7,500.
  - "Reply to hello@24stories.co.za with your choice and we'll take it from there."
  - Dashboard link

---

**M-9: Book Onboarding — Gift Giver**
- **To:** GiftGiverEmail
- **Trigger:** Tamara sets GoAheadDate in Airtable
- **Subject:** "Time to prepare [HonoreeName]'s book"
- **Content:**
  - "The stories are edited. Now we need a few details to complete the book."
  - What's needed: portrait photo (optional), book title (we've suggested one — you can change it), dedication (optional), delivery address
  - Dashboard link (book prep section now visible)
  - "Up to 4 weeks from when you complete this form to delivery."

---

**M-10: Book Onboarding Reminder**
- **To:** GiftGiverEmail
- **Trigger:** Days 3 and 6 after GoAheadDate, if BookFormCompleted is empty
- **Subject:** "[HonoreeName]'s book — a few details still needed"
- **Content:** Shorter version of M-9. Dashboard link. Urgency increases on day 6.

---

**M-11: Book Onboarding Overdue**
- **To:** GiftGiverEmail + Tamara alert to hello@
- **Trigger:** Day 10 after GoAheadDate, if BookFormCompleted still empty
- **Subject:** "[HonoreeName]'s book — urgent: details needed"
- **Content:** Direct and warm — "Book production cannot begin without these details. Please complete the form today or contact us."
- **Tamara alert:** "Book form overdue — [HonoreeName] / [GiftGiverName] / [GiftGiverEmail]"

---

**M-12: Book Dispatched — Gift Giver**
- **To:** GiftGiverEmail
- **Trigger:** Tamara sets BookSentToPrintDate in Airtable (same trigger pattern as current email-12)
- **Subject:** "[HonoreeName]'s book is on its way"
- **Content:**
  - Book has been dispatched
  - Delivery: up to 4 weeks
  - "Any questions about delivery: hello@24stories.co.za"

---

## 7. Airtable Schema (on paper — no build yet)

**Recommended: New tables added to existing 52stories base (apprTOobuxs4Od7XB)**
Keeps everything in one place. Clean separation by table name.

---

### Table: Milestone Projects

| Field | Type | Notes |
|---|---|---|
| HonoreeFirstName | singleLineText | |
| HonoreeSurname | singleLineText | |
| Occasion | singleLineText | Free text from setup form |
| GiftGiverName | singleLineText | |
| GiftGiverEmail | email | |
| GiftGiverMobile | singleLineText | |
| GiftGiverPersonalNote | multilineText | Appears verbatim in M-2 invitations |
| StartDate | date | Set on payment confirmed |
| DeadlineDate | date | Calculated: StartDate + [days chosen at setup] |
| Status | singleSelect | Pending, Active, Awaiting Go-Ahead, In Production, Complete, Refunded |
| BookTitle | singleLineText | Default: "Stories of [HonoreeName]" — gift giver editable |
| PortraitPhotoURL | url | Uploaded via milestone-library.html |
| DedicationText | multilineText | Gift giver editable in library |
| DeliveryAddress | multilineText | Required for print dispatch |
| DeliveryPhone | singleLineText | |
| BookFormCompleted | date | Gift giver presses Complete in library |
| GoAheadDate | date | **Tamara sets this.** Triggers: M-4 to contributors, M-9 to gift giver, unlocks book prep in library |
| TotalWords | rollup | SUM of Contributors.WordCount |
| EstimatedPages | formula | ROUND({TotalWords}/300 + 10, 0) |
| PageCountStatus | formula | IF({EstimatedPages}>=80,"Print Ready", IF(AND(IS_AFTER(TODAY(),{DeadlineDate}),{EstimatedPages}<80),"Insufficient","In Progress")) |
| StoriesSubmitted | rollup | COUNT of Contributors where SubmissionDate is not empty |
| ContributorCount | rollup | COUNT of linked Contributors |
| BookCompiledDate | date | Tamara sets when book is compiled |
| BookSentToPrintDate | date | Tamara sets when book goes to printer — triggers M-12 |
| RefundIssued | checkbox | Tamara ticks if 50% refund processed |
| Notes | multilineText | Internal only |

---

### Table: Milestone Contributors

| Field | Type | Notes |
|---|---|---|
| Name | singleLineText | |
| Email | email | |
| Mobile | singleLineText | Optional — visible in gift giver dashboard |
| ProjectID | multipleRecordLinks | Links to Milestone Projects |
| InviteSentDate | date | Set when M-2 fires |
| StoryText | multilineText | Raw submission — what contributor typed/spoke |
| EditedText | multilineText | Tamara's edited version |
| PhotoURL | url | Cloudinary upload |
| PhotoCaption | singleLineText | |
| SubmissionDate | date | Set when contributor submits |
| WordCount | number | Calculated on submission: len(StoryText)/5 |
| LastReminderDate | date | Set when M-5 fires |
| ReminderCount | number | Increments each M-5 send |
| EditSentDate | date | Set when M-4 fires to this contributor |

---

## 8. Netlify Functions (on paper — no build yet)

### milestone-checkout.js
**Trigger:** POST from milestone-begin.html
**Inputs:** honoree details, gift giver details, personal note, deadline days, contributor list (array)
**Logic:**
1. Create Projects record — Status: Pending
2. Create one Contributors record per contributor (including gift giver as contributor #1)
3. Build PayFast one-off payment params:
   - amount: 15000.00
   - item_name: "The Milestone Book — [HonoreeName]"
   - custom_str1: ProjectID
   - return_url: milestone-begin.html?paid=1
   - cancel_url: milestone-begin.html?cancelled=1
   - notify_url: /.netlify/functions/milestone-webhook
4. Return PayFast redirect URL

---

### milestone-webhook.js
**Trigger:** POST IPN from PayFast
**Logic:**
1. Verify PayFast signature
2. Check payment_status = COMPLETE
3. Find Project record by custom_str1 (ProjectID)
4. Set Status: Active, StartDate: today, DeadlineDate: today + deadlineDays
5. Send M-1 to GiftGiverEmail
6. Query all Contributors linked to project → loop → send M-2 to each
7. Set InviteSentDate on each Contributor record
8. Send Tamara alert to hello@: "New Milestone Project — [HonoreeName] · [GiftGiverName] · [N] contributors · Deadline [Date]"

---

### milestone-submit.js
**Trigger:** POST from milestone-submit.html
**Inputs:** projectId, contributorId, storyText, photoURL, photoCaption
**Logic:**
1. Verify contributorId belongs to projectId (security check)
2. Check SubmissionDate is empty (prevent duplicate submission)
3. Calculate wordCount = Math.round(storyText.split(' ').length)
4. Write to Contributor record: StoryText, PhotoURL, PhotoCaption, SubmissionDate, WordCount
5. Send M-3 to contributor
6. Send Tamara alert to hello@: "Story submitted — [ContributorName] for [HonoreeName] project"

---

### milestone-library-read.js
**Trigger:** GET ?id=[ProjectID]
**Returns:** Project record + all linked Contributors with their fields
**Used by:** milestone-library.html to render dashboard

---

### milestone-library-update.js
**Trigger:** POST from milestone-library.html
**Handles:** BookTitle, PortraitPhotoURL, DedicationText, DeliveryAddress, DeliveryPhone, BookFormCompleted
**Logic:** Write fields to Project record. Set BookFormCompleted date when gift giver presses Complete.

---

### milestone-reminders.js (daily cron — runs alongside existing daily functions)
**Trigger:** Daily at 9am SAST
**Logic:**

**Contributor reminders (M-5):**
- Query all Contributors where SubmissionDate is empty AND Project.Status = Active
- For each: if LastReminderDate is empty OR (today − LastReminderDate) ≥ 3 days → send M-5, update LastReminderDate, increment ReminderCount

**Weekly status (M-6):**
- Query Active Projects where (today − StartDate) = 7, 14, or 21 days
- For each: send M-6 to GiftGiverEmail

**Deadline check:**
- Query Active Projects where DeadlineDate = today
- For each:
  - If EstimatedPages ≥ 80: send M-7, set Status: Awaiting Go-Ahead
  - If EstimatedPages < 80: send M-8, set Status: Awaiting Go-Ahead

**Book onboarding reminders (M-10, M-11):**
- Query Projects where GoAheadDate is set AND BookFormCompleted is empty
- Day 3 after GoAheadDate: send M-10
- Day 6 after GoAheadDate: send M-10 (second reminder)
- Day 10 after GoAheadDate: send M-11 + Tamara alert

**Book dispatch (M-12):**
- Query Projects where BookSentToPrintDate is set AND Status ≠ Complete
- Check if M-12 has already been sent (add DispatchEmailSent checkbox field to Projects table)
- If not sent: send M-12, tick DispatchEmailSent, set Status: Complete

**Edited stories batch send (M-4):**
- Query Projects where GoAheadDate is set AND GoAheadDate = today
- For each: query all linked Contributors where EditedText is not empty AND EditSentDate is empty
- Send M-4 to each, set EditSentDate

---

## 9. Payment Flow (on paper)

```
Gift giver completes milestone-begin.html
  ↓
POST to milestone-checkout.js
  ↓
Creates: Projects record (Pending) + Contributors records
  ↓
Returns: PayFast payment URL (R15,000 one-off)
  ↓
Gift giver pays on PayFast
  ↓
PayFast sends IPN to milestone-webhook.js
  ↓
Verifies payment → Sets Project Active → Sends M-1 + M-2 (all contributors)
  ↓
Gift giver redirected to milestone-begin.html?paid=1
Shows: "Your project is live. Invitations are on their way."
```

**Refund flow (manual):**
- Gift giver emails hello@ with refund request
- Tamara issues R7,500 refund via PayFast dashboard
- Tamara generates PDF of submitted stories from Airtable (manual export at this stage)
- Tamara emails PDF to gift giver
- Tamara sets Status: Refunded in Airtable

---

## 10. Page Count Logic

### The formula
1. On each story submission, milestone-submit.js calculates **WordCount** = number of words in StoryText
2. Milestone Projects table has a **TotalWords** rollup field = SUM of linked Contributors.WordCount
3. **EstimatedPages** formula = ROUND(TotalWords / 300 + 10, 0)
   - 300 words per page (Georgia 12pt, 1.4 line spacing, standard margins, A5)
   - +10 fixed pages: title, portrait, dedication, table of contents, colophon, section breaks

### The threshold
- **80 pages** = minimum viable hardcover (to be confirmed with SA printer before launch)
- This is 40 physical leaves (double-sided), standard short-run minimum

### What the gift giver sees in the dashboard
- Summary strip: "Est. 54 pages · 26 pages to go"
- Progress bar filling toward 80-page target
- Colours: red < 60 pages / amber 60–79 / green ≥ 80

### Important caveat
EstimatedPages is an estimate. Actual typeset pages may vary by ±10% depending on photo placement, story formatting, and layout decisions. The estimate is sufficient for the go/no-go decision — exact page count is confirmed when Tamara compiles the book.

---

## 11. Submission Form — Standalone HTML Spec

A self-contained HTML file that can be:
- Opened via URL (milestone-submit.html?project=X&contributor=Y)
- Emailed as a standalone file
- Shared via WhatsApp link

**Pre-population via URL params:** project, contributor, name (contributor name), honoree (honoree name), deadline

**Fields:**
1. Honoree name — pre-filled, read-only display
2. Contributor name — pre-filled, read-only display
3. Prompt — displayed as instruction block, not a form field
4. Alt angles — displayed below prompt, smaller text
5. Story textarea — large, primary input
6. Voice recording toggle — same MediaRecorder component as tell.html
7. Photo upload — Cloudinary, optional. Only appears as an offer — not required.
8. Caption field — appears only after photo is uploaded
9. Submit button

**Behaviour:**
- If already submitted: shows "Your story is in" state, no re-submission
- If deadline passed: shows closed state
- Submits to milestone-submit.js Netlify Function

---

## 12. Promotional One-Pager — Copy Draft

*To be designed as a printable/emailable HTML file or PDF. For interested gift givers who want to understand the product before committing.*

---

**THE MILESTONE BOOK**
*Stories only the people who were there can tell.*

---

Some people deserve more than a card.

For a 70th birthday, a retirement, forty years of marriage — The Milestone Book gathers the stories that only the people who truly know them can tell.

You commission it. We do the rest.

---

**How it works**

**You start it.**
You tell us who the book is for and give us a list of contributors — friends, family, colleagues. We send each person a personal invitation with your note and a simple prompt. They have one month.

**They write it.**
Each contributor writes one story about your person. A moment. A memory. Something only they know. It takes about five minutes. They can type it or record it by voice.

**We make it.**
Every story is professionally edited. A beautifully printed, linen-bound hardcover is delivered to you to present.

---

**What's included**
- Up to 24 individual, personalised invitations
- Your own progress dashboard — track who has submitted in real time
- Professional editing on every story
- One printed linen-bound hardcover book
- Delivered to your door

**Extra copies: R1,200 each** — order any time after the book is complete.

---

**The occasions**
70th or 80th birthday · Retirement · 25th, 30th, 40th, 50th anniversary · Farewell · Tribute

---

**The price**
**R15,000 — once off.**

If your project does not reach print, you receive a 50% refund (R7,500) and a PDF of all submitted stories.

---

**Before you sign up**
You will need 10–24 people who are willing to write, and their names and email addresses. The project runs for one month. If that's not in place yet, it's worth taking a week to confirm your contributors before signing up.

---

**Ready to begin?**
Email hello@24stories.co.za or visit 24stories.co.za/milestone

---

## 13. What Reuses the Current Build

| Component | Reuse |
|---|---|
| Email HTML structure | All 12 emails reuse the Georgia serif template structure |
| PayFast one-off payment | Direct reuse of book-order-checkout.js pattern |
| Cloudinary photo upload | Direct reuse of tell.html component |
| Voice recording (MediaRecorder) | Direct reuse of tell.html component |
| Whisper transcription (transcribe.js) | Reuse as-is |
| Claude cleanup (cleanup.js) | Reuse as-is |
| Library.html layout patterns | milestone-library.html adapts the same circle grid, book prep section, URL-based access |
| Book onboarding flow | Identical logic — same fields, same form, same Complete button |
| Book dispatch flow | Same pattern as BookSentToPrintDate → email trigger |
| Book compile (compile-book.html) | The same book-compile.js function can compile a Milestone Book if Stories are linked correctly |
| Daily cron pattern | milestone-reminders.js follows the exact same daily-check pattern |

---

## 14. What Is Genuinely New

| Component | Description |
|---|---|
| Milestone Projects table | New Airtable table |
| Milestone Contributors table | New Airtable table |
| Multi-contributor model | One project → many submitters with individual records |
| Individual invitation system | M-2 fires per contributor with unique submission link |
| Gift giver personal note | Written at setup, appears in all invitations |
| Page count formula | Word count rollup → estimated pages → dashboard indicator |
| Page count progress bar | Visual fill toward 80-page target in dashboard |
| Go/no-go decision gate | M-7/M-8 at deadline, gift giver makes the call |
| Extended deadline option | System resumes reminders after gift giver chooses to extend |
| Image-only submission path | Contributor submits photo + caption when no story (increases page count) |
| milestone-begin.html dynamic rows | Dynamic add/remove contributor form with minimum enforcement |
| milestone-submit.html | Simplified tell.html for external contributors |

---

## 15. Build Sequence (when approved to proceed)

**Phase 1 — Foundation**
1. Create Milestone Projects table in Airtable with all fields
2. Create Milestone Contributors table in Airtable with all fields
3. Build milestone-checkout.js (payment + record creation)
4. Build milestone-webhook.js (IPN + M-1 + M-2)
5. Test payment end-to-end in sandbox

**Phase 2 — Submission**
6. Build milestone-submit.html + milestone-submit.js
7. Test contributor submission: story saved, M-3 fires, word count calculated
8. Verify page count rolling up correctly in Milestone Projects

**Phase 3 — Dashboard**
9. Build milestone-library-read.js
10. Build milestone-library.html (dashboard with summary strip + contributor circles)
11. Build milestone-library-update.js (book prep fields)
12. Test dashboard: stories visible, page count live, book prep unlocks on GoAheadDate

**Phase 4 — Automation**
13. Build milestone-reminders.js (all cron logic: M-5, M-6, deadline check, book onboarding reminders, M-4 batch, M-12)
14. Write all 12 email HTML functions
15. Test full timeline end-to-end in sandbox

**Phase 5 — Public-facing**
16. Build milestone.html (product landing page)
17. Build milestone-begin.html (signup form with dynamic contributor list)
18. Add "Milestone Books" to nav bar on all pages
19. Build promotional one-pager HTML

**Phase 6 — Pre-launch**
20. Update operations manual with Milestone Book daily check procedure
21. Update CLAUDE.md with Milestone Book context
22. Full end-to-end test with real contributors
23. Confirm minimum page count with SA printer
24. Launch

---

## 16. Open Decisions Before Build Begins

| Decision | Status |
|---|---|
| Minimum page count | Working assumption: 80 pages. Confirm with SA printer before launch. |
| Airtable: same base or new base | Recommendation: same base (52stories). Revisit if tables become unwieldy. |
| Standalone submission form as emailable HTML | Confirm if needed or if URL-only is sufficient |
| Image-only submission path | Confirm whether to build at launch or add later |
| Book compile integration | Confirm whether book-compile.js can handle Milestone Books or needs a variant |
| Nav label | "Milestone Books" or "The Milestone Book Project" |
| Extra copies for Milestone Book | Same R1,200 pricing? Ordered via milestone-library.html? |

---

*End of document. Nothing in this file changes anything live. Feed this back session by session to build.*
