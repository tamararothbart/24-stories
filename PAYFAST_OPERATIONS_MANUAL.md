# 24stories.co.za — PayFast Operations Manual

---

## QUICK REFERENCE: ALL PAYMENT LINKS

| ID | Scenario | How to initiate | Type | Amount |
|----|----------|----------------|------|--------|
| PAY-01 | Gift subscription | https://24stories.co.za/#subscribe — gift tab | Monthly recurring | R3 500 × 6 |
| PAY-02 | Self subscription | https://24stories.co.za/#subscribe — self tab | Monthly recurring | R3 500 × 6 |
| PAY-03 | Lump sum | WhatsApp arrangement — no public link | Once-off | R16 800 |
| PAY-04 | Accelerated upgrade | https://24stories.co.za/accelerated-admin.html — enter subscriber email, click Send | Once-off | R16 800 minus payments made |
| PAY-05 | Extra copies | https://24stories.co.za/library.html?id=[subscriberID] — Extra Copies section | Once-off | R1,200/copy (R1,000 for 10+) |
| PAY-06 | Coaching | https://wa.me/27823758320 — manual only, no PayFast | Manual | R1,200 / R3,200 / R5,500 / R18,000 |
| PAY-07 | Recurring renewals 2–6 | Automatic — PayFast bills monthly, no action needed | Automatic | R3 500 each |

**All payment links are static and permanent except PAY-04 (generated per subscriber) and PAY-05 (unique per subscriber library URL).**

---

## PAYFAST DASHBOARD SETUP CHECKLIST

Log in at https://www.payfast.co.za

1. **Recurring payments enabled** — Settings → Products → confirm Subscriptions is active on your account. If not, contact PayFast to enable it.
2. **IPN URL set** — Settings → Integration → Instant Transaction Notification URL:
   `https://24stories.co.za/.netlify/functions/payfast-webhook`
3. **Merchant ID and Key noted** — Settings → Integration → copy both values. Store in a secure note. You need them on launch day.
4. **Passphrase** — Settings → Integration → Passphrase field. You have created one. Keep it. Store it securely. You need it on launch day.
5. **2FA active** — Settings → Security → confirm two-factor authentication is on.
6. **Bank account verified** — Merchant → Bank Details → confirm verified. PayFast will not pay out until verified.
7. **Sandbox credentials noted** — Integration → Sandbox → copy Sandbox Merchant ID and Sandbox Merchant Key. Store securely. You need them for any future sandbox testing.

---

## SCENARIO-BY-SCENARIO REFERENCE

---

### PAY-01: Gift-path monthly subscription

**A. WHAT THE CLIENT SEES**
- Page: https://24stories.co.za/#subscribe
- Tab: "I'm giving this as a gift" (default)
- Fields: Storyteller name + first name + email, Gift Giver name + email, optional Story Helper, family recipient emails (up to 10)
- Button: "Give This Gift"
- On submit: redirected to PayFast hosted payment page (sandbox.payfast.co.za during testing, www.payfast.co.za on launch)
- On cancel: returned to https://24stories.co.za/#subscribe

**B. PAYFAST CONFIGURATION**
- Type: Recurring subscription (subscription_type=1, frequency=3 monthly, cycles=6)
- Amount: R3 500.00 per month
- item_name: 24 Stories
- notify_url: https://24stories.co.za/.netlify/functions/payfast-webhook
- return_url: https://24stories.co.za/thank-you.html
- cancel_url: https://24stories.co.za/#subscribe
- custom_str1: Airtable subscriber record ID
- custom_str2: monthly
- Signature: generated server-side in checkout.js using PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE from Netlify env vars
- No static payment link — generated fresh per checkout by checkout.js

**C. CLIENT EXPERIENCE AFTER PAYMENT**
- Lands on: https://24stories.co.za/thank-you.html — "Payment received. Welcome to 24 Stories."
- Emails received within seconds: Email 1 (storyteller welcome with library link), Email 2 (gift giver confirmation), Email 3 (story helper welcome if applicable)
- Access: library live immediately at https://24stories.co.za/library.html?id=[recordID]
- First prompt: arrives following Wednesday via send-weekly-prompts.js

