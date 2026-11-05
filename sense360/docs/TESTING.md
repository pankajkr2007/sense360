# Testing

Automated checks already run: `npm run build` (TypeScript strict + Vite) and `python -m py_compile backend/main.py`.
The model-dependent steps below need a browser, a camera/microphone and the backend running, so they are manual.

| # | Test | Expected |
|---|---|---|
| 1 | Open every nav link and every card on Welcome and Modes | All routes load, no dead buttons |
| 2 | Vision: deny camera permission | Red message explains how to allow it; Upload photo still works |
| 3 | Vision: Start camera, then navigate away | Camera light turns off |
| 4 | Vision: go offline before first Load detector | Model error message with retry |
| 5 | Vision: upload a photo with people/chairs | Boxes with confidence; Announce objects speaks and adds history |
| 6 | Vision: photo with printed text → Read text aloud | Text shown, spoken, saved as text only |
| 7 | Sound: backend stopped, open page | "Audio server offline" badge; recording shows connection error; demo mode works |
| 8 | Sound: backend running | "YAMNet loaded" badge |
| 9 | Sound: upload a siren, horn, alarm and doorbell clip | Matching event scores; alert banner; "Real YAMNet inference" label |
| 10 | Sound: raise threshold above the score | "Uncertain" or "No tracked sound", no alert |
| 11 | Sound: deny microphone | Clear permission message |
| 12 | Sound: Record, then leave the page | Microphone released |
| 13 | Demo buttons | Every result labelled Simulated |
| 14 | Wristband: Connect, Test each event | Distinct patterns, animation, phone vibrates on Android |
| 15 | Settings: toggle high contrast, mute low urgency, reset | Applied immediately; doorbell alert suppressed when muted |
| 16 | History after reload | Entries persist; Clear all empties them |
| 17 | Mobile width (~375 px) | No horizontal scroll, buttons ≥ 48 px, keyboard focus visible |

Record results and the date for each run before the demo.
