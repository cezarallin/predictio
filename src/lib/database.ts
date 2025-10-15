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
  } catch {
    // Column already exists, that's fine
  }

  // Add play_type column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN play_type TEXT`); // 'fun' or 'miza' - no default
    console.log('Added play_type column to users table');
  } catch {
    // Column already exists, that's fine
  }

  // Reset existing play_type values to NULL (for users who had 'fun' set previously)
  try {
    db.exec(`UPDATE users SET play_type = NULL`); // Reset ALL play_type values to NULL
    console.log('Reset ALL play_type values to NULL');
  } catch (error) {
    console.log('Error resetting play_type:', error);
  }

  // Matches are now stored in JSON file, not database

  // Predictions table (match_id references JSON file matches)
  db.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      prediction TEXT NOT NULL, -- '1', 'X', '2'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, match_id)
    )
  `);

  // Reactions table for reactions on predictions
  db.exec(`
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      reaction TEXT NOT NULL, -- 'like', 'dislike', 'laugh', 'wow', 'love', 'angry'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (target_user_id) REFERENCES users (id),
      UNIQUE(user_id, target_user_id, match_id)
    )
  `);

  // Player boosts table - each player can choose one match to boost
  db.exec(`
    CREATE TABLE IF NOT EXISTS player_boosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id)
    )
  `);

  // Second chances table - each player can use ONE second chance to modify a prediction
  db.exec(`
    CREATE TABLE IF NOT EXISTS second_chances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      match_id TEXT NOT NULL,
      old_prediction TEXT NOT NULL,
      new_prediction TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id)
    )
  `);

  // Super spins table - each player can spin once after login
  db.exec(`
    CREATE TABLE IF NOT EXISTS super_spins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      prize_type TEXT NOT NULL, -- 'extra_boost', 'triple_boost', 'spin_again', 'no_win', 'modify_result', 'extra_point', 'five_lei'
      prize_value INTEGER DEFAULT 0, -- for extra points or boost counts
      used BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // H2H challenges table - head-to-head duels between players
  db.exec(`
    CREATE TABLE IF NOT EXISTS h2h_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenger_id INTEGER NOT NULL,
      challenged_id INTEGER NOT NULL,
      match_date TEXT NOT NULL, -- specific date for the duel (e.g. "2023-12-09")
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
      winner_id INTEGER, -- set when challenge is completed
      challenger_score INTEGER DEFAULT 0, -- number of correct predictions
      challenged_score INTEGER DEFAULT 0, -- number of correct predictions
      challenger_odds_total REAL DEFAULT 0.0, -- total odds of correct predictions
      challenged_odds_total REAL DEFAULT 0.0, -- total odds of correct predictions
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (challenger_id) REFERENCES users (id),
      FOREIGN KEY (challenged_id) REFERENCES users (id),
      FOREIGN KEY (winner_id) REFERENCES users (id)
    )
  `);

  // App settings table - for global configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default settings
  try {
    const checkSetting = db.prepare('SELECT * FROM app_settings WHERE key = ?');
    if (!checkSetting.get('results_enabled')) {
      db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)').run('results_enabled', 'true');
      console.log('Initialized results_enabled setting to true');
    }
  } catch (error) {
    console.log('Error initializing settings:', error);
  }

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

// Clear all predictions (when needed)
export const clearAllPredictions = db.prepare(`
  DELETE FROM predictions
`);

// Prediction operations
export const insertPrediction = db.prepare(`
  INSERT INTO predictions (user_id, match_id, prediction)
  VALUES (?, ?, ?)
`);

// Check if user already has a prediction for a match
export const getUserPrediction = db.prepare(`
  SELECT * FROM predictions WHERE user_id = ? AND match_id = ?
`);

export const getAllPredictions = db.prepare(`
  SELECT p.*, u.name as user_name
  FROM predictions p
  JOIN users u ON p.user_id = u.id
`);

export const getPredictionsByUser = db.prepare(`
  SELECT p.*
  FROM predictions p
  WHERE p.user_id = ?
`);