**D. BACKEND PROCESSING**
- PayFast POSTs ITN to payfast-webhook.js
- Checks payment_status = COMPLETE only
- Fetches Airtable subscriber record (was Pending)
- Updates: Status → Active, SubscriptionStartDate → today, LibraryToken → recordID, WelcomeEmailSentAt → now, PaymentsCount → 1
- Creates Payments record with subscription token as PayFastTransactionID
- Sends emails 1/2/3
- Sends notification to hello@24stories.co.za
- If ITN not received: subscriber stays Pending. PayFast retries up to 3 times at 30-minute intervals. If all fail, activate manually in Airtable (Status → Active, SubscriptionStartDate → today, LibraryToken → record ID, PaymentsCount → 1).

**E. AIRTABLE**
- Subscribers table: Status Active, SubscriptionStartDate, LibraryToken, WelcomeEmailSentAt, PaymentsCount=1
- Payments table: new record with subscriber link, transaction ID (subscription token), amount, date, Status=COMPLETE
- Trigger: ITN only (not return_url)

**F. MAILJET**
- Email 1 to storyteller: "Welcome to 24 Stories — Your Journey Begins Today" — from stories@24stories.co.za
- Email 2 to gift giver (if different email): "Your gift to [Name] — 24 Stories"
- Email 3 to story helper (if different from both): "You have been named as [Name]'s Story Helper — 24 Stories"
- Fires within seconds of ITN. No retry if Mailjet fails.

**G. YOUR NOTIFICATIONS**
- Email to hello@24stories.co.za — subject: "NEW SUBSCRIBER — [Full Name]"
- Includes: name, email, payment type (Monthly R3 500 × 6), amount
- Arrives within seconds of payment confirmation

**H. GAPS AND RISKS**
- No ITN security validation — webhook does not ping PayFast to verify ITN is genuine. Low risk for now; add before scaling.
- Pending records accumulate on abandoned checkouts — no cleanup process. Harmless at low volume.
- PAYFAST_USE_SANDBOX = true in script.js — must change to false on launch day.

**I. PAYMENT LINK**
- Entry point: https://24stories.co.za/#subscribe
- Dynamic — checkout.js generates fresh signed params per submission
- Share this URL in all marketing, emails, social posts

---

### PAY-02: Self-path monthly subscription

Identical to PAY-01 in every backend respect. The only difference is the frontend form tab ("I'm telling my own story") and the data collected (no separate gift giver — storyteller and gift giver fields are set to the same person). Everything from B through I is identical to PAY-01.

**Entry point:** https://24stories.co.za/#subscribe — self tab

---

### PAY-03: Lump sum once-off (R16 800)

**A. WHAT THE CLIENT SEES**
- No public page. This is arranged manually via WhatsApp (082 375 8320) or hello@24stories.co.za.
- The FAQ on index.html says: "Prefer to pay in full? WhatsApp us at 082 375 8320 and we'll arrange a once-off payment instead."
- You initiate this via accelerated-admin.html (see PAY-04) for subscribers who want to pay upfront at signup.

**B. PAYFAST CONFIGURATION**
- Type: Once-off single payment (no subscription fields)
- Amount: R16 800.00
- custom_str2: lump_sum
- checkout.js supports this via paymentType: 'lump_sum' but no frontend UI exposes it
- To use: call checkout.js API directly or arrange via PAY-04 accelerated flow

**C–G.** Same as PAY-01 except:
- AccessEndDate set to 6 months from today on activation
- No subscription token (once-off payment, no recurring billing)
- PaymentsCount set to 1 only — no further payments will arrive

**H. GAPS**
- No frontend UI for lump sum at signup. Clients must WhatsApp you. You then either (a) create the Airtable record manually and use accelerated-admin.html, or (b) have them sign up normally and offer a refund arrangement.

**I. PAYMENT LINK**
- None (manual). Entry point: https://wa.me/27823758320

---

### PAY-04: Accelerated upgrade (all 26 prompts unlocked immediately)

**WHO THIS IS FOR:** Existing active subscribers (monthly plan) who want to unlock all 26 prompts immediately instead of waiting for the weekly schedule. Also used for pre-launch free testers.

**A. YOUR ACTION AS OPERATOR**
- Go to: https://24stories.co.za/accelerated-admin.html
- Enter the subscriber's email address
- Optionally override the amount (default: R16 800 minus payments already made)
- Click "Send payment link"
- The system emails the subscriber a personalised payment link automatically

