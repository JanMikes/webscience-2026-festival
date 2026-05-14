# VIBE CHECK 9000 — Implementation Plan

> Web-based "Kiss Cam for Devs" — face detection + predefined AI-style roasts. Live demo at AI Battle stage, WebScience Festival, vibe coding theme.

## Concept

Browser app uses webcam + face detection. When face(s) detected and stable for ~1.5s, fakes a 3-second "AI ANALYZING..." sequence, then reveals:
- **2+ faces** → KISS CAM mode: animated heart between them + fake co-authored commit message + compatibility %
- **1 face** → SOLO mode: dev archetype roast ("TYPESCRIPT ZEALOT", "VIBE CODER — Brněnská varianta", etc.)

**No live AI calls.** Everything pulled from predefined JSON pools. Fake 3-second processing for the AI feel.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Aspect ratio | Adaptive fullscreen |
| Language | Mixed EN + CZ easter eggs (EN commits, CZ flavor in logs/archetypes) |
| Title | **VIBE CHECK 9000** — subtitle "AI BATTLE EDITION" |
| Sound | Web Audio synth (8-bit beeps + kiss-cam jingle + reveal boom) |
| Trigger | Fully automatic — stable face for ~1s; spacebar is silent override |
| Pair logic | 80/20 mix — 80% kiss cam on 2+ faces, 20% chaos solo-pick |
| Reveal layout | Webcam fullscreen, verdict overlaid |

## Tech Stack

- **Vite + React** (vanilla JS, no TS)
- **face-api.js** — TinyFaceDetector model (~190KB), **bundled locally in `public/models/`** (conference WiFi will fail)
- **Custom CSS** (no Tailwind — punk control)
- **Google Fonts**: `Press Start 2P` (titles), `VT323` (terminal)
- No backend, no env vars

## File Structure

```
webscience-festival/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── models/
│       ├── tiny_face_detector_model-weights_manifest.json
│       └── tiny_face_detector_model-shard1
└── src/
    ├── main.jsx
    ├── App.jsx                      ← state machine + camera + detection loop
    ├── App.css                      ← all punk styles
    ├── audio.js                     ← Web Audio synth helper
    ├── data/
    │   ├── kissCam.js               ← commit messages + compatibility lines + co-author tags
    │   ├── soloVerdicts.js          ← dev archetypes
    │   ├── terminalLogs.js          ← fake "AI analyzing..." log lines (EN + CZ mix)
    │   └── chaosMode.js             ← polyamorous + divorce + look-away copy
    └── components/
        ├── FaceBoxes.jsx            ← animated corner brackets per face
        ├── AnalyzingOverlay.jsx     ← 3-sec processing UI w/ streaming log
        ├── KissCamReveal.jsx        ← heart + typewriter commit reveal
        ├── SoloReveal.jsx           ← archetype verdict card
        └── HUD.jsx                  ← scanlines, marquee title, corner chrome
```

## State Machine

```
IDLE
  ↓ (face count stable for 1.0s, OR spacebar)
ANALYZING (3s)        — glitch overlay, streaming log, pulsing brackets
  ↓                    (face count snapshotted here — locks the mode)
REVEAL_KISS (8s)      — if 2+ faces: heart + commit + compatibility %
REVEAL_SOLO (6s)      — if 1 face OR chaos-mode-picked: archetype verdict
  ↓ (auto)
COOLDOWN (2s)         — "ANALYSIS COMPLETE", lockout to prevent re-trigger
  ↓
IDLE
```

- Spacebar manually re-triggers from any state
- ESC returns to IDLE
- F toggles fullscreen

## Detection Logic (face-api.js)

- Load model once: `faceapi.nets.tinyFaceDetector.loadFromUri('/models')`
- `detectAllFaces(video, new TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))` every **150ms**
- Rolling buffer of last 6 frames; trigger ANALYZING when ≥4 frames show same face count
- During ANALYZING + REVEAL: freeze detection so brackets stay locked
- Pair selection (when >2 faces): pick the two with largest bounding boxes