// Admin operations
export const makeUserAdmin = db.prepare(`
  UPDATE users SET is_admin = 1 WHERE name = ?
`);

export const removeUserAdmin = db.prepare(`
  UPDATE users SET is_admin = 0 WHERE name = ?
`);

// Delete all users and predictions
export const clearAllUsers = db.prepare(`
  DELETE FROM users
`);

// Admin-specific prediction operations
export const updatePrediction = db.prepare(`
  UPDATE predictions SET prediction = ? WHERE user_id = ? AND match_id = ?
`);

export const deletePrediction = db.prepare(`
  DELETE FROM predictions WHERE user_id = ? AND match_id = ?
`);

export const upsertPrediction = db.prepare(`
  INSERT INTO predictions (user_id, match_id, prediction)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id, match_id) DO UPDATE SET
    prediction = excluded.prediction
`);

// Reaction operations
export const addReaction = db.prepare(`
  INSERT OR REPLACE INTO reactions (user_id, target_user_id, match_id, reaction)
  VALUES (?, ?, ?, ?)
`);

export const removeReaction = db.prepare(`
  DELETE FROM reactions WHERE user_id = ? AND target_user_id = ? AND match_id = ?
`);

export const getReactionsByMatch = db.prepare(`
  SELECT r.*, u.name as user_name 
  FROM reactions r
  JOIN users u ON r.user_id = u.id
  WHERE r.match_id = ?
`);

export const getAllReactions = db.prepare(`
  SELECT r.*, u.name as user_name, tu.name as target_user_name
  FROM reactions r
  JOIN users u ON r.user_id = u.id
  JOIN users tu ON r.target_user_id = tu.id
`);

export const clearAllReactions = db.prepare(`
  DELETE FROM reactions
`);

// Player boost operations
export const setPlayerBoost = db.prepare(`
  INSERT OR REPLACE INTO player_boosts (user_id, match_id)
  VALUES (?, ?)
`);

export const removePlayerBoost = db.prepare(`
  DELETE FROM player_boosts WHERE user_id = ?
`);

export const getPlayerBoost = db.prepare(`
  SELECT * FROM player_boosts WHERE user_id = ?
`);

export const getAllPlayerBoosts = db.prepare(`
  SELECT pb.*, u.name as user_name
  FROM player_boosts pb
  JOIN users u ON pb.user_id = u.id
`);

export const clearAllPlayerBoosts = db.prepare(`
  DELETE FROM player_boosts
`);

// Second chances operations
export const useSecondChance = db.prepare(`
  INSERT INTO second_chances (user_id, match_id, old_prediction, new_prediction)
  VALUES (?, ?, ?, ?)
`);

export const getUserSecondChance = db.prepare(`
  SELECT * FROM second_chances WHERE user_id = ?
`);

export const hasUserUsedSecondChance = db.prepare(`
  SELECT COUNT(*) as count FROM second_chances WHERE user_id = ?
`);

export const getAllSecondChances = db.prepare(`
  SELECT sc.*, u.name as user_name
  FROM second_chances sc
  JOIN users u ON sc.user_id = u.id
`);

export const clearAllSecondChances = db.prepare(`
  DELETE FROM second_chances
`);

// Super spin operations
export const addSuperSpinResult = db.prepare(`
  INSERT INTO super_spins (user_id, prize_type, prize_value)
  VALUES (?, ?, ?)
`);

export const getUserSuperSpins = db.prepare(`
  SELECT * FROM super_spins WHERE user_id = ? ORDER BY created_at DESC
`);

export const hasUserSpinnedToday = db.prepare(`
  SELECT COUNT(*) as count FROM super_spins 
  WHERE user_id = ? 
  AND DATE(created_at) = DATE('now')
`);

export const getUnusedSuperSpinPrizes = db.prepare(`
  SELECT * FROM super_spins 
  WHERE user_id = ? AND used = FALSE AND prize_type != 'no_win'
  ORDER BY created_at DESC
`);

export const markSuperSpinPrizeAsUsed = db.prepare(`
  UPDATE super_spins SET used = TRUE WHERE id = ?
`);

