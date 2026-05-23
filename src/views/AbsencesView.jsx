import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

function getPeriod(date, p1_end, p2_end) {
  if (date <= p1_end) return 1;
  if (date <= p2_end) return 2;
  return 3;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCalendar(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday = 0
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    cells.push({ day: d, dateStr: toDateStr(year, month, d), isWeekend: dow === 0 || dow === 6 });
  }
  return cells;
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

export default function AbsencesView() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [pupils, setPupils] = useState([]);
  const [selectedPupil, setSelectedPupil] = useState(null);
  const [absenceDates, setAbsenceDates] = useState(new Set());
  const [closedDates, setClosedDates] = useState(new Set());
  const [calMonth, setCalMonth] = useState({ year: 0, month: 9 });
  const [error, setError] = useState('');

  useEffect(() => {
    api.years.list()
      .then((ys) => {
        setYears(ys);
        if (ys.length > 0) {
          setSelectedYear(ys[0]);
          setCalMonth({ year: ys[0].start_year, month: 9 });
        }
      })
      .catch(() => setError('Erro ao carregar anos'));
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setSelectedPupil(null);
    setAbsenceDates(new Set());
    setClosedDates(new Set());
    Promise.all([
      api.enrollments.list(selectedYear.id),
      api.closures.list(selectedYear.id),
    ])
      .then(([p, c]) => { setPupils(p); setClosedDates(new Set(c)); })
      .catch(() => setError('Erro ao carregar alunos'));
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedPupil || !selectedYear) return;
    api.absences
      .list(selectedYear.id, selectedPupil.id)
      .then((abs) => setAbsenceDates(new Set(abs.map((a) => a.date))))
      .catch(() => setError('Erro ao carregar faltas'));
  }, [selectedPupil, selectedYear]);

  async function toggleAbsence(dateStr) {
    setError('');
    const removing = absenceDates.has(dateStr);
    try {
      if (removing) {
        await api.absences.remove(selectedYear.id, selectedPupil.id, dateStr);
        setAbsenceDates((s) => { const n = new Set(s); n.delete(dateStr); return n; });
      } else {
        await api.absences.add(selectedYear.id, selectedPupil.id, dateStr);
        setAbsenceDates((s) => new Set(s).add(dateStr));
      }
      setPupils((ps) => ps.map((p) =>
        p.id !== selectedPupil.id ? p :
        { ...p, absence_count: (p.absence_count || 0) + (removing ? -1 : 1) }
      ));
    } catch (e) {
      setError(e.message);
    }
  }

  function prevMonth() {
    setCalMonth(({ year, month }) =>
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setCalMonth(({ year, month }) =>
      month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
    );
  }

  const cells = useMemo(() => buildCalendar(calMonth.year, calMonth.month), [calMonth]);

  const periodCounts = useMemo(() => {
    if (!selectedYear) return { 1: 0, 2: 0, 3: 0 };
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const date of absenceDates) {
      counts[getPeriod(date, selectedYear.p1_end, selectedYear.p2_end)]++;
    }
    return counts;
  }, [absenceDates, selectedYear]);

  return (
    <div className='max-w-4xl mx-auto p-3 sm:p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>Faltas</h1>

      {years.length === 0 ? (
        <p className='text-sm text-gray-400'>Ainda não há anos letivos criados.</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start'>

          {/* Left panel */}
          <div className='space-y-4'>
            <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
              <div className='px-4 py-3 border-b border-gray-100'>
                <h2 className='text-sm font-medium text-gray-700'>Ano Letivo</h2>
              </div>
              <ul>
                {years.map((y) => (
                  <li key={y.id}>
                    <button
                      onClick={() => { setSelectedYear(y); setCalMonth({ year: y.start_year, month: 9 }); setError(''); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ${
                        selectedYear?.id === y.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {schoolYearLabel(y.start_year)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
              <div className='px-4 py-3 border-b border-gray-100'>
                <h2 className='text-sm font-medium text-gray-700'>Alunos</h2>
              </div>
              {pupils.length === 0 ? (
                <p className='text-xs text-gray-400 px-4 py-3'>Nenhum aluno inscrito.</p>
              ) : (
                <ul>
                  {pupils.map((pupil) => (
                    <li key={pupil.id}>
                      <button
                        onClick={() => { setSelectedPupil(pupil); setError(''); }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                          selectedPupil?.id === pupil.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{pupil.name}</span>
                        {pupil.absence_count > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            selectedPupil?.id === pupil.id
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {pupil.absence_count}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right panel: calendar */}
          {!selectedPupil ? (
            <div className='bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center'>
              <p className='text-sm text-gray-400'>Selecione um aluno para registar faltas.</p>
            </div>
          ) : (
            <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
              <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
                <h2 className='text-sm font-medium text-gray-700'>{selectedPupil.name}</h2>
                {error && <p className='text-xs text-red-500'>{error}</p>}
              </div>

              {/* Month navigation */}
              <div className='flex items-center justify-between px-4 py-3 border-b border-gray-100'>
                <button onClick={prevMonth} className='p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer'>
                  <ChevronLeft size={16} className='text-gray-500' />
                </button>
                <span className='text-sm font-medium text-gray-700'>
                  {MONTHS[calMonth.month - 1]} {calMonth.year}
                </span>
                <button onClick={nextMonth} className='p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer'>
                  <ChevronRight size={16} className='text-gray-500' />
                </button>
              </div>

              {/* Weekday headers */}
              <div className='grid grid-cols-7 border-b border-gray-100'>
                {WEEKDAYS.map((d) => (
                  <div key={d} className={`py-2 text-center text-xs font-medium ${
                    d === 'Sáb' || d === 'Dom' ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className='grid grid-cols-7 p-2 gap-0.5 sm:gap-1'>
                {cells.map((cell, i) => {
                  if (!cell) return <div key={i} />;
                  const inactive = cell.isWeekend || closedDates.has(cell.dateStr);
                  const absent = absenceDates.has(cell.dateStr);
                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => !inactive && toggleAbsence(cell.dateStr)}
                      disabled={inactive}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${
                        inactive
                          ? 'text-gray-200 cursor-default'
                          : absent
                          ? 'bg-red-500 text-white font-medium cursor-pointer hover:bg-red-600'
                          : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Period summary */}
              <div className='px-4 py-3 border-t border-gray-100 flex items-center gap-6'>
                <span className='text-xs text-gray-500'>
                  Total: <span className='font-semibold text-gray-700'>{absenceDates.size}</span>
                </span>
                {[1, 2, 3].map((p) => (
                  <span key={p} className='text-xs text-gray-500'>
                    {p}.º Período: <span className='font-semibold text-gray-700'>{periodCounts[p]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
