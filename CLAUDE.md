# 24 Stories — Website & Developer Context

## ⚠ CLAUDE.MD IS THE ONLY SOURCE OF TRUTH — READ FIRST, EVERY SESSION

---

## Session 30 — Pricing Restructure: Two-Card Layout + Payment Wiring — COMPLETE (2026-05-29)

### New pricing model (LOCKED)
- **Monthly:** R3 500/month × 6 months = R21 000 total (PayFast recurring subscription, auto-stops after 6 payments)
- **Upfront:** R16 800 once-off (PayFast single payment, AccessEndDate set to +6 months)
- **Saving:** R4 200 (20% off monthly total) — prominently displayed on upfront card
- Old prices R2,795/month and R16,770 once-off are GONE. Every file updated.

### Files changed this session
- **index.html:** Two-card pricing layout (upfront left, monthly right). Pricing eyebrow: "Six months from now, your memoir will be delivered to your door." Features list rewritten: speak-or-type + auto-transcription foregrounded. SA number format (non-breaking space as thousands separator) on all prices. FAQ "How does payment work?" updated to new prices + mentions upfront option. `data-payment="monthly"` added to monthly card buttons.
- **js/script.js:** `pendingPaymentType` variable reads `data-payment` attribute from whichever pricing card button was clicked. Passed to checkout on form submit. Both gift and self form submit handlers use `pendingPaymentType` instead of hardcoded `'monthly'`.
- **checkout.js:** Monthly amount R2,795 → R3,500. Lump sum amount R16,770 → R16,800. `recurring_amount` R2,795 → R3,500. `item_name` and `item_description` now dynamic per payment type.
- **payfast-webhook.js:** Admin alert label updated to new prices.
- **restart-checkout.js:** amount and recurring_amount R2,795 → R3,500. Item description updated.
- **accelerated-send.js:** Calculation updated: R16,800 minus (PaymentsCount × R3,500).
- **accelerated-checkout.js:** Default amount 16770 → 16800.
- **accelerated-admin.html:** Label updated to R16 800.
- **begin.html:** All 5 price references updated (intro text, payment summary ×2, fine print ×2).
- **library.html:** "Give This Gift" button updated to "from R3 500/month".
- **terms.html:** Payment terms updated; upfront option added.
- **operations-manual.md + PAYFAST_OPERATIONS_MANUAL.md:** All price references updated.
- **presentation/index.html:** Hero meta + product card updated.

### How PayFast tells them apart
- Monthly: `subscription_type=1, frequency=3, cycles=6` params present → PayFast treats as recurring
- Upfront: no subscription params → PayFast treats as once-off. Webhook sets AccessEndDate +6 months.
- `data-payment` attribute on pricing card buttons captures buyer's choice before they reach the form.

### Pause message
- Removed from pricing section. Belongs in T&Cs under "Pausing your subscription" — not yet written. Add when ready.

### Form fine print — dynamic (FIXED)
- Both forms on index.html share `id="payment-fine-print"`. Text updates automatically when a pricing card button is clicked.
- Monthly: "This is a 6-month subscription. You authorise R3 500 to be deducted automatically each month for six months, after which billing stops automatically."
- Lump sum: "This is a once-off payment of R16 800, covering your full 6-month subscription. No further payments will be taken."
- Logic lives in `updateFinePrint()` in js/script.js, called from the `[data-payment]` click handler.

---

## Session 29 — Copy Repositioning + Free Guide + Social Landing Page — COMPLETE (2026-05-29)

### Strategic repositioning (index.html + styles.css)
- Hero H1: "24 Stories. One Book. Six Months." → "24 Prompts. Six Months. One Book."
- Concept strip label: "Stories told" → "Prompts"
- Crux section (mobile) + founder video section (desktop): replaced "Each chapter is a self-contained story" with:
  - Problem copy: "Most families never capture their stories. Not because they don't want to. Because no one made it easy enough."
  - Bridge line: "One prompt. One week. Five minutes. That's the ask."
  - Founder download box: title "You Already Have the Stories" + subtitle "Your stories don't need to be created. They need to be uncovered." + gold CTA button
- Copy: "these stories" → "their stories" (both crux + founder sections)
- **North star sentence (locked):** "Your family has questions they forgot to ask. We help you answer them."
- **Hero sub line: NOT YET REWRITTEN** — marked with `<!-- ⚠ HERO SUB — REWRITE THIS LINE -->` in index.html. Direction: ease/simplicity, not craft. Avoid "told one prompt at a time." Current placeholder still live.

