---
name: 24 Stories — v3 Cradle-to-Grave Flow Decisions
description: All flow decisions made 2026-04-06 session. Reference for architecture build and email audit.
type: project
---

# 24 Stories — v3 Cradle-to-Grave Flow

**Decided: 2026-04-06**

---

## PATH A — STORYTELLER SUBSCRIBES DIRECTLY

1. Storyteller completes signup form:
   - First name, surname, email
   - Story Helper first name + email (optional)
   - Family email list (optional)
   - Delivery address + phone number
   - PayFast payment

2. PayFast confirms payment:
   - a. Airtable Subscribers record created — all fields, LibraryToken generated, BookOrdered = TRUE, Status = Active, PromptNumber = 0
   - b. Email 1 → Storyteller (Welcome; library link prominent)
   - c. Email 3 → Story Helper (if StoryHelperEmail not empty; Welcome; library link)

---

## PATH B — GIFT GIVER SUBSCRIBES ON BEHALF OF STORYTELLER

1. Gift Giver completes signup form:
   - Gift Giver first name + email
   - Storyteller first name, surname, email
   - Story Helper first name + email (optional)
   - Family email list (optional)
   - Delivery address + phone number
   - PayFast payment

2. PayFast confirms payment:
   - a. Airtable Subscribers record created — all fields, GiftGiverEmail populated
   - b. Email 1 → Storyteller (Welcome; library link prominent)
   - c. Email 2 → Gift Giver (Confirmation)
   - d. Email 3 → Story Helper (if StoryHelperEmail not empty)

---

*Paths merge from here.*

---

## WEEKLY CYCLE — WEEKS 1–26

3. Week 1 — first prompt:
   - a. Email 4 (Week 1 Prompt) → Storyteller (library link in footer)
   - b. Email 4 → Story Helper (if StoryHelperEmail not empty; Make filter applied)
   - c. Airtable: PromptNumber = 1

4. Day 4 — if no story submitted:
   - a. Email 7 (Day 4 Reminder) → Storyteller
   - b. Email 7 → Story Helper (if StoryHelperEmail not empty; Make filter applied)

5. Storyteller submits story via library portal:
   - a. Airtable Stories record created — Subscriber, PromptNumber, story text, timestamp
   - b. Email 5 (Story Confirmation) → Storyteller only (never Story Helper)

6. Family story delivery (fires on every submission, no time window):
   - a. Email 6 (Family Story Delivery) → all FamilyEmails (Gift Giver slot 1, Story Helper slot 2 if present)
   - Note: Email 6 includes line "Stories arrive as your storyteller shares them"

7. Weeks 2–26 — regular weekly cycle (same as steps 3–6, Email 8 replaces Email 4):
   - a. Email 8 (Regular Prompt) → Storyteller (library link in footer)
   - b. Email 8 → Story Helper (if StoryHelperEmail not empty; Make filter applied)
   - c. Airtable: PromptNumber incremented

---

## WEEK 13 — BOOK FORM REMINDER (within prompt email)

8. Week 13 prompt email includes dedicated paragraph:
   - Midpoint reminder to start collecting cover photo and portrait
   - Prominent library button

---

## WEEK 20 — BOOK FORM DEDICATED REMINDER

9. After Week 20 prompt sends:
   - a. New dedicated book form reminder email → Storyteller (warm, library button)
   - Note: Review request flow entirely removed — Week 20 is otherwise a standard week

---

## WEEK 24 — BOOK FORM URGENT REMINDER

10. After Week 24 prompt sends:
    - a. New dedicated urgent reminder → Storyteller ("2 weeks remaining, please complete your book form")
    - Library button

---

## WEEKS 25–26 — FINAL PROMPTS

11. Weeks 25 and 26 follow regular cycle (Email 8, steps 7)

---

## WEEK 26 — END OF SUBSCRIPTION

12. After Week 26 prompt sends:
    - a. Email 16 (Book Onboarding Week 26) → Storyteller (subscription complete; production beginning; library link to complete form)
    - b. Airtable: Status → SubscriptionComplete; BookOrders record created

---

## BACK COVER BLURB (between Week 26 and book production)

13. Tamara exports all 26 stories from Airtable
14. Pastes into Claude with blurb prompt template (template to be written)
15. Reviews and edits output
16. Back cover blurb goes to designer with rest of book production assets

---

## BOOK ONBOARDING — POST-WEEK 26 FOLLOW-UP (if form incomplete)

17. Day 3 post-Week 26: Email 17 (Reminder) → Storyteller
18. Day 7 post-Week 26: Email 17 (Reminder) → Storyteller
19. Day 14+ post-Week 26: Email 18 (Overdue — Pause Option) → Storyteller

---

## BOOK PRODUCTION

20. Storyteller completes book form in library (cover photo optional, portrait optional, dedication or epigraph single field)
21. Airtable BookOrders record updated — all production assets captured
22. Tamara notified
23. Tamara generates back cover blurb (see step 13–15)
24. Book designed using InDesign/Affinity Publisher template (full colour throughout)
25. Print order placed

---

## EXTRA COPIES

26. Storyteller orders via website (method TBC — book.html or library)
    - a. PayFast payment
    - b. Email 19 (Extra Copies Confirmation) → Storyteller
    - c. Airtable BookOrders updated

---

## PROOF APPROVAL (new step — not previously in flow)

27. Designer sends proof to Tamara
28. Tamara reviews proof
29. Tamara sends Proof Email → Storyteller (manual, from hello@24stories.co.za):
    - PDF proof attached or linked
    - Request to review and approve (or flag changes)
    - Extra copies prompt: "Order extra copies now to include in same print run — visit your library"
    - Response deadline stated
    - Note: ordering after print run starts means a new job at higher cost (also in FAQ and library)
30. Storyteller approves or requests changes
31. If changes: designer amends, new proof sent, repeat
32. On approval: Airtable ProofApprovedDate stamped; designer sends to printer

---

## BOOK DELIVERY

33. Books dispatched
34. Email 20 (Book Delivery Confirmation) → Storyteller — manual, Tamara sends from hello@
35. If delayed: Email 21 (Late Delivery Apology) → Storyteller — manual

---

## PAYMENT FAILURE (any point during subscription)

- Day 1: Email 10 (Payment Failed #1) — includes card update link
- Day 5: Email 11 (Payment Failed #2 + Warning) — includes card update link
- Day 10: Email 12 (Cancelled — Payment Failure) — automatic; Airtable Status → Cancelled

---

## CANCELLATION BY SUBSCRIBER (separate path — no crossover with payment failure)

- Storyteller emails hello@24stories.co.za
- Tamara ticks "Cancel Subscription" checkbox in Airtable
- Make automatically:
  - a. Calls PayFast API — stops debits
  - b. Updates Status → Cancelled
  - c. Fires Email 13 (Cancellation Confirmation)
- Email 13 confirms: access continues to end of billing month; no further debits

---

## MANUAL / EXCEPTION EMAILS

- Email 21 (Late Delivery Apology) — Tamara sends manually
- Email 22 (Refund Confirmation) — Tamara sends manually
