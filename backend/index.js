// backend/index.js
require('dotenv').config(); // Cette ligne doit toujours être la première

const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Utilisez 'bcryptjs' comme dans votre package.json

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Assurez-vous que l'origine correspond à votre frontend

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erreur de vérification du token:', err.message);
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
};

// Route d'inscription
app.post('/register', async (req, res) => {
  const { username, password, isProfessional } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe sont requis.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Note: Utilisation de 'password_hash' et 'is_professional' pour la cohérence du schéma DB
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, is_professional) VALUES ($1, $2, $3) RETURNING id, username, is_professional',
      [username, hashedPassword, isProfessional || false]
    );
    res.status(201).json({ message: 'Utilisateur enregistré avec succès', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
    }
    console.error('Erreur inscription:', err.message);
    res.status(500).json({ error: 'Erreur lors de l\'inscription: ' + err.message });
  }
});

// Route de connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe sont requis.' });
  }
  try {
    // Note: Sélectionne 'password_hash' et 'is_professional'
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe invalide' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash); // Utilise 'password_hash'
    if (!validPassword) {
      return res.status(400).json({ error: 'Nom d\'utilisateur ou mot de passe invalide' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, isProfessional: user.is_professional }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Erreur connexion:', err.message);
    res.status(500).json({ error: 'Erreur lors de la connexion: ' + err.message });
  }
});

// Route pour récupérer le profil de l'utilisateur connecté
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Note: Sélectionne 'is_professional'
    const result = await pool.query('SELECT id, username, is_professional FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur récupération profil:', err.message);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// Créer un événement
app.post('/events', authenticateToken, async (req, res) => {
  const { title, date, time, location, description, category } = req.body;
  if (!title || !date || !location || !description || !category) {
    return res.status(400).json({ error: 'Tous les champs obligatoires (Titre, Date, Lieu, Description, Catégorie) doivent être remplis.' });
  }
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Format de date invalide. Utilisez AAAA-MM-JJ.' });
  }

  try {
    const userEventsCountResult = await pool.query('SELECT COUNT(*) FROM events WHERE user_id = $1', [req.user.id]);
    const userEventsCount = parseInt(userEventsCountResult.rows[0].count, 10);

    if (!req.user.isProfessional && userEventsCount >= 3) {
      return res.status(403).json({ error: 'Limite de 3 événements atteinte pour les utilisateurs non professionnels.' });
    }

    const result = await pool.query(
      'INSERT INTO events (user_id, title, date, time, location, description, category, participant_count) VALUES ($1, $2, $3, $4, $5, $6, $7, 0) RETURNING *',
      [req.user.id, title, date, time, location, description, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erreur création événement:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l\'événement: ' + err.message });
  }
});

// Obtenir tous les événements avec le nombre de participants et le nom du créateur
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id,
        e.user_id,
        e.title,
        e.date,
        e.time,
        e.location,
        e.description,
        e.category,
        e.participant_count,
        u.username AS creator_username
      FROM events e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.date DESC, e.time DESC;
    `);
    res.json(result.rows);
  } catch (err) {
      console.error('Erreur récupération événements:', err.message);
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des événements: ' + err.message });
  }
});

// Obtenir un événement par ID
app.get('/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur récupération événement par ID:', err.message);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// Mettre à jour un événement (seul le créateur peut le faire)
app.put('/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, date, time, location, description, category } = req.body;

  if (!title || !date || !location || !description || !category) {
    return res.status(400).json({ error: 'Tous les champs obligatoires (Titre, Date, Lieu, Description, Catégorie) doivent être remplis.' });
  }
  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Format de date invalide. Utilisez AAAA-MM-JJ.' });
  }

  try {
    const eventCheck = await pool.query('SELECT user_id FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    if (eventCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé à modifier cet événement' });
    }

    const result = await pool.query(
      'UPDATE events SET title = $1, date = $2, time = $3, location = $4, description = $5, category = $6 WHERE id = $7 RETURNING *',
      [title, date, time, location, description, category, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erreur mise à jour événement:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de l\'événement: ' + err.message });
  }
});

// Supprimer un événement (seul le créateur peut le faire)
app.delete('/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const eventCheck = await pool.query('SELECT user_id FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    if (eventCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé à supprimer cet événement' });
    }

    // Supprimer d'abord les entrées dans user_events pour éviter les erreurs de clé étrangère
    await pool.query('DELETE FROM user_events WHERE event_id = $1', [id]);
    // Puis supprimer l'événement
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

    res.json({ message: 'Événement supprimé avec succès', event: result.rows[0] });
  } catch (err) {
    console.error('Erreur suppression événement:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'événement: ' + err.message });
  }
});

// Route pour assister à un événement
app.post('/events/:id/attend', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const eventResult = await pool.query('SELECT user_id FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) return res.status(404).json({ error: 'Événement non trouvé' });

    if (eventResult.rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas assister à un événement que vous avez créé.' });
    }

    const participationResult = await pool.query(
      'INSERT INTO user_events (user_id, event_id) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT user_events_pkey DO NOTHING RETURNING *',
      [req.user.id, id]
    );

    if (participationResult.rows.length > 0) {
      await pool.query('UPDATE events SET participant_count = participant_count + 1 WHERE id = $1', [id]);
      res.status(200).json({ message: 'Inscription réussie', eventId: id });
    } else {
      res.status(200).json({ message: 'Vous êtes déjà inscrit à cet événement', eventId: id });
    }
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription à l\'événement: ' + err.message });
  }
});

// Route pour se désinscrire d'un événement
app.delete('/events/:id/unattend', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM user_events WHERE user_id = $1 AND event_id = $2 RETURNING *', [req.user.id, id]);

    if (result.rows.length > 0) {
      await pool.query('UPDATE events SET participant_count = GREATEST(0, participant_count - 1) WHERE id = $1', [id]);
      res.status(200).json({ message: 'Désinscription réussie', eventId: id });
    } else {
      res.status(404).json({ error: 'Vous n\'êtes pas inscrit à cet événement ou événement non trouvé' });
    }
  } catch (err) {
    console.error('Erreur lors de la désinscription:', err.message);
    res.status(500).json({ error: 'Erreur serveur lors de la désinscription de l\'événement: ' + err.message });
  }
});

// Route pour obtenir les événements auxquels un utilisateur assiste
app.get('/attending-events', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id,
        e.user_id,
        e.title,
        e.date,
        e.time,
        e.location,
        e.description,
        e.category,
        e.participant_count,
        u.username AS creator_username
      FROM events e
      JOIN user_events ue_attend ON e.id = ue_attend.event_id
      JOIN users u ON e.user_id = u.id
      WHERE ue_attend.user_id = $1
      ORDER BY e.date DESC, e.time DESC;
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération événements assistés:', err.message);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});

// Obtenir les participants d'un événement (seulement si l'utilisateur est le créateur)
app.get('/events/:id/participants', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const eventCheck = await pool.query('SELECT user_id FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    if (eventCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé à voir les participants de cet événement' });
    }

    const result = await pool.query(`
      SELECT u.username
      FROM users u
      JOIN user_events ue ON u.id = ue.user_id
      WHERE ue.event_id = $1
      ORDER BY u.username;
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur récupération participants:', err.message);
    res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
