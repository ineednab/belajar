# Pudar — Product Requirements Document

**Version:** 1.3
**Status:** Source of truth for MVP development
**Platform:** iOS first (Expo + React Native + TypeScript)
**Category:** Personal journaling / emotional wellness
**Tagline:** Write. Feel. Let it fade.

> If code and this document disagree, this document wins until it is updated. Changes to locked decisions require a version bump and a changelog entry.

---

## 0. Changelog

### v1.3 — decisions from nabila's review (2026-10-11)

| Area | v1.2 | v1.3 |
|---|---|---|
| Language (§8) | English | **Bahasa Indonesia only.** All UI copy, dates and numbers in `id-ID` |
| Entries per day (D5) | At most one per profile per date | **Any number per day.** Each entry has its own 30-day retention |
| Drafts (§6 Editor) | Not persisted across app termination | **Saved automatically** and restored after the app closes (D21) |
| Quick logs (§6) | Three toggles | Three main toggles plus **"Lainnya"** with up to six more, including "Ingin chat dia" (D22) |
| Closing a Pudar | — | **"Aku sudah selesai dengan orang ini"** turns a Pudar into read-only history; reopening is possible and counted (D23) |
| Dark mode (§8) | Light only | **Light and dark**, following the system setting |
| "Ingin chat dia" | — | Opens a write-it-here screen with a 10-minute breathing wait, then Lepaskan or Simpan (§5) |
| Editor | Fixed placeholder | A **daily opening question** with "Pertanyaan lain" (§6 Journal editor) |
| Today | — | A "Hari ini" button returns to today from any past day or week |
| Visual reference | — | nabila's mockups (`/mockup/referensi-desain-nabila-v1.png` in the project files); serif headings use Fraunces Regular |
| Order of work (§10) | Epics 1 → 9 | Roadmap in §10.0 |


### v1.2 — decisions made at the start of Epic 1

| Area | v1.1 | v1.2 |
|---|---|---|
| Device migration (§9.3) | Key is device-only; data does not move to a new iPhone | Key moves with encrypted iCloud/Finder backups; data **does** survive a phone change |
| Encryption (§9.2) | SQLCipher pending spike | SQLCipher enabled via `expo-sqlite` plugin; production builds refuse to run unencrypted. Final on-device verification is on the Epic 1 checklist |
| Color tokens (§8) | Base palette only | Added `*Ink` tokens for text and icons so every pair meets WCAG AA |
| Fonts | Open | Fraunces (headings) + Inter (body) |
| Project structure (§9.5) | `app/(tabs)/` | Routes in `src/app/` (Expo SDK 57 default) |
| Purge (§6) | — | Checkpoint the WAL after a purge so erased text doesn't linger in the WAL file |
| Release (Epic 9) | — | Export-compliance answer for SQLCipher |

### v1.1 — changes from v1.0

| Area | v1.0 | v1.1 |
|---|---|---|
| Data model | Quick logs embedded in `JournalEntry` | Separate `DayRecord`, one per profile per date |
| Dates | Unspecified | Calendar dates stored as local `YYYY-MM-DD`; moments stored as epoch ms |
| Writable days | Unspecified | Only today is writable; past is read-only; future is disabled |
| Entries per day | Unspecified | At most one `JournalEntry` per profile per date |
| Retention at day 30 | Entry deleted | Text erased (`content = null`); record and metadata kept |
| Fading UI | Opacity decreases | Timeline cards fade to a 40% minimum; opened entries stay readable; status always shown as text |
| Expiry processing | Unspecified | Purge on app launch and on return to foreground; UI never shows expired text even before purge |
| Statuses | Active, Fading, Locked, Near expiry, Deleted | Active, Fading, Near expiry, Faded, plus independent Locked flag. "Deleted" removed |
| Profile creation label | "+ New Entry" | "+ New Pudar" |
| Profile limit | Open | No hard cap |
| Storage | AsyncStorage | SQLite from day one; encryption decided in Epic 1 and required before TestFlight |
| New | — | "Start again from today", Face ID / passcode app lock (P1), support resources link, retention notice before first entry (P0) |
| Export | Open | Not in MVP |

---

## 1. Product overview

Pudar is a private, time-fading journal for processing unresolved feelings toward someone without contacting them.

Users create a separate space (a "Pudar") for each person or relationship. Inside each space they record how they feel, see how long they have kept no contact, and revisit entries in a timeline. Entry text fades over time and is erased after 30 days. Users can lock an entry to hide it, or let it go to delete it immediately.

**Vision:** A calm, private space to express what you cannot send, acknowledge what you feel, and let time pass, without turning recovery into a competition.

**Core principle:** The journal is a place to release feelings, not a reason to stay attached to the past.

---

## 2. Target users and jobs to be done

People who recently ended a relationship, are keeping no contact, still think about someone they are moving on from, or need to express feelings without sending them.

- **Primary job:** "When I feel the urge to write to someone I'm letting go of, I want a private place to say it so I don't have to keep it in my head or send it to them."
- **Secondary job:** "When I'm ready to move forward, I want old entries to recede over time, while I stay in control of what I hide or delete."

---

## 3. Goals and non-goals

**Goals**
1. Writing an entry is simple and emotionally accessible.
2. Multiple independent person/relationship spaces.
3. No-contact duration is visible without streaks or rewards.
4. Time-based fading is the defining interaction.
5. Users control their words through Lock, Unlock, and Let Go.
6. All data stays on the device and is encrypted at rest.
7. A stable iOS app ready for App Store review.

