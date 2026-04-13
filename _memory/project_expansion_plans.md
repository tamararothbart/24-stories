---
name: 24 Stories Expansion Plans
description: Post-launch product expansion ideas for 24 Stories platform — build after beta testing and monetization of core product
type: project
---

Expand 24 Stories into a broader story archiving platform once the core product is live and generating revenue.

**Why:** User believes real revenue potential lies in corporate and milestone products, not just the personal legacy subscription.

**How to apply:** Once core 24 Stories is beta tested and live, build these as separate products on the same Airtable/Make/Claude/Mailjet infrastructure.

---

## Post-Launch Technical — WhatsApp Notifications (Twilio)
- Cut from launch to avoid setup delays and keep costs lean
- PhoneNumber field removed from signup forms (2026-03-29) — add back when ready
- PhoneNumber field still exists in Airtable Subscribers table — keep it, just not collected yet
- When ready: add Twilio WhatsApp module to Scenario 4 (prompt delivery) and Scenario 5 (reminder), firing only if PhoneNumber is populated
- Setup requires: Twilio account, WhatsApp Business API approval via Facebook Business Manager (can take weeks — start early)
- Cost: ~$4/month for 200 subscribers at 1 message/week — negligible

---

## Product 2 — Corporate Story Collection
- One corporate client, many narrators (tens to hundreds of employees)
- Few prompts sent to all narrators
- Each narrator submits their story
- Compiled into a corporate legacy/culture archive or book
- Airtable needs a People table alongside Subscribers

## Product 3 — Birthday/Milestone Book
- Reverse of core product: ONE prompt sent to MANY contributors (up to 24+)
- Each contributor submits one story about the birthday/milestone person
- All stories compiled into one celebratory book
- Simpler flow than core product
- High gifting potential — birthdays, retirements, anniversaries, farewells

## Technical Approach
- Same infrastructure: Airtable, Make, Claude, Mailjet, /tell page
- Build each as a separate product within the same Airtable base
- New Make scenarios per product type
- New landing pages per product
- One platform, multiple revenue streams
