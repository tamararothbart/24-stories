# 24 STORIES — WHERE TO GO FOR EVERYTHING

Operations Flow Reference

Last updated: 11 May 2026

This document tells you where to go and what to do for every operational task in 24 Stories. Keep it open in a browser tab. Add to it as new flows are built.

---

## PART 1 — THE WEEKLY STORY FLOW

*(What happens every week, in order)*

---

### STEP 1 — PROMPT GOES OUT AUTOMATICALLY

Every Wednesday at 7am SAST, the system sends each active subscriber their prompt for the week.

You do nothing. It is automatic.

---

### STEP 2 — SUBSCRIBER SUBMITS THEIR STORY

The subscriber clicks the link in their prompt email.

This takes them to: 24stories.co.za/tell.html

They type or record their story and press Send.

You do nothing. It is automatic.

---

### STEP 3 — YOU ARE NOTIFIED

The moment a story is submitted, you receive an alert email at:

**hello@24stories.co.za**

Subject: New story — [Name] — Week [N]

The email includes the first part of the story text and a button:

**"Edit this story in Airtable →"**

Click that button. It takes you directly to the Airtable record for that story. You do not need to search for it.

---

### STEP 4 — YOU EDIT THE STORY

**WHERE TO GO:** Click the **"Edit this story →"** button in the alert email. It opens the web editing page (edit.html) with the story already loaded.

**WHAT TO DO:**

1. The editing page opens. The story text is already in the editor — pre-loaded automatically from the subscriber's submission. You do not copy or paste anything.

2. Edit directly in the editor. Fix spelling, flow, structure — whatever the story needs.

3. **Add a chapter title** in the Chapter Title field. Keep it short — four to eight words. This appears in the family delivery email, in the subscriber's story library, and in the book.

4. Click **Save**. The edited story is written to Airtable immediately.

**THREE FIELDS IN AIRTABLE — KNOW THE DIFFERENCE:**

| Field | What it is | Do you edit it? |
|-------|-----------|-----------------|
| StoryText | Raw submission — original record | Never. Leave untouched. |
| EditedText | Your edited version — sent to family and used in book | Yes — this is where your edit lands when you save. |
| FinalStory | Your fully approved version for book production | Yes — fill this at book stage before pressing Complete. |

---

### STEP 5 — YOU SEND THE STORY TO THE FAMILY

**WHERE TO GO:** Open Airtable → **Stories** table → find this subscriber's story record.

**WHAT TO DO:**

1. Tick the **SendToFamily** checkbox.

2. That's it. Airtable saves immediately.

**WHAT HAPPENS NEXT (automatic, within 2 minutes):**

- The system detects the ticked checkbox and fires automatically.
- The storyteller receives an email confirming their story has been delivered — showing the edited version.
- Every family email address on their Subscribers record receives the story.
- The story record is updated: **SentToFamilyDate** is set to today and the **SendToFamily** checkbox unticks itself.

**IF THE SUBSCRIBER HAS NO FAMILY RECIPIENTS:**

Tick SendToFamily anyway. The storyteller still receives a confirmation email. Nothing else to do.

---

### TEXTEDIT — AUTOMATED STORY EDITING (NOT YET IN USE)

TextEdit is a built-in editing engine that will eventually handle first-pass editing automatically, before the story reaches you. It is built but not yet QA'd. Do not use it until it has been tested and trained. The manual workflow above (Steps 4–5) is your current process.

---

**A. CURRENT MANUAL WORKFLOW (use this now)**

1. Alert arrives at hello@24stories.co.za.
2. Click **"Edit this story →"** in the email.
3. Edit the story in the web editor. Add chapter title. Click Save.
4. Open Airtable → Stories → find the record → tick **SendToFamily**.
5. Done.

---

**B. HOW TO TRAIN TEXTEDIT BEFORE USING IT**

TextEdit works from a written prompt — a set of instructions that tells Claude how to edit. You train it by refining those instructions based on what it gets wrong.

Before switching it on:

1. Take 5 stories you have already edited manually. You have both the raw version (StoryText) and your finished version (EditedText) in Airtable.

2. Run TextEdit on those same raw stories and compare its output to yours.

3. Identify the patterns where it falls short. Too formal? Loses the person's voice? Over-corrects colloquial grammar that should stay? Adds words you would cut?

4. Update the Claude prompt inside TextEdit to address those patterns. Repeat until its draft is close enough to your standard that you are only making small adjustments — not rewriting.

Do this exercise with 5 to 10 stories before switching TextEdit on. Ask Claude Code to run the comparison and help you refine the prompt.

---

**C. INSTALLING TEXTEDIT AND THE ADJUSTED WORKFLOW**

When TextEdit is QA'd and trained, Claude Code will wire it into the submission flow. At that point:

- A story is submitted → TextEdit runs automatically → EditedText is pre-filled with an AI-edited draft (not the raw text).
- Your alert arrives at hello@ as usual.
- You click **"Edit this story →"** — but now you open to Claude's draft, not the raw submission.
- You review, adjust where needed, add the chapter title, click Save.
- Go to Airtable → Stories → tick **SendToFamily**.

Steps 4 and 5 stay the same. The only change is that the editing is lighter — you are reviewing and refining a draft rather than editing from raw.

**Your editing time per story goes from 15–20 minutes to approximately 5 minutes.**

---

## PART 1B — MISSED PROMPTS, CATCHING UP, AND SPEEDING AHEAD

---

### THE LIBRARY HAS ALL 26 PROMPTS FROM DAY ONE

The subscriber's library shows all 26 prompts from the moment they sign up — not just the current week. Every unanswered prompt has a "Record this story" button. The subscriber does not need to find an old email. They just open their library.

**MISSED A WEEK?**
The subscriber opens their library, scrolls to the week they missed, and clicks "Record this story." They go straight into the submission page for that prompt with everything pre-loaded. No email hunting required.

**WANT TO SPEED AHEAD?**
A subscriber who needs the finished book by a certain date (a milestone birthday, for example) can open their library and record multiple stories in a single sitting. They are not locked to one story per week. The library lets them work at whatever pace they choose.

---

### DO YOU STILL GET AN ALERT WHEN THEY SUBMIT VIA THE LIBRARY?

Yes. When a subscriber clicks "Record this story" in the library, it takes them to tell.html — the same submission page as the prompt email link. The story goes through exactly the same process. You receive the same alert email at hello@24stories.co.za the moment they press Send. It does not matter whether they came from the prompt email or from the library.

---

### DOES THE RAW TEXT BECOME EDITED TEXT AFTER YOU PRESS SEND TO FAMILY?

Yes. Here is the exact sequence:

1. Subscriber submits their story. Raw text lands in Airtable (StoryText field). EditedText is automatically pre-filled with the same text.
2. You receive an alert email with a direct link to the Airtable record.
3. You click the link, open the record, edit in the EditedText field, add a chapter title to the ChapterTitle field.
4. You open the subscriber's library and click Send to Family.
5. The edited version and chapter title are sent to the family and to the storyteller.
6. The library now shows the edited version under the chapter title. The raw text is gone from view permanently.

The subscriber only ever sees the edited version. At no point do they see the raw text in their library — only what you have approved.

---

### HOW SUBSCRIBERS ARE REMINDED ABOUT THEIR LIBRARY

Every prompt email and every Day 4 reminder email contains:

- Their personal library link (a button and a plain text URL they can bookmark)
- The line: "Missed a prompt or want to get ahead? Your library has all 26 — record any story at any time."
- The line: "Lost your library link? Scroll to the bottom of 24stories.co.za to request it."

The website (24stories.co.za) has a section at the bottom of the page where subscribers can request their library link to be resent to their email address.

---

## PART 2 — WHERE TO FIND THINGS

---

**AIRTABLE** — airtable.com — base: "52stories"

