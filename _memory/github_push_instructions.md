---
name: GitHub — Push 24 Stories Website to GitHub
description: Step-by-step instructions for pushing the 24stories-website folder to a GitHub repo for safe version control. Load when user says "push to GitHub" or "save to GitHub".
type: reference
originSessionId: c6f5fe16-ba20-4eaf-ad01-d3e870d44c12
---
# GitHub Push Instructions — 24 Stories Website

**Goal:** Push `/Users/tamararothbart/24stories-website/` to a GitHub repository so the master-architecture.html and all project files are version-controlled and never lost between sessions.

---

## One-time setup (only if repo doesn't exist yet)

### Step 1 — Create the repo on GitHub
1. Go to github.com and sign in
2. Click the **+** icon (top right) → **New repository**
3. Name it: `24stories-website`
4. Set to **Private** (keeps client files safe)
5. Do NOT tick "Add a README" — leave it empty
6. Click **Create repository**
7. Copy the repo URL shown (format: `https://github.com/[yourusername]/24stories-website.git`)

### Step 2 — Open Terminal on your Mac
Press **Cmd + Space**, type **Terminal**, press Enter.

### Step 3 — Navigate to the project folder
```
cd /Users/tamararothbart/24stories-website
```

### Step 4 — Initialise git and push
Run these commands one at a time (press Enter after each):
```
git init
git add .
git commit -m "24 Stories v3.1 — master architecture + all files"
git branch -M main
git remote add origin https://github.com/[yourusername]/24stories-website.git
git push -u origin main
```
Replace `[yourusername]` with your actual GitHub username.

GitHub will ask for your username and password. For the password, use a **Personal Access Token** (not your GitHub login password):
- Go to github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Click **Generate new token (classic)**
- Tick: `repo` (full control)
- Copy the token — paste it as your password in Terminal

---

## After the first push — how to update going forward

Each time you want to save new changes, run these three commands from Terminal:
```
cd /Users/tamararothbart/24stories-website
git add .
git commit -m "Brief description of what changed"
git push
```

---

## What gets saved to GitHub

Everything in `/Users/tamararothbart/24stories-website/`:
- `index.html` — main website
- `tell.html` — story submission page
- `library.html` — story library
- `master-architecture.html` — full v3.1 architecture document
- `24stories-emails/` — all 16 email HTML files
- Any other files in that folder

---

## What does NOT get saved (and why that's fine)

The memory files (in `~/.claude/`) are not in the website folder — they stay on your Mac only. That's correct. GitHub stores the build output (the website files). Claude's memory stores the decisions and context.

---

## Tip — view your files on GitHub

After pushing, go to:
`https://github.com/[yourusername]/24stories-website`

Click any file to read it in the browser. The master-architecture.html will render as raw HTML — to see it properly, use GitHub Pages (optional, ask Claude to set up if wanted).
