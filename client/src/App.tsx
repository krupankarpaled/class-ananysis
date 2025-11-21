import React, { useMemo, useState } from 'react'
import Student from './components/Student'
import Teacher from './components/Teacher'
import Login from './components/Login'

export default function App() {
  const [tab, setTab] = useState<'student' | 'teacher'>('student')
  const [authed, setAuthed] = useState(false)

  const tabs = useMemo(() => [
    { key: 'student', label: 'Student' },
    { key: 'teacher', label: 'Teacher' },
  ], [])

  return (
    <div className="container">
      <h1>Emotion-Aware Classroom Analyzer</h1>
      {!authed ? (
        <Login onAuthed={(r) => { setAuthed(true); setTab(r) }} />
      ) : (
        <>
          <div className="tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={tab === t.key ? 'active' : ''}
                onClick={() => setTab(t.key as any)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'student' ? <Student /> : <Teacher />}
        </>
      )}
    </div>
  )
}