# Lean Metrics

A calorie/macro calculator, food log, and progress tracker — built to work equally well as a phone app and a desktop dashboard, in any modern browser.

**Live app:** https://anilmadha.github.io/lean-metrics/

## Two ways to use it

**Live link (recommended)** — open the link above on your phone or your computer; there's nothing to install. It automatically switches between a phone layout (bottom tab bar, single column) and a desktop layout (sidebar nav, card dashboard) based on how wide the window is.

**Local file** — `index.html` in this folder is the same app as a plain file, for self-hosting or keeping an offline copy. Double-click it, or serve it from any static web host. On an iPhone, opening it in Safari and choosing Share → "Add to Home Screen" gives it a full-screen icon too.

## What's different from the first version

- **Responsive layout** — under about 900px wide it's the original phone-style single column with a bottom tab bar; above that it switches to a left sidebar and a two-column card dashboard, so it's genuinely usable on a laptop or monitor, not just a phone screen stretched wide.
- - **No native app / App Store work** — that direction is on hold. `App-Store-Guide.md` is kept in the folder in case you want to revisit it later, but it's not the plan right now.
  - - **No Apple Health / Fitness connection** — browsers can't talk to Apple Health directly (only a native app can), and you'd rather not deal with a Google Sheet or file-import step, so that idea was dropped. Weight, food, and measurements stay manual, same as before.
   
    - ## Your data
   
    - Everything — your profile, targets, food log, weight and measurement history — is stored only in your browser's local storage. Nothing is sent to a server, and nothing is shared between devices or browsers automatically: your phone and your computer each keep their own copy, since they're different browsers.
   
    - If you want to move your data between devices, or just keep a backup, use **Setup → Your data → Export backup** to get a JSON file, and **Import backup** on the other device to load it back in. On the live link, that export goes through a small "save this file?" confirmation (the hosted page can't silently trigger a download); on the local file, it downloads normally.
   
    - ## Files in this folder
   
    - - `index.html` — the app (self-contained, no build step)
      - - `manifest.webmanifest`, `icon-*.png` — used only by the local-file/PWA path (Add to Home Screen); not used by the live link
        - - `App-Store-Guide.md` — optional, for later, if you ever want a real installable iOS app
          - 