**Non-goals (MVP)**
- AI companion or therapist; social features; contacting the other person.
- Android, cloud sync, accounts, export.
- Streaks, scores, badges, recovery percentages.
- Push or local notifications of any kind.
- Writing or backfilling entries for past dates.
- Any claim to diagnose or treat mental health conditions.

---

## 4. Locked decisions

| # | Area | Decision |
|---|---|---|
| D1 | Quick logs | Stored in `DayRecord`, unique on `(profileId, date)` |
| D2 | Calendar dates | Local `YYYY-MM-DD` strings, captured at write time and never re-derived |
| D3 | Moments | `createdAt`, `updatedAt`, `retentionExpiresAt`, `fadedAt` are epoch milliseconds |
| D4 | Writability | Only today is writable. Past days are read-only. Future days are visible but disabled |
| D5 | Entries per day | Any number of `JournalEntry` rows per profile per date (v1.3). Each has its own `createdAt` and 30-day retention |
| D6 | Retention | 30 days from first save. At expiry, `content` becomes `null`; the record, date, lock flag and the day's quick logs remain |
| D7 | Editing | Editing today's entry does not reset or extend retention |
| D8 | Lock | Hides text everywhere in the UI. Fading continues. Unlocking does not restore anything |
| D9 | Let Go | Permanently deletes the `JournalEntry` row. The day's `DayRecord` (quick logs) is not affected |
| D10 | Fading UI | Timeline cards fade from 100% to a 40% minimum. Opened entries are fully readable. Status is always shown as a text label |
| D11 | Expiry | Purge runs on app launch and on every return to foreground. The UI treats `now ≥ retentionExpiresAt` as faded even if purge has not run |
| D12 | Profiles | No hard cap. Created via "+ New Pudar" |
| D13 | Storage | `expo-sqlite` from day one. No AsyncStorage for any user data |
| D14 | Security | Database encrypted at rest with SQLCipher (§9.2). Production builds refuse to run without it |
| D19 | Device migration | Journal data survives moving to a new iPhone through an encrypted backup (§9.3) |
| D15 | App lock | Face ID / passcode app lock is P1 |
| D16 | Recovery | "Start again from today" resets the no-contact start date with non-judgmental copy. No history of previous start dates is kept |
| D17 | Support | Settings links to support resources |
| D18 | Export | Not in MVP. The retention policy is shown and acknowledged before the first entry |
| D20 | Language | Bahasa Indonesia only for MVP. No language switch |
| D21 | Drafts | The editor's text is saved automatically (debounced, about 1 s) per profile and restored on return, including after the app is closed. A draft is not an entry: it doesn't fade, isn't listed, and is removed when saved or cleared. Drafts untouched for 30 days are deleted by the purge |
| D22 | More quick logs | Up to six extra per-day toggles behind "Lainnya", stored like the main three |
| D23 | Closing a Pudar | A closed Pudar is read-only history: no new entries or quick logs, counter frozen at its last day. Existing text still fades on schedule. Reopening asks for confirmation and increments `reopenCount` |

---

## 5. Information architecture

Three tabs:
1. **Today** — profile selector, week strip, no-contact counter, quick logs, journal editor.
2. **Memory** — timeline and monthly calendar of the active profile.
3. **Settings** — profiles, retention info, privacy, support, data deletion, app lock (P1).

Each profile has its own name, optional icon and accent color, no-contact start date, day records, and journal entries. Switching profiles changes every tab to that profile's data.

Wording rule: **"Pudar"** = a profile/space ("+ Pudar baru", "Pudar untuk V"). **"Tulisan"** = a journal entry inside a Pudar. The two are never used interchangeably in UI copy. English strings elsewhere in this document describe meaning; the shipped copy is Indonesian (D20), and final wording is reviewed by nabila.

### v1.3 additions

**Several entries per day.** Today lists the day's saved entries below the editor and save button, under "Tulisan hari ini · N", newest first, each with its time ("21.40"). Saving adds a new entry and clears the editor. Tapping one of today's entries opens it for editing while it is still today. A short line under the editor explains this: "Kamu bisa menulis lebih dari sekali hari ini." The week strip dot means "at least one entry"; it is hollow only when every entry that day has faded. Memory shows one card per entry.

**"Hari ini" button.** When a past day is selected, or the week strip shows an earlier week, a small "Hari ini" pill appears next to the week strip and jumps back to today.

**Lainnya (more quick logs).** A "Lainnya" button sits under the three main quick logs and opens a sheet of extra toggles. Proposed set, to be confirmed by nabila: Ingin chat dia, Lihat media sosialnya, Kangen, Marah, Merasa lega, Tidur nyenyak. Toggles that are on also appear as small chips under the main row. Same rules as the main three: saved on tap, no counts or scores.

**"Ingin chat dia" screen (from the competitor benchmark, 2026-10-11).** Turning on "Ingin chat dia" for today opens a modal titled "Tulis di sini, bukan ke dia." It has a text box for the message the person wants to send, a ten-minute countdown inside a slowly breathing circle ("Tarik napas pelan…" / "Hembuskan perlahan…"; static when Reduce Motion is on), and two choices that are available at any time: **Lepaskan** (the words are discarded, nothing is stored) and **Simpan sebagai tulisan** (saved as a normal entry for today, with the usual 30-day fade). Nothing is written to disk until "Simpan". No count of how often this happens is shown anywhere.

