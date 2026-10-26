import { useCallback, useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { loadCalibration, saveCalibration } from './calibration'
import {
  DEFAULT_THRESHOLDS,
  GestureSmoother,
  classifyRatios,
  fingerRatios,
  type FingerRatios,
  type Gesture,
  type Landmark,
  type Thresholds,
} from './gesture'

export type TrackingStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'no-camera' | 'error'

const BASE = import.meta.env.BASE_URL
const WASM_PATH = `${BASE}mediapipe/wasm`
const MODEL_PATH = `${BASE}models/hand_landmarker.task`
const DETECT_INTERVAL_MS = 33

export interface HandTracking {
  status: TrackingStatus
  message: string
  gesture: Gesture
  handVisible: boolean
  calibrated: boolean
  thresholds: Thresholds
  video: HTMLVideoElement
  /** Latest smoothed gesture, readable every frame without triggering renders. */
  gestureRef: React.RefObject<Gesture>
  landmarksRef: React.RefObject<readonly Landmark[] | null>
  ratiosRef: React.RefObject<FingerRatios | null>
  start: () => Promise<void>
  stop: () => void
  applyCalibration: (thresholds: Thresholds) => void
}

let landmarkerPromise: Promise<HandLandmarker> | null = null

function loadLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)
      const create = (delegate: 'GPU' | 'CPU') =>
        HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate },
          runningMode: 'VIDEO',
          numHands: 1,
        })
      try {
        return await create('GPU')
      } catch (gpuError) {
        console.warn('GPU delegate unavailable, using CPU', gpuError)
        return create('CPU')
      }
    })().catch((error: unknown) => {
      landmarkerPromise = null
      throw error
    })
  }
  return landmarkerPromise
}

function describeCameraError(error: unknown): { status: TrackingStatus; message: string } {
  const name = error instanceof DOMException ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return { status: 'denied', message: 'Camera access was blocked. Allow it in your browser and try again.' }
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return { status: 'no-camera', message: 'No webcam detected. Connect one, or switch to manual controls.' }
  }
  const detail = error instanceof Error ? error.message : 'unknown error'
  return { status: 'error', message: `Camera error: ${detail}` }
}

export function useHandTracking(): HandTracking {
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [message, setMessage] = useState('Camera is off.')
  const [gesture, setGesture] = useState<Gesture>('none')
  const [handVisible, setHandVisible] = useState(false)
  const [calibration] = useState(() => loadCalibration())
  const [thresholds, setThresholds] = useState<Thresholds>(calibration ?? DEFAULT_THRESHOLDS)
  const [calibrated, setCalibrated] = useState(calibration !== null)

  const [video] = useState(() => {
    const el = document.createElement('video')
    el.playsInline = true
    el.muted = true
    return el
  })
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef(0)
  const statusRef = useRef<TrackingStatus>('idle')
  const generationRef = useRef(0)
  const thresholdsRef = useRef(thresholds)
  const smootherRef = useRef(new GestureSmoother())
  const gestureRef = useRef<Gesture>('none')
  const landmarksRef = useRef<readonly Landmark[] | null>(null)
  const ratiosRef = useRef<FingerRatios | null>(null)

  const updateStatus = useCallback((next: TrackingStatus, text: string) => {
    statusRef.current = next
    setStatus(next)
    setMessage(text)
  }, [])

  const releaseCamera = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    video.srcObject = null
    smootherRef.current.reset()
    gestureRef.current = 'none'
    landmarksRef.current = null
    ratiosRef.current = null
    setGesture('none')
    setHandVisible(false)
  }, [video])

  const stop = useCallback(() => {
    generationRef.current++
    releaseCamera()
    updateStatus('idle', 'Camera is off.')
  }, [releaseCamera, updateStatus])

  const startDetectionLoop = useCallback(
    (landmarker: HandLandmarker, generation: number) => {
      let lastRun = 0
      let lastVideoTime = -1
      let visible = false

      const loop = (now: number) => {
        if (generation !== generationRef.current) return
        frameRef.current = requestAnimationFrame(loop)
        if (now - lastRun < DETECT_INTERVAL_MS) return
        if (video.readyState < 2 || video.currentTime === lastVideoTime) return
        lastRun = now
        lastVideoTime = video.currentTime

        const aspect = video.videoWidth / (video.videoHeight || 1)
        const hand = landmarker.detectForVideo(video, now).landmarks[0] ?? null
        const ratios = hand ? fingerRatios(hand, aspect) : null
        landmarksRef.current = hand
        ratiosRef.current = ratios

        const raw: Gesture = ratios ? classifyRatios(ratios, thresholdsRef.current) : 'none'
        const smoothed = smootherRef.current.push(raw)
        if (smoothed !== gestureRef.current) {
          gestureRef.current = smoothed
          setGesture(smoothed)
        }
        if ((hand !== null) !== visible) {
          visible = hand !== null
          setHandVisible(visible)
        }
      }
      frameRef.current = requestAnimationFrame(loop)
    },
    [video],
  )

  const start = useCallback(async () => {
    if (statusRef.current === 'loading' || statusRef.current === 'ready') return
    if (!navigator.mediaDevices?.getUserMedia) {
      updateStatus('error', 'Camera access needs a secure (https) connection.')
      return
    }
    const generation = ++generationRef.current
    updateStatus('loading', 'Requesting camera...')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      })
    } catch (error) {
      if (generation !== generationRef.current) return
      const { status: next, message: text } = describeCameraError(error)
      updateStatus(next, text)
      return
    }
    if (generation !== generationRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    streamRef.current = stream
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (generation !== generationRef.current) return
      releaseCamera()
      updateStatus('error', 'Camera disconnected. Reconnect it and enable the camera again.')
    })

    try {
      updateStatus('loading', 'Loading hand model...')
      video.srcObject = stream
      const [landmarker] = await Promise.all([loadLandmarker(), video.play()])
      if (generation !== generationRef.current) return
      updateStatus('ready', 'Camera on. Show your hand.')
      startDetectionLoop(landmarker, generation)
    } catch (error) {
      if (generation !== generationRef.current) return
      releaseCamera()
      const detail = error instanceof Error ? error.message : 'unknown error'
      updateStatus('error', `Could not start hand tracking: ${detail}`)
    }
  }, [releaseCamera, startDetectionLoop, updateStatus, video])

  const applyCalibration = useCallback((next: Thresholds) => {
    thresholdsRef.current = next
    setThresholds(next)
    setCalibrated(true)
    saveCalibration(next)
  }, [])

  useEffect(() => {
    return () => {
      generationRef.current++
      releaseCamera()
    }
  }, [releaseCamera])

  return {
    status,
    message,
    gesture,
    handVisible,
    calibrated,
    thresholds,
    video,
    gestureRef,
    landmarksRef,
    ratiosRef,
    start,
    stop,
    applyCalibration,
  }
}