### Typography / legibility fixes (styles.css)
- `founder-crux-key`: Playfair bold → Cormorant Garamond 400 (cohesive with body)
- `founder-crux-body`: removed italic, opacity 0.72 → 0.97, slightly bigger
- `founder-download-title`: opacity 0.92 → #fff
- `founder-download-btn`: gold border+text on dark → **gold fill at rest**, charcoal on hover (reversed)
- `crux-body`: font-weight 400 → 500, full #1A1A1A (was 72% faded — Cormorant Garamond is hair-thin at 400 on screens)
- `crux-headline`: Cormorant+gold → Playfair Display 700 charcoal (#B8976A on #F7F5F2 = ~3:1 contrast, unreadable)
- `.btn-guide-cta` (new class): gold fill at rest, charcoal on hover — used on all "Get the free guide" buttons
- Crux section button changed from `.btn-outline-dark` to `.btn-guide-cta` (gold at rest)
- Global mobile rule in guide: all text forced to #1A1A1A — no opacity-faded text on screens ≤720px

### Free guide — you-already-have-the-stories.html
- **URL:** `https://24stories.co.za/you-already-have-the-stories.html`
- 8-page HTML guide — redesigned from original ugly PDF to match 24 Stories aesthetic
- Content: "You Already Have the Stories" — 10 sections covering story mining, the golden shift, story bank, 5-question method, how 24 Stories helps
- Opens in **same tab** (no `target="_blank"`) — browser back button returns to exact website scroll position
- **Sticky top nav (always visible):** two equal tabs:
  - **[Back to 24stories.co.za]** — gold fill, uses `history.back()` with fallback to homepage. Returns to exact scroll position.
  - **[Read this later]** — charcoal fill, opens drop-down name+email form → calls `guide-download.js` → "On its way — check your inbox."
- **Bottom email form:** "Want to read this later? / Send to my inbox" — same function, no technical language, no PDF/print references
- **Mobile floating bottom bar:** "Ready to begin? / Start at 24stories.co.za →" — fixed to bottom of screen throughout read
- NO technical instructions anywhere (no "Save as PDF", no "Chrome → Print", no "pinch outward")
- **On website:** button links directly — no email gate. Guide is the sales pitch.

### Social landing page — guide-landing.html
- **URL:** `https://24stories.co.za/guide-landing.html` — use this link on LinkedIn + Facebook posts
- Email capture: name + email → sends guide link by email → thank-you state with direct guide link
- Connects to `guide-download.js`

### guide-download.js (new Netlify function)
- Saves lead to Airtable leads table (tbl4as6w4R2xoICpu), Source = "Guide Download — Social"
- Parallel Mailjet sends: Tamara alert (hello@) + subscriber email with guide link
- `timeout = 26` in netlify.toml
- Email subject: "Your free guide — You Already Have the Stories"
- Link in email: `https://24stories.co.za/you-already-have-the-stories.html`

### Two guides / two delivery modes — LOCKED
| Guide | File | Delivery on website | Delivery on social |
|---|---|---|---|
| 5 Stories Worth Saving | free-download.html | Email-gated modal | — |
| You Already Have the Stories | you-already-have-the-stories.html | Open access (no gate) | Email-gated via guide-landing.html |

---

## Session 28 — Free Download Fix — COMPLETE (2026-05-29)

### Root cause
`free-download.js` was running three sequential API calls (Airtable write → Mailjet notify Tamara → Mailjet send download). On a cold start, total execution exceeded Netlify's 10-second default timeout. The notification to hello@ always arrived (step 2 completed in time); the download email to the subscriber was cut off at step 3.

### Fix 1 — Parallel Mailjet sends (free-download.js)
Airtable write now fires without `await` (fire-and-forget). Both Mailjet sends (Tamara notification + subscriber download email) now run simultaneously via `Promise.all`. Cold-start total time dropped from ~10s to ~3s. Commit: 5cbacc1.

### Fix 2 — netlify.toml timeout = 26 added
`free-download`, `early-interest`, `events-inquiry`, `story-application`, `coaching-inquiry`, and `admin-enroll` all added with `timeout = 26` in netlify.toml. Prevents this class of timeout bug on any function making multiple API calls.

### Fix 3 — Remove data-netlify form attributes (index.html)
The free-download modal form had `data-netlify="true"` and related Netlify Forms attributes. These caused Netlify to inject a competing form-handling script. Removed — form submits directly to the function via custom JS fetch. Commit: e59395e.

### Fix 4 — PDF copy corrected
"Imagine 26" → "Imagine 24" on the closing page of free-download.html. Commit: c8ce25b.

### ⚠ Pattern rule — locked
Any Netlify Function making more than one external API call MUST either:
- Run calls in parallel with `Promise.all`, or
- Have `timeout = 26` set in netlify.toml
Both applied to free-download.js. Apply this pattern to any new functions.

---

**CLAUDE.md is updated every 5–10 minutes during a session. Every action, every confirmed fact, every decision goes here — not in memory files. Memory files are unreliable, go stale, and cause errors. Ignore them. Read CLAUDE.md and the live code files only.**

**Session start protocol: read CLAUDE.md, then read the relevant live files before stating anything as done or not done.**

---

## Session 27 — Complimentary Subscription System — COMPLETE (2026-05-25)

### gifted.html — subscriber-facing complimentary enrolment page
- URL: `https://24stories.co.za/gifted.html` — send via WhatsApp or email to complimentary subscribers
- Opens directly on the self form (no landing/path choice screen)
- Gift path accessible via `gifted.html?type=gift` (rarely used)
- Logo is NOT a clickable link — no `<a>` wrapper, just `<img>`
- Calls `/.netlify/functions/admin-enroll` on submit
- Status goes to Active immediately — no PayFast involved
- Confirmation message: "Welcome to 24 Stories. A welcome email is on its way to your inbox. Your first prompt arrives this Wednesday."
- No payment language, no sandbox references, no billing copy

### admin-enroll.js — Netlify Function (POST)
- Creates Airtable subscriber record: Status=Active, PromptNumber=0, SubscriptionStartDate=today, WelcomeEmailSentAt=now
- Fires email-1 to storyteller, email-2 to gift giver (if ≠ storyteller email), email-3 to story helper (if ≠ storyteller email)
- Fires COMPLIMENTARY ENROLMENT alert to hello@24stories.co.za with record ID + library URL
- Returns `{ success, recordId, libUrl, firstName }`
- Email-1 and email-3 copy is identical to payfast-webhook.js versions. Email-2 omits "Thank you for your purchase."

### Gmail Template 3 — Complimentary Subscription (begin-email-templates.html)
- Subject: `A complimentary subscription to 24 Stories`
- Fill in: `[Name]`
- Body: "Hello [Name], Here is the link to a complimentary subscription to 24 Stories. Tap the Get Started button, fill in your details, and your storytelling journey begins."
- Button: "Get Started →" → `https://24stories.co.za/gifted.html`
- Signature: The 24 Stories Team
- Open at `https://24stories.co.za/begin-email-templates.html` — Template 3 is at the bottom. Click "Copy this email" → paste into Gmail Compose.

### WhatsApp quick reply — complimentary subscription
- Shortcut: `gifted` (WhatsApp Business adds the / automatically — just type the word)
- Message: "Hello [Name], here is your complimentary subscription to 24 Stories. Tap the link, fill in your details, and your storytelling journey begins: https://24stories.co.za/gifted.html"

### Pablo Rothbart — test subscriber (2026-05-25) — PENDING DELETION
- Record ID: recqWhEXze1wC4C0d | StorytellerEmail: rothbartpablo@gmail.com
- Status: Active, PromptNumber: 0 (Airtable NOT updated — stays in normal queue)
- Week 1 prompt sent manually to rothbartpablo@gmail.com for library link testing
- **DELETE this record once Pablo confirms library opens correctly**

---

## Session 26 — Extra Copies Flow: Display + Dispatch Notification — COMPLETE (2026-05-24)

### Extra copies — library.html
- `setupExtraCopies(existingQty)` now accepts `f.ExtraCopies` from Airtable. If > 0, shows green line above input: "X extra copy / X extra copies on order." Font size 1rem.
- Input always resets to 0 on library load (including return from PayFast). No pre-population.
- On `?ordered=N` return from PayFast: shows confirmation message "Your order is confirmed — N extra copy/copies. A confirmation email is on its way." — receipt for current payment only, not cumulative.
- Green tally line is the cumulative total from Airtable (updates after IPN fires).

### extra-copies-checkout.js
- `return_url` now carries actual qty: `&ordered=N` (was hardcoded `&ordered=1`).

### External orderer dispatch notification — BUILT (2026-05-24)
- **Airtable — Payments table:** Two new fields added: `OrdererEmail` (fld6KdRaoqjfuvahh) and `OrdererName` (fld6nxc0QymqWBnZv). Empty on subscription/library payments. Only populated on external book orders.
- **payfast-webhook.js:** External order Payments record now writes `OrdererEmail` + `OrdererName` from `custom_str4`/`custom_str5`.
- **send-story-queue.js:** On `BookDispatchEmailSent` tick, after sending email-12 to storyteller, queries Payments for all records linked to that subscriber where `OrdererEmail` is set. Sends `emailOrdererDispatchHtml()` to each.
- **Dispatch email to orderers:** Subject "[Storyteller]'s book is on its way." Copy confirms copies dispatched to storyteller's address, instructs orderer to arrange collection/forward delivery with storyteller directly. Timing: up to four weeks.

### Print order — confirmed correct, no changes needed
- `ExtraCopies` in Airtable = extra copies only (excludes master copy).
- `book-compile.js` and `book-dispatch.js` both calculate total print copies as `1 + ExtraCopies`. Master copy always included automatically.
- PayFast webhook increments `ExtraCopies` (read-then-write) — never overwrites.

### begin-email-templates.html — Template 2 added (2026-05-24)
- Template 2: "Order extra copies — 24 Stories". For responding to email enquiries about extra book copies.
- Fill in: `[Name]` and `[RECORD_ID]` (Airtable subscriber record ID from URL).
- Button links to `https://24stories.co.za/book-order.html?id=[RECORD_ID]`.
- Signature: "The 24 Stories Team" (NOT Tamara's personal signature — coaching only gets personal sig).
- Same clipboard copy mechanism as Template 1.

### payfast-webhook.js — base64 body handling added (2026-05-24)
- Added `event.isBase64Encoded` check so body decodes correctly if Netlify base64-encodes it.
- Replaces `new URLSearchParams(event.body || '')` with conditional decode first.

### External book order — end-to-end confirmed working (2026-05-24)
- Webhook tested via manual IPN POST: Airtable ExtraCopies updated ✓, Payment record created with OrdererEmail/OrdererName ✓, orderer confirmation email (email-14 External) sent ✓, storyteller alert email sent ✓, hello@ alert sent ✓.
- PayFast sandbox IPNs for one-off credit card payments are unreliable (sandbox limitation — not a code issue). Production PayFast IPNs are reliable. Subscription IPNs (tested in Sessions 18–19) use the same mechanism and work correctly.
- No duplicate-IPN protection on ExtraCopies increment. Acceptable risk — extra copies are manual fulfilment; double-charge visible in Airtable. Harden if needed post-launch.

### Storyteller alert on external book order — BUILT & TESTED (2026-05-24)
- When an external orderer completes payment via book-order.html, an email fires to the storyteller (StorytellerEmail) alerting them that [OrdererName] has ordered [N] extra copies of their book.
- Purpose: prevents storyteller over-ordering their own copies, unaware that family/friends have already ordered.
- Copy: warm tone; advises storyteller to check their own order in case it affects what they need; directs questions to hello@24stories.co.za; includes library link.
- Function: `emailExternalOrderAlertHtml()` in payfast-webhook.js.
- Full email sequence on external order: (1) orderer confirmation email-14 External, (2) storyteller alert, (3) hello@ alert.

### Sandbox behaviour — confirmed expected
- PayFast sandbox returns a generic "payment confirmed" screen with a link back to Story Library. No itemised receipt. This is sandbox-only behaviour — production PayFast shows full payment details.

### Test result (2026-05-24)
- Tamara ordered 10 extra copies across multiple sandbox payments (library flow). Airtable ExtraCopies = 10 ✓. Print order = 11 (master + 10 extra) ✓.
- External book order flow (book-order.html) confirmed working via manual IPN simulation.
- ExtraCopies reset to 0 after all testing.

---

## Session 25 — Progress Bar Overhaul + Book Onboarding at Week 21 — COMPLETE (2026-05-22)

### library.html — Progress bar: 6-state system (replaces 4-state gold system)
- All 26 circles always shown. Future weeks render as `<span>` (non-clickable). Sent weeks render as `<a>` anchors.
- New function `getProgressState(story, weekNum, promptsSent)` derives state from StoryText/EditedText + StoryImageURL + StoryImageCaption.
- **6 states (LOCKED):**
  - `st-future`: pale grey, no interaction — week not yet sent
  - `st-current-incomplete`: dashed black border — current week, story/image/caption not all present
  - `st-current-complete`: solid black border — current week, story + image + caption all present
  - `st-past-missed`: solid RED border — past week, no story at all
  - `st-past-incomplete`: dashed RED border — past week, story submitted but image or caption missing
  - `st-past-complete`: solid black border — past week, all elements present
- Old 4-state gold system (st-empty/awaiting/story/full on progress dots) removed. Story card status pills UNCHANGED.
- `renderProgress()` now loops 1–26 always (not just to promptsSent).
- "Complete" = has (StoryText OR EditedText) AND StoryImageURL AND StoryImageCaption. Awaiting stories with image+caption count as past-complete (subscriber did their part).
- Timing (Phase 2 confirmed): send-weekly-prompts.js patches PromptNumber in Airtable immediately after sending the email — library reflects new prompt/circle state within seconds of dispatch. No additional synchronization needed.

### Phase 3 — Book onboarding trigger moved from week 24 → week 21
- **send-weekly-prompts.js**: email-9 now fires alongside week 21 prompt (was week 24). `isWeek24` renamed `isWeek21`. Subject: "Your Legacy Book — time to get it ready."
- **email9Html**: heading changed from "Two chapters to go. Time to prepare your book." → "Your book begins here." Body copy updated to be chapter-count neutral (removed "Two more stories to tell"). Body otherwise unchanged.
- **book-onboarding-reminder.js**: Airtable query formula changed from `{PromptNumber}>=24` → `{PromptNumber}>=21`. Day-3 and Day-6 reminder gates changed from `promptNumber===24` → `promptNumber===21`. Day-1 and Day-4 final/overdue gates on promptNumber===26 are UNCHANGED.
- **payfast-webhook.js**: Removed write to non-existent `BookOnboardingUnlocked` field (was silently failing). Added payment-6 safety net: if PaymentsCount reaches 6 and PromptNumber < 21, fires email-9 to subscriber. Added `email9Html()` function at bottom of file.
- Updated Book Onboarding schedule in this file (see below).

### Book Onboarding Email Schedule (UPDATED — locked 2026-05-22)
| Day | Trigger | Email |
|-----|---------|-------|
| 0 | Prompt 21 sent | Email-9 fires alongside prompt |
| +3 | PromptNumber=21, daysSince=3 | Email-10 Reminder 1 |
| +6 | PromptNumber=21, daysSince=6 | Email-10 Reminder 2 |
| +15 | PromptNumber=26, daysSince=1 | Email-10 Final reminder |
| +18 | PromptNumber=26, daysSince=4 | Email-11 Overdue + Tamara alert |
| Safety | PaymentsCount=6 AND PromptNumber<21 | Email-9 fires via payfast-webhook.js |
Stop condition: PortraitPhotoURL + BookTitle + DedicationText all filled OR BookFormCompleted filled.

### Test subscriber state (2026-05-22 — CLEANED)
- Tamara test subscriber (recj2fKFXLRmGNLn5) reset to PromptNumber=26, LastPromptSentDate=2026-05-20.
- Test story record recI4cgzzeN2ChlmB created during testing and DELETED. Subscriber Stories field is empty again.

---

## Session 24 — tell.html + Library + Email-3 Fixes — COMPLETE (2026-05-22)

### tell.html — Pause button added to voice recording
- `MediaRecorder.pause()` / `resume()` wired up. Pause button appears below timer during recording.
- Button only appears if browser supports `MediaRecorder.pause` (feature detection — graceful degradation on older devices).
- When paused: timer freezes, pulsing stops, status text changes to "Paused — tap Resume to continue".
- Speak state text legibility improved: `.speak-sub` 0.82rem/#999 → 0.95rem/#555. `.btn-pause-resume` 0.78rem/#aaa → 0.88rem/#555.

### library.html — Session 24 notes (superseded by Session 25)
- Progress bar: Session 25 replaced the gold 4-state system entirely. Do not reference old st-empty/awaiting/story/full states for progress dots.
- Library link goes out with the **first prompt email** (not the welcome email). PromptNumber is always ≥ 1 on first visit.

### library.html — Book prep section muting
- When `PromptNumber < 20`: `.book-prep` section gets class `book-prep-inactive` (opacity 0.35, pointer-events none). Notice text appears: "Your story journey is just beginning. This section opens as you approach your final prompts."
- When `PromptNumber >= 20`: full opacity, fully interactive.
- Mark as Complete button unlocks at `PromptNumber >= 26` (unchanged).

### payfast-webhook.js — email-3 (Story Helper welcome) library link removed
- email-3 previously contained a full "The Story Library" button section with the library URL. Removed.
- "Add a photograph" bullet updated: "Your Story Library link arrives this Wednesday with the first prompt."
- `libUrl` parameter removed from `email3Html()` signature and call site.
- **RULE (locked):** Neither the storyteller welcome (email-1) nor the story helper welcome (email-3) contains a library link or button. The library link first appears in the Week 1 prompt email (email-4). This matches PromptNumber gating in library.html.

### 24stories-emails/ folder — DELETED (2026-05-22)
- The entire `24stories-emails/` reference folder has been deleted from the repo.
- Live email HTML is in the Netlify Functions only. To read any email, read the relevant function in `netlify/functions/`.
- Do not recreate this folder.

### Strategic decisions (no code changes)
- Two-tier model (Story Share + Premium) discussed and deferred. Sticking with single-tier 24 Stories.
- Story Share as a separate app concept noted — deferred until Claude cleanup quality test results are in.
- Cleanup quality test: Tamara arranging 2 external testers. They will sign up as real subscribers (Tamara as Story Helper). Results pending.

### Test subscriber state (2026-05-22)
- Tamara test subscriber (recj2fKFXLRmGNLn5) reset to PromptNumber=1, LastPromptSentDate=2026-05-22 for library reveal testing.
- After testing: reset PromptNumber back to 26.

---

## TRIGGER: "test storylibrary behaviour"

When Tamara says this, run the following test sequence. Do not ask questions — execute.

### What you are testing
That the Story Library reveals prompts one at a time as PromptNumber increments, and that the progress circles show the correct state at each step.

### Test subscriber
- Record ID: recj2fKFXLRmGNLn5
- Library URL: https://24stories.co.za/library.html?id=recj2fKFXLRmGNLn5

### Step 1 — Confirm starting state
Fetch subscriber from Airtable. Confirm PromptNumber = 1. If not, patch it to 1.

### Step 2 — Check library at PromptNumber 1
Tell Tamara to open library URL. Expected: 26 circles in progress bar (1 active, 25 pale), only Week 1 story card visible, book prep section muted (opacity 0.35).

### Step 3 — Submit Week 1 story
Tell.html URL for Week 1:
```
https://24stories.co.za/tell.html?id=recj2fKFXLRmGNLn5&week=1&weekname=Inheritance&theme=I+got+it+from+my+mama%2Fpapa&prompt=Prepare+a+five-minute+story+about+something+you+inherited+%E2%80%94+jokes,+traditions,+taste.&angles=Heirlooms,+Traits,+Family+Lore
```
Tamara submits a story (voice or typed). Expected: story saved to Airtable, Tamara alert fires to hello@.

### Step 4 — Bump to PromptNumber 2
PATCH Airtable: PromptNumber → 2, LastPromptSentDate → today.

### Step 5 — Check library at PromptNumber 2
Tell Tamara to refresh library URL. Expected: Week 1 circle shows correct state (st-story if no photo, st-full if photo+caption), Week 2 circle shows st-empty (prompt sent, no story), Weeks 3–26 pale. Week 2 story card now visible.

### Step 6 — Submit Week 2 story
Tell.html URL for Week 2:
```
https://24stories.co.za/tell.html?id=recj2fKFXLRmGNLn5&week=2&weekname=Youthful+Imaginings&theme=Beginnings&prompt=Prepare+a+five-minute+story+about+unfulfilled+hopes,+wild+ambitions,+or+the+thing+you+always+dreamed+you%27d+become+%28but+never+did%29.&angles=Compromise,+Rite+of+Passage,+Dawning+Realizations
```

### Step 7 — Confirm and reset
After test passes: PATCH Airtable to reset PromptNumber → 26, LastPromptSentDate → 2026-05-20.

---

## ⚠ FOOTER — PERMANENT RULE
**Do NOT add an "Also from us" section or any cross-product links to the footer — ever.** 24 Stories is a single product. Documentary Films, Heirloom Editions, and Life Legacy Stories do not exist as offerings. Removed 2026-05-21.
**Footer Navigate links (locked):** How It Works → #how-it-works | Pricing → #pricing | Give This Gift → #subscribe | Story Coaching → coaching.html. Added 2026-05-21.
**Footer columns on mobile:** Navigate + Support always show side by side (2-column grid even at ≤480px). Locked 2026-05-21.

---

## Session 23 — Mobile Sweep — COMPLETE (2026-05-21)

### What changed (styles.css + index.html + coaching.html + events.html)
- **Hero book panel hidden on mobile:** `.hero-book-panel { display: none !important; }` at ≤768px. The 2-page spread at zoom:0.54 was 477px wide inside a 335px container — hard overflow:hidden cuts on both sides were causing the "borders on sides of pages" visual. The crux section (mobile-only, immediately below) already shows the book cover.
- **Founder video hidden on mobile:** `.founder-video-section { display: none; }` at ≤768px. Tamara's explicit request.
- **Subscribe image hidden at ≤1024px:** The girl-writing image was taking up the full width in single-column layout on tablets and mobile. Hidden entirely at ≤1024px (all single-column views) so the form is immediately visible.
- **Section padding reduced on mobile:** `.how-it-works`, `.prompts-section`, `.book-section`, `.pricing`, `.subscribe` → 48px at ≤768px, 40px at ≤480px. `.testimonials` → 36px. Reduces total scroll distance significantly.
- **Inline-style section padding:** Urgency banner (80px→clamp(44px,8vw,80px)), coaching band (72px min→48px min), resend section (80px→clamp(48px,8vw,80px)). Desktop values unchanged.
- **Footer 2-column at ≤480px:** Changed from `1fr` to `repeat(2, 1fr)` so Navigate and Support remain side by side at all mobile screen sizes.
- **coaching.html hero bug fixed:** The existing 768px rule set padding-top to 136px on mobile (bug — was adding to the large desktop value). Fixed to `padding: 88px var(--pad) 44px` on mobile.
- **coaching.html sections:** `.c-section` padding reduced from 72px to 44px on mobile.
- **events.html sections:** `.section` padding reduced from 72px to 44px on mobile.

### FAQs — no change needed
FAQs are `<details>/<summary>` elements — already function as native dropdowns (tap to expand/collapse). The + / − indicator is shown via CSS `::after`. No code change needed.

---

## ⚠ ARCHITECTURE — READ FIRST, EVERY SESSION

**MAKE IS PERMANENTLY CANCELLED. IT DOES NOT EXIST IN THIS PROJECT.**
All automation is built on Netlify Functions (serverless). There are no Make scenarios, no Make webhooks, no Make modules — ever. Any reference to Make in older documents (developer-handover.html, make-build-reference.html etc.) is obsolete. Ignore it.

**The stack:**
- Hosting + serverless functions: Netlify (resilient-eclair-c46b34.netlify.app → 24stories.co.za)
- Database: Airtable base "52stories" (ID: apprTOobuxs4Od7XB)
- Emails: Netlify Functions calling Mailjet API
- Payments: PayFast → Netlify Function webhook
- Deploy: push to GitHub → auto-deploys to Netlify. Fallback: `netlify deploy --prod` from /Users/tamararothbart/24stories-website

---

## The Product
24 Stories guides a storyteller through 26 weekly prompts, edits each story professionally, delivers them to family by email, and produces a printed linen-bound hardcover book. Pricing: R3 500/month × 6 months (auto-stops), or R16 800 once-off lump sum.

## Credentials
- Airtable base: 52stories | Base ID: apprTOobuxs4Od7XB
- Hosting: Netlify — resilient-eclair-c46b34.netlify.app | Domain: 24stories.co.za
- Cloudinary: cloud dorv3glde, preset 24stories
- stories@24stories.co.za — Mailjet only (automated sender, no inbox). DNS: SPF + DKIM authorised.
- hello@24stories.co.za — Google Workspace (migrated from Titan 2026-05-15). Tamara's inbox + all subscriber replies route here via ReplyTo.
- Mailjet keys: in Netlify env (MAILJET_API_KEY, MAILJET_API_SECRET)
- Airtable PAT: in memory file

## PayFast — Netlify env status
- PAYFAST_MERCHANT_ID: ✅ set (10048976) — SANDBOX credential only. Live credential is 34556163 — swap on launch day.
- PAYFAST_MERCHANT_KEY: ✅ set (ipt18teru1agg) — SANDBOX credential only. Live credential is liduaqfvjfeox — swap on launch day.
- PAYFAST_PASSPHRASE: ✅ set (Twenty4Storie3) — same value for both sandbox and live accounts. No change needed on launch day.
- PAYFAST_SANDBOX: ✅ set to "true" in Netlify env — set to "false" on launch day.
- PAYFAST_USE_SANDBOX: hardcoded true in begin.html AND js/script.js — set both to false on launch day.

## PayFast credential map (confirmed 2026-05-20)
| Label | Merchant ID | Key | Notes |
|-------|-------------|-----|-------|
| **LIVE account** | **34556163** | **liduaqfvjfeox** | Use on launch day |
| Sandbox dashboard | 10048976 | ipt18teru1agg | Currently in Netlify |
| Temp sandbox (origin unknown) | 10048842 | do7cmfwoagwjs | Was in Netlify pre-2026-05-17 |
Live credentials were NEVER set in Netlify during sandbox work — they are untouched.

## ⚠ UNTESTED IN PRODUCTION — VERIFY ON FIRST LIVE CANCELLATION
The PayFast subscription cancel API call (in send-story-queue.js `cancelPayFastSubscription()`) has NEVER run against a live subscription. Sandbox PayFast does not support this API call. When the first real subscriber cancels after launch, check the CANCELLATION PROCESSED alert at hello@24stories.co.za immediately. If it says "PayFast subscription cancelled ✓" — all good. If it says WARNING — cancel manually in the PayFast dashboard and flag for investigation.

## ⚠ UNTESTED IN PRODUCTION — VERIFY ON FIRST LIVE PAYMENT FAILURE + RESTART
PayFast sandbox auto-completes payments without showing a card entry form. In live mode, the restart-checkout.js redirect must show a full PayFast card entry form (card number, expiry, CVV) so subscribers can enter new card details. Verify on the first real payment failure after launch:
1. Check that the restart link opens a PayFast page with a card entry form (not an error)
2. Confirm the subscriber can complete payment with new card details
3. Confirm SUBSCRIPTION RESTARTED alert arrives at hello@ with correct payment count
If the restart link fails in live mode for any reason, the fallback is: cancel the subscription in the PayFast dashboard and have the subscriber sign up fresh via begin.html (Tamara manually sets PromptNumber to resume where they left off).

## ✅ PAYFAST LIVE — EXECUTED 2026-05-25
All 7 steps completed. Site is now taking live payments.
- PAYFAST_MERCHANT_ID = 34556163 (live) ✓
- PAYFAST_MERCHANT_KEY = liduaqfvjfeox (live) ✓
- PAYFAST_PASSPHRASE = Twenty4Storie3 ✓
- PAYFAST_SANDBOX = false ✓
- begin.html PAYFAST_USE_SANDBOX = false ✓
- js/script.js PAYFAST_USE_SANDBOX = false ✓
- Pushed: commit 81dc1a4 ✓

## Airtable Schema — Subscribers Table (locked field names)
StorytellerFirstName, StorytellerSurname, StorytellerEmail, StoryHelperName, StoryHelperEmail, GiftGiverName, GiftGiverEmail, FamilyEmails, DeliveryAddress, DeliveryPhone, Phone, SubscriptionStartDate, Status, PromptNumber, LibraryToken, LastPromptSentDate, BookFormCompleted, BookTitle, PortraitPhotoURL, PortraitCaption, DedicationText, EpigraphText, CoverColour, BookCompiledDate, BookSentToPrintDate, BookProductionStatus (formula — read only), PauseStartDate, ExtraCopies (number), SendDelayNotification (checkbox), GenerateChapterOrder (checkbox), BookDispatchEmailSent (checkbox)

## Critical Rules
- Never add fields to Airtable without explicit discussion — schema changes affect library.html, tell.html, and all Netlify Functions simultaneously.
- Never reference Make. Never suggest Make. It does not exist in this project.

## Outreach Email Templates — LOCKED (2026-05-25)
- File: `begin-email-templates.html` (repo root). Three templates. Open at `https://24stories.co.za/begin-email-templates.html`.
- Copy mechanism: `navigator.clipboard.write()` with `text/html` blob — preserves clickable button when pasting into Gmail. Do NOT revert to `document.execCommand('copy')`.
- **Template 1 — Begin 24 Stories:** Subject `Begin 24 Stories — Next Step`. Fill in: `[Name]`. Links to `https://24stories.co.za/begin.html`. Saved in Gmail as canned response.
- **Template 2 — Extra copies:** Subject `Order extra copies — 24 Stories`. Fill in: `[Name]` and `[RECORD_ID]`. Links to `https://24stories.co.za/book-order.html?id=[RECORD_ID]`.
- **Template 3 — Complimentary subscription:** Subject `A complimentary subscription to 24 Stories`. Fill in: `[Name]`. Links to `https://24stories.co.za/gifted.html`. Save in Gmail as canned response.

## Founder Video — LIVE (2026-05-20)
- File: `founder-video.mp4` (converted from `founder video ..mov`, H.264, 15MB, portrait 9:16)
- Section: `.founder-video-section` in index.html — charcoal background, portrait wrap 360px max-width, 38% column
- Behaviour: rests on end frame (56s) as static image. Play starts at 1.0s with sound on. Stop returns to end frame. No loop. No autoplay.
- To adjust trim: edit `START_TIME` (currently 1.0) and `END_TIME` (currently 56.0) in the founder video script block near the bottom of index.html.

## Presentation & Printer Spec — Quick Links
- **Presentation hub:** https://24stories.co.za/presentation/index.html — subscriber journey, email sequence, all links in one page. Bookmark this.
- **Printer spec:** https://24stories.co.za/presentation/printer-spec.html — full print brief for the printer (170 × 240mm, linen cloth, margins, typography, proofing)
- **Live compiled book (PDF preview):** https://24stories.co.za/.netlify/functions/book-compile?id=recj2fKFXLRmGNLn5
- **Story recording (tell.html demo):** https://24stories.co.za/tell.html?id=recj2fKFXLRmGNLn5&week=1&weekname=Inheritance&theme=I+got+it+from+my+mama&prompt=Prepare+a+five-minute+story+about+something+you+inherited.&angles=Heirlooms,+Traits,+Family+Lore
- **Story library (demo):** https://24stories.co.za/library.html?id=recj2fKFXLRmGNLn5

## File Map
- `index.html` — main site (pricing, FAQ, signup form, resend library link)
- `begin.html` — subscriber sign-up + PayFast checkout (self or gift path)
- `gifted.html` — complimentary subscriber enrolment (no PayFast — calls admin-enroll.js directly)
- `library.html` — subscriber story library + book prep (reads/writes via Netlify Functions)
- `tell.html` — story submission (voice + typed, Claude cleanup, Cloudinary upload)
- `compile-book.html` — Tamara admin: preview + compile subscriber book (book-compile.js)
- `begin-email-templates.html` — 3 Gmail copy-paste templates: (1) Begin outreach, (2) Extra copies link, (3) Complimentary subscription
- `netlify/functions/` — all serverless automation

## Netlify Functions (20 total)

**Book production:**
- `book-compile.js` — GET ?id=[recordId] → returns full HTML book (browser preview + PDF export). POST {id} → emails HTML attachment to hello@, sets BookCompiledDate. Triggered from compile-book.html. Uses FinalStory → EditedText → StoryText fallback. Assembles: spec sheet (screen only, hidden from PDF), title page, portrait, dedication, epigraph, ToC, chapters (ChapterOrder sort), colophon. Typography: Bebas Neue (Google Fonts) for all title/display text; Georgia serif for all body text — NO Cormorant Garamond. Print: 170 × 240mm portrait (NOT A5). Mirror margins (case-bound hardcover): recto 17mm top / 15mm outer / 22mm bottom / 20mm spine; verso 17mm top / 20mm outer / 22mm bottom / 15mm spine. Full-bleed named @page (margin:0, page:full-bleed) for cover/portrait/photo/dedication/epigraph/colophon. Dates never appear in book — StoryCircaDate is sorting only. Images always on own page after chapter text page. Admin page: compile-book.html. Test: https://24stories.co.za/.netlify/functions/book-compile?id=recj2fKFXLRmGNLn5

**Scheduled (cron):**
- `send-weekly-prompts.js` — Wednesday 7am SAST: sends week's prompt to all Active subscribers (emails 4, 8, 25, 26); fires coaching email 0 alongside week 1; fires email-9 at week 24
- `send-day4-reminder.js` — Saturday 8am SAST: sends reminder (email-5) to subscribers who haven't submitted since Wednesday
- `book-onboarding-reminder.js` — daily 9am SAST: book onboarding reminders (emails 10, 11), coaching emails 1–4, delivery tracking alerts, pause expiry alerts
- `send-story-queue.js` — every 2 minutes: processes SendToFamily checkbox (emails 6+7), SendDelayNotification checkbox (email-13), pause confirmations (email-15)

**Payment:**
- `payfast-webhook.js` — PayFast IPN receiver: activates subscriber, creates Payments record, sends emails 1/2/3 on subscription; handles extra copies payment (email-14)
- `checkout.js` — creates Pending subscriber record and returns record ID for PayFast custom_str1

**Library (subscriber-facing):**
- `library-read.js` — reads subscriber + all stories + prompts for library.html
- `library-update.js` — writes book prep fields (photo, title, dedication, epigraph, etc.) from library.html
- `book-dispatch.js` — called when subscriber presses Complete: saves BookSentToPrintDate, sends email-12
- `approve-story.js` — called from library.html: sends emails 6+7 on demand (alternative to queue-based flow)

**Story submission:**
- `story-submission.js` — saves story to Airtable (Stories table), alerts Tamara at hello@
- `story-load.js` — loads story + subscriber + prompt for edit.html (Tamara's editing page)
- `story-save.js` — saves EditedText from edit.html back to Airtable
- `transcribe.js` — calls OpenAI Whisper to transcribe audio recording
- `cleanup.js` — calls Claude API (streaming) to copy-edit raw story text

**Complimentary enrolment:**
- `admin-enroll.js` — POST: creates Active subscriber record in Airtable, fires emails 1/2/3, sends COMPLIMENTARY ENROLMENT alert to hello@. Called by gifted.html. No PayFast.

**Leads / marketing:**
- `early-interest.js` — saves interest form lead, notifies Tamara, sends confirmation email
- `free-download.js` — saves free download lead, sends free download email
- `events-inquiry.js` — saves events lead, notifies Tamara, sends storyteller application link if applicable
- `story-application.js` — saves full storyteller application, notifies Tamara, sends applicant confirmation
- `resend-library-link.js` — looks up subscriber by email (Active or Paused), resends library link
- `coaching-inquiry.js` — coaching contact form handler: saves lead to 24stories-live Airtable base, sends loud alert to hello@24stories.co.za. Fields: name, mobile, email, page. Subject: "Coaching inquiry — RESPOND ASAP — [Name]"

## Coaching — 24stories-live Airtable Base
- **coaching.html** — coaching product page. All "Book" buttons open a contact form popup (Name, Mobile/WhatsApp, Email + Submit). No automation beyond lead capture.
- **Available to active subscribers only.** No combined purchase flow. Subscribers sign up first, then access coaching.
- **Airtable base:** 24stories-live (ID: appHPLRYmURYxlG3K) — SEPARATE from the 52stories subscriber base. Never write coaching leads to 52stories.
- **Coaching table:** tblDtVB2CALY2biJm. Fields: Name, Contact (mobile), Method ('Form'), Page, DateInquired, Status ('New'), Notes (stores email as "Email: [address]")
- **No Zoom, no calendar, no automation.** Tamara books and manages all sessions manually after receiving the alert. Response within 24 hours.
- **Payment: EFT only.** Coaching is NOT paid via PayFast. Tamara invoices the subscriber manually. Payment goes by EFT to Tamara's personal banking account.
- **Invoice templates:** 7 templates (6 invoices + 1 payment confirmation) saved as Gmail canned responses in hello@24stories.co.za. File was removed from repo (2026-05-18) — do not recreate it publicly.
- **Banking details on invoices:** T. Rothbart · Nedbank Sea Point · Current Account · 1069404799. EFT note for sessions within 72 hours.
- **20% off first session:** offer appears in the week-1 prompt email (coaching email fires alongside first prompt). NOT on the sign-up page. The sign-up page (begin.html) has no coaching mention.

## Payment Model
- Monthly: R3 500/month × 6 cycles (auto-stops). PayFast recurring subscription (subscription_type=1, frequency=3, cycles=6).
- Lump sum: R16 800 once-off. PayFast single payment. AccessEndDate set to +6 months on activation.
- Extra copies: R1,200 each (ordered via Story Library).
- Airtable record created on payment_status = COMPLETE only.
- Book: physical printed hardcover. SA printer + Courier Guy. Up to 4 weeks delivery.
- Library: URL-based access (library.html?id=[LibraryToken]). Prompts reveal one at a time — library shows up to PromptNumber. Library link goes out with the first prompt email (not the welcome email), so PromptNumber is always ≥ 1 on first visit.
- No client proof — library IS the proof.
- CoverColour: Black / Blue / Red (linen cloth, no cover image).

## Session 18 Changes (2026-05-17) — Payment Flow Test

### Critical bug fixed
- `payfast-webhook.js` had smart/curly quotes (`'` `'`) used as JS string delimiters throughout — JS cannot parse these. The function crashed on every invocation since it was written. No IPN had ever processed. Fixed 2026-05-17 by replacing all curly quotes with straight quotes. Syntax-checked and confirmed working.

### checkout.js
- Added `item_description`: "6 monthly payments of R2,795. Stops automatically after 6 months." — shows on PayFast payment page below item name.
- Added dynamic `returnUrl` param (accepted from client, like `cancelUrl`). Falls back to `thank-you.html` if not provided.
- Removed hardcoded fallback credentials (were removed in a prior session — confirmed clean).

### PayFast return flow — SUBSCRIBED state
- After payment, PayFast redirects back to the sign-up page with `?subscribed=1`.
- `begin.html`: return_url = `begin.html?subscribed=1`. On load detects param → hides all forms → shows `#section-subscribed` with "You are subscribed." heading and bold black "An email from 24 Stories is on its way to your inbox."
- `index.html`: return_url = `/?subscribed=1`. On load detects param → hides `#signup-forms` → shows `#subscribe-subscribed` with same message. Scrolls to subscribe section.
- `js/script.js`: both fetch calls pass `returnUrl: 'https://24stories.co.za/?subscribed=1'`.
- `cancelUrl` in begin.html corrected to `begin.html?type=self` / `begin.html?type=gift` (was missing .html).
- `urlType` param (`?type=self/gift`) now auto-shows the correct form on begin.html — previously declared but not wired.

### Admin notification email
- First-payment alert now reads "Payment: Monthly — Payment 1 of 6 (R2,795 × 6)" — consistent with payments 2–6 which already showed X/6.
- Airtable Record ID added to admin notification body as one-line backup reference.

### Form copy
- Removed form-reassurance line ("An email from 24 Stories will be sent to you…") from both payment forms on index.html — now only appears (bold) on the SUBSCRIBED landing page.
- PayFast sandbox: confirmed recurring payment params correct (subscription_type=1, frequency=3/monthly, cycles=6). IPN fires and activates subscriber. Emails 1 + admin alert confirmed delivered.

### Other functions checked for smart-quote issue
- `payfast-webhook.js` was the only function with this problem — others were written without curly quotes.

## Session 18 continued — Form & UX fixes (2026-05-17)

### Story Helper buttons — both forms
All helper selection converted from checkboxes/radio to pill-button UI (charcoal background when selected, cream text). Radio input hidden; `:has(input:checked)` CSS drives visual state.

**Gift form (begin.html + index.html):**
- Three options: **None** (default, value="none") | **Me** (value="me") | **Someone else** (value="other")
- None: gift giver auto-fills slot 1 only. No Email 3.
- Me: gift giver auto-fills slot 1. Email 2 AND Email 3 both sent to gift giver. (payfast-webhook.js: removed giftGiverEmail exclusion from Email 3 guard — gift giver who is also helper now receives both.)
- Someone else: gift giver slot 1, third-party helper slot 2. Email 2 to giver, Email 3 to helper.

**Self form (begin.html + index.html):**
- Two options: **None** (default, value="none") | **Story Helper** (value="other")
- None: no auto-fill in recipient section. No Email 3.
- Story Helper: helper name + email fields appear. Helper auto-fills slot 1. Email 3 sent to helper.
- "Someone else" label was used briefly then renamed to "Story Helper" — correct final label.

### payfast-webhook.js — Email 3 guard
Removed condition `storyHelperEmail !== giftGiverEmail`. Email 3 now fires whenever storyHelperEmail is set and different from storytellerEmail. This correctly sends Email 3 to gift givers who select "Me" as story helper.

### JS/script defaults
All helper-type fallback defaults changed from `'me'` to `'none'` in js/script.js (2 places) and begin.html (2 places).

### SUBSCRIBED return state (from earlier in session)
- After PayFast payment, return_url redirects back to sign-up page with `?subscribed=1`
- begin.html: shows `#section-subscribed` — "You are subscribed." heading + bold black email notice
- index.html: shows `#subscribe-subscribed` inside subscribe section, hides `#signup-forms`
- checkout.js: accepts `returnUrl` param from client (falls back to thank-you.html)
- js/script.js + begin.html: both pass `returnUrl` in fetch body

### Form copy
- Removed form-reassurance line from both payment forms on index.html (was "An email from 24 Stories will be sent to you…")
- PayFast item_description added: "6 monthly payments of R2,795. Stops automatically after 6 months."
- Admin notification now shows "Payment 1 of 6" and Airtable Record ID

### cancelUrl corrected
begin.html cancelUrl was `begin?type=self/gift` (missing .html) — corrected to `begin.html?type=self` and `begin.html?type=gift`. urlType param now also wires up auto-show of correct form on cancel return.

### PayFast item_name
Changed from `'24 Stories'` to `'24 Stories — 6 monthly payments, stops automatically'`. item_description is NOT displayed on PayFast payment page (only in backend records) — item_name is the visible field.

### Story Helper buttons — final state
**Gift form:** None (default) | Me | Someone else
**Self form:** None (default) | Story Helper
All pill buttons. Radio input hidden. `:has(input:checked)` drives charcoal/cream selected state.
Self form converted from checkbox to radio buttons. `getSelfHelperType()` function reads radio value in both begin.html and js/script.js. Submit handlers use `getSelfHelperType() === 'other'` instead of `sAddHelper.checked`.

### Payment flow tests — COMPLETE (2026-05-25)

**begin.html is one page, one link.** Subscriber chooses gift or self on the page and continues. There are not separate test scenarios per path — all paths are within the same form.

- All three email paths confirmed via IPN simulation (2026-05-25):
  - Self, no helper: Email-1 (self copy) to storyteller ✓
  - Gift, no helper: Email-1 (gift copy) to storyteller, Email-2 to gift giver ✓
  - Gift + helper (Me): Email-1 to storyteller, Email-2 + Email-3 both to gift giver ✓
- Airtable: Status→Active, PaymentsCount=1, WelcomeEmailSentAt set on all three ✓
- Live sandbox payment confirmed: record activates, hello@ alert fires ✓
- index.html is NOT a separate test — it directs to begin.html on launch day

**Mobile sign-up links (Tamara sends specific links per path):**
- Default: `https://24stories.co.za/begin.html`
- Self path: `https://24stories.co.za/begin.html?type=self`
- Gift path: `https://24stories.co.za/begin.html?type=gift`
- Mobile render confirmed ✓

After all tests: delete test Airtable records. Resolve PayFast live credential identity before launch.

## Session 18 continued — Scenario B: Voluntary cancellation flow (2026-05-17)

### Airtable
- `CancellationRequested` checkbox field added to Subscribers (field ID: fld2FnadLAxvHRdsm). Tamara ticks this when subscriber emails to cancel.

### send-story-queue.js (2-min poll)
- Detects `CancellationRequested=TRUE()`. Unticks immediately to prevent double-processing.
- Fetches subscription token from Payments table (PayFastTransactionID on first payment record for that subscriber).
- Calls PayFast cancel API (`PUT /subscriptions/{token}/cancel`) with MD5 signature.
- Calculates AccessEndDate = SubscriptionStartDate + PaymentsCount months (end of current paid period).
- Writes AccessEndDate to Airtable.
- Sends email-17 to storyteller (cancellation confirmed, access until date, library seals after, restart by email).
- Sends CANCELLATION PROCESSED alert to hello@24stories.co.za with PayFast cancel status.
- Helper functions added: `getSubscriptionToken()`, `cancelPayFastSubscription()`, `email17Html()`.

### book-onboarding-reminder.js (daily 9am)
- New section queries Active subscribers with AccessEndDate set.
- If AccessEndDate = today or past: sets Status→Cancelled, sends SEALED alert to hello@.
- If AccessEndDate = tomorrow: sends SEALS TOMORROW alert to hello@ (with note: "No action needed unless you agreed to extend access. If so, update AccessEndDate in Airtable.")
- Note: AccessEndDate override for grace periods is manual — update in Airtable only after payment confirmed.

### library-read.js
- `computeAccessLevel()`: Status=Cancelled now returns `'locked'` (was `'read_only'`).
- Status=Complete remains `'read_only'`.

### library.html
- Added `stateSealed` screen (shown when access_level=locked): "Your Story Library has been sealed." with restart-by-email instruction.
- Added `'stateSealed'` to showState array.
- Added `if (accessLevel === 'locked') { showState('sealed'); return; }` handler.

### email-17-cancellation-confirmed.html
- New reference file. Subject: "Your 24 Stories subscription — cancellation confirmed".
- Placeholders: [FirstName], [AccessEndDate].

### Scenario A (payment failure) — DEFERRED to next session
- IPN with payment_status=CANCELLED triggers different flow (no active cancel by subscriber).
- "Subscription ended" email (email-18) to be written and wired.
- Library seals 3 days after third failed PayFast attempt.
- Stories submitted during grace window stored but not edited or sent to family.
- See MEMORY.md for full flow spec.

### Commits
- Scenario B: 968d6fd (cancellation flow), 560d335 (token fix), 4de87bd (PayFast URL fix)

## Session 18 continued — Scenario A: Payment failure freeze (2026-05-17)

### Airtable
- Status field: "Paused" confirmed removed (Tamara deleted it). "Frozen" added as new option (red).
- Status options now: Active, Pending, Complete, Cancelled, Frozen.

### payfast-webhook.js
- CANCELLED IPN: sets Status=Frozen immediately, sends PAYMENT FAILED — SUBSCRIPTION FROZEN alert to hello@ with name, email, phone, and restart link.
- COMPLETE IPN on Frozen subscriber: reactivates (Status=Active, SubscriptionStartDate=today, PaymentsCount=1), creates new Payment record, sends email-18 to subscriber, sends SUBSCRIPTION RESTARTED alert to hello@.

### restart-checkout.js (new function)
- GET `?id=SUBSCRIBER_RECORD_ID`
- Verifies Status=Frozen. Builds signed PayFast recurring payment URL (R3 500 × 6 months, same params as checkout.js).
- Redirects subscriber directly to PayFast. One-click.
- return_url and cancel_url both go back to library.html?id=RECORD_ID.

### library-read.js
- Status=Frozen → access_level='frozen' (separate from 'locked' used by Cancelled).

### library.html
- stateFrozen screen: "Your Story Library is temporarily unavailable." + "Restart my subscription →" button (href built from subscriberId in URL, points to restart-checkout function).

### email-18-welcome-back.html
- New reference file. Subject: "Welcome back — 24 Stories". Fires on restart COMPLETE IPN.

### Operations manual
- Part 3C added: WHAT TO DO WHEN A PAYMENT FAILS — full workflow, how to save/send restart link via email or WhatsApp.

### ⚠ UNTESTED IN PRODUCTION (same caveat as Scenario B PayFast cancel)
- CANCELLED IPN trigger cannot be sandbox-tested. First live payment failure will verify the freeze works.
- Restart flow: restart-checkout.js redirect to PayFast + COMPLETE IPN reactivation logic is correct but untested end-to-end.

### Commit
- Scenario A: 88fe99b

## Session 19 — Cancellation / Freeze / Restart — TESTED & COMPLETE (2026-05-18)

### Bugs fixed
- `restart-checkout.js`: hardcoded `cycles:6` → `6 - PaymentsCount` (remaining cycles only)
- `restart-checkout.js`: only accepted Frozen — now accepts Cancelled too
- `restart-checkout.js`: m_payment_id was reused from original checkout → PayFast rejected as duplicate. Now appends `-r` + timestamp.
- `restart-checkout.js`: included `email_address` + `name_first` → PayFast sandbox rejected as self-payment. Removed (original checkout never included them).
- `payfast-webhook.js` Frozen/Cancelled restart handler: was resetting `PaymentsCount:1` and `SubscriptionStartDate:today` → now increments PaymentsCount, preserves SubscriptionStartDate, clears AccessEndDate.

### New
- `payfast-webhook.js`: CANCELLED IPN now emails subscriber ("We're Sorry To See You Go!" + restart link) before alerting Tamara.
- `send-story-queue.js`: CANCELLATION PROCESSED alert now includes permanent restart link at bottom.
- `library.html`: stateFrozen screen detects `?restarted=1` return param — shows "payment received, reinstating shortly" instead of restart button.
- `restart-checkout.js`: return_url now includes `&restarted=1`.
- Both exit emails (email-17 and emailFrozenHtml) now open with "We're Sorry To See You Go!" heading.
- Operations manual Part 3B: loud ⚠ warning about CancellationRequested checkbox; restart link retrieval guide. Part 3C: updated for subscriber auto-receiving restart link; what subscriber sees on PayFast page; card change guidance. New section: lost/changed card → do nothing, wait for payment failure, system handles it.
- Gmail template drafted: "Card change — wait for payment link" (Tamara to save manually).

### Tested end-to-end (sandbox)
- Frozen library screen ✓
- Restart from Frozen → PaymentsCount increments correctly, email-18 + RESTARTED alert ✓
- Voluntary cancellation → email-17, CANCELLATION PROCESSED with restart link, AccessEndDate set ✓
- Restart from Cancelled → PaymentsCount increments, email-18 + RESTARTED alert ✓

### Still untested in production (flagged in ⚠ sections above)
- PayFast subscription cancel API (voluntary cancellation)
- PayFast CANCELLED IPN triggering automatic freeze
- Restart card entry form showing in live PayFast (sandbox auto-completes)

## Session 20 — Book Orders: Library + External Order Form — COMPLETE (2026-05-18)

### Built & tested
- **library.html**: button renamed "Order extra copies"; `?ordered=1` return param shows confirmation message; PayFast redirect overlay added.
- **extra-copies-checkout.js**: return_url now includes `&ordered=1`; flat R1,200 rate (bulk discount removed).
- **book-order.html**: new standalone external order form (`book-order.html?id=[RecordID]`). Fetches storyteller name via subscriber-lookup.js. Fields: name, email, phone, qty. No delivery address — copies ship to storyteller. Delivery note with red border below Pay button. PayFast redirect overlay.
- **book-order-checkout.js**: new function for external PayFast one-off payments. custom_str3='external', custom_str4=email|phone, custom_str5=name.
- **subscriber-lookup.js**: new minimal function — returns storyteller firstName + fullName by record ID.
- **payfast-webhook.js**: delivery address + phone added to library Tamara alert; external order detection (custom_str3='external') — routes to email14ExternalHtml, EXTERNAL BOOK ORDER alert to hello@ with orderer details; flat R1,200 rate.
- **email14ExternalHtml()**: new function — no library link, delivery to storyteller's address, orderer arranges onward collection, 4-week timing note.
- **Pricing**: flat R1,200 per copy everywhere. Bulk discount removed across all functions, library.html, book-order.html, email-14 reference.
- **Tamara test subscriber** (recj2fKFXLRmGNLn5): Status set to Active for testing. ExtraCopies reflects test orders.

### Promotional touchpoints — three built
- **email-7 weeks 25+26** (`send-story-queue.js` + `approve-story.js`): the "Have a story you want to hear?" suggestions box in email-7 is replaced with an extra copies promo box when `weekNumber >= 25`. Shows "[Name]'s story collection is nearly complete. If you'd like your own copy of the finished book, you can order here, now. Each book ships alongside the main order." + "Order a copy →" button linking to `book-order.html?id=[subscriberId]`. Both send-story-queue.js and approve-story.js have the same email7Html function — both updated identically.
- **Gift giver extra copies email** (`book-onboarding-reminder.js`): when `promptNumber === 24 && daysSince === 2` (Friday after prompt 24 sends on Wednesday), fires gift giver email if GiftGiverEmail exists and differs from StorytellerEmail. Subject: "A note about [Name]'s book — 24 Stories". Copy: story collection nearly complete, enjoyed reading instalments, order extra copies for family. `Order extra copies →` button to `book-order.html?id=`. Implemented as `giftGiverBookOrderHtml()` function appended to book-onboarding-reminder.js.
- **book-order.html**: shareable standalone link (`book-order.html?id=[RecordID]`). Tamara or storyteller can share this with any family member at any time.

### All tests passed
Library flow (button, PayFast, return confirmation, Tamara alert with delivery address, email-14) ✓
External flow (book-order.html, PayFast, confirmed screen, external email-14, EXTERNAL BOOK ORDER alert) ✓
Invalid link state ✓

### Dispatch notification — RESOLVED (2026-05-24)
External orderers now receive a dispatch notification. See Session 26 at top of file.

## Session 21 — Pre-Launch Sweep — COMPLETE (2026-05-20)

### Confirmed done — verified from live code and Airtable, not memory files
- **All operational alerts confirmed TO hello@24stories.co.za** — verified in send-story-queue.js, book-onboarding-reminder.js, payfast-webhook.js. No remaining code changes needed.
- **No ReplyTo on automated notification emails (6, 7, 12, 13, 17) — intentional by design.** Service is capped. Subscribers have hello@ contact in email body. Do NOT add ReplyTo to these emails in future.
- **Coaching email trigger BUILT AND LIVE** — CoachingEmailsSent field in Airtable. Email 0 in send-weekly-prompts.js. Emails 1–4 in book-onboarding-reminder.js.
- **SubscriberTier + UpgradeDate deleted from Airtable** — confirmed via Metadata API. Schema is clean.
- **All Gmail templates saved** — coaching invoices (Single Session R1,200, Starter Session R900, 3-Session Bundle R3,200, 6-Session Bundle R5,500, Full 24-Session Programme monthly R3,000, Full 24-Session Programme upfront R18,000), Payment Confirmation, Card Update subscriber response, Begin 24 Stories — Next Step outreach template. All in hello@24stories.co.za as canned responses.
- **begin.html outreach email template** — single template only. Tested end-to-end.
- **WhatsApp Business quick replies** — all 3 scenarios tested. Forward slash (/) in chat opens quick replies.
- **Operations manual** — updated 2026-05-20: Status field explained (dropdown not checkbox), manual EFT override documented, Titan references replaced with Gmail/Google Workspace.
- **send-story-queue.js** — no changes made. FROM stories@ is correct by design. TO addresses are correct. No ReplyTo is intentional.

### Remaining before launch
1. **Test index.html payment flows** — self and gift scenarios (sandbox). Confirm Airtable record created, emails 1/2/3 fire, admin alert arrives at hello@.
2. **Test extra copies from Story Library** — confirm PayFast payment, email-14, Tamara alert with delivery address.
3. **Payment confirmation emails** — confirm correct emails arrive after each test above.

### Card update mechanism — PENDING
- Tamara calling PayFast to understand their card update flow and retry behaviour.
- Current position: wait for payment failure (PayFast retries, then CANCELLED IPN → Frozen → restart link emailed automatically). Pre-emptive card update requires further investigation.
- If subscriber pays by manual EFT: change Status from Frozen → Active in Airtable dropdown. No PayFast subscription running — monitor manually.

### GoDaddy call outstanding
- Delete Titan subscriptions, delete 52stories domain, update card, set auto-renew on 24stories.co.za.

### Launch day only — ready to execute
- PayFast credential swap documented in CLAUDE.md above. Do not do this until launch day.

## Session 22 — Book Production: book-compile.js — COMPLETE (2026-05-21)

### Built
- **book-compile.js** — Netlify Function. Compiles all stories for a subscriber into a print-ready HTML book document.
  - GET `?id=[recordId]` → returns full HTML for browser preview + Chrome → Print → Save as PDF
  - POST `{id}` → emails HTML as .html attachment to hello@, sets BookCompiledDate in Airtable
  - Admin page: `compile-book.html`
- **compile-book.html** — Tamara admin page. Enter subscriber Record ID → Preview in browser (GET) or Compile & email (POST).

### Book structure (page order, fixed)
1. Printer spec sheet — `.spec-sheet.no-print` — screen only, hidden from PDF
2. Title page — full-bleed dark linen (CoverColour), Bebas Neue title + author block
3. Portrait photograph — full-bleed, no caption (PortraitPhotoURL, only if set)
4. Dedication page — fixed, centred, italic Georgia (DedicationText, only if set)
5. Epigraph page — fixed, centred, italic Georgia (EpigraphText, only if set)
6. Table of contents — Bebas Neue "Contents" heading, chapter numbers + titles, NO dates
7. Chapters × N — each: one chapter-page (title block + story text); if image: separate photo-page after text page
8. Colophon — bottom-centred, "This book was made for [Name]. Produced by 24 Stories."

### Typography — FINAL, LOCKED
- **ALL title/display/heading text: Bebas Neue** (Google Font, loaded via link tag in `<head>`)
- **ALL body text: Georgia, 'Times New Roman', serif** — system font, always available
- **NEVER use Cormorant Garamond, NEVER use Inter in 24 Stories books**
- Chapter title: Bebas Neue 68px / 42pt, line-height 0.93, letter-spacing 0.01em, uppercase, `text-transform: uppercase`
- Chapter body: Georgia 17.5px / 11pt, line-height 30px / 19pt, `text-align: justify`
- Orphans: 3 / Widows: 3 — `orphans: 3; widows: 3` on `.chapter-text p`
- Photo caption: Georgia italic 12.5px / 9pt, line-height 19px / 14.5pt, `text-align: left`
- Dedication: Georgia italic 13.5px / 10pt, line-height 1.85
- Epigraph: Georgia italic 14px / 10.5pt, line-height 1.9
- ToC heading: Bebas Neue 38px / 24pt, letter-spacing 0.02em
- ToC chapter number: Georgia 11px / 8pt, gold #B8976A
- ToC chapter title: Georgia 14px / 10pt
- Author name on cover: Bebas Neue 24px / 15pt, letter-spacing 0.09em, cream #F4F2EE
- Cover subtitle: Georgia 11px / 7.5pt, "A Collection of Stories", uppercase, faded cream

### Print format — 170 × 240mm portrait (NOT A5 — premium hardcover format, 6.7"×9.4")
**Mirror margins (standard for case-bound hardcover — spine always wider):**
- **Recto (odd/right-hand pages):** top 17mm / outer (fore-edge) 15mm / bottom 22mm / inner (spine) 20mm
- **Verso (even/left-hand pages):** top 17mm / outer (fore-edge) 20mm / bottom 22mm / inner (spine) 15mm
- CSS `@page { margin: 17mm 15mm 22mm 20mm; }` — carries recto as fallback if browser ignores `:left/:right`
- CSS `@page :right { margin: 17mm 15mm 22mm 20mm; }` — recto
- CSS `@page :left  { margin: 17mm 20mm 22mm 15mm; }` — verso

**Full-bleed pages (cover, portrait, photo, dedication, epigraph, colophon):**
- CSS `@page full-bleed { size: 170mm 240mm; margin: 0; }`
- CSS `.fixed-page { page: full-bleed; }` in `@media print`
- These pages have content to the trim edge — no margin

**Screen preview proportions match print exactly:**
- Screen page: 760×1073px, background #F4F2EE
- Scale factor: ~4.47px per mm
- Chapter padding screen: 76px top / 67px outer / 98px bottom / 89px inner (matches print margin ratios)
- Fixed pages: 1073px height screen / 240mm print
- Chrome PDF export: set paper size to custom 170mm × 240mm (not A5)

### Dates — NEVER appear in the book
- StoryCircaDate is used ONLY by GenerateChapterOrder to sort chapters
- Dates do NOT appear in chapters, chapter titles, ToC, or anywhere in the compiled book
- `formatCirca()` helper exists in code but is not called from any book-rendering function — do not wire it in

### Images — always own page, always after chapter text
- Every chapter image appears on its own `.fixed-page` div, placed AFTER the chapter text page
- NEVER inline within chapter text
- Photo page layout: `photo-page-inner` — absolute top 76px / left 76px / right 76px / height 530px (screen); top 16.5mm / left 16.5mm / right 16.5mm / height 115mm (print)
- Caption: absolute top 660px (screen) / top 143mm (print), italic, text-align left

### Cover page
- Backgrounds by CoverColour: Black → #1A1A1A / Blue → #1C2B3F / Red → #3A0E0E
- Title block: top-left. `splitTitle()` splits title into ≤2 lines at word midpoint
- Author block: bottom-right. Name in Bebas Neue, "A Collection of Stories" in small caps below
- Cover screen positions: title-block top 220px left 68px; author-block bottom 160px right 68px
- Cover print positions: title-block top 52mm left 15mm; author-block bottom 38mm right 15mm

### Text content fallback chain (per chapter)
FinalStory → EditedText → StoryText

### Airtable fields used
**Subscribers:** StorytellerFirstName, StorytellerSurname, BookTitle, PortraitPhotoURL, DedicationText, EpigraphText, CoverColour, DeliveryAddress, ExtraCopies, BookCompiledDate
**Stories (per chapter):** ChapterOrder, ChapterTitle, FinalStory, EditedText, StoryText, StoryImageURL, StoryImageCaption

### No Airtable schema changes this session — uses existing fields only
(PortraitCaption exists in Subscribers schema but is intentionally unused — portrait is always full bleed, no caption, by design.)

### Known limitations
- `@page :left/:right` Chrome support not yet verified in production. Verify alternating spine margins on first printed proof. Fallback is recto margins on all pages (acceptable).
- Page numbers not implemented — static HTML cannot accurately number dynamic-length chapters. Add in InDesign pass or by printer if needed.
- Bebas Neue requires internet connection at Chrome PDF export time. Once exported, fonts are embedded in the PDF.

### Test preview (use Tamara subscriber — never Elizabeth who is Paused)
- Admin page: https://24stories.co.za/compile-book.html → enter `recj2fKFXLRmGNLn5` → Preview in browser
- Direct function URL: https://24stories.co.za/.netlify/functions/book-compile?id=recj2fKFXLRmGNLn5

## Launch Dates
- 8 June 2026: Live storytelling event
- 10 June 2026: Paid site goes live, interest list emailed
- Free testers: 5–6 people, accelerated trial, before paid launch