**Closing a Pudar.** At the very bottom of Today, a quiet text button "Aku sudah selesai dengan orang ini" opens a gentle confirmation. A closed Pudar shows a "Selesai" label, its frozen counter, and its history read-only on Today and Memory. "Buka lagi" (on Edit Pudar) asks for confirmation and increments `reopenCount`. Built with the Q7 default: `reopenCount` shows only as neutral text ("Dibuka lagi 2 kali") on the closed Pudar's banner and on Edit Pudar, never as a trend. Closed Pudars stay in the switcher under "Sudah selesai" and can still be deleted. Locking and Let Go still work on a closed Pudar's entries, since they only hide or erase. An unsaved draft is kept and comes back on reopen (or fades after 30 days).

**Dark mode.** Every color token gets a dark value; the contrast test covers both sets. The app follows the system appearance.

---

## 6. Feature requirements

### P0 — Profiles

- Create a profile with a name or nickname (1–30 characters, trimmed; counted as characters, so an emoji counts once). A newly created Pudar becomes the active one.
- Optional icon and accent color. Accent color only tints the profile avatar, not the whole theme.
  - Icons (SF Symbols): moon, heart, leaf, cloud, star, sparkles, drop, bird.
  - Colors: Rose `#D97C8B`, Peach `#E8A77E`, Sand `#D4B48A`, Sage `#9DBF9E`, Sky `#8DB4D6`, Lavender `#B7A6DB`. The avatar's icon or initial is drawn in `text` on the color (≥ 3:1, tested).
  - Without an icon, the avatar shows the name's first letter.
- Optional no-contact start date. It cannot be in the future.
- Switch, rename, edit, and delete profiles.
- The active profile is persisted and restored on launch.
- Deleting a profile requires confirmation, names the profile, and states that all of its entries and quick logs will be permanently deleted. Deletion cascades in the database.
- If the last profile is deleted, the app returns to the "create your first Pudar" state.

### P0 — Today screen

Top to bottom:
1. Profile selector (name + chip; tap opens the switcher with "+ New Pudar").
2. Week strip.
3. No-contact counter.
4. "How do I feel today?" with three quick-log buttons.
5. Journal editor with character count.
6. "Save my journal" button.
7. Tab bar.

#### Week strip
- Shows 7 consecutive days for the week containing the selected date. Week start follows device locale (fallback: Monday).
- Today is selected by default.
- Swiping goes to previous weeks. It cannot go past the current week.
- Future days are shown but disabled.
- A day with a journal entry shows a filled dot. A day whose entry has faded shows a hollow dot. No dot means no entry. Dots never reveal content or lock state.
- A calendar icon opens the monthly calendar (P1).
- Selecting a past day switches the screen to **read-only** for that date: quick logs are shown but not tappable, and the entry is displayed according to its state (locked → hidden, faded → placeholder). The editor and save button are hidden.
- When the app returns to foreground on a new local date, the selection moves to the new today unless the user is mid-edit (see Editor).

