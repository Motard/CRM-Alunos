import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCalendar(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
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

function NoteModal({ cell, note, onClose, onSave }) {
  const [text, setText] = useState(note);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSave() {
    setSaving(true);
    await onSave(text.trim());
    setSaving(false);
    onClose();
  }

  const dateLabel = (() => {
    const [y, m, d] = cell.dateStr.split('-');
    return `${parseInt(d)} de ${MONTHS[parseInt(m) - 1]} de ${y}`;
  })();

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30' onClick={onClose}>
      <div
        className='bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100'>
          <div>
            <p className='text-xs text-gray-400 uppercase tracking-wide'>Nota do dia</p>
            <h3 className='text-sm font-semibold text-gray-800 mt-0.5'>{dateLabel}</h3>
          </div>
          <button onClick={onClose} className='p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer'>
            <X size={16} className='text-gray-400' />
          </button>
        </div>

        <div className='px-5 py-4'>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder='Escreva uma nota para este dia…'
            className='w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700 placeholder-gray-300'
          />
        </div>

        <div className='px-5 py-3 border-t border-gray-100 flex justify-end gap-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer'
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className='px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50'
          >
            {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchoolCalendarView() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [closedDates, setClosedDates] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [calMonth, setCalMonth] = useState({ year: 0, month: 9 });
  const [error, setError] = useState('');
  const [activeCell, setActiveCell] = useState(null);

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
    setClosedDates(new Set());
    setNotes({});
    Promise.all([
      api.closures.list(selectedYear.id),
      api.notes.list(selectedYear.id),
    ])
      .then(([dates, noteRows]) => {
        setClosedDates(new Set(dates));
        const map = {};
        for (const row of noteRows) map[row.date] = row.note;
        setNotes(map);
      })
      .catch(() => setError('Erro ao carregar calendário'));
  }, [selectedYear]);

  async function toggleDay(dateStr) {
    setError('');
    const closing = !closedDates.has(dateStr);
    try {
      if (closing) {
        await api.closures.add(selectedYear.id, dateStr);
        setClosedDates((s) => new Set(s).add(dateStr));
      } else {
        await api.closures.remove(selectedYear.id, dateStr);
        setClosedDates((s) => { const n = new Set(s); n.delete(dateStr); return n; });
      }
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveNote(dateStr, text) {
    setError('');
    try {
      if (text) {
        await api.notes.save(selectedYear.id, dateStr, text);
        setNotes((n) => ({ ...n, [dateStr]: text }));
      } else if (notes[dateStr]) {
        await api.notes.remove(selectedYear.id, dateStr);
        setNotes((n) => { const m = { ...n }; delete m[dateStr]; return m; });
      }
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

  const closedThisMonth = cells.filter((c) => c && !c.isWeekend && closedDates.has(c.dateStr)).length;
  const openThisMonth = cells.filter((c) => c && !c.isWeekend && !closedDates.has(c.dateStr)).length;

  return (
    <div className='max-w-4xl mx-auto p-3 sm:p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>Calendário Escolar</h1>

      {years.length === 0 ? (
        <p className='text-sm text-gray-400'>Ainda não há anos letivos criados.</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start'>

          {/* Year selector */}
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

          {/* Calendar */}
          <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
            <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
              <div>
                <h2 className='text-sm font-medium text-gray-700'>Dias com escola</h2>
                <p className='text-xs text-gray-400 mt-0.5'>Clique num dia útil para o marcar como encerrado</p>
              </div>
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
                const closed = closedDates.has(cell.dateStr);
                const hasNote = !!notes[cell.dateStr];
                return (
                  <div
                    key={cell.dateStr}
                    className={`aspect-square relative flex items-center justify-center rounded-lg text-sm transition-colors ${
                      cell.isWeekend
                        ? 'text-gray-200'
                        : closed
                        ? 'bg-gray-200 text-gray-400 cursor-pointer hover:bg-gray-300'
                        : 'bg-green-50 text-green-700 font-medium cursor-pointer hover:bg-green-100'
                    }`}
                    onClick={() => !cell.isWeekend && toggleDay(cell.dateStr)}
                  >
                    {cell.day}

                    {!cell.isWeekend && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveCell(cell); }}
                        title='Adicionar nota'
                        className='absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded transition-colors cursor-pointer text-gray-500 hover:text-blue-500'
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    )}

                    {hasNote && (
                      <span className='absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400' />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className='px-4 py-3 border-t border-gray-100 flex items-center gap-6'>
              <span className='text-xs text-gray-500 flex items-center gap-1.5'>
                <span className='w-3 h-3 rounded-sm bg-green-100 inline-block' />
                Aberto: <span className='font-semibold text-gray-700'>{openThisMonth}</span>
              </span>
              <span className='text-xs text-gray-500 flex items-center gap-1.5'>
                <span className='w-3 h-3 rounded-sm bg-gray-200 inline-block' />
                Encerrado: <span className='font-semibold text-gray-700'>{closedThisMonth}</span>
              </span>
              <span className='text-xs text-gray-500 flex items-center gap-1.5'>
                <span className='w-3 h-3 rounded-full bg-blue-400 inline-block' />
                Com nota
              </span>
            </div>
          </div>
        </div>
      )}

      {activeCell && (
        <NoteModal
          cell={activeCell}
          note={notes[activeCell.dateStr] || ''}
          onClose={() => setActiveCell(null)}
          onSave={(text) => saveNote(activeCell.dateStr, text)}
        />
      )}
    </div>
  );
}
