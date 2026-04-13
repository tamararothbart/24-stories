---
name: Architecture Decisions — Story Helper & Family Engagement
description: Finalised decisions on Story Helper role, suggestion feature removed, submission form, and email flow
type: project
---

## Story Suggestion Feature — REMOVED
Decision made 28 March 2026. Do not build:
- SuggestedPrompts Airtable table — do NOT create
- Scenario 6 (suggestion webhook) — do NOT build
- suggest.html — do NOT build
- Scenario 4 suggestion logic — do NOT add

**Reason:** Over-complicates the product. Family engagement happens naturally through existing relationships. Technology gets out of the way.

**Replacement:** A warm note at the bottom of every story delivery email (Scenario 3) reminding family they can encourage the storyteller to share any memory — prompts are just a starting point.

**Note copy (draft):**
"Enjoying [StorytellerFirstName]'s stories? Let them know any memory is worth telling — the prompts are just a starting point. Every story that arrives is a gift."

---

## Story Helper — Role & Naming
- **Name on form and in all copy:** "Story Helper"
- **Role:** Help storyteller use tell.html, upload family photos, gentle weekly reminder to record
- **NOT responsible for suggesting prompts** — that feature has been removed
- **Assumption:** Gift giver is likely the Story Helper in most cases — form has "Same as gift giver" checkbox

**Form description (one line under field):**
"Someone who can help your storyteller use the recording page and upload family photos — usually a family member comfortable with technology."

---

## GeneratedPrompt Field
- Field exists in Subscribers table — leave it dormant
- Reserved for future AI-generated personalised prompts (post-launch, needs 100+ subscribers, 6+ months data)
- No wiring needed now — do not connect to any scenario

---

## Submission Form Changes (index.html)
- Add **PhoneNumber** field (storyteller's mobile)
- Add **Story Helper** section: Name + Email fields, with "Same as gift giver" checkbox (pre-ticked)
- Change FamilyEmails to **dynamic expanding fields**: one field shown at start, new field appears as each is filled, up to 10
  - On submit: JavaScript joins filled fields into comma-separated string → sends as FamilyEmails in webhook
  - Nothing changes in Make, Airtable, or Scenario 1/3
- **Family emails label:** "Who else would you like to receive the stories?"
- **Family emails description:** "Add up to 10 email addresses. Your gift giver and story helper receive their own separate emails."
- Update Scenario 1 Airtable mapping: add PhoneNumber, FamilyHelperName, FamilyHelperEmail

---

## Email Flow — Who Gets What

### At signup (Scenario 1):
- Storyteller → welcome email (exists — add my-story.html link)
- Gift Giver → confirmation email (exists — review content)
- Story Helper → **new welcome email** (new module in Scenario 1, conditional on FamilyHelperEmail being populated and different from GiftGiverEmail)
  - Content: their role, my-story.html link, how to upload photos, gentle weekly nudge reminder

### Weekly prompt (Scenario 4):
- Storyteller → prompt email (exists — add my-story.html link)
- Story Helper → **same prompt email as second recipient** (so they can nudge storyteller)
- Week 1 only: add "how it works" block to prompt email

### Day 4 reminder (Scenario 5):
- Storyteller → reminder (exists — add my-story.html link)
- Story Helper → **do NOT copy** on reminder (too intrusive)

### Story delivery (Scenario 3):
- Storyteller → **new confirmation module**: "Your story for Week X has been sent to your family. Here is what you shared." (different copy, new Mailjet module)
- Gift Giver → **new fixed recipient module**: standard family delivery email
- Story Helper → **new conditional module**: standard family delivery email (only if FamilyHelperEmail populated)
- Family list → existing 10 modules (unchanged)
- **Note at bottom of all family delivery emails:** "Enjoying [StorytellerFirstName]'s stories? Let them know any memory is worth telling — the prompts are just a starting point. Every story that arrives is a gift."