- **Subscribers table:** one record per subscriber. Names, emails, status, prompt number, library token.
- **Stories table:** one record per submitted story. Raw text (StoryText), edited text (EditedText), chapter title (ChapterTitle), image URL, caption.
- **Prompts table:** all 26 weekly prompts. Week number, theme, prompt text, other angles.
- **Payments table:** PayFast transaction records.

---

**SUBSCRIBER'S LIBRARY**

URL format: `24stories.co.za/library.html?id=[LibraryToken]`

The LibraryToken is the Airtable record ID for that subscriber (starts with "rec").

Find it in Airtable: open the subscriber record — the ID is in the browser URL.

This is where you send stories to family (Step 5 above).

This is also where the subscriber sees all their stories, uploads photos, and — at week 26 — completes their book details.

---

**SUBSCRIBER'S STORY SUBMISSION PAGE**

URL format: `24stories.co.za/tell.html?id=[LibraryToken]&week=[N]&...`

Subscribers reach this via the link in their prompt email or via the "Record this story" button in their library.

You will rarely need to open this directly.

---

**YOUR EMAIL — hello@24stories.co.za (Titan)**

- All Tamara manual emails go from here.
- Story submission alerts arrive here (with direct Airtable link).
- PayFast payment notifications arrive here.

---

**AUTOMATED EMAIL SENDER — stories@24stories.co.za (Mailjet)**

- All automated emails send from this address (prompts, story delivery, reminders, book onboarding).
- You do not log into this to send. It sends automatically.

---

## PART 3 — DAY 4 REMINDER (AUTOMATIC)

If a subscriber has not submitted a story 4 days after their prompt was sent, the system automatically sends them a gentle nudge.

You do nothing. It is automatic.

---

## PART 3B — WHAT TO DO IN THE EVENT OF A CANCELLATION

---

> ## ⚠⚠⚠ CRITICAL — THE ONE STEP YOU MUST NOT MISS ⚠⚠⚠
>
> **YOU MUST TICK THE CancellationRequested CHECKBOX IN AIRTABLE.**
>
> Nothing happens automatically until you tick it. If you forget:
> - PayFast will keep billing the subscriber
> - No cancellation email will be sent
> - No AccessEndDate will be set
> - The subscriber will remain Active indefinitely
>
> **Tick the checkbox. Then stop. That is the only thing you do.**

---

### STEP 1 — TICK THE CHECKBOX

When a subscriber emails hello@24stories.co.za to cancel:

1. Open **Airtable → Subscribers table**
2. Find the subscriber's record
3. **TICK the CancellationRequested checkbox** ← THIS IS THE STEP
4. Close Airtable and wait for the CANCELLATION PROCESSED email to arrive at hello@

That is the only action you take. Everything else is automatic.

---

### WHAT HAPPENS AUTOMATICALLY (YOU DO NOT DO ANY OF THIS)

Within 2 minutes of you ticking the box:

- The system cancels the subscription with PayFast — no further payments will be taken
- **AccessEndDate** is calculated automatically: SubscriptionStartDate + number of payments already made = the last day of their current paid billing period
- AccessEndDate is written to Airtable
- The subscriber receives **email-17** ("We're Sorry To See You Go!") — their access end date, stories are safe, contact us to return
- You receive a **CANCELLATION PROCESSED** alert at hello@24stories.co.za confirming the above, including the AccessEndDate, PayFast cancel status, and **the subscriber's restart link** (see below)

> ⚠ **When this alert arrives — do nothing in Airtable.** Status stays Active until AccessEndDate. The daily cron changes it to Cancelled automatically on that date. The alert is for your awareness only.

The day before AccessEndDate:

- You receive a **SEALS TOMORROW** alert at hello@. No action is needed. This is for your awareness only.

On AccessEndDate (daily at 9am SAST):

- Status is automatically set to Cancelled in Airtable
- The subscriber's Story Library is sealed — they see "Your Story Library has been sealed"
- You receive a **SEALED** alert at hello@

---

### THE RESTART LINK — WHERE TO FIND IT IF THEY WANT TO RETURN

The **CANCELLATION PROCESSED** alert (which arrives at hello@ within 2 minutes of you ticking the checkbox) contains a restart link at the bottom:

