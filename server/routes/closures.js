const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT date FROM school_closures WHERE year_list_id = ?').all(req.params.yearId);
  res.json(rows.map((r) => r.date));
});

router.post('/', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });
  try {
    db.prepare('INSERT INTO school_closures (year_list_id, date) VALUES (?, ?)').run(req.params.yearId, date);
    res.status(201).json({ date });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Already closed' });
    throw e;
  }
});

router.delete('/:date', (req, res) => {
  const result = db.prepare('DELETE FROM school_closures WHERE year_list_id = ? AND date = ?').run(req.params.yearId, req.params.date);
  if (result.changes === 0) return res.status(404).json({ error: 'Closure not found' });
  res.status(204).end();
});

module.exports = router;
