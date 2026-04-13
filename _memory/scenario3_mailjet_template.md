---
name: Scenario 3 Mailjet Email Template
description: HTML template for family story delivery email in Make Scenario 3 — paste into Mailjet content field, then replace 3 placeholders with variable picker
type: project
---

## How to use

1. Open Mailjet module 1 in Scenario 3
2. Switch the content field to HTML mode
3. Paste the HTML below
4. Use the variable picker to replace each **[PLACEHOLDER]** with the correct Make variable:
   - `[WEEK_NUMBER]` → Module 1 (Watch Records) → Week Number
   - `[STORYTELLER_FIRST_NAME]` → Module 3 (Get Record) → StorytellerFirstName
   - `[STORY_TEXT]` → Module 1 (Watch Records) → Story Text
5. Do the same for the **subject line** (not in this HTML — set separately in the Subject field):
   - Subject: `Week [WEEK_NUMBER] — [STORYTELLER_FIRST_NAME]'s story`

## HTML Template

```html
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #1A1A1A; background: #F7F5F2;">

  <p style="font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: #B8976A; margin: 0 0 32px 0;">
    Week [WEEK_NUMBER]
  </p>

  <p style="font-size: 18px; font-weight: normal; margin: 0 0 24px 0; line-height: 1.5;">
    Hello,
  </p>

  <p style="font-size: 16px; margin: 0 0 32px 0; line-height: 1.7;">
    [STORYTELLER_FIRST_NAME] wants to share something with you.
  </p>

  <hr style="border: none; border-top: 1px solid #D0CCC6; margin: 0 0 32px 0;">

  <p style="font-size: 16px; line-height: 1.9; margin: 0 0 40px 0; white-space: pre-wrap;">
    [STORY_TEXT]
  </p>

  <hr style="border: none; border-top: 1px solid #D0CCC6; margin: 0 0 24px 0;">

  <p style="font-size: 12px; color: #888; margin: 0; line-height: 1.6;">
    Delivered by <a href="https://24stories.co.za" style="color: #B8976A; text-decoration: none;">24 Stories</a> — preserving the stories that matter.
  </p>

</div>
```

## Subject line (set in the Subject field, not in HTML)

`Week [WEEK_NUMBER] — [STORYTELLER_FIRST_NAME]'s story`
