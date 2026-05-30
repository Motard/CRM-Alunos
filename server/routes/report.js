const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const year = db.prepare('SELECT * FROM year_lists WHERE id = ?').get(req.params.yearId);
  if (!year) return res.status(404).json({ error: 'Year not found' });

  const pupils = db.prepare(`
    SELECT
      p.id, p.name,
      SUM(CASE WHEN a.date <= ? THEN 1 ELSE 0 END) AS p1_count,
      SUM(CASE WHEN a.date > ? AND a.date <= ? THEN 1 ELSE 0 END) AS p2_count,
      SUM(CASE WHEN a.date > ? THEN 1 ELSE 0 END) AS p3_count,
      COUNT(a.id) AS total,
      SUM(CASE WHEN a.justified = 1 THEN 1 ELSE 0 END) AS justified_count,
      SUM(CASE WHEN a.justified = 0 AND a.id IS NOT NULL THEN 1 ELSE 0 END) AS unjustified_count
    FROM pupils p
    INNER JOIN enrollments e ON e.pupil_id = p.id AND e.year_list_id = ?
    LEFT JOIN absences a ON a.pupil_id = p.id AND a.year_list_id = ?
    GROUP BY p.id
    ORDER BY p.name
  `).all(year.p1_end, year.p1_end, year.p2_end, year.p2_end, req.params.yearId, req.params.yearId);

  res.json(pupils);
});

module.exports = router;