## Predefined Data — Sample Shapes

### `data/kissCam.js`
```js
export const commitMessages = [
  "feat: fall in love in production (closes #404)",
  "fix: race condition between feelings",
  "feat: implement OAuth between souls",
  "BREAKING CHANGE: hearts now connected",
  "perf: optimize eye contact rendering by 200%",
  "feat: cross-origin resource sharing (lips)",
  "refactor: extract common emotions into shared hook",
  "feat: enable HMR (Hot Module Romance)",
  "chore: upgrade relationship from JSON to JSX",
  "feat: replace useState with useUs",
  "fix: deprecated single status, now married",
  "feat: add foreign key from her_heart to his_heart",
  "fix: undefined feelings are no longer falsy",
  "feat: introduce two-way data binding (literal)",
  "chore: bump up the vibes from 2.0 to 3.0",
  "feat(love): implement useLove() with stale-while-revalidate",
  "feat: add romantic indexes to relationship table",
  "fix: merge conflict resolved with kiss",
  "feat: prevent memory leak in attachment system",
  "refactor: rename 'friend' to 'something more'",
  "feat: enable strict mode in this relationship",
  "fix: hydration mismatch between hearts",
  "feat: add Suspense boundary around first date",
  "chore: deprecate ex.gitignore",
  "feat: ship love to production without tests (yolo)",
];

export const compatibilityLines = [
  { pct: 94, line: "You will ship 3 features before passive-aggressive PR comments begin." },
  { pct: 12, line: "One uses Vim, the other doesn't. This will not work." },
  { pct: 87, line: "Both believe semicolons are optional. Soulmates." },
  { pct: 73, line: "Will agree on indentation, fight to the death over tabs vs spaces." },
  { pct: 100, line: "You both hate `npm install` with equal passion. Marry now." },
  { pct: 62, line: "You will write your wedding vows in Markdown." },
  { pct: 45, line: "Frontend × Backend. Difficult but possible via REST." },
  { pct: 8,  line: "One prays at the altar of TypeScript. The other ships JS to prod. Doomed." },
  { pct: 99, line: "Aligned on tabs. Aligned on dark mode. Aligned on disliking Jira. Marry." },
  { pct: 71, line: "Will co-author a side project. Will not finish it. But will stay together." },
  { pct: 34, line: "He commits to main. She uses feature branches. Therapy required." },
  { pct: 88, line: "Both have 47 unread Slack DMs. Mutual chaos = compatibility." },
  // …~15 more
];

export const coAuthorTags = [
  "Co-Authored-By: someone-who-still-uses-jQuery",
  "Co-Authored-By: a-dev-with-47-unread-slack-messages",
  "Co-Authored-By: ChatGPT (definitely-not-cheating)",
  "Co-Authored-By: the-intern-who-pushed-to-main",
  "Co-Authored-By: vibe-coder-9000",
  "Co-Authored-By: stack-overflow-copypaste-bot",
  // …
];
```

