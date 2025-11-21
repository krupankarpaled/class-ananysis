import React, { useState } from 'react'
import { post, setToken } from '../api'

export default function Login({ onAuthed }: { onAuthed: (role: 'student' | 'teacher') => void }) {
  const [email, setEmail] = useState('teacher@example.com')
  const [password, setPassword] = useState('password')
  const [role, setRole] = useState<'student' | 'teacher'>('teacher')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email & password')
      return
    }

    setError('')
    setLoading(true)

    try {
      const r = await post('/auth/login', { email: email.trim(), password, role })

      if (r?.token) {
        setToken(r.token)
        onAuthed(role)
      } else {
        setError('Invalid credentials')
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="row">
        <label>Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="row">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="row">
        <label>Role</label>
        <select value={role} onChange={e => setRole(e.target.value as any)}>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <button disabled={loading} onClick={submit}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {error && <div className="bad">{error}</div>}
    </div>
  )
}