```
https://24stories.co.za/.netlify/functions/restart-checkout?id=RECORD_ID
```

This link is permanent and unique to that subscriber. It stays valid indefinitely — even months later.

**If the subscriber contacts you to return:**
1. Search hello@24stories.co.za for "CANCELLATION PROCESSED [their name]"
2. Open that alert email
3. Copy the restart link from the bottom
4. Paste it into a reply or WhatsApp message to them

**If you can't find the alert email:**
1. Open Airtable → Subscribers → find their record
2. Copy the Record ID from the URL bar in your browser (format: `recXXXXXXXX`)
3. Build the link: `https://24stories.co.za/.netlify/functions/restart-checkout?id=` + that Record ID

---

### THE ONLY TIME YOU TAKE FURTHER ACTION

If a subscriber emails after cancelling to say they've resolved a payment issue and want to continue — and you have agreed to extend their access — update **AccessEndDate** in Airtable manually to the new date. Do this only after payment is confirmed. The system will then reseal on that new date.

Do not change Status back to Active unless they have paid and you want prompts to resume.

---

### CANCELLATION POLICY

- Subscribers may cancel at any time by writing to hello@24stories.co.za or WhatsApp 082 375 8320
- Subscription ends at the close of the current paid billing cycle — no further payments are taken
- Story Library access and weekly prompts continue until AccessEndDate
- No refund is issued for the current billing period (see Refunds section for exceptional cases)

---

## PART 3C — WHAT TO DO WHEN A PAYMENT FAILS

---

### WHAT HAPPENS AUTOMATICALLY (YOU DO NOTHING UNLESS YOU CHOOSE TO REACH OUT)

When PayFast cannot collect a payment after all retries are exhausted, it sends a cancellation signal to the system. Within seconds:

- The subscriber's account is **frozen** — no more prompts, Story Library locked immediately
- The subscriber receives an automatic email ("We're Sorry To See You Go!") — their account is frozen, stories are safe, **restart link included**
- You receive a **PAYMENT FAILED — SUBSCRIPTION FROZEN** alert at hello@24stories.co.za

This is different from a voluntary cancellation. There is no end-of-billing-cycle grace period. The freeze is instant.

---

### THE SUBSCRIBER ALREADY HAS THEIR RESTART LINK

The restart link is included in the automatic email sent to the subscriber. **You do not need to do anything unless you choose to follow up.**

The restart link looks like this:
```
https://24stories.co.za/.netlify/functions/restart-checkout?id=RECORD_ID
```
Each link is unique to that subscriber and permanent — it stays valid until they use it.

Your PAYMENT FAILED alert at hello@ also contains the restart link (as a backup, and for sending by WhatsApp if needed). It also contains:

- Subscriber's full name
- Email address
- WhatsApp / phone number (if provided at signup)

---

### YOUR OPTIONAL ACTION — FOLLOW UP

The subscriber has the restart link in their email. You can choose to also reach out by WhatsApp:

**By WhatsApp:**
1. Open the PAYMENT FAILED alert on your phone or desktop (hello@ is Google Workspace)
2. Long-press the restart link to copy it
3. Open the subscriber's WhatsApp conversation (their number is in the alert)
4. Paste and send with a warm note

**To save the link for later (if you want to call first):**
- Forward the PAYMENT FAILED alert to yourself with subject "HOLD — [Name] restart link"
- Or copy it to a WhatsApp "Saved Messages" or note

**If you can't find the alert email later:**
1. Open Airtable → Subscribers → find their record
2. Copy the Record ID from the URL bar (format: `recXXXXXXXX`)
3. Build the link: `https://24stories.co.za/.netlify/functions/restart-checkout?id=` + that Record ID

---

### WHAT THE SUBSCRIBER SEES WHEN THEY CLICK THE RESTART LINK

The restart link does **not** take them to the subscription form. It goes directly to a PayFast payment page showing exactly how many payments remain on their original contract. In live mode, PayFast shows a full card entry form — this is where a subscriber with a new or replacement card enters their updated details. No separate card-update step is needed.

