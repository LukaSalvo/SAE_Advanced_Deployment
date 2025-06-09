import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', date: '', location: '', description: '' });

  useEffect(() => {
    axios.get('http://localhost:3001/events').then((res) => setEvents(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:3001/events', form);
    setForm({ title: '', date: '', location: '', description: '' });
    const res = await axios.get('http://localhost:3001/events');
    setEvents(res.data);
  };

  return (
    <div>
      <h1>Planificateur d'événements</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Titre"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="text"
          placeholder="Lieu"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">Créer</button>
      </form>
      <h2>Événements</h2>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.title} - {event.date} - {event.location}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

