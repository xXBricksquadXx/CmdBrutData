# CmdBrutData

Static data + optional static website for **CmdBrutPS**.

This repo is “distro-first”:

- **Portable data**: `site/index.json` + `site/pages/**` (no absolute paths)
- **Optional UI**: a tiny static browser to search + open the markdown
- **Host anywhere**: GitHub Pages / Netlify / Vercel

> CmdBrutPS stays lean and installs/updates data separately. CmdBrutData can ship bigger assets.

## Folder structure

```
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

## Build

### Option A: build from the TLDR zip

```powershell
pwsh .\tools\build-site.ps1 -Input .\vendor\tldr\tldr.zip
```

### Option B: build from a local `tldr` checkout

```powershell
pwsh .\tools\build-site.ps1 -Input C:\path\to\tldr -AutoFindPages
```

## Local preview

```powershell
python -m http.server 8080 -d site
# open http://localhost:8080
```

## Deploy

- GitHub Pages: commit `site/` and push to `main` (workflow included).
- Netlify: `netlify.toml` publishes `site/`.

## Notes

- If you later prefer **release assets** instead of committing pages, you can build in CI and attach `site.zip` to a GitHub Release. CmdBrutPS can later download via a `-DataUri` option.