> ⚠ **Verify on first live payment failure after launch:** confirm that the PayFast payment page shows a card entry form and that the subscriber can complete payment successfully. Sandbox testing auto-completes without showing the form. If the restart link fails in live mode for any reason, contact hello@24stories.co.za and cancel the old subscription manually in the PayFast dashboard.

After payment:

- They land on their Story Library with a "payment received, reinstating shortly" message
- Within minutes their account unfreezes (Status → Active, Library opens)
- They receive a "Welcome back" confirmation email

---

### WHAT HAPPENS WHEN THEY PAY (FULLY AUTOMATIC)

Once the subscriber completes payment:

- Their account unfreezes immediately — Status → Active
- Their Story Library reopens from where they left off — same stories, same prompt number, correct remaining billing cycles
- They receive a **"Welcome back — 24 Stories"** email confirming their subscription is active
- You receive a **SUBSCRIPTION RESTARTED** alert at hello@ showing payment number and remaining cycles
- Prompts resume automatically the following Wednesday

You do not touch Airtable. You do not do anything else.

---

### IF THEY DO NOT RESTART

If the subscriber does not respond and does not pay, the account stays frozen indefinitely. No further prompts are sent. Their stories remain safe in Airtable. If they eventually return, the restart link in your PAYMENT FAILED alert remains valid — copy and send it at any time.

---

### WHEN A SUBSCRIBER CONTACTS YOU ABOUT A LOST OR CHANGED CARD

If a subscriber emails hello@ to say they've lost their card, their card has expired, or they're changing banks — **do nothing on your end.**

Reply using the Gmail template **"Card change — wait for payment link"** (see below for how to find it).

That is the complete process. Here is why it works without any action from you:

- When their next payment fails, PayFast sends a signal to the system automatically
- The system freezes their account and immediately emails them a restart link
- They click the link, pay with their new card, and the subscription resumes
- You receive a SUBSCRIPTION RESTARTED alert at hello@

The subscriber does not lose any stories. Their prompt number does not reset. Their billing cycle continues from where it left off with the correct number of payments remaining.

**The only disruption** is a brief account freeze on the day the payment fails — resolved the moment they click the restart link. For most subscribers this is not a problem. If they are mid-story on that exact day, reassure them their draft is safe in the Story Library.

**Gmail template to use:** "Card change — wait for payment link"

---

## PART 4 — WEEK 26 / BOOK PRODUCTION

---

### WEEKS 25 AND 26 — AUTOMATIC

At weeks 25 and 26, the system sends the final two prompts automatically alongside special emails. You do nothing. It is automatic.

---

### BOOK ONBOARDING — WHAT THE SUBSCRIBER NEEDS TO DO

From week 24 onwards, the subscriber receives reminders asking them to complete their book details in their Story Library:

- Upload a portrait photograph
- Confirm their book title
- Write a dedication
- Write an epigraph (optional)

The system sends these reminders automatically (emails 9, 10, and 11). You do not need to chase them manually unless email-11 triggers an overdue alert to hello@24stories.co.za.

---

### PRESSING COMPLETE

When the subscriber has filled in all their book details, they press **Complete** in their Story Library.

**What happens automatically:**

- BookFormCompleted is set in Airtable — book details are locked in.
- Nothing else fires at this point. Email-12 does not fire here. That is your trigger to send, when you are ready.

---

### STEP 1 — GENERATE CHAPTER ORDER (your trigger)

When all 26 stories are submitted and edited, tick **GenerateChapterOrder** on the subscriber's Airtable record.

**WHERE TO GO:** Airtable → Subscribers table → open the subscriber record → tick the **GenerateChapterOrder** checkbox.

**What happens automatically (within 2 minutes):**

