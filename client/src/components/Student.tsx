import React, { useEffect, useRef, useState } from 'react'
import { createLiveSocket } from '../socket'
import { post } from '../api'

export default function Student() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<any>(null) // Prevent reinitialization

  const [studentId, setStudentId] = useState('S1')
  const [attention, setAttention] = useState(75)
  const [state, setState] = useState<'attentive' | 'bored' | 'confused' | 'neutral'>('attentive')
  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState('')

  // Initialize WebSocket ONCE
  useEffect(() => {
    socketRef.current = createLiveSocket()
    const s = socketRef.current

    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.emit('ping')
    s.on('pong', () => {})

    return () => s.close()
  }, [])

  // Emit snapshot every 2 seconds
  useEffect(() => {
    const iv = setInterval(async () => {
      if (!socketRef.current) return

      socketRef.current.emit('snapshot', {
        studentId,
        attention,
        state,
      })

      // Send to backend analytics
      if (sessionId) {
        await post('/analytics/events', {
          sessionId,
          studentId,
          metrics: { attention, state }
        })
      }
    }, 2000)

    return () => clearInterval(iv)
  }, [studentId, attention, state, sessionId])

  // Webcam preview
  useEffect(() => {
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e) {
        console.error('Webcam error:', e)
      }
    }
    start()
  }, [])

  return (
    <div className="student-container">
      <div className="row">
        <label>Session ID</label>
        <input value={sessionId} onChange={e => setSessionId(e.target.value)} />
      </div>

      <div className="row">
        <label>Student ID</label>
        <input value={studentId} onChange={e => setStudentId(e.target.value)} />
        <span className={connected ? 'badge ok' : 'badge bad'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="bar">
        <div className="bar-fill" style={{ width: `${attention}%` }} />
      </div>

      <div className="row">
        <label>Attention</label>
        <input
          type="range"
          min={0}
          max={100}
          value={attention}
          onChange={e => setAttention(Number(e.target.value))}
        />
        <span>{attention}</span>
      </div>

      <div className="row">
        <label>State</label>
        <select value={state} onChange={e => setState(e.target.value as any)}>
          <option value="attentive">Attentive</option>
          <option value="neutral">Neutral</option>
          <option value="bored">Bored</option>
          <option value="confused">Confused</option>
        </select>
      </div>

      <video ref={videoRef} className="video" muted playsInline />

      <p className="hint">Webcam preview; ML analysis will replace sliders soon.</p>
    </div>
  )
}
