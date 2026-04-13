---
name: Make — Prompt Pace Changes (undecided optional feature)
description: Pace changes are NOT a confirmed feature and are NOT advertised. One prompt/week is locked. This flags an optional manual architecture to be questioned during the Make build. RAISE THIS whenever PromptNumber, prompt schedule, or frequency come up.
type: project
originSessionId: 0e25d345-75a8-4323-8f7d-1395e723049d
---
# Make — Prompt Pace Changes (optional — question at build time)

**⚠ RAISE THIS whenever: PromptNumber, prompt schedule, or frequency come up during the Make build.**

**Status: NOT a confirmed feature. Not advertised to subscribers. One prompt per week is the locked cadence — matches StoryWorth and Remento. Pace-change question removed from FAQ. This file flags an optional manual back-end capability for edge cases only (e.g. free testers on accelerated trial). Decision deferred to Make build phase.**

**Question to ask at build time:** Is it worth adding a manual webhook scenario (15 min to build) that lets Tamara send one subscriber their next prompt early — without touching the main weekly schedule? Or keep it fully fixed and handle exceptions another way?

---

## The Main Weekly Scenario (confirmed design)

1. Runs on a fixed schedule (e.g., every Monday)
2. Loops through all Active subscribers
3. Reads each subscriber's `PromptNumber` from Airtable
4. Sends the correct prompt email via Mailjet
5. Increments `PromptNumber` by 1

**Do not change the schedule of this scenario to handle one subscriber's pace request — it affects everyone.**

---

## Optional Architecture — If Decided at Build Time

**Option A — Manually run with a filter (no extra build needed):**
1. In Make, open the prompt delivery scenario
2. Add a temporary filter: `StorytellerEmail = [subscriber's email]`
3. Run once manually
4. Remove the filter immediately after

Sends that subscriber their next prompt, increments PromptNumber correctly, main schedule untouched.

**Option B — Separate "Send Next Prompt — Manual" scenario (15 min to build alongside main):**
- Webhook-triggered
- Accepts a SubscriberID as input
- Runs the same prompt-send-and-increment logic for that one subscriber only
- Main weekly scenario unaffected

---

## What NOT to Do (regardless of decision)

- Do NOT change the weekly schedule to twice-weekly — double-sends to every subscriber
- Do NOT manually edit `PromptNumber` in Airtable to skip ahead — Make reads this to decide which prompt to send next. Manual edits break the sequence.

---

**Why:** Edge cases exist (accelerated free testers, elderly storyteller with health concerns). The right architecture handles them cleanly without disrupting the main flow.
**How to apply:** Raise this question when building Make scenario step 7. Option B costs 15 minutes at that moment and nothing later. Decide then, not now.
