---
name: Launch Roadmap — 24 Stories
description: Ordered pre-launch job list with deadlines and launch date
type: project
---

**Launch date: 8 June 2026 at 7pm SAST**
**Build deadline: 30 April 2026** (May reserved for marketing strategy and beta)

---

## Current State (as at 28 March 2026)
- Scenario 1 — Signup — WORKING
- Scenario 2 — Story Submission — WORKING (full end-to-end test still needed)
- Scenario 3 — Family Delivery — WORKING
- Scenario 4 — Prompt Delivery — WORKING (filter fix applied 28 March)
- Scenario 5 — Day 4 Reminder — WORKING (filter fix NOT yet applied — do this first)
- tell.html — WORKING
- Airtable Subscribers fields added: PhoneNumber, FamilyHelperName, FamilyHelperEmail, DeliveryAddress, CoverImageURL, Dedication, BookUpgrade, StoriesComplete, GeneratedPrompt (dormant)
- Website redesign complete — awaiting hero photo, testimonial portraits, book mockup images

---

## Build List — In Order

### 1. Scenario 5 filter fix (quick — 5 minutes)
Same fix applied to Scenario 4 on 28 March. Open Scenario 5, click wrench between module 1 and 2, add filter: ID from module 1 Exists. Prevents empty bundle errors on days with no subscribers due for reminder.

### 2. Submission form (index.html)
- Add PhoneNumber field
- Add Story Helper section: Name + Email, "Same as gift giver" checkbox (pre-ticked by default)
- Change FamilyEmails to dynamic expanding fields (1 shown → up to 10, new field appears as each is filled)
- Update Scenario 1 Airtable mapping for PhoneNumber, FamilyHelperName, FamilyHelperEmail

### 3. Scenario 3 — restructure recipients + add note
- Add new Mailjet module: Storyteller confirmation ("Your story has been sent. Here is what you shared.")
- Add new Mailjet module: Gift Giver fixed recipient (standard family email)
- Add new conditional Mailjet module: Story Helper fixed recipient (only fires if FamilyHelperEmail populated)
- Add note to bottom of all family delivery emails: "Enjoying [StorytellerFirstName]'s stories? Let them know any memory is worth telling — the prompts are just a starting point. Every story that arrives is a gift."

### 4. Scenario 1 — Story Helper welcome email
- Add third Mailjet module to Scenario 1 (conditional on FamilyHelperEmail populated + different from GiftGiverEmail)
- Content: Story Helper role, my-story.html link, how to upload photos, reminder to nudge storyteller weekly

### 5. Build my-story.html
- Story archive: 24 story cards showing prompt, story text, photo slot, caption
- Per-story photo upload to Cloudinary + save ImageURL + Caption to Airtable Stories record
- Cover section: upload cover photo + dedication → saves to Subscriber record
- No login — link-based access via ?id= URL param
- URL format: https://24stories.co.za/my-story.html?id={{subscriber_record_id}}

### 6. Update Scenario 4 prompt emails
- Add my-story.html link to prompt email
- Add Story Helper as second Mailjet recipient
- Week 1 only: add "how it works" block to email

### 7. Update Scenario 5 reminder email
- Add my-story.html link
- Do NOT add Story Helper as recipient on reminders

### 8. Update Scenario 1 storyteller welcome email
- Add my-story.html link

### 9. Scenario 2 — full end-to-end test
URL: https://24stories.co.za/tell.html?id=rechfjHuK4Qs63ohu&week=1&prompt=Tell%20us%20a%20story
Steps: record audio → add photo + caption → submit → verify Airtable fields populated → verify Tamara notification → tick Sent to Family → verify Scenario 3 fires

### 10. Paywall — Payfast integration
Build payment flow using Payfast (South African payment gateway). Inactive during beta, active at launch.
- Payfast handles once-off and recurring payments in ZAR — no currency conversion needed
- R280/month recurring OR R1,500 upfront (one-off)
- Decision needed: does paywall gate signup form, or does subscriber pay after first prompt?
- See item 10a (book upgrade) for second payment flow

### 10a. Book upgrade flow — DECISION NEEDED before building
How does a subscriber signal they want to upgrade to a Legacy Book (R5,500)?
Options:
  A. Email CTA in prompt emails: "Want your stories made into a book? Reply to this email." (simplest, no build)
  B. Button on my-story.html: "Order your Legacy Book" → Payfast payment page (cleanest UX)
  C. Contact form on website
Recommendation: Option A during beta (no build needed). Option B for launch (one Payfast payment link).
- Decision to be made before building Payfast integration

### 10b. Contact details — fix website footer
"Contact Us" in footer links to href="#" — broken. Before launch, either:
  A. Change to mailto:stories@24stories.co.za (simplest)
  B. Build a simple contact form that posts to Make → Tamara inbox
  C. Link to a dedicated contact page
No email address is publicly visible anywhere on the site currently.

### 11. Website — deploy with images
Once hero photo, testimonial portraits, book mockup images received. Do not touch until images ready.

### 12. book-template.html + book-admin.html
Legacy Book HTML/CSS template. Pulls 24 stories + photos from Airtable. Tamara manually triggers during beta.
- book-template.html: 24 story cards (prompt, story text, photo, caption), cover page, dedication
- book-admin.html: Tamara enters subscriber ID → pulls all stories → renders printable book
- Output: Tamara prints to PDF → sends to printer or orders via MagCloud/PrintNinja

### 13. Mobile + desktop testing
Full cross-device test of tell.html, my-story.html, submission form, all emails.

### 14. Beta testing with real users
Recruit 3–5 outside storytellers. Full signup → prompt → submission flow.

### 15. SEO
Optimise 24stories.co.za for Google search before launch.

---

## Do NOT Build (removed from scope)
- SuggestedPrompts Airtable table
- Scenario 6 (suggestion webhook)
- suggest.html
- Scenario 4 suggestion logic

---

## Post-Launch Only
- AI-generated personalised prompts (GeneratedPrompt field — needs 100+ subscribers, 6+ months data)
- Automated book generation (Puppeteer PDF)
- WhatsApp integration
- Outbound calls (Twilio/Vapi)
- Paywall activation