**B. WHAT THE SUBSCRIBER SEES**
- Receives email: "Your payment link — 24 Stories"
- Clicks the link — lands on a branded payment page showing their name and amount
- Clicks "Pay securely →" — taken to PayFast
- return_url: their library (https://24stories.co.za/library.html?id=[ID])
- cancel_url: their library

**C. PAYFAST CONFIGURATION**
- Type: Once-off single payment
- Amount: calculated as R16 800 minus (PaymentsCount × R3 500), or overridden
- item_name: 24 Stories — Accelerated Subscription
- custom_str1: subscriber record ID
- custom_str2: accelerated
- Signature: generated server-side in accelerated-checkout.js

**D. BACKEND PROCESSING (payfast-webhook.js)**
- Checks isAlreadyActive = true AND paymentType = accelerated
- Sets AcceleratedSubscription = true on subscriber record
- Creates Payments record
- Sends notification to hello@24stories.co.za — subject: "ACCELERATED UPGRADE — [Name]"

**E. AIRTABLE**
- AcceleratedSubscription checkbox → true
- New Payments record

**F. MAILJET**
- No email sent to subscriber on completion (they return to their library which updates automatically)

**G. YOUR NOTIFICATIONS**
- Email to hello@24stories.co.za — subject: "ACCELERATED UPGRADE — [Full Name]"
- Includes: name, amount paid

**H. GAPS**
- No confirmation email to subscriber on payment success. They return to library which shows all 26 prompts — that is the confirmation.

**I. PAYMENT LINK**
- Admin page: https://24stories.co.za/accelerated-admin.html (keep this URL private)
- Generated per subscriber — not reusable

---

### PAY-05: Extra copies

**WHO THIS IS FOR:** Active subscribers in the book production phase who want additional copies of their Legacy Book.

**A. WHAT THE CLIENT SEES**
- Page: their Story Library — https://24stories.co.za/library.html?id=[subscriberID]
- Section: Extra Copies (visible in Book Production section)
- Enters quantity — price calculates automatically (R1,200 each, R1,000 each for 10+)
- Clicks "Request a payment link" — taken directly to PayFast

**B. PAYFAST CONFIGURATION**
- Type: Once-off single payment
- Amount: quantity × rate
- item_name: 24 Stories — N Extra Copies
- custom_str1: subscriber record ID
- custom_str2: quantity as a number string (e.g. "3")
- notify_url: https://24stories.co.za/.netlify/functions/payfast-webhook
- return_url: subscriber's library URL
- cancel_url: subscriber's library URL
- Signature: generated server-side in extra-copies-checkout.js (NEW — replaced broken placeholder code)

**C. CLIENT EXPERIENCE AFTER PAYMENT**
- Returns to their library
- No separate confirmation page

**D. BACKEND PROCESSING**
- payfast-webhook.js detects custom_str2 is a number → extra copies path
- Increments ExtraCopies field on subscriber record (cumulative — safe to order in multiple transactions)
- Creates Payments record
- Sends email 14 to subscriber — "Your extra copies are confirmed — 24 Stories"
- Sends notification to hello@24stories.co.za

**E. AIRTABLE**
- Subscribers: ExtraCopies field incremented by quantity
- Payments: new record

**F. MAILJET**
- Email 14 to subscriber: "Your extra copies are confirmed — 24 Stories"

**G. YOUR NOTIFICATIONS**
- Email to hello@24stories.co.za — subject: "EXTRA COPIES — [Name]: N copies"
- Includes: name, quantity, amount paid

**H. GAPS**
- Extra copies are confirmed in Airtable and email but the print order workflow (sending total copies to printer at dispatch) is not yet automated. When BookDispatchEmailSent fires, send-story-queue.js already reads totalBooks = 1 + ExtraCopies. The print order alert to you is the next build item.

**I. PAYMENT LINK**
- Not a shareable static link — accessed from inside the subscriber's library only
- To direct a subscriber there: https://24stories.co.za/library.html?id=[their Airtable record ID] → Extra Copies section

---

### PAY-06: Coaching sessions

**No PayFast integration.** All coaching is manual.

- All four pricing options on coaching.html link to https://wa.me/27823758320
- You arrange payment and sessions directly with the subscriber
- Coaching upsell emails (at prompts 3, 8, 15, 24) also link to WhatsApp
- No Airtable payment record is created for coaching

**To book coaching:** https://24stories.co.za/coaching.html or direct WhatsApp link https://wa.me/27823758320

---

### PAY-07: Recurring renewals (payments 2–6)

**No action required from you or the subscriber.** PayFast handles billing automatically.

**What happens:**
- PayFast charges R3 500 on the same date each month (or the next working day)
- PayFast sends an ITN to payfast-webhook.js with the subscription token
- payfast-webhook.js increments PaymentsCount (2, 3, 4, 5, 6)
- On payment 6: BookOnboardingUnlocked is set to true on the subscriber record
- Payments record created for each payment
- You receive a notification email for every payment

**Your notifications (hello@24stories.co.za):**
- Payments 2–5: "PAYMENT N/6 — [Full Name]" — includes amount
- Payment 6: "PAYMENT 6/6 COMPLETE — [Full Name] — book onboarding unlocked" — signals you to watch for book onboarding activity

**If a recurring payment fails:**
- PayFast will retry (check your PayFast dashboard — Transactions → Subscriptions)
- The subscriber will receive a PayFast payment failure email automatically
- You will NOT receive a notification of a failed payment — check PayFast dashboard if you suspect an issue
- If a subscriber's subscription lapses, their Status in Airtable remains Active until you manually change it

---

## FAILURE AND EDGE CASE HANDLING

| Situation | What happens | What to do |
|-----------|-------------|------------|
| PayFast is down | Subscriber cannot complete payment — sees PayFast error page | Wait and ask them to retry. No Airtable record is activated until ITN arrives. |
| ITN not received after payment | Subscriber paid but Status stays Pending. Emails not sent. | Check PayFast dashboard → Transactions → find the transaction → check ITN status. If confirmed paid, manually activate in Airtable: Status=Active, SubscriptionStartDate=today, LibraryToken=recordID, PaymentsCount=1. Then send emails 1/2/3 manually from hello@. |
| Subscriber paid but got no emails | ITN fired and activated but Mailjet failed silently | Check Airtable — if Status=Active they are activated. Send emails 1/2/3 manually from hello@. Their library link is https://24stories.co.za/library.html?id=[Airtable record ID]. |
| Duplicate payment (paid twice) | Second ITN fires with same record ID. isAlreadyActive=true — treated as payment 2/6. PaymentsCount becomes 2. | Check PayFast dashboard. If genuine duplicate, contact PayFast for refund. Correct PaymentsCount manually in Airtable. |
| Subscriber cancels mid-subscription | PayFast stops billing. No ITN fires. Airtable Status stays Active. | Change Status to Cancelled manually in Airtable. No refund — non-refundable per terms. |
| Recurring payment fails (card expired etc.) | PayFast retries. If all retries fail, subscription lapses. | Check PayFast dashboard. Contact subscriber. Ask them to update payment details in PayFast or restart subscription. |
| Subscriber requests refund | Non-refundable per Terms & Conditions. | Refer to terms. If exception granted, process refund in PayFast dashboard → Transactions → Refund. Then manually set Status to Cancelled in Airtable. |
| Extra copies paid but ExtraCopies not updated | ITN failed for extra copies payment | Check PayFast dashboard. If confirmed paid, manually update ExtraCopies field in Airtable and create Payments record manually. |

---

## YOUR NOTIFICATION CHECKLIST

Every payment event that sends you an email to hello@24stories.co.za:

| Event | Subject line | When it arrives |
|-------|-------------|----------------|
| New subscriber (PAY-01/02) | NEW SUBSCRIBER — [Full Name] | Seconds after payment confirmed |
| Lump sum activation (PAY-03) | NEW SUBSCRIBER — [Full Name] | Seconds after payment confirmed |
| Accelerated upgrade (PAY-04) | ACCELERATED UPGRADE — [Full Name] | Seconds after payment confirmed |
| Extra copies (PAY-05) | EXTRA COPIES — [Full Name]: N copies | Seconds after payment confirmed |
| Recurring payment 2–5 (PAY-07) | PAYMENT N/6 — [Full Name] | Seconds after PayFast bills |
| Final payment 6/6 (PAY-07) | PAYMENT 6/6 COMPLETE — [Full Name] — book onboarding unlocked | Seconds after PayFast bills |

**What you are NOT notified about:**
- Failed recurring payments — check PayFast dashboard if you suspect an issue
- Abandoned checkouts (visitor started form, never paid) — Pending records in Airtable

---

## AIRTABLE AND MAILJET AUTOMATION MAP

| Payment event | Airtable action | Email to subscriber | Email to you |
|--------------|----------------|---------------------|--------------|
| PAY-01/02 first payment | Status=Active, PaymentsCount=1, LibraryToken set | Email 1 (welcome), Email 2 (gift giver), Email 3 (helper) | NEW SUBSCRIBER |
| PAY-03 lump sum | Status=Active, AccessEndDate=+6mo, PaymentsCount=1 | Email 1, 2, 3 | NEW SUBSCRIBER |
| PAY-04 accelerated | AcceleratedSubscription=true | None | ACCELERATED UPGRADE |
| PAY-05 extra copies | ExtraCopies incremented | Email 14 | EXTRA COPIES |
| PAY-07 payments 2–5 | PaymentsCount incremented | None | PAYMENT N/6 |
| PAY-07 payment 6 | PaymentsCount=6, BookOnboardingUnlocked=true | None | PAYMENT 6/6 COMPLETE |

---

## LAUNCH DAY FLIP — COMPLETE CHECKLIST

Do these in order on June 10 before emailing the interest list.

**In Netlify dashboard (app.netlify.com → your site → Environment Variables):**

1. Edit `PAYFAST_MERCHANT_ID` → replace sandbox value with your live Merchant ID (from PayFast dashboard → Integration)
2. Edit `PAYFAST_MERCHANT_KEY` → replace sandbox value with your live Merchant Key
3. Edit `PAYFAST_SANDBOX` → change `true` to `false`
4. Edit `PAYFAST_PASSPHRASE` → paste your passphrase (currently blank — add it back)

**In the codebase (one line change — done by Claude):**

5. `js/script.js` line 65: change `PAYFAST_USE_SANDBOX = true` to `PAYFAST_USE_SANDBOX = false`

**Deploy:**

6. Push to GitHub (Claude does this) → Netlify auto-deploys
7. Wait for deploy confirmation
8. Go to https://24stories.co.za/#subscribe and complete a test signup with a real card for R3 500
9. Confirm: Airtable activates, emails arrive, hello@ notification arrives
10. If all confirmed: send to interest list

**To reverse back to sandbox at any time:** reverse steps 1–5.

---

## SANDBOX TESTING CHECKLIST

Current state (as of session 2026-05-13): sandbox is configured and ready.

**To run a test:**
1. Go to https://24stories.co.za/#subscribe
2. Fill in the gift or self form with test data (use your own email as storyteller)
3. Complete payment on PayFast sandbox using PayFast test card details:
   - Card number: 4000000000000002
   - Expiry: any future date
   - CVV: any 3 digits
4. Check: hello@24stories.co.za for NEW SUBSCRIBER notification
5. Check: Airtable — subscriber should be Status=Active
6. Check: tamararothbart1@gmail.com for Email 1 (welcome)
7. Check: library at https://24stories.co.za/library.html?id=[Airtable record ID]

**To test extra copies (PAY-05):**
1. Go to the test subscriber's library URL
2. Enter a quantity in the Extra Copies section
3. Complete payment on PayFast sandbox
4. Check: Airtable ExtraCopies field incremented
5. Check: Email 14 received
6. Check: hello@ EXTRA COPIES notification received

**To test accelerated upgrade (PAY-04):**
1. Go to https://24stories.co.za/accelerated-admin.html
2. Enter the test subscriber's email
3. Check that payment link email arrives
4. Click link, complete payment on sandbox
5. Check: AcceleratedSubscription = true in Airtable
6. Check: hello@ ACCELERATED UPGRADE notification received

---

## REMAINING ACTION ITEMS BEFORE LAUNCH

| # | Item | Blocker? | How to fix |
|---|------|----------|------------|
| 1 | `PAYFAST_USE_SANDBOX = false` in script.js | YES — launch day | One line change, Claude does it |
| 2 | Swap live credentials in Netlify | YES — launch day | See Launch Day Flip above |
| 3 | Add PAYFAST_PASSPHRASE back on launch day | YES | Netlify dashboard |
| 4 | Complete sandbox testing | YES — before beta | Run Sandbox Testing Checklist above |
| 5 | ITN security validation not implemented | No — add post-launch | payfast-webhook.js needs PayFast validation ping |
| 6 | No notification on failed recurring payments | No — add post-launch | Requires PayFast webhook subscription event |
| 7 | Pending records not cleaned up | No — low volume | Add a cleanup cron later |
