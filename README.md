# CmdBrutData

Static data + optional static website for **CmdBrutPS**.

**GitHub About (paste-ready):** Portable TLDR markdown pages + search index (and optional neo‑brutal browser UI) for CmdBrutPS; host on GitHub Pages, Netlify, or Vercel.

---

## What this is

CmdBrutData is the **distribution repo** for larger, portable assets:

- **Portable data**: `index.json` + `pages/**` (no absolute paths)
- **Optional UI**: a tiny static browser to search + open the markdown
- **Host anywhere**: GitHub Pages / Netlify / Vercel

CmdBrutPS stays lean and installs/updates data separately. CmdBrutData can ship bigger assets.

---

## Folder structure

```text
CmdBrutData/
  site/
    index.html
    app.js
    app.css
    assets/
      marked.min.js       # optional (placeholder included)
    pages/                # generated (portable)
    index.json            # generated (portable)
  tools/
    build-site.ps1
  .github/workflows/
    pages.yml
  netlify.toml            # optional
  .gitignore
  README.md
```

---

## Build

### Option A: build from the TLDR zip

```powershell
pwsh .\tools\build-site.ps1 -Input .\vendor\tldr\tldr.zip
```

### Option B: build from a local `tldr` checkout

```powershell
pwsh .\tools\build-site.ps1 -Input C:\path\to\tldr -AutoFindPages
```

---

## Local preview

```bash
python -m http.server 8080 -d site
# open http://localhost:8080
```

---

## Deploy

### GitHub Pages
Typical flow:
- Build produces output into `site/`
- Pages workflow publishes `site/` as the web root

Once deployed, your hosted paths usually look like:

- `https://<user>.github.io/<repo>/` (UI)
- `https://<user>.github.io/<repo>/index.json` (search index)
- `https://<user>.github.io/<repo>/pages/<some-page>.md` (markdown pages)

### Netlify (optional)
If you have `netlify.toml`, set the publish directory to `site/`.

---

## Notes / ideas

- If you prefer **release assets** instead of committing generated pages, you can build in CI and attach `site.zip` to a GitHub Release.
- CmdBrutPS can later add a `-DataUri` option to download the latest dataset from a release or hosted URL.
