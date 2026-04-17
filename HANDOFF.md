# 24 Stories — Session Handoff File
**Updated:** 2026-04-17 | **Read this at the start of every session.**

---

## HOW TO USE THIS FILE
Paste this at the start of every new Claude session:
> "Read HANDOFF.md and continue."
Claude will read this file and pick up exactly where we left off.

---

## DEPLOY COMMAND (use at end of every session)
```
netlify deploy --prod --dir /Users/tamararothbart/24stories-website && cd /Users/tamararothbart/24stories-website && git add -A && git commit -m "session update" && git push origin main
```

---

## TWO SEPARATE PROJECTS — DO NOT CONFUSE THEM

### Project A: 24 Stories (Book Experience)
- Subscription memory legacy product — R6,795 once-off
- Website: 24stories.co.za
- Make.com automation (BEING CANCELLED — replace with custom build)
- Full spec in memory files (see MEMORY.md)

### Project B: 24 Stories Live Events
- Moth-style live storytelling events in Cape Town CBD / Atlantic Seaboard
- Separate campaign — being built NOW
- Goals: 20 storyteller applications + 60 audience signups for first event
- Theme: "The Moment Everything Changed"
- Date/venue: Cape Town, before end July 2026 — TBC

---

## WHAT WAS BUILT THIS SESSION (2026-04-17)

### Files created/updated:
- `events.html` — live events page, fully deployed at 24stories.co.za/events.html
- `social-launch-pack.html` — all social media posts, captions, hashtags, DM scripts, email templates, Canva specs
- `thank-you.html` — form submission confirmation page
- `index.html` — "Live Events" added to navbar

### Forms live on Netlify (all sending to hello@24stories.co.za):
- `storyteller-application` — story submission form
- `event-alerts` — first event signup
- `mailing-list` — ongoing events mailing list

### GitHub: all pushed to github.com/tamararothbart/24-stories (main branch)

---

## NEXT SESSION — START HERE

### Immediate tasks (in order):

**1. Set up Buffer account**
- Go to buffer.com → create free account
- Connect: Instagram (new 24 Stories account), Facebook (personal), LinkedIn (personal), TikTok (new 24 Stories account)
- Buffer free plan: 3 channels, 10 posts per channel
- NOTE: May need to upgrade to Buffer Essentials (~$6/month) for 4 channels

**2. Set up Instagram account for 24 Stories**
- Username: @24stories.co.za or @24storiescapetown
- Business/Creator account (required for later API access)
- Bio: "Live storytelling events · Cape Town · 24stories.co.za/events"
- Link in bio: https://24stories.co.za/events.html

**3. Set up TikTok account for 24 Stories**
- Username: @24stories or @24storiescapetown
- NOTE: TikTok needs VIDEO content — discuss with Tamara whether she will film short clips

**4. Build the marketing_agent**
Claude builds a Node.js agent that:
- Reads social-launch-pack.html
- Uses Claude API to generate post variations
- Populates Airtable content calendar (28-day campaign)
- User copies from Airtable into Buffer each morning

**5. Airtable content calendar table**
New table: "Campaign" with fields:
- Date (date)
- Day (number)
- Platform (single select: Instagram / Facebook / LinkedIn / TikTok / WhatsApp / Email)
- Phase (single select: Awareness / Recruit / Launch / Scarcity)
- Caption (long text)
- Hashtags (long text)
- Visual (single select: Dark-1 / Cream-2 / Dark-3 / Cream-4 / Dark-5 / Cream-6)
- Status (single select: Draft / Approved / Scheduled / Posted)
- Notes (long text)

---

## CREDENTIALS NEEDED (Tamara to provide at session start)
- Anthropic API key: ✓ (confirmed exists)
- Airtable API key: ✓ (confirmed exists — same base as 24 Stories)
- Airtable Base ID: confirm it's still "52stories" base
- Buffer API key: NOT YET — set up Buffer first
- Instagram account: NOT YET — set up this session
- TikTok account: NOT YET — set up this session

---

## PLATFORM ACCOUNTS STATUS
| Platform | Account | Status |
|---|---|---|
| Instagram | @24stories (TBC) | NOT SET UP |
| Facebook | Tamara personal | READY |
| LinkedIn | Tamara personal | READY |
| TikTok | @24stories (TBC) | NOT SET UP |
| Buffer | — | NOT SET UP |

---

## MARKETING AGENT SPEC (marketing_agent)

### What it does:
1. Reads social-launch-pack.html — extracts all post content
2. Calls Claude API — generates 3 caption variations per post
3. Writes to Airtable Campaign table — one row per platform per day
4. Tamara reviews in Airtable, marks Approved
5. Tamara copies approved posts into Buffer for scheduling

### Tech stack:
- Node.js (already installed v25.9.0)
- @anthropic-ai/sdk (Claude API)
- Airtable API
- Buffer API (for future direct scheduling)
- Runs from Terminal: `node marketing_agent.js`

### Files to create:
- `/Users/tamararothbart/24stories-website/marketing_agent/marketing_agent.js`
- `/Users/tamararothbart/24stories-website/marketing_agent/.env` (API keys)
- `/Users/tamararothbart/24stories-website/marketing_agent/package.json`

---

## MAKE.COM STATUS
- User is CANCELLING Make subscription
- Reason: repeated build failures, unreliable across sessions
- Replacement: custom Node.js scripts + Buffer + Airtable
- 24 Stories Book Experience automation: to be rebuilt by human developer or alternative platform
- DO NOT build any new Make scenarios

---

## 28-DAY CAMPAIGN SCHEDULE (from social-launch-pack.html)
| Phase | Days | Posts | Goal |
|---|---|---|---|
| Awareness | 1–4 | Posts 1–2 | Seed idea, no event details |
| Recruit | 5–7 | Posts 3–4 | Draw out storytellers |
| Launch | 8–14 | Post 5 | Open seats, drive registrations |
| Scarcity | Final week | Post 6 | Urgency, close registrations |

---

## CAMPAIGN GOALS
- 20 storyteller applications (via events.html form)
- 60 audience signups (via events.html mailing list + event-alerts forms)
- First event: Cape Town, before end July 2026

---

## BRAND RULES (NEVER BREAK THESE)
- Fonts: Cormorant Garamond, Playfair Display, Inter
- Colors: charcoal #1A1A1A, gold #B8976A, cream #F7F5F2
- Tone: human, reflective, emotionally intelligent, minimal
- No emojis. No salesy language. No generic marketing clichés.
- South African English. Prices in Rand.
- Sign-off: "With warmth, The 24 Stories Team"

---

## KEY CONTACTS / CREDENTIALS
- WhatsApp (Tamara personal): +27 79 509 0667
- Email (manual): hello@24stories.co.za
- Email (automated): stories@24stories.co.za
- Website: 24stories.co.za (Netlify: resilient-eclair-c46b34)
- GitHub: github.com/tamararothbart/24-stories
- Airtable base: "52stories" (old name, correct base)

---

## IMPORTANT RULES FOR CLAUDE
1. One instruction at a time — wait for confirmation before next step
2. Never add Make scenarios — Make is cancelled
3. Never downgrade cleanup.js from claude-sonnet-4-6 to Haiku
4. Never add fields to Airtable without explicit instruction
5. Always deploy + push to GitHub at end of session
6. Read this file before doing anything else in a new session
