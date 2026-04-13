---
name: Pending Make/Airtable Updates
description: Two unfinished items in the 52 Stories Story Submission Make scenario
type: project
---

Two items left incomplete in the **Story Submission Make scenario** (the second scenario, not the Signup one):

1. **Story Text field** — currently mapped to raw `storyText` from webhook. Needs to be updated to use Claude's cleaned output from the HTTP module (the cleaned text comes back in the HTTP response as `content[0].text` from the Claude API response).

2. **Subscriber linked record** — the Subscriber field in the Stories Airtable table is a linked record field requiring an Airtable Record ID. Currently left empty. Need to look up the subscriber's Airtable Record ID using their `subscriberId` from the webhook, then pass that ID into the Subscriber field.

3. **Professional email address** — currently using personal Gmail for Make/story notifications. Must switch to `stories@52stories.co.za` (or similar) before going live with paying subscribers. Requires setting up Google Workspace (~R80/month) or email hosting via GoDaddy/Xneelo for the 52stories.co.za domain, then reconnecting the Gmail module in Make.

4. **52 Stories branding** — company not yet fully branded. Family notification emails currently use placeholder branding. Before going live, update the family email template in Make with final logo, brand colours, and sign-off once branding is complete.

**Why:** These were skipped to keep momentum — the basic flow needed to be tested end-to-end first.

**How to apply:** Raise these at the start of the next Make/Airtable session. Items 3 (professional email) and 4 (branding) are hard requirements before going live.
