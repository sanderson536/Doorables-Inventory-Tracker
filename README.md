# Steve's Doorable Inventory Tracker

Version: `1.0.0-stage9`

Steve's Doorable Inventory Tracker is a local-first, mobile-first Progressive Web App for Disney Doorables sales inventory maintenance. It is built for fast visual recognition, quantity and price updates, catalog navigation, search/filtering, Data Pack and CSV imports, CSV export, backup/restore, bulk maintenance, and Quick Stock / Show Mode.

The app is local only. It does not use accounts, authentication, cloud sync, backend services, or external inventory APIs. IndexedDB is the source of truth.

## Technology

- React
- TypeScript
- Vite
- React Router
- IndexedDB
- Local Blob storage for figure images
- Static PWA/service worker support
- Native project CSS with CSS variables for theming

## Development

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Production preview:

```powershell
npm.cmd run build
npm.cmd run preview
```

Android local-network testing:

```powershell
npm.cmd run dev -- --host 0.0.0.0
```

Then open the LAN URL from the Android phone, for example `http://192.168.x.x:5173/`.

## IndexedDB Architecture

Database name: `steves-doorable-inventory-tracker`

Schema version: `1`

Stores: `categories`, `collections`, `franchises`, `rarityDefinitions`, `figures`, `inventory`, `images`, `appSettings`.

The catalog and inventory are intentionally separate:

- `Figure` stores catalog/reference fields.
- `Inventory` stores sales fields: `quantity`, `priceCents`, `notes`, `updatedAt`.

Inventory uniqueness is structurally enforced because the `inventory` object store uses `figureId` as its key path and also has a unique `figureId` index. This preserves the invariant `one figureId -> at most one Inventory record`.

## Stage 8 Polish

Stage 8 focuses on production polish and real-data readiness:

- optional dark theme with emerald-green action highlights
- first-run and empty-state guidance toward import, Add Figure, Manage, or Restore
- Manage demo-data transition notice when known Stage 1 demo figure IDs are present
- CSV workflow helpers: empty template, example template, copy headers, column guide, and import notes
- Add Figure and Full Details helper for using Character as Variant Name
- clearer local-data and backup guidance in Settings
- last full backup reminder stored as an app setting after successful backup creation
- release-candidate readiness documentation

Light theme remains the default. Dark theme is stored in `appSettings` as `appearance.theme`; invalid values fall back to light. Theme settings are included in full backup/restore because app settings are backed up.

## Stage 9 Data Packs

Stage 9 adds Doorables Data Pack support: an app-native JSON checklist/catalog import workflow for structured collection data. Data Packs are different from CSV files:

- CSV is the flexible spreadsheet workflow for custom imports and updates.
- Data Packs are versioned JSON checklist packs intended for verified catalog/reference data.

The app does not include official complete Doorables checklists, does not scrape websites, does not download images, and does not bundle copyrighted artwork. The included example pack uses fake sample figures only.

Data Pack imports preserve existing user inventory values. When a pack matches an existing figure by collection plus normalized Variant Name, it may update catalog fields such as Character, Variant Name casing, Franchise, Rarity, and Display Order, but it preserves:

- `Inventory.quantity`
- `Inventory.priceCents`
- `Inventory.notes`
- `Figure.imageId`

New figures receive an Inventory row with `quantity` from the pack when provided, otherwise `0`; `priceCents` from `defaultPrice` when provided, otherwise `null`; and notes from pack figure notes when provided.

Installed Data Pack metadata is stored in `appSettings` at `dataPacks.installed`, so it is included in Full Backup/Restore without adding a new IndexedDB store.

### Data Pack JSON Format

Supported format:

```json
{
  "packFormat": "steves-doorable-data-pack",
  "packVersion": 1,
  "packId": "example-series-5-v1",
  "name": "Example Doorables Series 5",
  "description": "Example data pack for testing.",
  "source": "User-created",
  "createdAt": "2026-08-03T00:00:00.000Z",
  "collections": [
    {
      "category": "Main Series",
      "collection": "Series 5",
      "collectionShortName": "S5",
      "displayOrder": 5,
      "figures": [
        {
          "character": "Sample Bear",
          "variantName": "Sample Bear Green Vest",
          "franchise": "Sample Friends",
          "rarity": "Common",
          "displayOrder": 1,
          "defaultPrice": "3.00",
          "quantity": 1,
          "notes": "Optional note for new records."
        }
      ]
    }
  ]
}
```

Required top-level fields: `packFormat`, `packVersion`, `packId`, `name`, `collections`.

Optional top-level fields: `description`, `source`, `createdAt`, `updatedAt`, `author`, `notes`.

Required collection fields: `category`, `collection`, `figures`.

Optional collection fields: `collectionShortName`, `displayOrder`, `notes`.

Required figure fields: `character`, `variantName`, `franchise`, `rarity`, `displayOrder`.

Optional figure fields: `defaultPrice`, `quantity`, `notes`.

Image fields are ignored with warnings. Rarity names must already exist in Manage; unknown rarities block import so rarity colors and ordering stay intentional.

### Data Pack Import Workflow

Manage -> Doorables Data Packs provides:

- Choose JSON Data Pack
- Download Blank Pack Template
- Download Example Pack
- preview counts for new categories, collections, franchises, figures, existing updates, no-op figures, warnings, and errors
- blocking validation for malformed JSON, wrong format, unsupported version, missing fields, unknown rarity, invalid price/quantity/display order, and duplicate figures inside the pack
- all-or-nothing transactional commit across catalog, inventory, and app settings
- Installed Data Packs list

