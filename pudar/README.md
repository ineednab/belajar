# Pudar

*Write. Feel. Let it fade.*

A private, time-fading journal for iOS. The product spec, including every locked decision, is in [`docs/PRD.md`](docs/PRD.md). Read it before changing behavior.

**Status:** Epic 1 (Foundation). Three placeholder tabs, encrypted SQLite with schema v1, date utilities, design tokens.

## Run it on your Mac

You need:
- **Node.js** 22 LTS (20.19+ also works)
- **Xcode** from the App Store, opened once to install components
- An iOS Simulator (Xcode → Settings → Components)

```bash
git clone https://github.com/ineednab/belajar.git
cd belajar/pudar
npm install
npm run ios        # builds a development build and opens the simulator
```

The first build takes several minutes, because it compiles SQLCipher and the native modules. Later runs are fast.

> Pudar uses a **development build**, not Expo Go. Expo Go can't include SQLCipher, so the journal would be unencrypted there.

## Checks

```bash
npm run check      # everything below, same as CI
npm run typecheck
npm run lint
npm test           # unit + database tests (in-memory SQLite)
npm run test:tz    # date tests in 6 timezones
```

## Verify encryption (Epic 1 checklist)

These steps need a real iOS build, so they can't run in CI.

1. `npm run ios`, then open the **Settings** tab.
2. **Storage diagnostics (dev)** should show:
   - Encryption: `SQLCipher 4.x …`
   - Foreign keys: `on`
   - Secure delete: `on`
   - Journal mode: `wal`
   - Schema version: `v1`
3. Check the file on disk isn't readable:
   ```bash
   DB=$(find ~/Library/Developer/CoreSimulator/Devices -name pudar.db -path '*SQLite*' 2>/dev/null | head -1)
   echo "$DB"
   strings "$DB" | grep -i "create table"   # should print nothing
   ```
   An unencrypted SQLite file would show its `CREATE TABLE` statements here.

If all three pass, tick the matching boxes in `docs/PRD.md` §10 Epic 1.

## Project layout

See [`docs/PRD.md` §9.5](docs/PRD.md). In short: routes in `src/app/`, pure logic in `src/lib/`, database code in `src/db/`, design tokens in `src/theme/`.
