const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const years = db.prepare(`
    SELECT y.*, COUNT(e.id) AS pupil_count
    FROM year_lists y
    LEFT JOIN enrollments e ON e.year_list_id = y.id
    GROUP BY y.id
    ORDER BY y.start_year DESC
  `).all();
  res.json(years);
});

router.post('/', (req, res) => {
  const { start_year, p1_end, p2_end } = req.body;
  if (!start_year || !p1_end || !p2_end) {
    return res.status(400).json({ error: 'start_year, p1_end and p2_end are required' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO year_lists (start_year, p1_end, p2_end) VALUES (?, ?, ?)'
    ).run(start_year, p1_end, p2_end);
    res.status(201).json(db.prepare('SELECT * FROM year_lists WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Year already exists' });
    throw e;
  }
});

router.put('/:id', (req, res) => {
  const { p1_end, p2_end } = req.body;
  if (!p1_end || !p2_end) {
    return res.status(400).json({ error: 'p1_end and p2_end are required' });
  }
  const result = db.prepare(
    'UPDATE year_lists SET p1_end = ?, p2_end = ? WHERE id = ?'
  ).run(p1_end, p2_end, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Year not found' });
  res.json(db.prepare('SELECT * FROM year_lists WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM enrollments WHERE year_list_id = ?').get(req.params.id);
  if (count > 0) return res.status(409).json({ error: 'Year has enrolled pupils and cannot be deleted' });
  const result = db.prepare('DELETE FROM year_lists WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Year not found' });
  res.status(204).end();
});

module.exports = router;