- The system reads all submitted stories for this subscriber
- Stories are sorted chronologically by the **Circa Date** each subscriber entered in their Story Library
- If a subscriber entered both a month and year, the system uses both; if year only, it sorts by year (and uses the prompt week number to break ties within the same year)
- Stories with no Circa Date entered are placed at the end, in prompt order
- **ChapterOrder** (1, 2, 3... up to 26) is written to each story record in the Airtable Stories table
- The **GenerateChapterOrder** checkbox unticks itself
- You receive an alert at **hello@24stories.co.za**:

Subject: `CHAPTER ORDER GENERATED — [FirstName Surname]`

The alert lists every chapter in order: chapter number, prompt week, chapter title, and circa date. It reads like a table of contents.

**What you do after receiving the alert:**

1. Review the chapter order — does the chronological sequence make sense?
2. If a story is in the wrong place, check the Circa Date the subscriber entered (Stories table → StoryCircaDate field) — you can correct it directly and re-tick GenerateChapterOrder to regenerate
3. Do your final edit pass — read each story in Airtable with the chapter order in mind, check for continuity, fix anything that needs attention
4. Check for system glitches: missing EditedText, blank chapter titles, missing images, anything unexpected

Only when you are satisfied with the chapter order and final edits, proceed to Step 2.

---

### STEP 2 — BOOK DISPATCH (your trigger)

Tick **BookDispatchEmailSent** on the subscriber's Airtable record only when you are ready to send the book to print.

**WHERE TO GO:** Airtable → Subscribers table → open the subscriber record → tick the **BookDispatchEmailSent** checkbox.

**What happens automatically (within 2 minutes):**

- Email-12 fires to the subscriber — confirms their book is on its way, shows delivery address and number of copies
- **BookSentToPrintDate** is set to today in Airtable
- **BookDispatchEmailSent** unticks itself
- Delivery tracking alerts begin counting from today

**Your job immediately after:**

- Send the book files to the designer and printer
- Confirm the delivery address matches what is shown in email-12
- Note any extra copies (ExtraCopies field on the subscriber record — send that total to the printer)

---

### DELIVERY TRACKING — AUTOMATIC ALERTS TO hello@24stories.co.za

From the day you tick BookDispatchEmailSent (i.e. from BookSentToPrintDate), the system tracks delivery automatically.

| When | Alert subject |
|------|--------------|
| Day 23 after dispatch | `DELIVERY DUE IN 5 DAYS — [Name]` |
| Day 28 after dispatch | `DELIVERY DUE TODAY — [Name]` |
| Day 35, 42, 49... | `ACTION REQUIRED — [Name]'s book is [N] days overdue` |

**What to do when you receive a delivery alert:**

- Check progress with the printer
- If everything is on schedule: no action needed
- If there is a delay: go to Airtable → Subscribers → find the subscriber → tick **SendDelayNotification** → email-13 fires to the subscriber automatically within 2 minutes
- Once delivery is confirmed: set **Status = Complete** in Airtable — all delivery alerts stop immediately

---

### EXTRA COPIES

If a subscriber has ordered extra copies, the total is shown in email-12. The ExtraCopies field on their Subscribers record holds the quantity. Send that total to the printer.

---

## PART 5 — PAYMENTS

---

### HOW PAYMENT WORKS

Payment is via PayFast. Subscribers choose monthly (R2,795/month × 6 payments, auto-stops) or lump sum (R16,770 once-off). PayFast sends payment directly to your account and notifies the system via a webhook.

**You do not need to do anything when a payment comes in.** The system:

1. Verifies the payment is COMPLETE
2. Activates the subscriber (Status = Active, SubscriptionStartDate = today)
3. Creates a record in the Payments table in Airtable
4. Sends welcome emails to the storyteller, gift giver, and story helper automatically

A PayFast payment receipt also goes directly to the buyer — that is handled by PayFast, not by 24 Stories.

---

### EXTRA COPIES PAYMENT

Extra copies (R1,200 each) are a separate PayFast payment. When confirmed:

1. ExtraCopies is updated in Airtable automatically
2. A Payments record is created
3. Email-14 fires to the subscriber confirming their extra copies

---

### ACCELERATED SUBSCRIPTION PAYMENT