export const getAllSuperSpins = db.prepare(`
  SELECT ss.*, u.name as user_name
  FROM super_spins ss
  JOIN users u ON ss.user_id = u.id
  ORDER BY ss.created_at DESC
`);

export const clearAllSuperSpins = db.prepare(`
  DELETE FROM super_spins
`);

// Play type operations
export const updateUserPlayType = db.prepare(`
  UPDATE users SET play_type = ? WHERE id = ?
`);

export const getUserPlayType = db.prepare(`
  SELECT play_type FROM users WHERE id = ?
`);

// Reset all play types to NULL (for existing users)
export const resetAllPlayTypes = db.prepare(`
  UPDATE users SET play_type = NULL
`);

// H2H Challenge operations
export const createH2HChallenge = db.prepare(`
  INSERT INTO h2h_challenges (challenger_id, challenged_id, match_date)
  VALUES (?, ?, ?)
`);

export const getH2HChallengeById = db.prepare(`
  SELECT h.*, 
         u1.name as challenger_name, 
         u2.name as challenged_name,
         u3.name as winner_name
  FROM h2h_challenges h
  JOIN users u1 ON h.challenger_id = u1.id
  JOIN users u2 ON h.challenged_id = u2.id
  LEFT JOIN users u3 ON h.winner_id = u3.id
  WHERE h.id = ?
`);

export const getUserH2HChallenges = db.prepare(`
  SELECT h.*, 
         u1.name as challenger_name, 
         u2.name as challenged_name,
         u3.name as winner_name
  FROM h2h_challenges h
  JOIN users u1 ON h.challenger_id = u1.id
  JOIN users u2 ON h.challenged_id = u2.id
  LEFT JOIN users u3 ON h.winner_id = u3.id
  WHERE h.challenger_id = ? OR h.challenged_id = ?
  ORDER BY h.created_at DESC
`);

export const getAllH2HChallenges = db.prepare(`
  SELECT h.*, 
         u1.name as challenger_name, 
         u2.name as challenged_name,
         u3.name as winner_name
  FROM h2h_challenges h
  JOIN users u1 ON h.challenger_id = u1.id
  JOIN users u2 ON h.challenged_id = u2.id
  LEFT JOIN users u3 ON h.winner_id = u3.id
  ORDER BY h.created_at DESC
`);

export const updateH2HChallengeStatus = db.prepare(`
  UPDATE h2h_challenges 
  SET status = ?
  WHERE id = ?
`);

export const completeH2HChallenge = db.prepare(`
  UPDATE h2h_challenges 
  SET status = 'completed', 
      winner_id = ?,
      challenger_score = ?,
      challenged_score = ?,
      challenger_odds_total = ?,
      challenged_odds_total = ?,
      completed_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

export const deleteH2HChallenge = db.prepare(`
  DELETE FROM h2h_challenges WHERE id = ?
`);

export const getActiveH2HChallengesByDate = db.prepare(`
  SELECT h.*, 
         u1.name as challenger_name, 
         u2.name as challenged_name
  FROM h2h_challenges h
  JOIN users u1 ON h.challenger_id = u1.id
  JOIN users u2 ON h.challenged_id = u2.id
  WHERE h.match_date = ? AND h.status = 'accepted'
`);

export const clearAllH2HChallenges = db.prepare(`
  DELETE FROM h2h_challenges
`);

// App settings operations
export const getAppSetting = db.prepare(`
  SELECT value FROM app_settings WHERE key = ?
`);

export const setAppSetting = db.prepare(`
  INSERT INTO app_settings (key, value, updated_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = CURRENT_TIMESTAMP
`);

export const resetDatabase = () => {
  // Clear all data
  clearAllUsers.run();
  clearAllPredictions.run();
  clearAllReactions.run();
  clearAllPlayerBoosts.run();
  clearAllSecondChances.run();
  clearAllSuperSpins.run();
  clearAllH2HChallenges.run();
  console.log('🗑️ All users, predictions, reactions, boosts, second chances, super spins and H2H challenges cleared');
};

export default db;
