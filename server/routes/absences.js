const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

function getPeriod(date, p1_end, p2_end) {
  if (date <= p1_end) return 1;
  if (date <= p2_end) return 2;
  return 3;
}

// GET /api/years/:yearId/pupils/:pupilId/absences
router.get('/', (req, res) => {
  const year = db.prepare('SELECT * FROM year_lists WHERE id = ?').get(req.params.yearId);
  if (!year) return res.status(404).json({ error: 'Year not found' });

  const absences = db.prepare(`
    SELECT * FROM absences
    WHERE year_list_id = ? AND pupil_id = ?
    ORDER BY date
  `).all(req.params.yearId, req.params.pupilId);

  const result = absences.map(a => ({
    ...a,
    period: getPeriod(a.date, year.p1_end, year.p2_end),
  }));

  res.json(result);
});

// GET /api/years/:yearId/absences  — all absences for a year (with period)
router.get('/all', (req, res) => {
  const year = db.prepare('SELECT * FROM year_lists WHERE id = ?').get(req.params.yearId);
  if (!year) return res.status(404).json({ error: 'Year not found' });

  const absences = db.prepare(`
    SELECT a.*, p.name as pupil_name FROM absences a
    INNER JOIN pupils p ON p.id = a.pupil_id
    WHERE a.year_list_id = ?
    ORDER BY a.date, p.name
  `).all(req.params.yearId);

  const result = absences.map(a => ({
    ...a,
    period: getPeriod(a.date, year.p1_end, year.p2_end),
  }));

  res.json(result);
});

// POST /api/years/:yearId/pupils/:pupilId/absences
router.post('/', (req, res) => {
  const { date, justified = false } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required' });

  const year = db.prepare('SELECT * FROM year_lists WHERE id = ?').get(req.params.yearId);
  if (!year) return res.status(404).json({ error: 'Year not found' });

  try {
    const result = db.prepare(
      'INSERT INTO absences (pupil_id, year_list_id, date, justified) VALUES (?, ?, ?, ?)'
    ).run(req.params.pupilId, req.params.yearId, date, justified ? 1 : 0);

    res.status(201).json({
      id: result.lastInsertRowid,
      pupil_id: Number(req.params.pupilId),
      year_list_id: Number(req.params.yearId),
      date,
      justified: justified ? 1 : 0,
      period: getPeriod(date, year.p1_end, year.p2_end),
    });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Absence already recorded for this date' });
    if (e.message.includes('FOREIGN KEY')) return res.status(404).json({ error: 'Pupil or year not found' });
    throw e;
  }
});

// PATCH /api/years/:yearId/pupils/:pupilId/absences/:date
router.patch('/:date', (req, res) => {
  const { justified } = req.body;
  if (justified === undefined) return res.status(400).json({ error: 'justified is required' });

  const result = db.prepare(
    'UPDATE absences SET justified = ? WHERE year_list_id = ? AND pupil_id = ? AND date = ?'
  ).run(justified ? 1 : 0, req.params.yearId, req.params.pupilId, req.params.date);

  if (result.changes === 0) return res.status(404).json({ error: 'Absence not found' });
  res.json({ date: req.params.date, justified: justified ? 1 : 0 });
});

// DELETE /api/years/:yearId/pupils/:pupilId/absences/:date
router.delete('/:date', (req, res) => {
  const result = db.prepare(
    'DELETE FROM absences WHERE year_list_id = ? AND pupil_id = ? AND date = ?'
  ).run(req.params.yearId, req.params.pupilId, req.params.date);
  if (result.changes === 0) return res.status(404).json({ error: 'Absence not found' });
  res.status(204).end();
});

module.exports = router;