If a subscriber emails asking to pay upfront and get all 26 prompts immediately:

**Bookmark this page:**
`https://24stories.co.za/accelerated-admin.html`

**Your workflow:**
1. Open the bookmarked page
2. Type the subscriber's email address (it's right there in the email they sent you)
3. Click Send
4. Done

The system looks up the subscriber, calculates the remaining amount (R16,770 minus whatever they've already paid), and emails them a payment link automatically. You don't touch Airtable or build any URLs.

If you've agreed on a different amount, type it in the Amount Override field before clicking Send.

**What happens after they pay:**
- All 26 prompts unlock in their Story Library automatically
- A Payments record is created in Airtable automatically
- Nothing else for you to do

---

### VIEWING PAYMENT RECORDS

Airtable → base "52stories" → **Payments** table. Every successful payment has a record: subscriber, PayFast transaction ID, amount, date, status.

---

### REFUNDS — see the Refunds section above

---

## PART 6 — NEW SUBSCRIBER ACTIVATION

---

### HOW A SUBSCRIBER IS ACTIVATED

Everything is automatic. When a subscriber pays:

1. PayFast confirms payment to the system
2. The subscriber record in Airtable is updated: Status = Active, SubscriptionStartDate = today, LibraryToken set
3. Welcome emails fire (email-1 to storyteller, email-2 to gift giver if applicable, email-3 to story helper if applicable)
4. The following Wednesday at 7am, their first prompt goes out automatically

**You do not activate subscribers manually.** If a subscriber contacts you to say they paid but received nothing, check the Payments table in Airtable. If no record exists, the PayFast webhook may not have fired — contact PayFast support.

---

### CHECKING FOR NEW SUBSCRIBERS

If you want to confirm a new subscriber has been activated:

1. Airtable → Subscribers table
2. Look for Status = Active and a SubscriptionStartDate of today
3. PromptNumber will be 0 until their first prompt fires on Wednesday

---

## PART 7 — LEADS AND ENQUIRIES

---

### HOW SOURCES WORK IN AIRTABLE

Every lead in the Leads table has a **Source** field. This tells you exactly which form they used. You do not need to guess or cross-reference.

| Source | What it means |
|---|---|
| `Interest` | Filled in the early interest form on 24stories.co.za |
| `Free Download` | Requested the "5 Stories Worth Saving" PDF |
| `Events` | Signed up to be notified about a live event (attending only) |
| `Events — Storyteller Interest` | Ticked "I want to tell a story" on the events page |
| `Storyteller Application` | Submitted the full story application via events-apply.html |

These are separate forms. If someone only requested the free download, their source will say "Free Download" — not "Interest." They would only appear as "Interest" if they also filled in the early interest form separately.

---

### WHAT HAPPENS AUTOMATICALLY WHEN A LEAD COMES IN

You do not need to do anything immediately for any of these.

1. Lead is saved to the Airtable Leads table (name, email, source).
2. You receive an instant notification at **hello@24stories.co.za** with their name, email, and what they did.
3. The person receives an automatic confirmation email (except Events — attending only, where no email is sent until the date and venue are confirmed).

**Notification subject lines to recognise in Titan:**

| Subject | Means |
|---|---|
| `New interest — [Name]` | Early interest form |
| `Free download request — [Name]` | Free download requested |
| `New events lead — [Name]` | Events attending interest |
| `New storyteller interest — [Name]` | Events storyteller interest |
| `New Storyteller Application — [Name]` | Full story application submitted |

No immediate action is required. These notifications are for your awareness only.

---

### COLLECTING EMAIL ADDRESSES FOR A CAMPAIGN

**Why this section exists:**
All automated 24 Stories emails — weekly prompts, story notifications, reminders, book onboarding — are sent transactionally, directly to individual email addresses pulled from Airtable. None of them use Mailjet contact lists. There is no persistent Mailjet subscriber list and you do not need one for the system to run.

Airtable is your subscriber and leads list.

**When you will refer to this section:**
Only when you want to send a broadcast campaign — one email to many people at once. The most likely use is the **10 June 2026 launch email** to everyone on your interest list. You may also use it for occasional campaign sends to free download leads, event enquiries, or past subscribers.

**The process — Airtable export → Mailjet import → send campaign:**

When you are ready to run an email campaign to your leads list:

**To export all leads:**
1. Go to Airtable → base "52stories" → **Leads** table
2. Click the **grid menu icon** (top left, next to the view name)
3. Click **Download CSV**
4. Open the CSV — it contains Name, Email, Source for every lead

**To target a specific segment (e.g. only free download leads):**
1. In the Leads table, click **Filter**
2. Set: Source → contains → Free Download (or whichever source you want)
3. The view updates to show only those records
4. Download CSV — it exports only the filtered records
5. Clear the filter when done

**Importing into Mailjet for a campaign:**
1. In Mailjet, go to **Contacts → All contacts → Add contacts → Import contacts**
2. Upload the CSV
3. Map the columns: Email → Email, Name → Name
4. Mailjet adds them to your contact list
5. You can then send a campaign to that list

You can create separate Mailjet lists per segment (Interest, Free Download, Events) if you want to track open rates by source separately.

---

## REFUNDS

### Main subscription refund

The 24 Stories subscription is non-refundable. Subscribers may cancel at any time — their subscription ends at the close of the current billing cycle.

A refund request will arrive as an email to hello@24stories.co.za from the subscriber. You decide whether to grant it.

**If you choose to issue a goodwill refund:**

1. Log in to PayFast merchant dashboard → Transactions → find the transaction → Refund
2. In Airtable → Subscribers table → set Status = Cancelled
3. Open Titan → click **+ New Email** → click the Templates icon → select **Refund confirmation**
4. Address it to the subscriber (their email is in the request they sent you)
5. Replace the three placeholders:
   - [FirstName] → their first name
   - [Amount] → the refund amount in figures (e.g. 2795)
   - [reason] → one short phrase (e.g. "a technical error on our side" or "an exceptional circumstance")
6. Send from hello@24stories.co.za

**One-time setup — save as a draft in Titan (hello@24stories.co.za):**
1. Open Titan → click **+ New Email**
2. Subject: `Your refund — 24 Stories`
3. Paste this into the body:

---
Hello [FirstName],

We have processed a refund of R[Amount] following [reason]. The funds will appear on your original payment method within 5–7 business days.

If the refund does not appear within seven business days, please write to us directly and we will follow up with PayFast on your behalf.

With warmth,
Tamara
24 Stories
---

4. Do not send — close the window. Titan saves it to Drafts automatically.

**Every time you need to send a refund:**
1. Go to Titan → Drafts → open **Your refund — 24 Stories**
2. Select all the body text → copy
3. Close the draft without sending (this keeps it intact for next time)
4. Click **+ New Email**
5. Paste the body → replace [FirstName], [Amount], and [reason] with the correct details
6. Add the subscriber's email address in the To field
7. Send from hello@24stories.co.za

---

### Extra copies refund

Extra copies can be refunded if the request is received before BookSentToPrintDate is set. Once the book has gone to print, no refund is possible.

**To process an extra copies refund:**

1. Log in to PayFast merchant dashboard → Transactions → find the extra copies transaction → Refund
2. In Airtable → Subscribers table → reduce ExtraCopies by the refunded quantity (edit the field directly)
3. Send a manual confirmation from hello@24stories.co.za — no automated email exists for this

---

### What PayFast handles automatically

- PayFast sends a payment receipt to the buyer on every successful payment (main subscription and extra copies)
- PayFast does not process refunds automatically — all refunds are initiated manually through the merchant dashboard
- 24 Stories sends email-14 (extra copies confirmation) automatically on payment — this is separate from the PayFast receipt

---

## IF SOMETHING BREAKS

Open Claude Code (the app on your Mac, or VS Code with the Claude extension).

Start a new session and say exactly what you see — what happened, what you expected, what the screen shows.

Claude has full access to the code, Airtable, and this project.
