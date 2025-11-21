-- Emotion-Aware Classroom Analyzer Database Schema

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table for classroom sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  teacher_id UUID REFERENCES users(id),
  class_name VARCHAR(255) NOT NULL,
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id);

-- Snapshots table for student engagement data
CREATE TABLE IF NOT EXISTS snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  student_id VARCHAR(100) NOT NULL,
  attention INTEGER CHECK (attention >= 0 AND attention <= 100),
  state VARCHAR(20) NOT NULL CHECK (state IN ('attentive', 'bored', 'confused', 'neutral')),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_session ON snapshots(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_snapshots_student ON snapshots(student_id, session_id);

-- Alerts table for classroom engagement alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  suggestion TEXT,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_session ON alerts(session_id, created_at);
