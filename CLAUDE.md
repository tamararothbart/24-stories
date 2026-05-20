# 24 Stories — Website & Developer Context

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
24 Stories guides a storyteller through 26 weekly prompts, edits each story professionally, delivers them to family by email, and produces a printed linen-bound hardcover book. Pricing: R2,795/month × 6 months (auto-stops), or R16,770 once-off lump sum.

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

## ⚠ LAUNCH DAY PAYFAST SWAP — RESOLVED, READY TO EXECUTE
Live credentials confirmed 2026-05-20. Swap ALL of the following simultaneously on launch day:
1. `netlify env:set PAYFAST_MERCHANT_ID 34556163`
2. `netlify env:set PAYFAST_MERCHANT_KEY liduaqfvjfeox`
3. PAYFAST_PASSPHRASE stays as Twenty4Storie3 — no change needed
4. `netlify env:set PAYFAST_SANDBOX false`
5. begin.html line 645: PAYFAST_USE_SANDBOX = false
6. js/script.js line 65: PAYFAST_USE_SANDBOX = false
7. Push to GitHub (auto-deploys to Netlify)

## Airtable Schema — Subscribers Table (locked field names)
StorytellerFirstName, StorytellerSurname, StorytellerEmail, StoryHelperName, StoryHelperEmail, GiftGiverName, GiftGiverEmail, FamilyEmails, DeliveryAddress, DeliveryPhone, Phone, SubscriptionStartDate, Status, PromptNumber, LibraryToken, LastPromptSentDate, BookFormCompleted, BookTitle, PortraitPhotoURL, PortraitCaption, DedicationText, EpigraphText, CoverColour, BookCompiledDate, BookSentToPrintDate, BookProductionStatus (formula — read only), PauseStartDate, ExtraCopies (number), SendDelayNotification (checkbox), GenerateChapterOrder (checkbox), BookDispatchEmailSent (checkbox)

## Critical Rules
- Never add fields to Airtable without explicit discussion — schema changes affect library.html, tell.html, and all Netlify Functions simultaneously.
- Never reference Make. Never suggest Make. It does not exist in this project.

## Outreach Email Template — LOCKED (2026-05-20)
- File: `begin-email-templates.html` (repo root). Single template only — "Begin 24 Stories — Next Step".
- Subject line: `Begin 24 Stories — Next Step`. Fill in: `[Name]`. Links to `https://24stories.co.za/begin.html`.
- Copy mechanism: `navigator.clipboard.write()` with `text/html` blob — this is what preserves the clickable button when pasting into Gmail. Do NOT revert to `document.execCommand('copy')`.
- Saved in Gmail as canned response. Tested end-to-end: button links correctly, payment completed from inside the email. Do not add more templates or change the copy mechanism.

## Founder Video — LIVE (2026-05-20)
- File: `founder-video.mp4` (converted from `founder video ..mov`, H.264, 15MB, portrait 9:16)
- Section: `.founder-video-section` in index.html — charcoal background, portrait wrap 360px max-width, 38% column
- Behaviour: rests on end frame (56s) as static image. Play starts at 1.0s with sound on. Stop returns to end frame. No loop. No autoplay.
- To adjust trim: edit `START_TIME` (currently 1.0) and `END_TIME` (currently 56.0) in the founder video script block near the bottom of index.html.

## File Map
- `index.html` — main site (pricing, FAQ, signup form, resend library link)
- `library.html` — subscriber story library + book prep (reads/writes via Netlify Functions)
- `tell.html` — story submission (voice + typed, Claude cleanup, Cloudinary upload)
- `events.html` — live storytelling events (separate product)
- `24stories-emails/` — 16 email HTML files (email-1 through email-16)
- `netlify/functions/` — all serverless automation

## Netlify Functions (20 total)

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
- Monthly: R2,795/month × 6 cycles (auto-stops). PayFast recurring subscription (subscription_type=1, frequency=3, cycles=6).
- Lump sum: R16,770 once-off. PayFast single payment. AccessEndDate set to +6 months on activation.
- Extra copies: R1,200 each (ordered via Story Library).
- Airtable record created on payment_status = COMPLETE only.
- Book: physical printed hardcover. SA printer + Courier Guy. Up to 4 weeks delivery.
- Library: URL-based access (library.html?id=[LibraryToken]). All 26 prompts unlocked day one.
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

### Payment flow test — Scenario 1 COMPLETE (begin.html, self, no helper)
- Auto-fill works reactively on typed/pasted input (not browser autocomplete)
- PayFast sandbox payment completes, IPN fires, record activates (Status→Active, PaymentsCount=1)
- SUBSCRIBED page appears on return ✓
- Email 1 arrived at storyteller ✓
- Admin NEW SUBSCRIBER alert arrived at hello@ ✓

### Payment flow test — Scenario 2 IN PROGRESS (gift, no helper)
- Payment went through ✓
- SUBSCRIBED page appeared ✓
- Pending: confirm Email 1 (storyteller), Email 2 (gift giver), admin alert all arrived

### Remaining test scenarios
3. begin.html — self + Story Helper
4. begin.html — gift + Me (gift giver is helper) → confirm Email 2 + Email 3 both to giver
5. begin.html — gift + Someone else → confirm Email 2 to giver, Email 3 to helper
6. index.html — same gift/self scenarios
7. Mobile (begin.html on phone)
8. Extra copies from Story Library
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
- Verifies Status=Frozen. Builds signed PayFast recurring payment URL (R2,795 × 6 months, same params as checkout.js).
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

### Open item — future session
External orderers (book-order.html) receive no dispatch notification. Email-12/13 only go to the storyteller. To fix: need a way to store orderer email against the subscriber record. Requires schema discussion — no field exists in Payments or Subscribers for this. Flag when first live external orders arrive.

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

## Launch Dates
- 8 June 2026: Live storytelling event
- 10 June 2026: Paid site goes live, interest list emailed
- Free testers: 5–6 people, accelerated trial, before paid launch
