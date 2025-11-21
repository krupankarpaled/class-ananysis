import React, { useEffect, useMemo, useState } from 'react'
import { createLiveSocket } from '../socket'
import { post, get } from '../api'

type Snapshot = {
  studentId: string
  attention: number
  state: 'attentive'|'bored'|'confused'|'neutral'
  ts?: number
}

export default function Teacher() {
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({})
  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [summary, setSummary] = useState<any[]>([])

  useEffect(() => {
    const s = createLiveSocket()
    s.on('connect', () => setConnected(true))
    s.on('disconnect', () => setConnected(false))
    s.on('snapshot', (payload: Snapshot) => {
      if (!payload || !payload.studentId) return
      setSnapshots(prev => ({ ...prev, [payload.studentId]: payload }))
    })
    return () => s.close()
  }, [])

  async function startSession() {
    const r = await post('/sessions/start', { courseId: 'course' })
    setSessionId(r.sessionId)
  }

  async function endSession() {
    if (!sessionId) return
    await post('/sessions/end', { sessionId })
  }

  async function loadSummary() {
    if (!sessionId) return
    const r = await get(`/analytics/summary?sessionId=${sessionId}`)
    setSummary(r.summary || [])
  }

  const list = useMemo(() => Object.values(snapshots), [snapshots])

  const avgAttention = useMemo(() => {
    if (!list.length) return 0
    return Math.round(list.reduce((a, b) => a + (b.attention || 0), 0) / list.length)
  }, [list])

  const counts = useMemo(() => {
    const c: Record<string, number> = { attentive: 0, bored: 0, confused: 0, neutral: 0 }
    for (const s of list) c[s.state] = (c[s.state] || 0) + 1
    return c
  }, [list])

  const alertText = useMemo(() => {
    const total = list.length || 1
    const boredPct = Math.round((counts.bored / total) * 100)
    const confusedPct = Math.round((counts.confused / total) * 100)
    const attentivePct = Math.round((counts.attentive / total) * 100)
    if (boredPct > 80) return 'Students appear bored. Try interaction or activity.'
    if (confusedPct > 50) return 'Many appear confused. Re-explain the concept.'
    if (attentivePct > 90) return 'Great! Class is highly attentive.'
    return ''
  }, [counts, list])

  return (
    <div>
      <div className="row">
        <span className={connected ? 'badge ok' : 'badge bad'}>{connected ? 'Connected' : 'Disconnected'}</span>
        <span>Students: {list.length}</span>
        <span>Avg Attention: {avgAttention}</span>
      </div>
      <div className="row">
        <button className="button-primary" onClick={startSession}>Start Session</button>
        <button className="button-secondary" onClick={endSession} disabled={!sessionId}>End Session</button>
        <span>Session: {sessionId || '-'}</span>
        <button className="button-secondary" onClick={loadSummary} disabled={!sessionId}>Load Summary</button>
      </div>
      {alertText && <div className="alert">{alertText}</div>}
      <div className="grid">
        {list.map(s => (
          <div key={s.studentId} className={`card ${s.state}`}>
            <div className="title">{s.studentId}</div>
            <div className="attention">Attention: {s.attention}</div>
            <div className="state">State: {s.state}</div>
            <div className="bar"><div className="bar-fill" style={{ width: `${s.attention}%` }} /></div>
          </div>
        ))}
      </div>
      {!!summary.length && (
        <div className="grid">
          {summary.map((row: any) => (
            <div key={row.studentId} className="card">
              <div className="title">{row.studentId}</div>
              <div>Avg Attention: {row.attention}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}