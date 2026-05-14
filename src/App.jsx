import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import { commitMessages, compatibilityLines, coAuthorTags } from './data/kissCam.js'
import { verdicts } from './data/soloVerdicts.js'
import { statPool } from './data/stats.js'
import './App.css'

const STATES = {
  LOADING: 'LOADING',
  IDLE: 'IDLE',
  ANALYZING: 'ANALYZING',
  REVEAL_KISS: 'REVEAL_KISS',
  REVEAL_SOLO: 'REVEAL_SOLO',
  COOLDOWN: 'COOLDOWN',
  ERROR: 'ERROR',
}

const STABLE_FRAMES_REQUIRED = 4
const BUFFER_SIZE = 6
const DETECTION_INTERVAL_MS = 150
const ANALYZING_MS = 3000
// reveal stays until user presses NEXT; auto-fallback only if nobody touches it
const REVEAL_AUTO_TIMEOUT_MS = 20000
const COOLDOWN_MS = 2000

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function App() {
  const videoRef = useRef(null)
  const [appState, setAppState] = useState(STATES.LOADING)
  const [faces, setFaces] = useState([])
  const [lockedFaces, setLockedFaces] = useState([])
  const [reveal, setReveal] = useState(null)
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 })
  const [errorMsg, setErrorMsg] = useState('')

  const appStateRef = useRef(appState)
  const facesRef = useRef([])
  const facesBufferRef = useRef([])
  const detectionTimerRef = useRef(null)
  const stateTimerRef = useRef(null)
  const lockedRef = useRef(false)

  useEffect(() => {
    appStateRef.current = appState
  }, [appState])

  useEffect(() => {
    facesRef.current = faces
  }, [faces])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        if (cancelled) return

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        const video = videoRef.current
        video.srcObject = stream
        await new Promise((resolve) => {
          if (video.readyState >= 2) resolve()
          else video.onloadedmetadata = () => resolve()
        })
        await video.play()
        setVideoSize({ w: video.videoWidth, h: video.videoHeight })
        setAppState(STATES.IDLE)
        startDetectionLoop()
      } catch (err) {
        console.error(err)
        setErrorMsg(err?.message || 'Unknown error')
        setAppState(STATES.ERROR)
      }
    }

    init()

    return () => {
      cancelled = true
      if (detectionTimerRef.current) clearInterval(detectionTimerRef.current)
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current)
      const stream = videoRef.current?.srcObject
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startDetectionLoop() {
    if (detectionTimerRef.current) clearInterval(detectionTimerRef.current)
    detectionTimerRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS)
  }

  async function runDetection() {
    const video = videoRef.current
    if (!video || video.readyState < 2) return

    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    const detections = await faceapi.detectAllFaces(video, opts)

    if (lockedRef.current) return

    const boxes = detections.map((d) => ({ x: d.box.x, y: d.box.y, width: d.box.width, height: d.box.height }))
    setFaces(boxes)
    pushBuffer(boxes.length)
    maybeTrigger(boxes)
  }

  function pushBuffer(count) {
    const buf = facesBufferRef.current
    buf.push(count)
    if (buf.length > BUFFER_SIZE) buf.shift()
  }

  function maybeTrigger(currentBoxes) {
    if (appStateRef.current !== STATES.IDLE) return
    const buf = facesBufferRef.current
    if (buf.length < STABLE_FRAMES_REQUIRED) return

    const counts = {}
    for (const c of buf) counts[c] = (counts[c] || 0) + 1
    let bestCount = 0
    let bestN = 0
    for (const [c, n] of Object.entries(counts)) {
      if (n > bestN) {
        bestN = n
        bestCount = Number(c)
      }
    }

    if (bestN >= STABLE_FRAMES_REQUIRED && bestCount >= 1) {
      trigger(bestCount, currentBoxes)
    }
  }

  function trigger(faceCount, boxes) {
    lockedRef.current = true
    facesBufferRef.current = []
    setLockedFaces(boxes || facesRef.current)
    setAppState(STATES.ANALYZING)

    if (stateTimerRef.current) clearTimeout(stateTimerRef.current)
    stateTimerRef.current = setTimeout(() => {
      if (faceCount >= 2) {
        setReveal({
          mode: 'kiss',
          commit: pick(commitMessages),
          compat: pick(compatibilityLines),
          coAuthor: pick(coAuthorTags),
        })
        setAppState(STATES.REVEAL_KISS)
      } else {
        setReveal({ mode: 'solo', verdict: pick(verdicts) })
        setAppState(STATES.REVEAL_SOLO)
      }
      // auto-fallback if nobody hits NEXT
      stateTimerRef.current = setTimeout(advanceToCooldown, REVEAL_AUTO_TIMEOUT_MS)
    }, ANALYZING_MS)
  }

  function advanceToCooldown() {
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current)
    setAppState(STATES.COOLDOWN)
    stateTimerRef.current = setTimeout(() => {
      setReveal(null)
      setLockedFaces([])
      lockedRef.current = false
      setAppState(STATES.IDLE)
    }, COOLDOWN_MS)
  }

  function isRevealing() {
    return (
      appStateRef.current === STATES.REVEAL_KISS ||
      appStateRef.current === STATES.REVEAL_SOLO
    )
  }

  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space') {
        e.preventDefault()
        if (appStateRef.current === STATES.IDLE) {
          const count = facesRef.current.length
          trigger(count >= 2 ? count : 1, facesRef.current)
        }
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault()
        if (isRevealing()) advanceToCooldown()
      } else if (e.code === 'Escape') {
        if (stateTimerRef.current) clearTimeout(stateTimerRef.current)
        lockedRef.current = false
        setReveal(null)
        setLockedFaces([])
        setAppState(STATES.IDLE)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (appState === STATES.ERROR) {
    return (
      <div className="screen-error">
        <h1>GRANT CAMERA ACCESS, COWARD</h1>
        <pre>$ ERR: {errorMsg}</pre>
        <p>refresh once permissions are sorted</p>
      </div>
    )
  }

  const showLiveBoxes = appState === STATES.IDLE
  const showLockedBoxes =
    appState === STATES.ANALYZING ||
    appState === STATES.REVEAL_KISS ||
    appState === STATES.REVEAL_SOLO

  return (
    <div className="stage">
      <video ref={videoRef} className="webcam" playsInline muted />

      {appState === STATES.LOADING && (
        <div className="screen-loading">
          <h1>VIBE CHECK 9000</h1>
          <p>booting tiny_face_detector_v847.pkl…</p>
        </div>
      )}

      {showLiveBoxes && (
        <FaceBrackets faces={faces} videoSize={videoSize} color="pink" />
      )}
      {showLockedBoxes && (
        <FaceBrackets faces={lockedFaces} videoSize={videoSize} color="yellow" locked />
      )}

      {appState === STATES.REVEAL_KISS && (
        <HeartBetween faces={lockedFaces} videoSize={videoSize} />
      )}

      {appState !== STATES.LOADING && (
        <div className="title-bar">
          <span className="title">VIBE CHECK 9000</span>
          <span className="subtitle">★ AI BATTLE EDITION ★</span>
        </div>
      )}

      {appState !== STATES.LOADING && (
        <StatsHUD
          locked={
            appState === STATES.REVEAL_KISS ||
            appState === STATES.REVEAL_SOLO ||
            appState === STATES.COOLDOWN
          }
        />
      )}

      {appState === STATES.IDLE && (
        <div className="hint">
          {faces.length === 0 && 'show your face to the camera'}
          {faces.length === 1 && 'analyzing in 3… 2… 1…'}
          {faces.length >= 2 && 'KISS CAM ARMED'}
        </div>
      )}

      {appState === STATES.ANALYZING && <AnalyzingOverlay />}

      {appState === STATES.REVEAL_KISS && reveal?.mode === 'kiss' && (
        <KissReveal reveal={reveal} onNext={advanceToCooldown} />
      )}

      {appState === STATES.REVEAL_SOLO && reveal?.mode === 'solo' && (
        <SoloReveal verdict={reveal.verdict} onNext={advanceToCooldown} />
      )}

      {appState === STATES.COOLDOWN && (
        <div className="cooldown">ANALYSIS COMPLETE</div>
      )}
    </div>
  )
}

