
/**
 * PArtie frontend de l'application Planif'Event
 * Cette partie gère l'interface utilisateur, les formulaires d'événements,
 * la connexion, l'inscription, et l'affichage des événements.
 * Elle utilise React pour la gestion de l'état et Axios pour les requêtes HTTP.
 * Elle inclut également des modales pour la connexion, l'inscription et l'affichage des détails des événements.
 * Elle permet aux utilisateurs de filtrer les événements par type et catégorie,
 * ainsi que de gérer les participations aux événements.
 * Elle supporte un mode sombre pour une meilleure expérience utilisateur.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Modal from 'react-modal';

Modal.setAppElement('#root');

// Configuration de la bibliothèque Axios pour les requêtes HTTP
function App() {

  /**
   * Constantes et états de l'application,
   * y compris les événements, les formulaires,
   * les filtres, l'authentification,
   * et les préférences utilisateur.
   */
  const [events, setEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '', category: 'Meetups entre passionnés' });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', category: 'all' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', isProfessional: false });
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

    // Fonction pour formater la date et l'heure
  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    let formattedDate = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      return `${formattedDate} à ${hours.padStart(2, '0')}h${minutes.padStart(2, '0')}`;
    }
    return formattedDate;
  };

    // Fonction pour récupérer les événements, les événements auxquels l'utilisateur participe,
  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/events');
      setEvents(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur serveur lors de la récupération des événements: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour récupérer les événements auxquels l'utilisateur participe
  const fetchAttendingEvents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/attending-events', { headers: { Authorization: `Bearer ${token}` } });
      setAttendingEvents(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur serveur lors de la récupération des événements auxquels vous participez: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour récupérer le profil de l'utilisateur
  const fetchProfile = async () => {
    if (token) {
      try {
        const response = await axios.get('http://localhost:3001/profile', { headers: { Authorization: `Bearer ${token}` } });
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
        setToken(null);
        localStorage.removeItem('token');
        setError('Erreur lors de la récupération du profil: ' + (err.response?.data?.error || err.message));
      }
    }
  };

    // Effet pour charger les événements et le profil utilisateur au démarrage
  useEffect(() => {
    fetchEvents();
    if (token) {
      fetchProfile();
      fetchAttendingEvents();
    }
  }, [token]);

    // Fonction pour gérer la soumission du formulaire d'événement
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await axios.put(`http://localhost:3001/events/${editingId}`, form, { headers: { Authorization: `Bearer ${token}` } });
        setEditingId(null);
      } else {
        await axios.post('http://localhost:3001/events', form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setForm({ title: '', date: '', time: '', location: '', description: '', category: 'Meetups entre passionnés' });
      fetchEvents();
    } catch (err) {
      setError('Erreur lors de la soumission de l\'événement: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour gérer la suppression d'un événement
  const handleDelete = async (id) => {
    setError(null);
    try {
      await axios.delete(`http://localhost:3001/events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchEvents();
    } catch (err) {
      setError('Erreur lors de la suppression de l\'événement: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour gérer l'édition d'un événement
  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      date: event.date.split('T')[0],
      time: event.time || '',
      location: event.location,
      description: event.description,
      category: event.category
    });
  };

    // Fonction pour gérer l'inscription à un événement
  const handleAttend = async (eventId) => {
    setError(null);
    try {
      await axios.post(`http://localhost:3001/events/${eventId}/attend`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchEvents();
      fetchAttendingEvents();
    } catch (err) {
      setError('Erreur lors de l\'inscription: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour gérer la désinscription d'un événement
  const handleUnattend = async (eventId) => {
    setError(null);
    try {
      await axios.delete(`http://localhost:3001/events/${eventId}/unattend`, { headers: { Authorization: `Bearer ${token}` } });
      fetchEvents();
      fetchAttendingEvents();
    } catch (err) {
      setError('Erreur lors de la désinscription: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour récupérer les participants d'un événement
  const fetchParticipants = async (eventId) => {
    setError(null);
    try {
      const response = await axios.get(`http://localhost:3001/events/${eventId}/participants`, { headers: { Authorization: `Bearer ${token}` } });
      setParticipants(response.data);
      setShowParticipants(true);
    } catch (err) {
      setError('Erreur lors de la récupération des participants: ' + (err.response?.data?.error || err.message) || 'Aucun participant disponible');
    }
  };

    // Fonction pour gérer les changements de filtre
  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

    // Filtrer les événements en fonction des critères sélectionnés
  const filteredEvents = events.filter(event => {
    const matchesType = filter.type === 'all' ||
      (filter.type === 'my-events' && isAuthenticated && event.user_id === user?.id) ||
      (filter.type === 'attending' && isAuthenticated && attendingEvents.some(ae => ae.id === event.id));
    const matchesCategory = filter.category === 'all' || event.category === filter.category;
    return matchesType && matchesCategory;
  });

    // Fonction pour gérer la soumission du formulaire de connexion
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post('http://localhost:3001/login', loginForm);
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setIsAuthenticated(true);
      setShowLogin(false);
      setLoginForm({ username: '', password: '' });
      fetchProfile();
      fetchEvents();
      fetchAttendingEvents();
    } catch (err) {
      setError('Échec de la connexion: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour gérer la soumission du formulaire d'inscription
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post('http://localhost:3001/register', registerForm);
      setShowRegister(false);
      setRegisterForm({ username: '', password: '', isProfessional: false });
      setError('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    } catch (err) {
      setError('Échec de l\'inscription: ' + (err.response?.data?.error || err.message));
    }
  };

    // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setEvents([]);
    setAttendingEvents([]);
    fetchEvents();
  };

    // Fonction pour basculer entre le mode sombre et le mode clair
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

    // Effet pour appliquer le mode sombre en fonction de l'état isDarkMode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Planif'Event</h1>
        <div className="nav-buttons">
          {!isAuthenticated ? (
            <>
              <button onClick={() => setShowLogin(true)}>Connexion</button>
              <button onClick={() => setShowRegister(true)}>Inscription</button>
            </>
          ) : (
            <div className="user-info">
              <span>Bienvenue, {user?.username}</span>
              <span className="account-badge">{user?.isProfessional ? 'Compte Pro' : 'Compte Normal'}</span>
              <button onClick={handleLogout} className="logout-button">Déconnexion</button>
            </div>
          )}
          <label className="switch">
            <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      <main className="app-main">
        {error && <p className="error-message">{error}</p>}

        {isAuthenticated && (
          <div className="event-form-container">
            <h2>{editingId ? 'Modifier un événement' : 'Créer un nouvel événement'}</h2>
            <form onSubmit={handleSubmit} className="event-form">
              <input type="text" placeholder="Titre de l'événement" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              <input type="text" placeholder="Lieu" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="Meetups entre passionnés">Meetups entre passionnés</option>
                <option value="Webinaires et Conférences">Webinaires et Conférences</option>
                <option value="Ateliers et Formations">Ateliers et Formations</option>
                <option value="Salons et Expositions">Salons et Expositions</option>
                <option value="Événements caritatifs">Événements caritatifs</option>
                <option value="Autres">Autres</option>
              </select>
              <button type="submit">{editingId ? 'Mettre à jour' : 'Ajouter un événement'}</button>
              {editingId && <button onClick={() => setEditingId(null)} className="cancel-edit-button">Annuler</button>}
            </form>
          </div>
        )}

        <div className="filters-container">
          <select name="type" value={filter.type} onChange={handleFilterChange}>
            <option value="all">Tous les événements</option>
            {isAuthenticated && <option value="my-events">Mes événements</option>}
            {isAuthenticated && <option value="attending">Mes participations</option>}
          </select>
          <select name="category" value={filter.category} onChange={handleFilterChange}>
            <option value="all">Toutes les catégories</option>
            <option value="Meetups entre passionnés">Meetups entre passionnés</option>
            <option value="Webinaires et Conférences">Webinaires et Conférences</option>
            <option value="Ateliers et Formations">Ateliers et Formations</option>
            <option value="Salons et Expositions">Salons et Expositions</option>
            <option value="Événements caritatifs">Événements caritatifs</option>
            <option value="Autres">Autres</option>
          </select>
        </div>

        <section className="events-section">
          <h2>Événements disponibles</h2>
          {filteredEvents.length === 0 && <p>Aucun événement ne correspond à vos critères.</p>}
          <div className="events-list">
            {filteredEvents.map(event => (
              <div key={event.id} className="event-item" onClick={() => setSelectedEvent(event)}>
                <h3 className="event-title">{event.title}</h3>
                <p><strong>Créateur :</strong> {event.creator_username}</p>
                <p><strong>Quand :</strong> {formatDateTime(event.date, event.time)}</p>
                <p><strong>Lieu :</strong> {event.location}</p>
                <p><strong>Catégorie :</strong> {event.category}</p>
                <p><strong>Participants :</strong> {event.participant_count || 0}</p>
                {isAuthenticated && user && event.user_id === user.id && (
                  <div className="event-actions">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(event); }} className="edit-button">Modifier</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }} className="delete-button">Supprimer</button>
                  </div>
                )}
                {isAuthenticated && user && event.user_id !== user.id && !attendingEvents.some(ae => ae.id === event.id) && (
                  <button onClick={(e) => { e.stopPropagation(); handleAttend(event.id); }} className="attend-button">Participer</button>
                )}
                {isAuthenticated && user && event.user_id !== user.id && attendingEvents.some(ae => ae.id === event.id) && (
                  <button onClick={(e) => { e.stopPropagation(); handleUnattend(event.id); }} className="unattend-button">Se désinscrire</button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Modal isOpen={showLogin} onRequestClose={() => setShowLogin(false)} className="modal" overlayClassName="modal-overlay">
        <div className="modal-content">
          <h2>Connexion</h2>
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <input type="text" placeholder="Nom d'utilisateur" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
            <input type="password" placeholder="Mot de passe" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            <button type="submit">Se connecter</button>
          </form>
          <button onClick={() => setShowLogin(false)} className="close-btn">Fermer</button>
        </div>
      </Modal>

      <Modal isOpen={showRegister} onRequestClose={() => setShowRegister(false)} className="modal" overlayClassName="modal-overlay">
        <div className="modal-content">
          <h2>Inscription</h2>
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <input type="text" placeholder="Nom d'utilisateur" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} required />
            <input type="password" placeholder="Mot de passe" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
            <label className="checkbox-label">
              <input type="checkbox" checked={registerForm.isProfessional} onChange={(e) => setRegisterForm({ ...registerForm, isProfessional: e.target.checked })} />
              Compte professionnel
            </label>
            <button type="submit">S'inscrire</button>
          </form>
          <button onClick={() => setShowRegister(false)} className="close-btn">Fermer</button>
        </div>
      </Modal>

      <Modal isOpen={!!selectedEvent} onRequestClose={() => setSelectedEvent(null)} className="modal event-detail-modal" overlayClassName="modal-overlay">
        {selectedEvent && (
          <div className="modal-content">
            <h2>{selectedEvent.title}</h2>
            <p><strong>Créateur :</strong> {selectedEvent.creator_username}</p>
            <p><strong>Quand :</strong> {formatDateTime(selectedEvent.date, selectedEvent.time)}</p>
            <p><strong>Lieu :</strong> {selectedEvent.location}</p>
            <p><strong>Catégorie :</strong> {selectedEvent.category}</p>
            <p><strong>Participants :</strong> {selectedEvent.participant_count || 0}</p>
            <p><strong>Description :</strong> {selectedEvent.description}</p>
            {isAuthenticated && user && selectedEvent.user_id === user.id && (
              <button onClick={() => fetchParticipants(selectedEvent.id)} className="view-participants-btn">Voir les participants</button>
            )}
            <button onClick={() => setSelectedEvent(null)} className="close-btn">Fermer</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showParticipants} onRequestClose={() => setShowParticipants(false)} className="modal participants-modal" overlayClassName="modal-overlay">
        <div className="modal-content">
          <h2>Participants</h2>
          {participants.length > 0 ? (
            <ul>
              {participants.map((participant, index) => <li key={index}>{participant.username}</li>)}
            </ul>
          ) : <p>Aucun participant pour le moment.</p>}
          <button onClick={() => setShowParticipants(false)} className="close-btn">Fermer</button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
