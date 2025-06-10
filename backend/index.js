const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Autoriser localhost:3000 pour tests locaux

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware pour vérifier le token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Route pour le profil utilisateur
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de la récupération du profil:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour la connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour l'inscription
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username', [username, password]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les événements
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des événements:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour les événements auxquels l'utilisateur assiste
app.get('/attending-events', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT e.* FROM events e JOIN user_events ue ON e.id = ue.event_id WHERE ue.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des événements auxquels vous assistez:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour ajouter un événement
app.post('/events', authenticateToken, async (req, res) => {
  const { title, date, time, location, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO events (user_id, title, date, time, location, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title, date, time, location, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de l\'ajout d\'un événement:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour modifier un événement
app.put('/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, date, time, location, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE events SET title = $1, date = $2, time = $3, location = $4, description = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
      [title, date, time, location, description, id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: 'Non autorisé ou événement non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur lors de la modification d\'un événement:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour supprimer un événement
app.delete('/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  console.log('Tentative de suppression - id:', id, 'user_id:', req.user.id); // Ajout de débogage
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    if (result.rows.length === 0) {
      console.log('Aucun événement supprimé - Vérification des autorisations');
      return res.status(403).json({ error: 'Non autorisé ou événement non trouvé' });
    }
    console.log('Événement supprimé avec succès:', result.rows[0]);
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression - Détails:', err.stack); // Plus de détails
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// Route pour assister à un événement
app.post('/events/:id/attend', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const eventResult = await pool.query('SELECT user_id FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Événement non trouvé' });
    await pool.query('INSERT INTO user_events (user_id, event_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, id]);
    res.json({ message: 'Inscription réussie' });
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
