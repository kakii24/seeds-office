# Seeds Office — Bureau de Distribution des Semences Subventionnées

A full-stack **Electron** desktop application that digitizes the official Algerian
agricultural office workflow for **subsidized seeds and crops distribution**.
It manages farmer registration, crop/seed requests, and delivery tracking inside a
**single application window**, using a **top nav bar** to switch between two views.

- **Enregistrement (Fenêtre 1):** farmer registration + printable A4 subsidy request form.
- **Suivi de Distribution (Fenêtre 2):** delivery tracking, invoicing, live stats, filtering, and Excel export.

The interface is **LTR and French-primary**, with short **Arabic** supplementary hints
shown beside French labels (e.g. `Nom de famille (اللقب)`).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron (single `BrowserWindow`, one main process) |
| UI | React 18 + Vite (single-page app, nav-bar view switching) |
| Styling | Tailwind CSS v3 (no component libraries) |
| Database | better-sqlite3 (synchronous, in the main process) |
| Excel export | xlsx |
| Packaging | electron-builder (Windows NSIS installer) |
| Security | `contextIsolation: true`, `nodeIntegration: false`, IPC via `contextBridge` |

---

## Project structure

```
seeds-office/
├─ package.json            # deps, scripts, electron-builder config
├─ vite.config.mjs         # single renderer entry point
├─ tailwind.config.js      # custom palettes + Inter / Cairo / mono fonts
├─ postcss.config.js
└─ src/
   ├─ main/
   │  ├─ main.js           # Electron entry: creates the window, all IPC handlers, xlsx export
   │  ├─ preload.js        # contextBridge → exposes window.api to the renderer
   │  └─ database.js       # better-sqlite3 init, schema, all query functions
   └─ renderer/
      ├─ index.html        # single HTML entry
      ├─ app/              # shell → main.jsx, App.jsx (view switch), NavBar.jsx
      ├─ shared/           # CSS, constants, Toast system, UI primitives (Modal, Field…)
      ├─ window1/          # "Enregistrement" view → App.jsx + components/
      └─ window2/          # "Suivi de Distribution" view → App.jsx + components/
```

---

## Prerequisites

- **Node.js 18+** (Node 20 LTS recommended)
- **Windows** is required to produce the final `.exe` installer (native `better-sqlite3`
  bindings and the NSIS target are platform-specific). Development also works on macOS/Linux.
- Build toolchain for native modules:
  - **Windows:** install the *Visual Studio Build Tools* (C++ workload). Recent Node
    installers can set this up via the optional "Tools for Native Modules" checkbox.

---

## Install

```bash
npm install
```

`postinstall` runs `electron-builder install-app-deps`, which compiles `better-sqlite3`
against the bundled Electron runtime. If you ever switch Electron versions, run:

```bash
npm run rebuild
```

---

## Development

Starts the Vite dev server **and** Electron together (both windows open):

```bash
npm run dev
```

- Vite serves the app at `http://localhost:5173/`.
- Electron loads that URL in dev and the built `dist/renderer/index.html` in production.
- Edits to renderer code hot-reload. Edits to `src/main/*` require restarting `npm run dev`.

---

## Build the Windows installer

Because this app ships a **native module** (`better-sqlite3`), the Windows installer
must be packaged **on Windows** — cross-building from Linux/macOS would bundle the wrong
native binary. Two reliable options:

### Option A — on a Windows machine

```bash
npm run build
```

This bundles both renderers (`vite build` → `dist/renderer/`) and then runs
`electron-builder --win nsis`. The installer is written to `release/`:

```
release/Seeds Office Setup 1.0.0.exe
```

- `appId`: `com.agriculture.seeds`
- `productName`: `Seeds Office`
- NSIS: user can choose the install directory; desktop + start-menu shortcuts are created.

> **Optional app icon:** drop a `build/icon.ico` (256×256) to brand the installer and
> executable. The build works without it (electron-builder uses a default icon).

To verify just the front-end bundle without packaging:

```bash
npm run build:renderer
```

### Option B — in the cloud with GitHub Actions (no Windows PC needed)

The repo includes `.github/workflows/build-windows.yml`, which builds the installer on a
GitHub-hosted **Windows runner** and gives you the `.exe` to download.

1. Push this project to a GitHub repo. **Put the contents of `seeds-office/` at the repo
   root** so `.github/`, `package.json`, and `src/` sit at the top level.
2. Trigger a build either way:
   - **Manual:** repo → **Actions** tab → **Build Windows Installer** → **Run workflow**.
   - **Tagged release:** `git tag v1.0.0 && git push --tags` — this also attaches the
     `.exe` to a GitHub **Release**.
3. When the run finishes, download **`seeds-office-windows-installer`** from the run's
   **Artifacts** section. Inside is `Seeds Office Setup 1.0.0.exe`.

> The installer is **unsigned** (no code-signing certificate), so Windows SmartScreen may
> show a "Windows protected your PC" notice on first run — click **More info → Run anyway**.
> To remove that warning, sign the build with an EV/OV code-signing certificate.

---

## Data storage

The SQLite database is created automatically on first launch at:

```
<userData>/seeds_office.db
```

`userData` resolves via `app.getPath('userData')` — on Windows that is
`%APPDATA%\Seeds Office\`. WAL journaling and `PRAGMA foreign_keys = ON` are enabled.

### Schema

- `farmers` — identity record (name, NIN, address, commune/daïra/wilaya, phone…)
- `crop_requests` — one row per requested crop/seed, `FK → farmers (ON DELETE CASCADE)`
- `deliveries` — one row per delivery/invoice, `FK → crop_requests` and `farmers (ON DELETE CASCADE)`

Editing a farmer **diffs** their crop rows (update existing / insert new / delete only
the rows you removed) so that deliveries attached to unchanged crop rows are preserved.

---

## IPC API (`window.api`)

| Method | Returns |
|--------|---------|
| `saveFarmer({ farmer, crops })` | `{ success, farmerId }` |
| `getFarmers()` | `farmer[]` |
| `getFarmerDetail(id)` | `{ farmer, crops }` |
| `deleteFarmer(id)` | `{ success }` |
| `getCropRequestsForFarmer(farmerId)` | `cropRequest[]` |
| `getDeliveries(farmerId?)` | `delivery[]` (joined with farmer + crop data) |
| `saveDelivery(delivery)` | `{ success }` |
| `deleteDelivery(id)` | `{ success }` |
| `exportDeliveriesXlsx(farmerId?)` | `{ success }` (native save dialog) |
| `printWindow()` | triggers `webContents.print()` |
| `onDataChanged(cb)` | subscribe to cross-window refresh; returns an unsubscribe fn |

---

## Notes

- **Fonts:** Inter / Cairo / JetBrains Mono load from Google Fonts via `<link>`. On a
  machine with no internet the UI gracefully falls back to system fonts. To make the app
  fully offline, download the font files and self-host them in `src/renderer/shared/`.
- **Printing (works on any PC/printer):** printing is triggered with the renderer's
  `window.print()`, which opens the OS print dialog so the user can choose any installed
  printer (including "Save as PDF"). A robust `@media print` stylesheet isolates the
  `.printable` document, pulls it to the page top-left, and prevents any overlay or scroll
  container from clipping it. Window 2's wide table auto-shrinks to fit the page.
- **Languages:** the layout is LTR everywhere; Arabic appears only as small muted hints
  beside the French primary labels, exactly as specified.