### `data/soloVerdicts.js`
```js
export const verdicts = [
  { title: "TYPESCRIPT ZEALOT",          confidence: 97, line: "Squint detected. Tweeted about strict mode this week." },
  { title: "VIBE CODER — Brněnská varianta", confidence: 99, line: "Detected at this exact conference. Ships features by feeling. CTRL+S is spiritual." },
  { title: "VIM USER",                   confidence: 88, line: "Hasn't exited Vim since 2019. Family misses them." },
  { title: "STILL USES jQUERY",          confidence: 91, line: "2026 and still $('#button').click(). Respect." },
  { title: "10X ENGINEER",               confidence: 84, line: "Writes code so good only they can maintain it. By design." },
  { title: "RUST EVANGELIST",            confidence: 93, line: "Has rewritten 3 personal projects in Rust this year. None deployed." },
  { title: "REACT DEVELOPER",            confidence: 79, line: "47 useEffect hooks in your last component. We need to talk." },
  { title: "TAILWIND DEFENDER",          confidence: 82, line: "Your className is longer than your component. Allegedly readable." },
  { title: "BACKEND PURIST",             confidence: 90, line: "Believes CSS is a war crime. Terminal has 47 tmux panes." },
  { title: "SCRUM MASTER",               confidence: 71, line: "Excessive nodding detected. Zero code committed in 8 months." },
  { title: "DEVOPS GHOST",               confidence: 88, line: "Lives in a YAML file. Last seen merging Kubernetes configs at 3 AM." },
  { title: "INDIE HACKER",               confidence: 76, line: "14 unfinished side projects. Twitter bio: 'Building in public'." },
  { title: "AI BRO",                     confidence: 95, line: "Cursor, Copilot, and Cody installed simultaneously. None help." },
  { title: "GO MINIMALIST",              confidence: 81, line: "Refuses to use generics on principle. 'It was fine before.'" },
  { title: "STAFF ENGINEER",             confidence: 87, line: "Hasn't written code in 2 years. Writes RFCs nobody reads." },
  { title: "JUNIOR DEV",                 confidence: 99, line: "Confidence: maximum. YOE: 0.3. Tweets about clean code daily." },
  { title: "CRYPTO REFUGEE",             confidence: 73, line: "Survived 3 winters. Now 'into AI'. Sure." },
  { title: "FULL-STACK LIAR",            confidence: 85, line: "Strong frontend, prays about backend." },
  { title: "JAVA ENTERPRISE WARRIOR",    confidence: 92, line: "AbstractFactoryBuilderImpl runs in your veins." },
  { title: "PHP DEFENDER",               confidence: 88, line: "Yes, in 2026. WordPress runs 43% of the internet, and you know it." },
  { title: "PRAŽSKÝ FULL-STACK",         confidence: 86, line: "Káva ze Starbucks. MacBook se samolepkama. 'Já dělám v Reactu.'" },
  { title: "OSTRAVSKÝ DEVOPS",           confidence: 94, line: "Bash skripty napsané v 90s. Stále běží. Nikdo neví proč." },
  { title: "PROMPT ENGINEER",            confidence: 68, line: "LinkedIn title only. Has written 'You are a helpful assistant' 4,000 times." },
  { title: "STILL DEBUGGING THE SAME BUG", confidence: 99, line: "Since Tuesday. Maybe last Tuesday. Time has lost meaning." },
  { title: "OPEN SOURCE MAINTAINER",     confidence: 77, line: "47 GitHub issues open. Last response: 2 years ago. Burned out but still here." },
];
```

### `data/terminalLogs.js`
```js
export const logs = [
  "$ loading tiny_face_detector_v847.pkl... [OK]",
  "$ vectorizing facial features...",
  "$ querying github.com/api/users... [302]",
  "$ scanning stackoverflow reputation...",
  "$ detecting framework allegiance...",
  "$ analyzing keyboard wear pattern...",
  "$ computing vim/emacs probability...",
  "$ cross-referencing linkedin endorsements...",
  "$ ⚠ npm audit found 47 vulnerabilities",
  "$ measuring caffeine tremor amplitude...",
  "$ ./ai_magic.sh --do-not-look-inside",
  "$ kontroluji české vývojářské DNA...",
  "$ scanning .gitignore for shame...",
  "$ generating verdict... [██████████] 100%",
  "$ WARN: model is just an if/else statement",
  "$ připojuji se k mainframu...",
];
```
Stream one line every ~250ms during the 3s wait.

### `data/chaosMode.js`
```js
export const polyamorousMessages = [
  "feat: implement n-way data binding (n=3)",
  "BREAKING CHANGE: relationship is now distributed",
  "feat: introduce useUs() hook with array dependency",
  "refactor: extract common feelings into shared context",
];

export const divorceLines = [
  "DIVORCE DETECTED — git revert HEAD~∞",
  "MERGE CONFLICT — irreconcilable differences in coding style",
  "BRANCH DELETED — relationship moved to /dev/null",
];

export const lookAwayLines = [
  "$ WARN: subject avoiding eye contact — confidence increased",
  "$ ERR: tsundere coefficient over threshold",
];
```

