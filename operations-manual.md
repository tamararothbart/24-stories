# 24 STORIES — WHERE TO GO FOR EVERYTHING

Operations Flow Reference

Last updated: 6 May 2026

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

**WHERE TO GO:** Click the "Edit this story in Airtable →" button in the alert email. It opens the exact record.

**WHAT TO DO:**

1. The record opens. You are looking at the StoryID panel.

2. Scroll down to the **EditedText** field. It already contains a full copy of the raw story text — pre-loaded automatically when the subscriber submitted.

3. Edit directly within the EditedText field. You do not need to read StoryText and retype anything. Just edit what is already there.

4. To work more comfortably: click the diagonal expand arrows in the top-right corner of the EditedText field. This opens a full-screen editing panel.

5. Grammarly works automatically in Airtable — your browser extension will run as you type.

6. When you are done editing, click outside the field or close the panel. Airtable saves automatically.

7. **Add a chapter title.** Click the **ChapterTitle** field and type the title for this chapter. Keep it short — four to eight words. This title appears in the family delivery email, in the subscriber's story library dropdown, and in the book. Airtable saves automatically.

**IMPORTANT:** Do not edit the StoryText field. That field holds the original submission exactly as the subscriber sent it — it is the authentic record. EditedText is where your work goes.

---

### STEP 5 — YOU SEND THE STORY TO THE FAMILY

**WHERE TO GO:** Stay in Airtable. You are still on the same story record you just edited.

**WHAT TO DO:**

1. Tick the **SendToFamily** checkbox on the story record.

2. That's it. Do not navigate away — Airtable saves immediately.

**WHAT HAPPENS NEXT (automatic, within 2 minutes):**

- The system detects the ticked checkbox and fires automatically.
- The subscriber receives an email confirming their story has been sent — with the edited version and the chapter title.
- Every family email address on their Subscribers record receives the story and chapter title.
- The story record is updated: **SentToFamilyDate** is set to today and the **SendToFamily** checkbox unticks itself.

**IF THE SUBSCRIBER HAS NO FAMILY RECIPIENTS:**

Tick SendToFamily anyway. The subscriber still receives a confirmation email showing their edited story. There is nothing else you need to do.

**NOTE:** The subscriber's library continues to show all stories — the edited version appears once EditedText is populated. This happens as soon as you save your edits in Step 4, independently of sending.

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

## PART 4 — WEEK 26 / BOOK PRODUCTION

*(To be added when book production flow is confirmed and tested.)*

---

## PART 5 — PAYMENTS

*(To be added when payment flow is tested and live.)*

---

## PART 6 — NEW SUBSCRIBER ACTIVATION

*(To be added when onboarding flow is confirmed.)*

---

## IF SOMETHING BREAKS

Open Claude Code (the app on your Mac, or VS Code with the Claude extension).

Start a new session and say exactly what you see — what happened, what you expected, what the screen shows.

Claude has full access to the code, Airtable, and this project.
