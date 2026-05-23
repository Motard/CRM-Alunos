const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const pupils = db.prepare(`
    SELECT p.*, COUNT(a.id) AS absence_count
    FROM pupils p
    INNER JOIN enrollments e ON e.pupil_id = p.id
    LEFT JOIN absences a ON a.pupil_id = p.id AND a.year_list_id = ?
    WHERE e.year_list_id = ?
    GROUP BY p.id
    ORDER BY p.name
  `).all(req.params.yearId, req.params.yearId);
  res.json(pupils);
});

router.post('/', (req, res) => {
  const { pupil_id } = req.body;
  if (!pupil_id) return res.status(400).json({ error: 'pupil_id is required' });
  try {
    const result = db.prepare(
      'INSERT INTO enrollments (pupil_id, year_list_id) VALUES (?, ?)'
    ).run(pupil_id, req.params.yearId);
    res.status(201).json({ id: result.lastInsertRowid, pupil_id, year_list_id: Number(req.params.yearId) });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Pupil already enrolled' });
    if (e.message.includes('FOREIGN KEY')) return res.status(404).json({ error: 'Pupil or year not found' });
    throw e;
  }
});

router.delete('/:pupilId', (req, res) => {
  const { count } = db.prepare(
    'SELECT COUNT(*) AS count FROM absences WHERE year_list_id = ? AND pupil_id = ?'
  ).get(req.params.yearId, req.params.pupilId);
  if (count > 0) return res.status(409).json({ error: 'Pupil has absences in this year and cannot be removed' });
  const result = db.prepare(
    'DELETE FROM enrollments WHERE year_list_id = ? AND pupil_id = ?'
  ).run(req.params.yearId, req.params.pupilId);
  if (result.changes === 0) return res.status(404).json({ error: 'Enrollment not found' });
  res.status(204).end();
});

module.exports = router;