## Visual Design

| Element | Style |
|---|---|
| Background | Pure black `#000` |
| Primary accent | Hot pink `#FF1493` |
| Secondary | Electric cyan `#00FFFF` |
| Alert | Acid yellow `#FFFF00` |
| Title font | `Press Start 2P` |
| Mono font | `VT323` |
| Scanlines | Repeating CSS gradient overlay, animated drift |
| Webcam | Slight desaturation + contrast bump for VHS feel |
| Face brackets | Animated red corner brackets `⌐ ¬` that snap to face |
| Heart (kiss cam) | Big SVG path, CSS keyframe `scale + glow` pulse |
| Glitch text | RGB-split `text-shadow` + flicker animation |
| Marquee | "VIBE CHECK 9000 ★ AI BATTLE EDITION ★" infinite scroll |
| Bottom HUD | Fake terminal log (green-on-black CRT) |

## Phased Build

### Phase 1 — "It works and it's funny" (~8 min) ⚡
**Goal: runnable, demoable, gets laughs**
- Vite + React init
- Webcam + face-api.js loaded, plain styled box around detected faces
- Auto-trigger after 1.5s stable face
- 3-sec "ANALYZING..." overlay (text only, no fancy log yet)
- Random reveal from a **smaller** 10-entry list each:
  - 2+ faces → random commit message
  - 1 face → random dev archetype
- Black background, hot pink Press Start 2P text, big and bold
- Hold 5 sec, cooldown 2 sec, reset, loop

**Phase 1 leaves the app fully working.**

### Phase 2 — "The wow moment" (~10 min) 🎯
- Animated pulsing **heart SVG** positioned between the two largest faces
- Typewriter reveal of the commit message
- Compatibility % line
- Sci-fi corner brackets replace plain boxes
- Expand pools to ~25 entries each

### Phase 3 — "Punk polish" (~10 min) ✨
- Web Audio synth: detect ping, kiss-cam jingle, reveal boom
- Streaming terminal log at bottom during the 3-sec analyze
- VHS scanlines + marquee title chrome
- Glitch RGB-split text effects
- Czech easter eggs sprinkled in

### Phase 4 — "Show-stoppers" (optional, ~10 min) 🎪
- Chaos mode (20% solo roast on pair)
- 3+ face → POLYAMOROUS PAIR PROGRAMMING mode
- Distance-based heart pulsing + "DIVORCE DETECTED" overlay if faces move apart
- Look-away detection → glitch intensifies + extra log line

## Build Order (when greenlit)

1. `npm create vite@latest . -- --template react` (run from inside `webscience-festival/`)
2. `npm install` + `npm install face-api.js`
3. `curl` the TinyFaceDetector model files into `public/models/`:
   ```
   https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
   https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
   ```
4. Build Phase 1 → run `npm run dev` → verify on stage screen
5. Layer Phase 2, then 3, then 4 as time allows. Each phase leaves a working app.

## Risks & Fallbacks

- **Camera permission denied** → Big red "GRANT CAMERA ACCESS, COWARD" screen with fake terminal error
- **face-api.js model fails to load** → Fallback: timer-based fake detection (triggers every N seconds) so demo still runs
- **Conference WiFi dies** → Zero impact, everything local
- **Only one face on stage** → SOLO mode fully designed, no degraded UX
- **Audio fails** → Silent fallback, no crash

## Bonus Interactivity (Phase 2+)

- Brackets track faces in real-time even during reveal (audience can move around)
- Distance-based heart pulse + auto-divorce when faces separate
- 3+ faces → polyamorous git rebase joke
- Look-away → glitch intensifies + tsundere terminal warning
