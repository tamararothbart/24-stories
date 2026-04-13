---
name: Monthly Platform Costs — 24 Stories
description: All platform subscriptions, costs in USD and ZAR, upgrade thresholds, and renewal dates
type: project
---

## Important Notes
- Always quote costs in both USD and approximate ZAR
- Exchange rate fluctuates — check current rate at xe.com before quoting
- Approximate rate at time of writing (March 2026): R18.50 to $1 USD
- Renewal dates to be added when user researches billing dashboards

## Fixed Monthly Costs (at launch)

| Service | Plan | USD/month | ~ZAR/month | Renewal Date |
|---------|------|-----------|------------|--------------|
| Netlify | Pro | $19 | ~R352 | TBC |
| Make | Core | $10 | ~R185 | TBC |
| Airtable | Team | $20 | ~R370 | TBC |
| Claude Code | Pro | ~$22 | ~R407 | TBC |
| Mailjet | Essential | $15 | ~R278 | TBC |
| Cloudinary | Free | $0 | R0 | n/a |
| **Total** | | **~$86** | **~R1,592** | |

## Variable Costs (pay as you go)

| Service | What it charges for | Rate | Estimated cost |
|---------|-------------------|------|----------------|
| OpenAI API | Whisper audio transcription | $0.006/min of audio | ~$0.72/subscriber over 6 months |
| Anthropic API | Claude Haiku story cleanup | ~$0.001/story | Negligible |

## Upgrade Thresholds

| Service | Free tier limit | Upgrade trigger | Next plan cost |
|---------|----------------|-----------------|----------------|
| Mailjet | 6,000 emails/month, 200/day | **Upgrade BEFORE first beta subscriber** — 20 simultaneous story submissions hits daily cap | Essential $15/month (~R278) |
| Cloudinary | 25GB storage + bandwidth | ~1,000 subscribers | Move to **Supabase** (not Cloudinary paid plan — too expensive at $89/month) |
| Make Core | 10,000 operations/month | When operations exceed limit | Higher tier ~$20/month |

## Key Notes
- **Mailjet Essential must be activated before launch** — free tier daily limit too low for even small beta
- **Cloudinary stays free for at least the first year** — do not budget for upgrade pre-launch
- At 1,000+ subscribers, consider migrating file storage from Cloudinary to **Supabase** (cheaper at scale)
- All costs in USD — converted to ZAR at prevailing rate (check xe.com)
