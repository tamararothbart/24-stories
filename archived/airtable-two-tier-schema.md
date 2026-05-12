# Airtable Two-Tier Schema — Archived Reference

Created: 2026-05-12
Session: 1 (revert to single-tier)
Reason: Two-tier model (Monthly Memoir + Bound Edition) cancelled. Reverting to single all-inclusive subscription.

---

## Fields Added to Subscribers Table for Two-Tier Model

These fields were added in Session 18 (2026-05-11) and removed in Session 1 of the revert (2026-05-12).

### SubscriberTier
- **Field ID:** fld5pPuVW0nlLlPer
- **Type:** singleSelect
- **Options:** `monthly_memoir`, `bound_edition`
- **Purpose:** Tracked which tier a subscriber was on. Monthly Memoir subscribers could upgrade to Bound Edition.
- **Used in:** `checkout-monthly.js` (set to `monthly_memoir` on signup), `payfast-webhook-monthly.js` (set to `monthly_memoir` on first payment, `bound_edition` on upgrade payment)

### PaymentsCount
- **Field ID:** fldF4VavF3nPAI4Mv
- **Type:** number
- **Purpose:** Tracked cumulative number of successful monthly PayFast debits for a subscriber. Used to detect first payment vs. recurring, and to increment on each successful charge.
- **Used in:** `checkout-monthly.js` (set to 0 on record creation), `payfast-webhook-monthly.js` (set to 1 on first payment, incremented on recurring payments)
- **Note:** Field retained in live schema — new single-tier model uses R2,795/month × 6 payments; PaymentsCount tracks position in that cycle.

### UpgradeDate
- **Field ID:** fldt2Ryc9s9XiheEs
- **Type:** date
- **Purpose:** Recorded the date a Monthly Memoir subscriber upgraded to the Bound Edition.
- **Used in:** `payfast-webhook-monthly.js` — written when `customStr2 === 'upgrade'` alongside setting SubscriberTier to `bound_edition`.

### CancellationDate
- **Field ID:** fldLB8uI6jUGR85K2
- **Type:** date
- **Purpose:** Recorded the date a subscriber's PayFast subscription was cancelled (PayFast sends `payment_status = CANCELLED`).
- **Used in:** `payfast-webhook-monthly.js` — written on cancellation alongside setting Status to `Cancelled`.
- **Note:** Field retained in live schema — useful for single-tier cancellation tracking.

---

## Netlify Functions Built for Two-Tier Model

### checkout-monthly.js
- **Path:** `netlify/functions/checkout-monthly.js`
- **Purpose:** Created a Pending Airtable Subscriber record for a Monthly Memoir signup and returned the record ID for PayFast's `custom_str1` parameter.
- **Key fields written:** StorytellerFirstName, StorytellerSurname, StorytellerEmail, StoryHelperName, StoryHelperEmail, GiftGiverName, GiftGiverEmail, FamilyEmails, Phone, Status (Pending), PromptNumber (0), SubscriberTier (monthly_memoir), PaymentsCount (0)
- **Archived to:** `archived/two-tier-website/checkout-monthly.js`

### payfast-webhook-monthly.js
- **Path:** `netlify/functions/payfast-webhook-monthly.js`
- **Purpose:** PayFast IPN handler for Monthly Memoir payments. Handled three scenarios:
  1. **CANCELLED** — set Status = Cancelled, CancellationDate = today, sent cancellation email (Email D)
  2. **COMPLETE + customStr2 = 'upgrade'** — set SubscriberTier = bound_edition, UpgradeDate = today, sent upgrade confirmation email (Email C)
  3. **COMPLETE (first or recurring payment)** — on first payment: activated subscriber, sent welcome email (Email A), gift giver email (Email B), story helper email; on recurring: incremented PaymentsCount
- **PayFast notify URL:** `https://24stories.co.za/.netlify/functions/payfast-webhook-monthly`
- **Archived to:** `archived/two-tier-website/payfast-webhook-monthly.js`

---

## Emails Built for Two-Tier Model

Inline HTML functions inside `payfast-webhook-monthly.js`:
- **Email A** — Monthly Memoir storyteller welcome (included upgrade prompt in Library section)
- **Email B** — Gift giver confirmation (mentioned upgrade option)
- **Email C** — Upgrade to Bound Edition confirmed
- **Email D** — Cancellation confirmation (72-hour library access window)

HTML reference files in `monthly-memoir-emails/`:
- `email-1.html` through `email-16.html` — Monthly Memoir variants of the full email stack
- `email-C-upgrade-confirmed.html`
- `email-D-cancellation.html`
- `subscriber-email-stack.html` — visual index

Archived folder: `archived/two-tier-website/monthly-memoir-emails/`

---

## index.html Two-Tier Pricing Section

### Pricing cards (approx. line 761–800)
Two-card layout:
- **Monthly Memoir card** — R395/month, data-plan="monthly_memoir", upgrade note below
- **Bound Edition card** — R6,795 once-off, data-plan="bound_edition"

### Signup form (approx. line 1046–1137)
Both gift and self forms contained:
- Two radio buttons: Monthly Memoir (R395/month) vs Bound Edition (R6,795)
- Dynamic recipient limit (5 for monthly, 10 for bound)
- Dynamic button label

---

## js/script.js Two-Tier Logic

- `CHECKOUT_MONTHLY_URL` — `/.netlify/functions/checkout-monthly`
- `NOTIFY_MONTHLY_URL` — `https://24stories.co.za/.netlify/functions/payfast-webhook-monthly`
- `getSelectedPlan()` — read radio button value
- `getRecipientLimit(plan)` — return 5 for monthly, 10 for bound
- `updateButtonLabel(plan, btn)` — swap button text by plan
- `window._selectedPlan` — plan state set by pricing card clicks
- Plan-conditional checkout routing throughout gift and self form submit handlers

---

## Pricing Mockup
- **File:** `24 Stories — Pricing Mockup v3.html`
- **Purpose:** Static design mockup for the two-tier pricing page. No live functionality.
- **Archived to:** `archived/two-tier-website/`

---

## Reinstatement Notes

If the two-tier model is reinstated:
1. Restore `checkout-monthly.js` and `payfast-webhook-monthly.js` from `archived/two-tier-website/`
2. Re-add SubscriberTier (singleSelect: monthly_memoir, bound_edition) and UpgradeDate (date) to Subscribers table
3. Restore two-tier pricing section in `index.html` and plan-detection logic in `js/script.js`
4. Set PayFast notify URL for monthly plan to `/.netlify/functions/payfast-webhook-monthly`
5. All 7 existing Subscribers at time of archive were set to `bound_edition`
