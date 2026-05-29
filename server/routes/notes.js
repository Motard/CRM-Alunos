const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT date, note FROM day_notes WHERE year_list_id = ?').all(req.params.yearId);
  res.json(rows);
});

router.put('/:date', (req, res) => {
  const { note } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'note is required' });
  db.prepare(
    'INSERT INTO day_notes (year_list_id, date, note) VALUES (?, ?, ?) ON CONFLICT(year_list_id, date) DO UPDATE SET note = excluded.note'
  ).run(req.params.yearId, req.params.date, note.trim());
  res.json({ date: req.params.date, note: note.trim() });
});

router.delete('/:date', (req, res) => {
  const result = db.prepare('DELETE FROM day_notes WHERE year_list_id = ? AND date = ?').run(req.params.yearId, req.params.date);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.status(204).end();
});

module.exports = router;
