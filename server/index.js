const express = require('express');
const cors = require('cors');

const yearsRouter = require('./routes/years');
const pupilsRouter = require('./routes/pupils');
const enrollmentsRouter = require('./routes/enrollments');
const absencesRouter = require('./routes/absences');
const closuresRouter = require('./routes/closures');
const reportRouter = require('./routes/report');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/years', yearsRouter);
app.use('/api/pupils', pupilsRouter);
app.use('/api/years/:yearId/pupils', enrollmentsRouter);
app.use('/api/years/:yearId/pupils/:pupilId/absences', absencesRouter);
app.use('/api/years/:yearId/absences', absencesRouter);
app.use('/api/years/:yearId/closures', closuresRouter);
app.use('/api/years/:yearId/report', reportRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
