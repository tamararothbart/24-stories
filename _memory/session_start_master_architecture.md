---
name: Session Start Flag — master-architecture.html v3.1 status
description: master-architecture.html IS rebuilt to v3.1 as of 2026-04-12. Build order is 18 items. Items 1–9 DONE. Items 10–18 TODO.
type: project
originSessionId: c6f5fe16-ba20-4eaf-ad01-d3e870d44c12
---
**master-architecture.html IS complete on v3.1 as of 2026-04-12. No rebuild needed.**

All sections locked and accurate:
- R6,795 once-off, single product, book included
- Emails 1–16 with correct numbering, triggers, and proofread lock status
- Email-15 is pause confirmation (not cancellation)
- Library spec: Mark as Complete, cover photo logic, BookSummary, DeliveryPhone, BookTitle
- Airtable schema (Section 7): all new fields — BookSentToPrintDate, BookProductionStatus (formula), PauseStartDate, IsPaused, IsResumed, DeliveryPhone, BookTitle, BookSummary. BookDispatchedDate absent (removed).
- 13 Make scenarios documented (Section 8)
- "Books in Production" Airtable view spec in Section 7
- 3-week print-to-delivery window (email-12)
- Pause policy: 12 months from subscription start date (Section 12)
- Build order: 18 items total. Items 1–9 DONE. Items 10–18 TODO.

**Open questions flagged in document:**
- library.html bug: "Awaiting edit" state missing (item 10)
- Prompts table field name: Week vs PromptNumber — resolve before Airtable reset (item 11)
- Scenario 13 Part B pause alert trigger mechanism not confirmed (item 12)

**Build order — items 10–18 (all TODO):**
10. Fix library.html "Awaiting edit" state
11. Resolve Week vs PromptNumber field name
12. Confirm Scenario 13 Part B spec
13. Reset Airtable to v3.1 schema (4 tables, all formula fields, "Books in Production" view)
14. Produce locked field name reference doc + Make scenario module maps (13 scenarios)
15. Prepare Make-ready email content (all 16 emails — subject lines + HTML with Make syntax)
16. Verify Mailjet DKIM for stories@24stories.co.za on GoDaddy
17. Configure library.html for go-live (Airtable API key, base ID, 4 webhook URLs)
18. Build Make scenarios 1–13