Duplicate figure detection uses the same business rule as CSV: same target collection plus normalized Variant Name. Duplicate display orders are allowed but warned; deterministic fallback sorting still applies.

## CSV Workflow

Canonical import headers:

```csv
Character,Variant Name,Franchise,Category,Collection,Collection Short Name,Rarity,Display Order,Quantity,Price,Notes
```

Manage and Import both provide:

- Download Empty Template
- Download Example Template
- Copy CSV Headers
- a column guide explaining each field

Clipboard use is feature-detected. If Clipboard API is unavailable over local HTTP or Android local-network testing, the app shows the headers in a selectable text area.

CSV import still validates and previews before committing. The preview does not mutate IndexedDB. Unknown rarities are rejected unless they already exist. Existing figures are matched by collection plus normalized Variant Name and updated instead of duplicated.

## Real-Data Setup Guide

Recommended first real-data setup:

1. Create a Full Backup.
2. Remove Demo Sample Figures.
3. Import a Doorables Data Pack if verified checklist JSON is available.
4. Otherwise download the CSV template and build the first real collection CSV.
5. Import the Data Pack or CSV.
6. Run Data Health Check.
7. Create another Full Backup.
8. Test Inventory, Search, Bulk Edit, and Show Mode on Android.

This is guidance only, not a forced workflow.

## Existing Features

Implemented through Stages 1-9:

- Inventory page with category/collection navigation
- visual Grid and compact List views
- Hide Out of Stock
- collection summaries
- Quick Edit for quantity and price
- Full Details editor
- local image upload/change/removal with resizing safeguards
- Search page with text search, filters, sorting, and URL-backed search state
- Manage page for categories, collections, franchises, rarities, Add Figure, CSV import/export, and demo data removal
- Doorables Data Pack import with installed pack tracking
- Full Backup and Restore
- Data Health Check
- Orphan image cleanup
- Reset All Quantities to Zero
- Android/local-HTTP safe ID generation fallback
- Inventory and Search bulk selection/editing in List view
- Quick Stock / Show Mode with Sell/Restock, temporary session summary, and Undo Last

## Backup and Data Safety

Full Backup creates a JSON file containing catalog, inventory, images, and app settings. Settings records "Last backup created on this device" after backup creation succeeds. That reminder does not guarantee the downloaded file was kept; it only records that creation completed on this browser/device.

Create backups before major imports, bulk changes, demo cleanup, device changes, or browser data cleanup.

## PWA / Offline

The service worker caches the app shell and built static assets. After first load/cache, the app can run offline from production preview or an installed PWA context. IndexedDB remains the local data source.

Offline-supported behavior includes Inventory, Search, Manage, Add Figure, Data Pack template download/import where browser file APIs permit, CSV template download/import/export where browser file APIs permit, backup/restore, Bulk Edit, Show Mode, theme switching, and locally stored image viewing.

## Release Candidate Readiness

Build and preview:

```powershell
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

Suggested smoke test:

- Inventory Grid/List loads with no console errors.
- Category and collection switching work.
- Quick Edit quantity and price save.
- Full Details save, image change, and image removal work.
- Search query, filters, sorting, and URL-backed state work.
- Bulk Edit applies a small safe change.
- Show Mode Sell/Restock and Undo Last work.
- Manage Add Figure works.
- Doorables Data Pack example download, preview, import commit, and installed metadata work.
- CSV template download, CSV import preview, import commit, and export work.
- Full Backup, Restore preview, Data Health Check, orphan cleanup preview, and reset preview work.
- Dark theme turns on, refreshes, and persists.
- No horizontal overflow at approximately 390px.
- Production offline refresh still renders Inventory and Search.

Manual Android checklist:

- Turn dark theme on/off.
- Refresh and confirm theme persists.
- Check Inventory Grid/List in dark theme.
- Check Search, Manage, Settings, Bulk Edit, and Show Mode in dark theme.
- Run a quick Sell/Restock action in Show Mode.
- Open CSV import help/template actions.
- Open Doorables Data Packs, download the example pack, preview it, and import it.
- Confirm imported sample figures appear in Inventory/Search/Show Mode.
- Check an empty collection or post-demo-cleanup empty state.
- Create a Full Backup and confirm the last-backup reminder updates.

## Android / Local HTTP Notes

Direct `crypto.randomUUID()` calls remain centralized behind `src/utils/id.ts`. Stage 9 does not add direct UUID calls outside that utility.

The app remains designed for local testing over `http://127.0.0.1` and local-network development URLs. Clipboard and crypto-dependent behavior use support checks and fallbacks where needed.

## Current Non-Goals

Stage 9 does not implement:

- release ZIP
- official complete Doorables checklist bundles
- Data Pack marketplace or cloud library
- pack uninstall/delete
- image packs or automatic image downloading
- permanent sale history
- show revenue/profit tracking
- barcode scanning
- cloud sync or multi-device sync
- accounts/authentication
- web image search or scraping
- advanced image editing
- bulk delete
- custom theme builder
- Stage 10 functionality

## Known Advisory

`npm audit --omit=dev` has previously reported React Router advisory `GHSA-qwww-vcr4-c8h2` with no fix available. This app is client-only and does not use React Router RSC/action server behavior.
