-- Creating PostgreSQL tables for group pomodoro timer
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(6) PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timer_state VARCHAR(20) NOT NULL DEFAULT 'focus',
    time_left INTEGER NOT NULL DEFAULT 1500,
    is_running BOOLEAN NOT NULL DEFAULT false,
    completed_cycles INTEGER NOT NULL DEFAULT 0,
    focus_time INTEGER NOT NULL DEFAULT 25,
    short_break_time INTEGER NOT NULL DEFAULT 5,
    long_break_time INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(6) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_host BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS timer_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(6) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL,
    duration INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adding indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_room_id ON timer_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_id ON timer_sessions(user_id);
