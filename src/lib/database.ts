import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'predictio.db');
const db = new Database(dbPath);

// Initialize database tables immediately
function initDatabase() {
  // Users table - create with is_admin column
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add is_admin column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
    console.log('Added is_admin column to users table');
  } catch (error) {
    // Column already exists, that's fine
  }

  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      league TEXT NOT NULL,
      match_date DATETIME NOT NULL,
      odds_1 REAL,
      odds_x REAL,
      odds_2 REAL,
      result TEXT, -- '1', 'X', '2', or NULL if not finished
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Predictions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      prediction TEXT NOT NULL, -- '1', 'X', '2'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (match_id) REFERENCES matches (id),
      UNIQUE(user_id, match_id)
    )
  `);

  console.log('Database initialized');
}

// Initialize database on module load
initDatabase();

// User operations
export const createUser = db.prepare(`
  INSERT INTO users (name, is_admin) VALUES (?, ?)
`);

export const getUserByName = db.prepare(`
  SELECT * FROM users WHERE name = ?
`);

export const getAllUsers = db.prepare(`
  SELECT * FROM users ORDER BY created_at
`);

// Match operations
export const insertMatch = db.prepare(`
  INSERT OR REPLACE INTO matches (id, home_team, away_team, league, match_date, odds_1, odds_x, odds_2)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export const getAllMatches = db.prepare(`
  SELECT * FROM matches ORDER BY match_date
`);

export const updateMatchResult = db.prepare(`
  UPDATE matches SET result = ? WHERE id = ?
`);

// Clear all matches (for new admin period)
export const clearAllMatches = db.prepare(`
  DELETE FROM matches
`);

// Clear all predictions (for new admin period)
export const clearAllPredictions = db.prepare(`
  DELETE FROM predictions
`);

// Prediction operations
export const insertPrediction = db.prepare(`
  INSERT OR REPLACE INTO predictions (user_id, match_id, prediction)
  VALUES (?, ?, ?)
`);

export const getAllPredictions = db.prepare(`
  SELECT p.*, u.name as user_name, m.home_team, m.away_team
  FROM predictions p
  JOIN users u ON p.user_id = u.id
  JOIN matches m ON p.match_id = m.id
`);

export const getPredictionsByUser = db.prepare(`
  SELECT p.*, m.home_team, m.away_team, m.result, m.odds_1, m.odds_x, m.odds_2
  FROM predictions p
  JOIN matches m ON p.match_id = m.id
  WHERE p.user_id = ?
`);

export default db;
