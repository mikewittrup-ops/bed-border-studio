BED & BORDER STUDIO — how to put this app online
==================================================

You have two ways to get a live, clickable web link. Start with Option A
to see it working in 2 minutes. Use Option B when you want a permanent,
updatable home for it (this is the one to build your business on).

WHAT'S IN THIS FOLDER
  index.html, package.json, vite.config.js, src/   <- the source code
  dist/                                            <- a ready-made built version
  README.txt                                       <- this file


--------------------------------------------------------------------
OPTION A — SEE IT LIVE RIGHT NOW  (2 minutes, no account, no install)
--------------------------------------------------------------------
1. Open your web browser and go to:  https://app.netlify.com/drop
2. Drag the "dist" folder (the whole folder) onto that page.
3. Wait a few seconds. Netlify gives you a live web link. Click it.
   Your app is now online and works on phone or computer.

  (This is a snapshot for showing people. To make changes later and keep
   one permanent address, use Option B.)


--------------------------------------------------------------------
OPTION B — PERMANENT HOME  (~15 minutes, all in the browser, no install)
--------------------------------------------------------------------
PART 1 — Put the code on GitHub
1. Go to github.com and make a free account (skip if you have one).
2. Click the "+" at the top-right, choose "New repository".
3. Name it: bed-border-studio  -> click "Create repository".
4. On the new page, click the link "uploading an existing file".
5. Drag in ALL of these from this folder: index.html, package.json,
   vite.config.js, .gitignore, AND the "src" folder.
   (You do NOT need to upload the "dist" folder.)
6. Click "Commit changes". Your code is now saved on GitHub.

PART 2 — Put it online with Vercel
7. Go to vercel.com -> "Sign Up" -> "Continue with GitHub".
8. Click "Add New..." -> "Project".
9. Find "bed-border-studio" in the list -> click "Import".
10. Don't change any settings. Click "Deploy".
11. Wait about a minute. You get a permanent link like
    bed-border-studio.vercel.app  — that's your live app.

TO UPDATE IT LATER
  Replace the file on GitHub with a new version, click "Commit changes",
  and Vercel automatically rebuilds your live site in about a minute.
  No installing anything, ever.

BONUS: once it's on GitHub, you can also open it in a live editor instantly at
  stackblitz.com/github/YOUR-USERNAME/bed-border-studio


--------------------------------------------------------------------
ONE NOTE FOR LATER (not needed now)
--------------------------------------------------------------------
This setup styles the app using "Tailwind via CDN", which is perfect for
getting online and demoing. Before you charge customers, a developer should
switch it to a compiled Tailwind build (a 15-minute job) to remove a small
console warning and make it load a touch faster. It does not affect how the
app looks or works.
