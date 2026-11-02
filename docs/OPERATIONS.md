# Operations

DailyLingo has no server to operate. “Operations” here means: protecting learner
data in the browser, recovering it, diagnosing a device problem, and releasing a
verified build.

## 1. Where data lives

| Key | Contents |
|---|---|
| `dailylingo_user_stats` | XP, level, streak, study days, goals, skill estimates, theme/audio prefs |
| `dailylingo_saved_words` | Saved words and their review schedule |
| `dailylingo_badges` | Badge definitions and unlock dates |
| `dailylingo_sound_muted` | Sound preference |
| `dailylingo_recovery_<key>_<timestamp>` | Raw copy of a corrupt value, written before recovery |
| `dailylingo_recovery_pre_import_<timestamp>` | Raw pre-import values of the four data keys (newest 3 kept) |

Nothing is sent to a server. Clearing browser site data, using a private window,
or switching browsers/devices loses the local progress unless the learner has an
exported backup.

## 2. Backup and restore

**Backup (learner):** Cài đặt → Dữ liệu & Sao lưu → create/download backup. The
file is JSON named `dailylingo-backup-YYYY-MM-DD.json`. Ask learners to keep it
outside the browser profile.

**Restore:** Cài đặt → import backup. Before writing, the app snapshots the raw
`localStorage` values under a `dailylingo_recovery_pre_import_*` key, validates
the file, and writes all datasets as one transaction. If any write fails, the
previous values are restored and the import reports failure. Invalid or
incompatible files are rejected with current data untouched. Only the three
newest pre-import snapshots are retained so a long-lived profile cannot grow
without bound. Restoring replaces stats, words, and badges.

**Reset all:** requires typing `XOA`. It is deliberately destructive and removes
**every** `dailylingo_*` key, including recovery snapshots. If a learner is
resetting to escape corrupt data, export first or copy the recovery snapshot from
DevTools → Application → Local Storage.

## 3. Storage failure triage

| Symptom | Meaning | Action |
|---|---|---|
| Banner “Không thể ghi tiến độ…” | Writes are blocked or quota exceeded | Export immediately; free space or allow storage for the site; keep the tab open until exported |
| Corrupt-data notice | A stored value failed validation; raw value copied to `dailylingo_recovery_*` | Export, then import a known-good backup; the recovery key preserves the raw value |
| Progress missing after a browser update | Storage cleared, different profile, or private mode | Check Settings diagnostics for storage availability; restore the latest backup |
| Speech button does nothing | Browser lacks Web Speech support or permission denied | Diagnostics show capability flags; use typed fallback; check OS/browser microphone permission |
| Notifications silent | Permission `default`/`denied`, or the DailyLingo tab is closed | Diagnostics show permission; reminders are checked only while the tab is open. Re-enable in browser settings if denied |

Diagnostics (Cài đặt → Xem chẩn đoán cục bộ) show booleans, storage usage counts,
recovery-event count, and build mode. They never contain learner content.

## 4. Support workflow (Beta)

1. Ask for the **diagnostics report** (copy/download). Do not ask for a backup
   unless the issue is data loss; backups contain learner content.
2. Record browser name/version, OS, device, and whether speech input/TTS was
   involved. The report's user agent helps but does not replace real-device notes.
3. Reproduce on the same class of device. If it involves microphone, TTS,
   permission prompts, unsupported APIs, or slow networks, it needs real hardware
   evidence — a desktop mock is not sufficient.
4. For scoring disputes: confirm the exercise is read-aloud transcript matching,
   not pronunciation assessment. Re-read the target sentence; show the transcript
   comparison if the UI exposes it.
5. For data loss: stop, export what remains, preserve `dailylingo_recovery_*`
   keys, then attempt restore.
6. File findings with reproduction steps, expected/actual, diagnostics, and the
   exact commit/build mode.

## 5. Release checklist

```bash
npm ci
npm run verify          # typecheck, coverage thresholds, build, bundle budget
npx playwright test     # 16 journeys incl. contrast audit
npm run test:e2e:preview # same journeys against the production build
```

Then:

- [ ] `git status` is intentional; no secrets, no `.env`, no learner backups.
- [ ] Bundle budget output recorded (initial JS 442.1 kB / 127.0 kB gzip at the
      Beta candidate; lazy analytics chunk present).
- [ ] Unit: 149/149, 10 files; coverage thresholds pass.
- [ ] Timezone matrix: 54/54 in each of three zones.
- [ ] Playwright: 16/16 on Chromium, against both the dev server and `dist/`.
- [ ] Exact commit SHA recorded in [`BETA_ACCEPTANCE.md`](BETA_ACCEPTANCE.md).
- [ ] Staging built with `VITE_BASE_PATH=/DailyLingo/` and manually smoke-tested.
- [ ] No public deploy without Owner authorization.

## 6. Known operational limits

- Single browser profile only; no account sync.
- `localStorage` is origin-scoped. Changing scheme/host/port or the base path can
  make existing data appear “lost” because it is a different origin/path context.
- Recovery is best-effort: if storage is completely blocked, the raw value cannot
  be backed up; the app reports this instead of pretending it succeeded.
- `audioEffects.ts` and `speech.ts` depend on browser audio APIs and are covered by
  browser journeys rather than unit tests; coverage thresholds focus on pure logic.
- Dependency updates can change the bundle; `npm run check:bundle` is the gate.
