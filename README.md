# Seeds Office — Bureau de Distribution des Semences Subventionnées

A full-stack **Electron** desktop application that digitizes the official Algerian
agricultural office workflow for **subsidized seeds and crops distribution**.
It manages farmer registration, crop/seed requests, and delivery tracking across
**two separate Electron windows**.

- **Window 1 — Enregistrement:** farmer registration + printable A4 subsidy request form.
- **Window 2 — Livraison:** delivery tracking, invoicing, live stats, filtering, and Excel export.

The interface is **LTR and French-primary**, with short **Arabic** supplementary hints
shown beside French labels (e.g. `Nom de famille (اللقب)`).

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron (two `BrowserWindow`s, one main process) |
| UI | React 18 + Vite (one dev server, two HTML entry points) |
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
├─ vite.config.mjs         # two renderer entry points (window1, window2)
├─ tailwind.config.js      # custom palettes + Inter / Cairo / mono fonts
├─ postcss.config.js
└─ src/
   ├─ main/
   │  ├─ main.js           # Electron entry: creates both windows, all IPC handlers, xlsx export, print
   │  ├─ preload.js        # contextBridge → exposes window.api to renderers
   │  └─ database.js       # better-sqlite3 init, schema, all query functions
   └─ renderer/
      ├─ shared/           # CSS, constants, Toast system, UI primitives (Modal, Field…)
      ├─ window1/          # Farmer registration + print form
      │  ├─ index.html  main.jsx  App.jsx  components/
      └─ window2/          # Distribution tracking + invoicing
         ├─ index.html  main.jsx  App.jsx  components/
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

- Vite serves `http://localhost:5173/window1/index.html` and `.../window2/index.html`.
- Electron loads those URLs in dev and the built files in production.
- Edits to renderer code hot-reload. Edits to `src/main/*` require restarting `npm run dev`.

---

## Build the Windows installer

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
- **Printing:** the print stylesheet isolates the official document (`.printable`) so only
  the form/table is sent to the printer; all app chrome is hidden.
- **Languages:** the layout is LTR everywhere; Arabic appears only as small muted hints
  beside the French primary labels, exactly as specified.
