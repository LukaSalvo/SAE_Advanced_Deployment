CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_events (
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id),
  PRIMARY KEY (user_id, event_id)
);