#### No-contact counter
- `days = diffCalendarDays(startDate, today)` in the device's current timezone.
- Display: `0` → "Starting today" · `1` → "1 day" · `n` → "n days", with the subtitle "no contact" and the line "One day at a time."
- No start date: empty state "Set the day you started" opening the date picker.
- "Start again from today" (in the counter's menu) sets the start date to today after a gentle confirmation: *"Starting again is part of it. Your count will begin from today."* No previous dates or counts are stored or shown.
- The counter shows elapsed days only. It is not a streak, score, or recovery indicator.

#### Quick logs
Three circular toggles in one row:

| Button | Icon/background |
|---|---|
| Thought of them | Neutral `#77736F` on `#E8E6E3` |
| Had a cry | Neutral `#77736F` on `#E8E6E3` |
| Chose myself | Sage `#7DA589` on `#E4EFE6` |

- Each toggle is a per-day boolean, **saved immediately on tap**, independent of the journal Save button.
- Any combination can be on. Tapping again turns it off.
- If all three become off, the `DayRecord` row is deleted (no blank records).
- The selected state uses more than color (filled ring + check icon) and exposes `accessibilityState.selected`.
- No counts, scores, or feedback messages.

#### Journal editor
- Placeholder: a gentle opening question that changes each day (`src/lib/prompts.ts`, 28 questions, e.g. "Apa yang ingin kamu katakan, tapi tidak bisa?"). Questions never name the person, judge, or ask for a score. While the box is empty, a small "Pertanyaan lain" button under it shows the next one. Added from the competitor benchmark (2026-10-11).
- Hard limit 2,000 characters with a live count ("1,240 / 2,000").
- Save button: "Save my journal". Disabled when the trimmed text is empty or unchanged.
- First save creates the entry: `createdAt = now`, `retentionExpiresAt = createdAt + 30 days`. Later saves update `content` and `updatedAt` only.
- Clearing all text does not delete an existing entry; deletion only happens through Let Go.
- **Writability is checked when the editor opens, not on save.** If the local date changes while the editor is open, the draft stays bound to the date it was opened on and can still be saved. Once the editor closes, that date is read-only.
- Unsaved text is saved automatically as a draft per profile and restored on return, including after the app is closed (D21). Switching profiles keeps each Pudar's draft, so no prompt is needed. A restored draft from an earlier day becomes a new entry draft for today; an unsaved edit of an earlier day's entry is dropped, because that day is read-only. While the draft differs from what's saved, a line under the button says "Draf disimpan otomatis, jadi tulisanmu aman walau aplikasi tertutup."
- Save confirmation: a brief, calm toast ("Saved").
- **Gate:** the first time the user tries to write, the retention notice (§6 P0 — Retention notice) must be acknowledged before the editor accepts input.

### P0 — Retention notice

Shown before the first entry is ever written (once per install, stored as `retention_ack_at`):

> **Your words will fade.**
> Each entry slowly fades and its text is erased 30 days after you write it, whether or not you open Pudar. The date and your check-ins stay.
> You can lock an entry to hide it, or let it go sooner. Pudar can't recover erased or deleted words, and there is no export.
>
> [I understand]

The same explanation is permanently available in Settings → "How fading works".

### P0 — Fading engine

Fading is computed by a pure function from persisted timestamps. It never depends on animation, app uptime, or how often an entry is opened.

```
RETENTION_MS     = 30 × 24h
FADE_START_MS    = 24h
NEAR_EXPIRY_MS   = 3 × 24h
MIN_CARD_OPACITY = 0.4
```

`getFadeState(entry, now)` returns:

| Condition (in order) | Status | Card opacity |
|---|---|---|
| `content === null` or `now ≥ retentionExpiresAt` | `faded` | 0.4 |
| `retentionExpiresAt − now ≤ NEAR_EXPIRY_MS` | `near_expiry` | linear |
| `now − createdAt ≥ FADE_START_MS` | `fading` | linear |
| otherwise | `active` | 1.0 |

Linear opacity: from 1.0 at `createdAt + 24h` down to 0.4 at `retentionExpiresAt`, clamped to `[0.4, 1.0]`.

The function also returns `daysLeft` (ceil of remaining time in days, minimum 0) for labels such as "Fades in 12 days".

`locked` is independent: any status can be locked, except that Lock is unavailable once an entry is `faded` (there is no text to hide).

**Purge** (`purgeExpired(now)`): a single statement sets `content = NULL, faded_at = now` for rows where `content IS NOT NULL AND retention_expires_at <= now`, followed by `PRAGMA wal_checkpoint(TRUNCATE)` when any row changed. Runs on launch (before the first screen reads data) and on every `AppState` change to `active`. Idempotent.

**Invariants**
- Opening, locking, unlocking, or editing an entry never changes `createdAt` or `retentionExpiresAt`.
- The UI never renders `content` for an entry whose computed status is `faded`, even if purge has not yet run.
- Erased text is unrecoverable: `PRAGMA secure_delete = ON` is set on every connection so freed pages are overwritten.

**Known limitation:** changing the device clock backwards can make an entry look less faded until real time catches up. Text that has already been purged stays erased. This is acceptable for MVP.

### P0 — Memory timeline

- Entries of the active profile, newest first, grouped by month.
- Each card shows date, quick-log icons for that day, status label, and lock icon if locked. Card opacity follows the fade state.
- **No text previews in the timeline**, for any status. Cards show metadata only.
- Tapping a card opens Entry Detail.
- Toggle between Timeline and Calendar (calendar is P1).

#### Entry detail
- Unlocked, not faded: content shown fully readable (no fading applied), plus "Written Oct 3 · Fades in 12 days".
- Locked: "This entry is locked. Your words are hidden while time keeps moving." with an **Unlock** button. Unlock asks for confirmation: "Unlocking won't slow or undo fading."
- Faded: "This entry has faded." No content area. Date and quick logs remain.
- Actions: Lock / Unlock (not on faded), Let Go (always).

### P0 — Lock and Unlock
- Lock and Unlock are on Entry Detail only.
- Lock sets `locked = 1`. Text is hidden on every screen, including Today when viewing that date.
- Unlock sets `locked = 0` after confirmation.
- Neither changes any timestamp.
- Lock is a UI privacy feature. It is not separate encryption, and the copy must not imply it is. Whole-app protection comes from the app lock (P1) and database encryption.

### P0 — Let Go
- Available on Entry Detail for any entry, including faded ones.
- Confirmation:
  - Title: "Are you sure you're ready to let this go?"
  - Body: "This entry will be permanently deleted. You won't be able to recover it."
  - Actions: **Let Go** (destructive) / Cancel.
- Deletes the `journal_entries` row. The day's quick logs remain. No undo.
- After Let Go on today's entry, the user may write a new entry for today. It gets a fresh `createdAt` and retention period.

### P0 — Settings and privacy
- Profiles: rename, edit icon/color, edit start date, "Start again from today", delete.
- How fading works (retention explainer).
- Privacy: what is stored, that nothing leaves the device, encryption, backup behavior (§9.3).
- **If you're struggling**: short supportive copy, a link to an international helpline directory (e.g. findahelpline.com), and a line saying Pudar is not a substitute for professional help or emergency services.
- Delete all data: two-step confirmation (dialog, then typing "HAPUS"). Closes the database, deletes the database file, then deletes the encryption key, and resets to first launch (the retention notice shows again).
- App version.

Built in step 10 (v1.3): Settings has three groups. "Pudar-mu" lists every Pudar (open ones first, closed ones with a "Selesai" label) and opens Edit Pudar, plus "Pudar baru". "Tentang Pudar" has "Cara tulisan memudar", "Privasi" and "Kalau kamu sedang berat" as reading pages. "Data" has "Hapus semua data". The version is shown at the bottom. The support page links to findahelpline.com and gives 112 (Indonesia's emergency number) with a call button; its copy still needs the review in Q5. The app lock toggle comes with step 12.

### P1 — Onboarding
1. "A journal for what you can't send."
2. "You're in control. Lock entries when you need space, or let them go when you're ready."
3. Retention notice (the same as the P0 notice; acknowledging it here satisfies the gate).
4. Create your first Pudar.

Screens 1–2 are skippable. Steps 3–4 are not.

### P1 — Monthly calendar
- Month grid for the active profile. Dots follow the same rules as the week strip.
- Tapping a day opens that day in read-only Today view (or live Today if it is today).
- Cannot navigate past the current month.

### P1 — App lock
- Settings toggle "Require Face ID" (or Touch ID / passcode, matching the device), using `expo-local-authentication`.
- When enabled: authenticate on cold launch and when returning to foreground after more than 30 seconds in background.
- The app switcher snapshot shows a blurred / blank privacy screen whenever app lock is enabled.

---

## 7. Data model

### TypeScript types

```ts
type LocalDate = string; // 'YYYY-MM-DD' in the device's local calendar at write time

type Profile = {
  id: string;                         // UUID v4
  name: string;                       // 1–30 chars
  icon: string | null;
  accentColor: string | null;
  noContactStartDate: LocalDate | null;
  createdAt: number;                  // epoch ms
  updatedAt: number;
};

type DayRecord = {
  profileId: string;
  date: LocalDate;
  thoughtOfThem: boolean;
  hadACry: boolean;
  choseMyself: boolean;
  updatedAt: number;
};

type JournalEntry = {
  id: string;
  profileId: string;
  date: LocalDate;
  content: string | null;             // null ⇔ faded (erased by purge)
  createdAt: number;
  updatedAt: number;
  locked: boolean;
  retentionExpiresAt: number;         // createdAt + RETENTION_MS, fixed at creation
  fadedAt: number | null;             // when purge actually erased the text
};
```

`retentionExpiresAt` is stored, not recomputed, so a future change to the retention period never retroactively changes existing entries. `fadedAt` records when the purge actually ran (which can be later than `retentionExpiresAt` if the app was not opened). It is used for debugging and the "faded" label, never for computing status.

### SQLite schema (after migration 5)

```sql
CREATE TABLE profiles (
  id                     TEXT PRIMARY KEY NOT NULL,
  name                   TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 30),
  icon                   TEXT,
  accent_color           TEXT,
  no_contact_start_date  TEXT,
  created_at             INTEGER NOT NULL,
  updated_at             INTEGER NOT NULL,
  -- Migration 5 (D23): closing and reopening.
  closed_at              INTEGER,       -- NULL while open
  closed_on              TEXT,          -- local date it was closed; the counter stops here
  reopen_count           INTEGER NOT NULL DEFAULT 0 CHECK (reopen_count >= 0)
);

CREATE TABLE day_records (
  profile_id       TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date             TEXT NOT NULL,
  thought_of_them  INTEGER NOT NULL DEFAULT 0 CHECK (thought_of_them IN (0, 1)),
  had_a_cry        INTEGER NOT NULL DEFAULT 0 CHECK (had_a_cry IN (0, 1)),
  chose_myself     INTEGER NOT NULL DEFAULT 0 CHECK (chose_myself IN (0, 1)),
  -- Migration 4 (D22): the six "Lainnya" quick logs, each with the same 0/1 CHECK as above.
  wanted_to_chat   INTEGER NOT NULL DEFAULT 0,
  checked_socials  INTEGER NOT NULL DEFAULT 0,
  missed_them      INTEGER NOT NULL DEFAULT 0,
  felt_angry       INTEGER NOT NULL DEFAULT 0,
  felt_relieved    INTEGER NOT NULL DEFAULT 0,
  slept_well       INTEGER NOT NULL DEFAULT 0,
  updated_at       INTEGER NOT NULL,
  PRIMARY KEY (profile_id, date)
);

CREATE TABLE journal_entries (
  id                    TEXT PRIMARY KEY NOT NULL,
  profile_id            TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                  TEXT NOT NULL,
  content               TEXT CHECK (content IS NULL OR length(content) BETWEEN 1 AND 2000),
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL,
  locked                INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0, 1)),
  retention_expires_at  INTEGER NOT NULL,
  faded_at              INTEGER
);
-- Migration 1 had UNIQUE (profile_id, date). Migration 2 rebuilds the table without it (D5, v1.3).

CREATE INDEX idx_entries_profile_date ON journal_entries (profile_id, date DESC, created_at DESC);
CREATE INDEX idx_entries_pending_purge ON journal_entries (retention_expires_at)
  WHERE content IS NOT NULL;

-- Migration 3 (D21): one autosaved editor draft per profile. Not an entry: never listed, never fades.
CREATE TABLE drafts (
  profile_id  TEXT PRIMARY KEY NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,     -- the date the editor was writing for
  entry_id    TEXT,              -- the entry being edited, or NULL for a new one
  content     TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  updated_at  INTEGER NOT NULL
);

CREATE TABLE settings (
  key    TEXT PRIMARY KEY NOT NULL,
  value  TEXT NOT NULL
);
-- keys: active_profile_id, retention_ack_at, app_lock_enabled (P1)
```

### Connection setup (every open)

```sql
PRAGMA key = '<key>';            -- if SQLCipher (§9.2); must be first
PRAGMA foreign_keys = ON;
PRAGMA secure_delete = ON;
PRAGMA journal_mode = WAL;
```

Migrations are versioned with `PRAGMA user_version`. Each migration runs inside a transaction. Running migrations on an up-to-date database is a no-op.

---

## 8. Design system

### Color tokens — Blush Peach

| Token | Hex | Usage |
|---|---|---|
| `background` | `#FDF7F4` | Screen background |
| `surface` | `#FFFCFA` | Cards, editor |
| `primary` | `#D97C8B` | Primary buttons, selected tab |
| `secondary` | `#F7E4E4` | Soft pink surfaces |
| `text` | `#43383A` | Primary text |
| `muted` | `#8C8081` | Secondary text |
| `neutralIcon` | `#77736F` | Thought of them, Had a cry |
| `neutralBg` | `#E8E6E3` | Gray circular buttons |
| `selfGreen` | `#7DA589` | Chose myself |
| `selfGreenBg` | `#E4EFE6` | Chose myself background |

**Ink tokens (text and icons).** Several base colors are too light to carry text or icons at WCAG AA. They stay as fills; anything *drawn on top* uses these darker shades of the same hues:

| Token | Hex | Replaces for text/icons | Contrast |
|---|---|---|---|
| `mutedInk` | `#766A6C` | `muted` (3.6:1) | 4.9:1 on background |
| `primaryInk` | `#A9505F` | `primary` as text (2.8:1), and as the fill behind white button labels (white on `primary` is 2.9:1) | 5.0:1 on background, 5.3:1 with white |
| `selfGreenInk` | `#567F63` | `selfGreen` icon on `selfGreenBg` (2.3:1) | 3.9:1 (icon minimum 3:1) |

`primary` remains the color for selected states, tab tint accents and soft fills. `src/theme/__tests__/contrast.test.ts` fails the build if a pair drops below AA.

### Dark mode (v1.3, roadmap step 11)

The app follows the iPhone's appearance setting; there is no in-app switch. Every token has a dark value in `src/theme/tokens.ts` (`darkColors`), and the same contrast tests run on both palettes. The dark palette is a warm near-black (`background #1B1617`, `surface #252021`) with lighter inks (`text #F2E9E7`, `mutedInk #B5A9AB`, `primaryInk #EC9DAA`, `dangerInk #F28B82`). Because `primaryInk` is light at night, filled buttons use dark labels (`onPrimaryInk #2B1A1E`). Profile accent colors stay the same in both modes, and their icons and initials always use dark ink (`onAccent`).

Components get colors through `createStyles` and `useColors` in `src/theme/theme.ts`, which build each stylesheet once per palette.

### Principles
- Calm, spacious, minimal. Soft rounded surfaces, restrained shadows.
- Serif headings in **Fraunces SemiBold**, body in **Inter** (Regular / Medium / SemiBold), bundled via `@expo-google-fonts`.
- Status is always communicated by text and icon, never by opacity alone.
- Faded cards never drop below 40% opacity. Text on cards must meet WCAG AA contrast at full opacity; the label carries meaning at reduced opacity.
- Support Dynamic Type and VoiceOver on every screen. Every interactive element has an accessibility label.
- Light and dark mode, following the system setting (v1.3).

---

## 9. Technical architecture

### 9.1 Stack
- Expo (latest stable SDK at project creation), React Native, TypeScript (strict).
- Expo Router (tabs).
- `expo-sqlite` with SQLCipher.
- `expo-secure-store` (encryption key), `expo-crypto` (UUIDs, random key bytes).
- `expo-localization` (week start), `expo-local-authentication` (P1).
- Jest via `jest-expo`; pure logic tested in plain Node with a timezone matrix.
- EAS Build, TestFlight, App Store Connect.
- **Development builds, not Expo Go.** SQLCipher requires native configuration, so the app runs with `npx expo run:ios` (local Xcode) or an EAS development build. Expo Go can start the app, but unencrypted and with a warning; that is for quick UI checks only.

### 9.2 Encryption at rest (decided in Epic 1)

Implemented in `src/db/open.ts` and `src/db/native.ts`:
1. SQLCipher is enabled with `["expo-sqlite", { "useSQLCipher": true }]` in `app.json`.
2. On first launch, a 256-bit random key is generated with `expo-crypto` and stored in `expo-secure-store` (`keychainAccessible: WHEN_UNLOCKED`) **before** the database file is created.
3. The database is opened with `PRAGMA key = "x'<hex>'"` (raw key, no passphrase derivation) as its first statement, then verified by reading `sqlite_master`.
4. If `PRAGMA cipher_version` returns nothing (SQLCipher missing), production builds refuse to open; development builds continue with a warning.
5. Delete all data (Epic 7) = close, delete the database file, delete the key.

**Data is only ever discarded in one case:** the keychain had no key *and* an existing file can't be read with the new one (§9.3). If a key exists but doesn't fit, or the keychain read fails, opening fails with a "Try again" screen and nothing is deleted. Unit tests cover each path.

Still to verify on a dev build (Epic 1 checklist, see `README.md`):
- The Settings → Storage diagnostics panel shows `SQLCipher <version>`.
- `strings` on the database file in the simulator finds no readable test phrase.

### 9.3 Backups and device migration

The key uses `WHEN_UNLOCKED` (not `*_THIS_DEVICE_ONLY`), so iOS includes it in **encrypted** backups. Journal data therefore moves to a new iPhone restored from:
- an iCloud backup (always encrypted), or
- an encrypted Finder backup.

An **unencrypted** Finder backup does not include keychain items. After such a restore the database file exists but the key does not; the app deletes the unreadable file, starts fresh, and shows a one-time explanation ("Starting fresh").

Restored entries keep their original timestamps, so anything that expired in the meantime is purged on first launch.

Settings → Privacy (Epic 7) explains this in plain language.

### 9.4 Privacy rules
- No network calls with user data. No analytics, advertising, or third-party crash SDKs in the MVP. The App Store privacy label is "Data Not Collected".
- Journal text, profile names, and dates never appear in logs, notifications, or error messages.
- No notifications in MVP.

### 9.5 Project structure

```
pudar/
├── src/
│   ├── app/                  # Expo Router routes (every file is a screen)
│   │   ├── _layout.tsx       # fonts, DB open, native tabs
│   │   ├── index.tsx         # Today
│   │   ├── memory.tsx
│   │   └── settings.tsx
│   ├── components/
│   ├── theme/                # tokens, typography, contrast helper
│   ├── lib/                  # pure logic: date.ts, fading.ts (+ __tests__)
│   └── db/
│       ├── types.ts          # Db interface (expo-sqlite or sql.js in tests)
│       ├── open.ts           # key → unlock → encryption check → pragmas → migrate
│       ├── native.ts         # expo-sqlite / SecureStore / Crypto wiring
│       ├── connection.ts     # pragmas, key, diagnostics
│       ├── migrations.ts
│       ├── settings.ts       # settings repository (more repositories from Epic 2)
│       └── provider.tsx      # React context
├── scripts/test-tz.mjs       # date tests across 6 timezones
├── docs/PRD.md               # this document
└── app.json
```

Rules: `src/lib` contains pure functions with no React Native imports. Database code depends on the `Db` interface, not on expo-sqlite, so migrations and repositories are tested against a real in-memory SQLite (sql.js) in Node.

---

## 10. Epics and acceptance criteria

### 10.0 Roadmap (v1.3)

Work runs in this order; each step is reviewed against nabila's mockups before the next starts. Epics below keep their acceptance criteria.

| # | Step | Why here |
|---|---|---|
| 1 | Today screen restyle and build (Epic 4, first pass) | Done in PR #3 |
| 2 | Bahasa Indonesia for all existing copy (D20) | Done in PR #3 |
| 3 | Several entries per day: migration 2, repository, Today list (D5) | Done in PR #3 |
| 4 | Automatic drafts (D21) and the "Hari ini" button | Done in PR #3 |
| 5 | Fading engine and purge (Epic 3) | Done in PR #3 |
| 6 | Memory timeline and entry detail (Epic 6) | Done in PR #3 (calendar view still P1) |
| 7 | Lock, Unlock and Let Go (Epic 5) | Done in PR #3 |
| 8 | Lainnya quick logs (D22) | Done in PR #3 with the proposed list; final list still Q8 |
| 9 | Closing and reopening a Pudar (D23) | Done in PR #3 with the Q7 default; migration 5 |
| 10 | Settings and privacy, Delete all data (Epic 7) | Done in PR #3; support copy still Q5 |
| 11 | Dark mode | Done in PR #3 (§8 Dark mode) |
| 11a | "Ingin chat dia" screen (benchmark idea 1) | Done in PR #3 (§5 Lainnya) |
| 11b | Daily opening questions in the editor (benchmark idea 2) | Done in PR #3 (§6 Journal editor) |
| 12 | Onboarding, app lock, hardening (Epic 8) | |
| 13 | App Store release (Epic 9) | |

Original epic order, for reference: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9.

### Epic 1 — Foundation
Scope:
- Create the Expo TypeScript project with Expo Router and three placeholder tabs.
- Theme tokens and fonts.
- SQLite client, connection pragmas, migration runner, migration 1 (full schema above), settings repository.
- Encryption at rest (§9.2).
- Date utilities in `src/lib/date.ts`:
  - `toLocalDate(date: Date): LocalDate`
  - `todayLocal(now?: Date): LocalDate`
  - `isValidLocalDate(s: string): boolean`
  - `diffCalendarDays(from: LocalDate, to: LocalDate): number` (computed with `Date.UTC` on Y/M/D, so DST never affects it)
  - `addDays(d: LocalDate, n: number): LocalDate`
  - `compareLocalDates(a, b): -1 | 0 | 1`
  - `weekContaining(d: LocalDate, weekStartsOn: number /* 0 = Sunday … 6 */): LocalDate[]`
  - `noContactDays(start: LocalDate, today: LocalDate): number`
- Fading constants in `src/lib/fading.ts` (so Epic 3 builds on fixed numbers).
- Tooling: `tsc --noEmit`, ESLint, Jest, and a `test:tz` script that runs the date tests under `UTC`, `Asia/Jakarta`, `America/New_York`, `America/Santiago` (DST at midnight), `Australia/Lord_Howe` (30-minute DST), and `Pacific/Kiritimati` (UTC+14).

Done when:
- [ ] `npm run ios` launches in the simulator with three Blush Peach tabs. *(needs a Mac)*
- [ ] Settings → Storage diagnostics shows SQLCipher, foreign keys on, secure delete on, schema v1. *(needs a Mac)*
- [ ] `strings` on the simulator's database file finds no readable text. *(needs a Mac)*
- [x] Migrations create the schema and `user_version = 1`; a second run is a no-op (tested).
- [x] `foreign_keys` and `secure_delete` are on for every connection (tested).
- [x] SQLCipher enabled in the native build config; the key-handling paths are tested.
- [x] Date tests pass across the full timezone matrix, including DST transitions, month and year boundaries, and leap days.
- [x] Typecheck, lint, and tests pass; CI runs them on every PR that touches `pudar/`.

### Epic 2 — Profiles
- Profile repository (CRUD, cascade delete), active-profile persistence, profile switcher sheet, create/edit form, delete confirmation, "Start again from today".
- "Start again from today" lives on the Edit Pudar screen until Epic 4 adds the counter's menu.

Done when:
- [x] Profiles can be created, switched, edited and deleted (repository tests).
- [x] Deleting a profile removes its own day records and entries, and no one else's (tested at the database level).
- [x] The active profile survives restart; if it was deleted, the oldest remaining profile is used, and with none left the app returns to "Create your first Pudar" (tested).
- [ ] Walk through the flow on a device or in Expo Go: create → switch → edit → start again → delete the last one. *(needs a phone or Mac)*

### Epic 3 — Fading engine
- `getFadeState`, `purgeExpired`, and purge on launch and foreground.
- Done when: unit tests cover each status boundary (exactly 24h, exactly 3 days left, exactly expiry), opacity clamping, `daysLeft`, and lock independence. An integration test shows that an entry created "31 days ago" has `content = null` after launch. The UI layer cannot read content for a faded entry (enforced in the repository's mapping function).

### Epic 4 — Today screen
- Week strip, counter, quick logs (immediate save), editor (gate, limit, save rules, midnight rule), read-only past-day view.
- Done when: every behavior in §6 Today works, and a full flow (create profile → acknowledge retention → toggle quick logs → write → save → restart) shows the same state after restart.

### Epic 5 — Lock and Let Go
- Entry detail actions and confirmations.
- Done when: locked text never appears anywhere (Today read-only view, timeline, detail), lock/unlock leave timestamps unchanged (tested), and Let Go deletes the entry row while leaving the `DayRecord`.

### Epic 6 — Memory
- Timeline grouped by month, status labels and opacity, entry detail, monthly calendar (P1).
- Done when: no text preview is shown for any card, statuses match `getFadeState`, and the calendar matches the week strip's dot rules.

### Epic 7 — Settings and privacy
- Every Settings item in §6, including Delete All Data (file + key).
- Done when: after Delete All Data the app is in first-launch state and the old database file and key no longer exist.
  - [x] Delete order (close, file, key) and the fresh first launch afterwards are tested with fake storage; checked in the web preview.
  - [ ] Checked on an iPhone build *(needs a Mac)*.

### Epic 8 — Hardening and onboarding
- Onboarding (P1), app lock (P1), app switcher privacy screen, accessibility pass (VoiceOver, Dynamic Type, contrast), layout check on the smallest and largest supported iPhones, empty states, error states.
- Done when: an accessibility audit passes and the full acceptance list (§11) is green.

### Epic 9 — App Store release
- Apple Developer Program, EAS credentials, production build, TestFlight beta, listing, screenshots, privacy label ("Data Not Collected"), privacy policy URL, review notes explaining local-only storage and automatic erasure.
- Export compliance: the app uses encryption (SQLCipher) for data at rest on the device. Answer App Store Connect's encryption questions accordingly and set `ios.config.usesNonExemptEncryption` once confirmed.
- Replace the placeholder bundle identifier `com.ineednab.pudar` if needed before the first upload (it cannot change after).

---

## 11. MVP acceptance criteria (beta gate)

- [ ] Multiple profiles with fully independent data and counters.
- [ ] Week strip: correct dates, dots, read-only past, disabled future.
- [ ] Quick logs toggle, save immediately, and persist; all-off removes the row.
- [ ] Only today is writable; several entries per day work (v1.3); the 2,000-character limit is enforced.
- [ ] Retention notice acknowledged before the first entry.
- [ ] Entries persist across restarts.
- [ ] Fading statuses and opacity are correct after the app has been closed for days.
- [ ] Expired text is erased on launch/foreground; metadata remains; the UI never shows expired text.
- [ ] Locked text never appears in any list or preview.
- [ ] Lock, unlock, open, and edit never change retention.
- [ ] Let Go deletes the entry after confirmation; quick logs remain.
- [ ] Profile deletion and Delete All Data work, including key deletion.
- [ ] Database encrypted at rest, verified on device.
- [ ] Nothing user-generated leaves the device.
- [ ] Works on all supported iPhone sizes with VoiceOver and Dynamic Type.

---

## 12. Success metrics

Measured through TestFlight feedback and interviews, not in-app analytics:
- Users can write and save their first entry without help.
- Users can correctly explain Lock, fading, and Let Go after first use.
- No reports of unexpected data loss or confusing privacy behavior.
- Qualitative: journaling feels useful and safe.

Do not optimize for streak length, frequency of thinking about someone, or daily engagement. Pudar should be useful without requiring people to return indefinitely.

---

## 13. Remaining open questions

| # | Question | Recommendation | Needed by |
|---|---|---|---|
| Q3 | Final app name "Pudar" — App Store availability | Check before Epic 9 | Epic 9 |
| Q5 | Support resource link and copy reviewed by someone with mental-health background | Yes | Epic 7 |
| Q6 | Button style: deeper `primaryInk` fill with white text (current), or `primary` fill with large bold dark text | `primaryInk` | Epic 4 |
| Q7 | Show how many times a closed Pudar was reopened? A visible count can feel like a score, which §3 avoids | Store it; show only on the closed Pudar as neutral text ("Dibuka lagi 2 kali"), never as a trend. Built this way in step 9; easy to hide later | Step 9 |
| Q8 | Final list of "Lainnya" quick logs (up to six) | Built with the six proposed (Ingin chat dia, Lihat media sosialnya, Kangen, Marah, Merasa lega, Tidur nyenyak; migration 4); renaming a label later needs no migration | Step 8 |

---

*Pudar gives feelings a place to exist, and gives time the space to do its work.*
