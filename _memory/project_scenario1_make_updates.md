---
name: Scenario 1 Make Updates — Pending
description: Exact steps needed to update Scenario 1 in Make once all email content is finalised in desktop HTML drafts. Do NOT touch Make until all 8 email HTML files are approved.
type: project
---

## Rule
All email content must be finalised in `/Users/tamararothbart/Desktop/24stories-emails/` BEFORE making any changes in Make. Changes are batched — one Make session after all emails are approved.

**Why:** Content changes in emails may require structural changes in Make (new modules, new conditionals, new fields). Doing Make first means redoing it.

## Source of truth for email content
`/Users/tamararothbart/Desktop/24stories-emails/` — 8 HTML files, one per email, with meta headers showing scenario, recipient, trigger, and status. Always read these before touching Make.

---

## Scenario 1 — Pending Make Changes

### 1. Email 1 — Storyteller Welcome (existing Mailjet module)
Replace the static GiftGiverName sentence with an inline Make `if()` conditional:

**Find this line in the Mailjet HTML body:**
```
[GiftGiverName] has given you a beautiful gift.
```

**Replace with this Make formula (insert via variable picker / formula editor):**
```
{{if(1.StorytellerEmail = 1.GiftGiverEmail;
  "You have given yourself a beautiful gift.";
  1.GiftGiverName + " has given you a beautiful gift.")}}
```

- If StorytellerEmail = GiftGiverEmail → self-signup → "You have given yourself a beautiful gift."
- If different → gifted → "[GiftGiverName] has given you a beautiful gift."
- This is a single Mailjet module — no router needed

### 2. Email 2 — Gift Giver Confirmation (existing Mailjet module)
Add a Make filter BEFORE the Gift Giver Mailjet module so it only fires when the subscription is a gift (not self-signup):

**Filter condition (wrench icon between Airtable module and Gift Giver Mailjet module):**
```
StorytellerEmail  Does not equal  GiftGiverEmail
```
(Use module 1 webhook variables: `1.StorytellerEmail` and `1.GiftGiverEmail`)

If self-signup (emails match), this module is skipped entirely — no confirmation sent to gift giver because there is no separate gift giver.

### 3. Email 3 — Story Helper Welcome (NEW Mailjet module — not yet built)
Add a new Mailjet module after the Gift Giver module with a filter so it only fires when StoryHelperEmail is populated AND differs from GiftGiverEmail.

**Filter condition:**
```
StoryHelperEmail  Exists
AND
StoryHelperEmail  Does not equal  GiftGiverEmail
```

**Recipients:**
- To: `1.StoryHelperEmail`
- Name: `1.StoryHelperName`

**Subject:** `You've been named as [StorytellerFirstName]'s Story Helper`

**Body:** Use content from `/Users/tamararothbart/Desktop/24stories-emails/email-3-storyhelper-welcome.html`

### 4. Airtable fields to map in Scenario 1 Airtable Create module

**Removed from webhook payload (2026-03-29):**
- `SubscriptionType` — deleted from Airtable and JS
- `PromptFrequency` — deleted from Airtable and JS
- `PhoneNumber` — removed from form (post-launch v2.0)

**New field to map:**
- `BookPath` → `1.BookPath` — single select, values: `subscription_only` or `book_upfront`

**Also map (added previously, confirm still present):**
- `StoryHelperName` → `1.StoryHelperName`
- `StoryHelperEmail` → `1.StoryHelperEmail`

**Scenario 4 — remove PromptFrequency logic:**
- Always add 7 days to NextPromptDueDate — no frequency multiplier needed
- Add upgrade link to every prompt email: PayFast R5,500 link → "Upgrade to Legacy Book →"

**New Scenario 6 — Monthly Book Reminder:**
- Trigger: last day of each month (scheduled)
- Filter: BookPurchased = false (or BookPath = subscription_only)
- Send Email 9 (not yet written): R4,400 book offer (20% off)
- PayFast link for R4,400
- Airtable Update: once BookPurchased = true → Scenario 6 stops sending

**Airtable Subscribers fields — simplified model (2026-03-29):**
- REMOVED: SubscriptionType, PromptFrequency
- RENAMED: BookUpgrade → BookPurchased (user does this manually)
- ADDED: BookPath (single select: subscription_only / book_upfront), BookPurchasedAt (date), SubscriptionFree (checkbox — auto-set true when BookPath = book_upfront)

---

## hello@24stories.co.za — Setup Status (updated 2026-03-29)
**All references changed from info@ to hello@** — website (index.html) and all 8 email HTML drafts updated.

1. ✅ **hello@ mailbox created in Titan** — accessible at app.titan.email, added as second account alongside stories@
2. ✅ **Autoresponder enabled** — Subject: "We've received your message" / Body: "Thank you for reaching out to 24 Stories. We'll get back to you within 2 working days. With warmth, The 24 Stories Team" — no end date (set to 2030)
3. ✅ **SPF record added to GoDaddy DNS** — TXT record: `v=spf1 include:secureserver.net include:spf.mailjet.com ~all` — added 2026-03-29, propagation takes up to 48 hours
4. ⏳ **CHECK TITAN SPF WARNING** — go to app.titan.email, log in as hello@, check if the "Action required: SPF record" warning has cleared. Do this BEFORE any Make/Mailjet work.
5. ⏳ **Set Reply-To in Mailjet** to hello@24stories.co.za across all transactional emails — so when subscribers reply to any email, it routes to hello@ not stories@
6. ⏳ **FAQ page** — build faq.html before launch. All emails link to https://24stories.co.za/faq (currently placeholder)
7. stories@24stories.co.za remains the Mailjet sender only — not a monitored inbox for customer queries
8. **Titan desktop shortcut** — created via Chrome → three dots → Create Shortcut → opens app.titan.email. Currently opens to stories@ by default; switch to hello@ from left menu.

## Other Scenario Updates Pending (from email content review)

### Scenario 3 — add Storyteller Confirmation module
New Mailjet module to send Email 5 (storyteller confirmation) to storyteller only when Tamara ticks "Sent to Family".
- Recipients: Subscribers table → StorytellerEmail, StorytellerFirstName
- See: `/Users/tamararothbart/Desktop/24stories-emails/email-5-storyteller-story-confirmation.html`

### Scenario 4 — add Story Helper as second recipient
Add Story Helper as second recipient in the Mailjet prompt delivery module.
- Condition: only if StoryHelperEmail is populated

### Scenario 4 / 5 — add my-story.html link
Commented out in email drafts — uncomment and add once my-story.html is built.

---

## Important Make Rules (hardlearned)
- Variables MUST be inserted via the variable picker (blue badges) — do not type `{{variable}}` manually for new variables
- Fields with spaces use backtick notation: `{{2.\`Alternative 1\`}}` — must use picker
- `if()` formulas go into the formula editor, not plain text field
- Never re-select Airtable table in a module to "refresh" — it resets all output field mappings
- Filters added via wrench icon between modules
