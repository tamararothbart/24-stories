---
name: 24 Stories Pricing Model
description: Final simplified pricing as of 2026-03-29 — three tiers, R3,820 book upfront calculation, section order on website
type: project
---

## Pricing (finalised 2026-03-29)

| Option | Price | Notes |
|--------|-------|-------|
| Monthly | R280/month | Cancel any time. Subscription runs to end of billing month (footnote only — not a drawcard) |
| Book Upfront | R3,820 once-off | Legacy Book R5,500 − subscription R1,680 (6 × R280) = R3,820. Subscription is FREE. |
| Add Book Later | R5,500 | Full book price, upgrade any time after subscribing monthly |

**Why R3,820:** Book = R5,500. Six months' subscription = 6 × R280 = R1,680. Pay for the book upfront and the subscription is free. R5,500 − R1,680 = R3,820.

**BookPath webhook values:** `subscription_only` or `book_upfront`

**Removed:** SubscriptionType, PromptFrequency (deleted from forms, JS, Airtable, Make)
**Removed:** Six months upfront at R1,500 — no longer an option
**Removed:** WhatsApp — post-launch v2.0 only

---

## Website Section Order (finalised 2026-03-29)

1. Hero
2. How It Works → Turn It Into a Book (no price shown — purely aspirational)
3. Testimonials (trust before price)
4. Pricing (three cards: Monthly | Add Book Later | Book Upfront featured)
5. Subscription Form
6. Final CTA

**Why this order:** Educate → build desire → social proof → price lands with full context → immediate capture.

---

## Pricing Page Cards (exact copy)

**Card 1 — Monthly**
- Price: R280/month
- Note: "Billed monthly. Cancel any time.*"
- Features: weekly prompt, 2 alternatives, voice-to-text, story shared with family each week, captioned photo, 24 stories archived
- Footnote *: "If you cancel, your subscription will remain active until the end of the current billing month. No further charges will be made."

**Card 2 — Add the Book**
- Price: R5,500
- Note: "Upgrade any time after subscribing. One copy included."
- Features: all book production inclusions

**Card 3 — Book Upfront (featured, Best Value badge)**
- Price: R3,820
- Note: "Pay for the Legacy Book upfront and your subscription is free. Book R5,500 − subscription R1,680 = R3,820."
- Features: everything in Monthly + subscription included + all book inclusions

---

## Airtable Changes Still To Do (user does manually)

- REMOVE: SubscriptionType, PromptFrequency
- RENAME: BookUpgrade → BookPurchased (checkbox)
- ADD: BookPath (single select: subscription_only / book_upfront)
- ADD: BookPurchasedAt (date)
- ADD: SubscriptionFree (checkbox)

---

## Make Changes Still To Do

- Scenario 1: remove SubscriptionType/PromptFrequency mappings, add BookPath → 1.BookPath
- Scenario 4: remove frequency multiplier, always +7 days. Add book upgrade link to email body once PayFast live
- All Mailjet modules: set Reply-To = hello@24stories.co.za (after SPF confirmed in Titan)
- New Scenario 6: end-of-month book reminder, R4,400 (20% off), filter BookPurchased = false, halts when BookPurchased = true
