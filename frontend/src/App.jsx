import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

function App() {
  const [events, setEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '', category: 'Meetups entre passionnés' });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', category: 'all' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', isProfessional: false });
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
    if (token) {
      axios.defaults.headers.Authorization = `Bearer ${token}`;
      fetchUser();
      fetchAttendingEvents();
    } else {
      setIsAuthenticated(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:3001/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      setError('Erreur de profil utilisateur : ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:3001/events');
      setEvents(res.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des événements : ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchAttendingEvents = async () => {
    try {
      const res = await axios.get('http://localhost:3001/attending-events');
      setAttendingEvents(res.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des événements auxquels vous assistez : ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Vous devez être connecté pour créer ou modifier un événement');
    
    const date = new Date(form.date);
    if (isNaN(date.getTime())) {
      setError('Date invalide. Utilisez le format YYYY-MM-DD.');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/events/${editingId}`, form);
        setEditingId(null);
      } else {
        const userEvents = events.filter(event => event.user_id === user.id);
        if (userEvents.length >= 3 && !user.isProfessional) {
          setError('Limite de 3 événements gratuits atteinte. Abonnez-vous pour plus.');
          return; // Bloque la création après 3 événements
        }
        await axios.post('http://localhost:3001/events', form);
      }
      setForm({ title: '', date: '', time: '', location: '', description: '', category: 'Meetups entre passionnés' });
      fetchEvents();
      setError(null);
    } catch (err) {
      setError('Erreur lors de la création/modification de l\'événement : ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated) return alert('Vous devez être connecté pour supprimer un événement');
    try {
      await axios.delete(`http://localhost:3001/events/${id}`);
      fetchEvents();
      setError(null);
    } catch (err) {
      setError('Erreur lors de la suppression de l\'événement : ' + err.message);
    }
  };

  const handleEdit = (event) => {
    if (!isAuthenticated || (user && event.user_id !== user.id)) return alert('Vous ne pouvez modifier que vos propres événements');
    setForm({
      title: event.title,
      date: event.date,
      time: event.time || '',
      location: event.location,
      description: event.description,
      category: event.category || 'Meetups entre passionnés',
    });
    setEditingId(event.id);
  };

  const handleAttend = async (id) => {
    if (!isAuthenticated) return alert('Vous devez être connecté pour assister à un événement');
    const event = events.find(e => e.id === id);
    if (event && event.user_id === user.id) {
      setError('Vous ne pouvez pas assister à un événement que vous avez créé.');
      return;
    }
    try {
      await axios.post(`http://localhost:3001/events/${id}/attend`);
      fetchAttendingEvents();
      setError(null);
    } catch (err) {
      setError('Erreur lors de l\'inscription à l\'événement : ' + err.message);
    }
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'Date invalide';
    const date = new Date(dateString + 'T' + (timeString || '00:00:00'));
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/login', loginForm);
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axios.defaults.headers.Authorization = `Bearer ${newToken}`;
      setShowLogin(false);
      await fetchUser();
    } catch (err) {
      setError('Échec de la connexion : ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3001/register', registerForm);
      setShowRegister(false);
      if (registerForm.isProfessional) {
        setError('Inscription professionnelle réussie. Paiement fictif de 7.99€ requis.');
      } else {
        setError('Inscription réussie, veuillez vous connecter');
      }
    } catch (err) {
      setError('Échec de l\'inscription : ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date + 'T' + (event.time || '00:00:00'));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchesType = (filter.type === 'all' || 
      (filter.type === 'future' && eventDate >= today) || 
      (filter.type === 'past' && eventDate < today));
    const matchesCategory = (filter.category === 'all' || event.category === filter.category);
    return matchesType && matchesCategory;
  });

  return (
    <div className="app-container">
      <h1>Planificateur d’Événements</h1>
      <div className="auth-status">
        {isAuthenticated ? (
          <div className="user-info">
            <span>Bienvenue, {user?.username} {user?.isProfessional ? '(Professionnel)' : '(Utilisateur)'}</span>
            <button onClick={() => { setToken(null); localStorage.removeItem('token'); setIsAuthenticated(false); }} className="logout-btn">Déconnexion</button>
          </div>
        ) : (
          <div className="auth-container">
            <button onClick={() => setShowLogin(true)} className="auth-btn">Se connecter</button>
            <button onClick={() => setShowRegister(true)} className="auth-btn">S'inscrire</button>
            <span className="status-message">(Non connecté - Ajout réservé aux connectés)</span>
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
      </div>
      <Modal
        isOpen={showLogin}
        onRequestClose={() => setShowLogin(false)}
        className="modal auth-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content">
          <h2>Connexion</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            <button type="submit">Se connecter</button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <button onClick={() => setShowLogin(false)} className="close-btn">Fermer</button>
        </div>
      </Modal>
      <Modal
        isOpen={showRegister}
        onRequestClose={() => setShowRegister(false)}
        className="modal auth-modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-content">
          <h2>Inscription</h2>
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
            />
            <label>
              <input
                type="checkbox"
                checked={registerForm.isProfessional}
                onChange={(e) => setRegisterForm({ ...registerForm, isProfessional: e.target.checked })}
              /> Inscription en tant que professionnel (7.99€/mois fictif)
            </label>
            <button type="submit">S'inscrire</button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <button onClick={() => setShowRegister(false)} className="close-btn">Fermer</button>
        </div>
      </Modal>
      <div className="events-section">
        <h2>Événements</h2>
        <div className="filter-container">
          <label>Filtrer par type : </label>
          <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className="filter-select">
            <option value="all">Tous</option>
            <option value="future">Futurs</option>
            <option value="past">Passés</option>
          </select>
          <label>Filtrer par catégorie : </label>
          <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })} className="filter-select">
            <option value="all">Toutes</option>
            <option value="Meetups entre passionnés">Meetups</option>
            <option value="Ateliers de formation ou d’initiation">Ateliers</option>
            <option value="Événements communautaires ou culturels">Communautaires</option>
            <option value="Petits concerts, expositions, etc.">Concerts/Expos</option>
          </select>
        </div>
        <ul className="events-list">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <li key={event.id} className="event-item">
                <span className="event-details" onClick={() => setSelectedEvent(event)}>
                  {event.title} - {formatDateTime(event.date, event.time)} - {event.location} ({event.category})
                </span>
                <div className="event-actions">
                  <button
                    onClick={() => handleEdit(event)}
                    className="edit-btn"
                    disabled={!isAuthenticated || (user && event.user_id !== user.id)}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="delete-btn"
                    disabled={!isAuthenticated || (user && event.user_id !== user.id)}
                  >
                    Supprimer
                  </button>
                  {!attendingEvents.find((e) => e.id === event.id) && (
                    <button
                      onClick={() => handleAttend(event.id)}
                      className="attend-btn"
                      disabled={!isAuthenticated || (user && event.user_id === user.id)}
                    >
                      Assister
                    </button>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="no-events">Aucun événement à afficher.</li>
          )}
        </ul>
        {attendingEvents.length > 0 && (
          <div className="attending-section">
            <h2>Événements auxquels vous assistez</h2>
            <ul className="events-list">
              {attendingEvents.map((event) => (
                <li key={event.id} className="event-item">
                  <span className="event-details" onClick={() => setSelectedEvent(event)}>
                    {event.title} - {formatDateTime(event.date, event.time)} - {event.location}
                  </span>
                  <div className="event-actions">
                    <button
                      onClick={() => handleEdit(event)}
                      className="edit-btn"
                      disabled={!isAuthenticated || (user && event.user_id !== user.id)}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="delete-btn"
                      disabled={!isAuthenticated || (user && event.user_id !== user.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {isAuthenticated && !(!user.isProfessional && events.filter(event => event.user_id === user.id).length >= 3) ? (
        <form onSubmit={handleSubmit} className="event-form">
          <input
            type="text"
            placeholder="Titre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
          <input
            type="text"
            placeholder="Lieu"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
            <option value="Meetups entre passionnés">Meetups entre passionnés</option>
            <option value="Ateliers de formation ou d’initiation">Ateliers de formation ou d’initiation</option>
            <option value="Événements communautaires ou culturels">Événements communautaires ou culturels</option>
            <option value="Petits concerts, expositions, etc.">Petits concerts, expositions, etc.</option>
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <button type="submit">{editingId ? 'Modifier' : 'Créer'}</button>
        </form>
      ) : isAuthenticated ? (
        <div className="login-prompt">
          <p>Limite de 3 événements gratuits atteinte. Abonnez-vous pour plus.</p>
          <button onClick={() => setShowRegister(true)} className="auth-btn">S'abonner</button>
        </div>
      ) : (
        <div className="login-prompt">
          <p>Connectez-vous pour ajouter ou modifier des événements.</p>
          <button onClick={() => setShowLogin(true)} className="auth-btn">Se connecter</button>
        </div>
      )}
      <Modal
        isOpen={!!selectedEvent}
        onRequestClose={() => setSelectedEvent(null)}
        className="modal event-modal"
        overlayClassName="modal-overlay"
      >
        {selectedEvent && (
          <div className="modal-content">
            <h2>{selectedEvent.title}</h2>
            <p><strong>Date :</strong> {formatDateTime(selectedEvent.date, selectedEvent.time)}</p>
            <p><strong>Lieu :</strong> {selectedEvent.location}</p>
            <p><strong>Catégorie :</strong> {selectedEvent.category}</p>
            <p><strong>Description :</strong> {selectedEvent.description}</p>
            <button onClick={() => setSelectedEvent(null)} className="close-btn">Fermer</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;