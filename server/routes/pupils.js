const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { all } = req.query;
  const pupils = all
    ? db.prepare('SELECT * FROM pupils ORDER BY name').all()
    : db.prepare('SELECT * FROM pupils WHERE active = 1 ORDER BY name').all();
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

module.exports = router;
