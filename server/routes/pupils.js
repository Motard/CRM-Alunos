const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { all } = req.query;
  const where = all ? '' : 'WHERE p.active = 1';
  const pupils = db.prepare(`
    SELECT p.*, COUNT(a.id) AS absence_count
    FROM pupils p
    LEFT JOIN absences a ON a.pupil_id = p.id
    ${where}
    GROUP BY p.id
    ORDER BY p.name
  `).all();
  res.json(pupils);
});

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
  const result = db.prepare('INSERT INTO pupils (name) VALUES (?)').run(name.trim());
  res.status(201).json(db.prepare('SELECT * FROM pupils WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, active } = req.body;
  const pupil = db.prepare('SELECT * FROM pupils WHERE id = ?').get(req.params.id);
  if (!pupil) return res.status(404).json({ error: 'Pupil not found' });

  const newName = name !== undefined ? name.trim() : pupil.name;
  const newActive = active !== undefined ? (active ? 1 : 0) : pupil.active;

  db.prepare('UPDATE pupils SET name = ?, active = ? WHERE id = ?').run(newName, newActive, req.params.id);
  res.json(db.prepare('SELECT * FROM pupils WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM absences WHERE pupil_id = ?').get(req.params.id);
  if (count > 0) return res.status(409).json({ error: 'Pupil has absences and cannot be deleted' });
  const result = db.prepare('DELETE FROM pupils WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Pupil not found' });
  res.status(204).end();
});

module.exports = router;
