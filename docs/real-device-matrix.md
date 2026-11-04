# Real-Device Test Matrix (template)

Status: **BLOCKED — no rows have been executed.** Do not mark a row PASS without
the device in hand. Chromium automation and mocks do not count.

Record for each run: date, tester, exact commit/build URL, OS version, browser
version, audio output (speaker/headset), and network condition. Attach the
diagnostics report (copy/download from Settings) — never an audio recording or a
learner backup.

## Devices to cover

Minimum Beta set: one iPhone (Safari), one Android phone (Chrome), desktop Chrome,
desktop Safari, desktop Firefox. Add a tablet if the Owner intends tablet support.

| # | Device / OS | Browser | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| 1 | iPhone __ / iOS __ | Safari | First run, catalog, save a word | Renders, persists after reload | | UNTESTED |
| 2 | iPhone __ / iOS __ | Safari | Microphone permission **allow** | Prompt appears, transcript captured | | UNTESTED |
| 3 | iPhone __ / iOS __ | Safari | Microphone permission **deny** | Clear message, no crash, manual path remains | | UNTESTED |
| 4 | iPhone __ / iOS __ | Safari | TTS playback (normal + 0.7×) | Audible, replay works, no overlap | | UNTESTED |
| 5 | Android __ | Chrome | First run, catalog, save a word | Renders, persists after reload | | UNTESTED |
| 6 | Android __ | Chrome | Microphone allow/deny | Prompt behaviour correct, no crash | | UNTESTED |
| 7 | Android __ | Chrome | TTS playback | Audible, replay works | | UNTESTED |
| 8 | Desktop __ | Chrome | Microphone allow/deny | Correct prompt and fallback | | UNTESTED |
| 9 | Desktop __ | Chrome | TTS voices available/absent | Plays or explains absence | | UNTESTED |
| 10 | Desktop __ | Safari | Microphone + TTS + persistence | Works or degrades with a clear message | | UNTESTED |
| 11 | Desktop __ | Firefox | Unsupported SpeechRecognition | Capability reported, exercise still usable | | UNTESTED |
| 12 | Any phone | Chrome/Safari | Slow 3G / offline transition | No white screen; storage notice if write fails | | UNTESTED |
| 13 | Any phone | Chrome/Safari | Reduced motion enabled | No confetti/bounce; content still readable | | UNTESTED |
| 14 | Any device | Any | Export backup → clear site data → import | Data restored | | UNTESTED |

## Pass rules

- A row is PASS only with device + browser version + observed result.
- “Works on my desktop” does not cover mobile microphone or TTS.
- A permission-denied or unsupported-API row passes only if the app explains the
  limitation and keeps a usable path; a silent failure is a P1.
- Any data loss is a P0 until reproduced and explained.

## Known code-side fallbacks to verify

- `isSpeechRecognitionSupported()` gates recording controls.
- `speechSynthesis` availability is shown in diagnostics.
- Notification permission state is `default | granted | denied | unsupported`.
- Storage write failure shows a banner and offers export.
- `prefers-reduced-motion` skips confetti and CSS motion.
