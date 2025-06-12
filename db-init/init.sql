

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, 
  is_professional BOOLEAN DEFAULT FALSE 
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  participant_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_events (
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);
