import { useState, useEffect } from 'react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

export default function EnrollmentsView() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [allPupils, setAllPupils] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [absenceIds, setAbsenceIds] = useState(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.years.list(), api.pupils.list(false)])
      .then(([y, p]) => {
        setYears(y);
        setAllPupils(p);
        if (y.length > 0) setSelectedYear(y[0]);
      })
      .catch(() => setError('Erro ao carregar dados'));
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    api.enrollments
      .list(selectedYear.id)
      .then((pupils) => {
        setEnrolledIds(new Set(pupils.map((p) => p.id)));
        setAbsenceIds(new Set(pupils.filter((p) => p.absence_count > 0).map((p) => p.id)));
      })
      .catch(() => setError('Erro ao carregar inscrições'));
  }, [selectedYear]);

  async function handleToggle(pupil) {
    setError('');
    const isEnrolled = enrolledIds.has(pupil.id);
    try {
      if (isEnrolled) {
        await api.enrollments.remove(selectedYear.id, pupil.id);
        setEnrolledIds((ids) => { const s = new Set(ids); s.delete(pupil.id); return s; });
      } else {
        await api.enrollments.add(selectedYear.id, pupil.id);
        setEnrolledIds((ids) => new Set(ids).add(pupil.id));
      }
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className='max-w-2xl mx-auto p-3 sm:p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>Inscrições</h1>

      {years.length === 0 ? (
        <p className='text-sm text-gray-400'>Ainda não há anos letivos criados.</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start'>

          {/* Years list */}
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

          {/* Pupils list */}
          <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
            <div className='px-4 py-3 border-b border-gray-100 flex items-center justify-between'>
              <h2 className='text-sm font-medium text-gray-700'>Alunos</h2>
              {allPupils.length > 0 && (
                <span className='text-xs text-gray-400'>
                  {enrolledIds.size} / {allPupils.length} inscritos
                </span>
              )}
            </div>

            {error && <p className='text-sm text-red-500 px-4 py-2'>{error}</p>}

            {allPupils.length === 0 ? (
              <p className='text-sm text-gray-400 px-4 py-4'>Ainda não há alunos criados.</p>
            ) : (
              <ul className='divide-y divide-gray-100'>
                {allPupils.map((pupil) => {
                  const locked = enrolledIds.has(pupil.id) && absenceIds.has(pupil.id);
                  return (
                    <li key={pupil.id}>
                      <label className={`flex items-center gap-3 px-4 py-3 ${locked ? 'cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                        <input
                          type='checkbox'
                          checked={enrolledIds.has(pupil.id)}
                          onChange={() => !locked && handleToggle(pupil)}
                          disabled={locked}
                          title={locked ? 'Este aluno já tem faltas registadas neste ano' : ''}
                          className='w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed'
                        />
                        <span className={`text-sm ${locked ? 'text-gray-400' : 'text-gray-800'}`}>
                          {pupil.name}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