function FaceBrackets({ faces, videoSize, color, locked }) {
  if (!videoSize.w) return null
  return (
    <div className="face-layer">
      {faces.map((b, i) => {
        const style = {
          left: `${(b.x / videoSize.w) * 100}%`,
          top: `${(b.y / videoSize.h) * 100}%`,
          width: `${(b.width / videoSize.w) * 100}%`,
          height: `${(b.height / videoSize.h) * 100}%`,
        }
        return (
          <div
            key={i}
            className={`face-bracket bracket-${color} ${locked ? 'is-locked' : ''}`}
            style={style}
          >
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
            <span className="bracket-label">
              {locked ? 'TARGET LOCKED' : `SUBJECT ${String(i + 1).padStart(2, '0')}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function HeartBetween({ faces, videoSize }) {
  if (!videoSize.w || faces.length < 2) return null
  const sorted = [...faces].sort((a, b) => b.width * b.height - a.width * a.height)
  const [a, b] = sorted
  const cxA = (a.x + a.width / 2) / videoSize.w
  const cyA = (a.y + a.height / 2) / videoSize.h
  const cxB = (b.x + b.width / 2) / videoSize.w
  const cyB = (b.y + b.height / 2) / videoSize.h
  const midX = (cxA + cxB) / 2
  const midY = (cyA + cyB) / 2
  // size based on distance between faces
  const dx = cxA - cxB
  const dy = cyA - cyB
  const dist = Math.sqrt(dx * dx + dy * dy)
  const size = Math.max(0.08, Math.min(0.25, dist * 0.7))
  return (
    <div
      className="heart-wrap"
      style={{
        left: `${midX * 100}%`,
        top: `${midY * 100}%`,
        width: `${size * 100}vmin`,
        height: `${size * 100}vmin`,
      }}
    >
      <svg viewBox="0 0 32 29.6" className="heart-svg" aria-hidden="true">
        <path
          d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4
             c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"
        />
      </svg>
    </div>
  )
}

function AnalyzingOverlay() {
  return (
    <div className="overlay analyzing">
      <div className="analyzing-text">AI ANALYZING…</div>
      <div className="analyzing-sub">$ scanning facial features ▮</div>
    </div>
  )
}

function useTypewriter(text, speedMs = 28) {
  const [out, setOut] = useState('')
  useEffect(() => {
    setOut('')
    if (!text) return
    let i = 0
    const id = setInterval(() => {
      i++
      setOut(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speedMs)
    return () => clearInterval(id)
  }, [text, speedMs])
  return out
}

function KissReveal({ reveal, onNext }) {
  const typed = useTypewriter(reveal.commit, 28)
  const done = typed.length >= reveal.commit.length
  return (
    <div className="overlay reveal">
      <div className="kiss-label">★ KISS CAM ★</div>
      <div className="commit-block">
        <div className="commit-cmd">$ git commit -m</div>
        <div className="commit-line">
          {typed}
          <span className="caret" />
        </div>
        {done && <div className="commit-author">{reveal.coAuthor}</div>}
      </div>
      {done && (
        <div className="compat">
          <span className="compat-pct">{reveal.compat.pct}%</span>
          <span className="compat-line">{reveal.compat.line}</span>
        </div>
      )}
      <NextCta onClick={onNext} />
    </div>
  )
}

function SoloReveal({ verdict, onNext }) {
  return (
    <div className="overlay reveal">
      <div className="solo-label">VERDICT</div>
      <div className="solo-title glitch" data-text={verdict.title}>
        {verdict.title}
      </div>
      <div className="solo-conf">confidence: {verdict.confidence}%</div>
      <div className="solo-line">{verdict.line}</div>
      <NextCta onClick={onNext} />
    </div>
  )
}

function StatsHUD({ locked }) {
  const [slots, setSlots] = useState(() => pickInitialSlots(4))
  const [rendered, setRendered] = useState(() =>
    slots.map((s) => ({ label: s.label, value: String(s.value()) })),
  )

  // tick values + keep rendered in sync with slots (only when unlocked)
  useEffect(() => {
    if (locked) return
    setRendered(slots.map((s) => ({ label: s.label, value: String(s.value()) })))
    const id = setInterval(() => {
      setRendered(slots.map((s) => ({ label: s.label, value: String(s.value()) })))
    }, 1200)
    return () => clearInterval(id)
  }, [slots, locked])

  // rotate one slot to a new stat every few seconds (only when unlocked)
  useEffect(() => {
    if (locked) return
    const id = setInterval(() => {
      setSlots((cur) => {
        const next = [...cur]
        const replaceIdx = Math.floor(Math.random() * next.length)
        const available = statPool.filter((s) => !next.includes(s) || s === next[replaceIdx])
        if (available.length) {
          next[replaceIdx] = available[Math.floor(Math.random() * available.length)]
        }
        return next
      })
    }, 3200)
    return () => clearInterval(id)
  }, [locked])

  return (
    <div className={`stats-hud ${locked ? 'is-locked' : ''}`} aria-hidden="true">
      <div className="stats-hud-title">
        ◤ SYSTEM TELEMETRY
        <span className="stats-hud-state">{locked ? '◆ LOCKED' : '● LIVE'}</span>
      </div>
      {rendered.map((s, i) => (
        <div key={`${s.label}-${i}`} className="stats-row">
          <span className="stats-label">{s.label}</span>
          <span className="stats-value">{s.value}</span>
        </div>
      ))}
      <div className="stats-hud-footer">◣ v9.000-vibe</div>
    </div>
  )
}

function pickInitialSlots(n) {
  const copy = [...statPool]
  const out = []
  // always start with the iconic one
  const days = copy.findIndex((s) => s.label === 'DAYS SINCE BUG IN PROD')
  if (days >= 0) out.push(copy.splice(days, 1)[0])
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

function NextCta({ onClick }) {
  return (
    <button type="button" className="next-cta" onClick={onClick}>
      <span className="next-cta-arrow">▸</span>
      <span className="next-cta-label">NEXT</span>
      <span className="next-cta-hint">[ENTER]</span>
    </button>
  )
}
