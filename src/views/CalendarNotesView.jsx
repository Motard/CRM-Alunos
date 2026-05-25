import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${WEEKDAYS[dow]}, ${d} de ${MONTHS[m - 1]} de ${y}`;
}

export default function CalendarNotesView() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.years.list()
      .then((ys) => {
        setYears(ys);
        if (ys.length > 0) setSelectedYear(ys[0]);
      })
      .catch(() => setError('Erro ao carregar anos'));
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    setNotes([]);
    api.notes.list(selectedYear.id)
      .then((rows) => {
        const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
        setNotes(sorted);
      })
      .catch(() => setError('Erro ao carregar notas'))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  async function deleteNote(date) {
    setError('');
    try {
      await api.notes.remove(selectedYear.id, date);
      setNotes((n) => n.filter((r) => r.date !== date));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className='max-w-4xl mx-auto p-3 sm:p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>Notas do Calendário</h1>

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
                    onClick={() => { setSelectedYear(y); setError(''); }}
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

          {/* Notes list */}
          <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
            <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
              <h2 className='text-sm font-medium text-gray-700'>Notas</h2>
              {error && <p className='text-xs text-red-500'>{error}</p>}
            </div>

            {loading ? (
              <p className='text-sm text-gray-400 px-4 py-6'>A carregar…</p>
            ) : notes.length === 0 ? (
              <p className='text-sm text-gray-400 px-4 py-6'>Nenhuma nota registada para este ano letivo.</p>
            ) : (
              <ul className='divide-y divide-gray-100'>
                {notes.map((row) => (
                  <li key={row.date} className='flex items-start gap-3 px-4 py-4 group'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-medium text-gray-400 mb-1'>{formatDate(row.date)}</p>
                      <p className='text-sm text-gray-700 whitespace-pre-wrap'>{row.note}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(row.date)}
                      title='Eliminar nota'
                      className='mt-0.5 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100'
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
