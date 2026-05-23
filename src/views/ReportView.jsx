import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

function PeriodBadge({ count, period }) {
  if (!count) return <span className='text-gray-300'>—</span>;
  return <span className='font-medium text-gray-700'>{count}</span>;
}

function MasterView({ year, pupils, onSelectPupil }) {
  const totalAbsences = pupils.reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
        <div className='px-5 py-3 border-b border-gray-100 flex items-center justify-between'>
          <h2 className='text-sm font-medium text-gray-700'>
            Ano letivo {schoolYearLabel(year.start_year)}
          </h2>
          <span className='text-xs text-gray-400'>
            {pupils.length} alunos · {totalAbsences} faltas
          </span>
        </div>

        {pupils.length === 0 ? (
          <p className='text-sm text-gray-400 px-5 py-4'>
            Nenhum aluno inscrito neste ano.
          </p>
        ) : (
          <div className='overflow-x-auto'><table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 text-xs text-gray-400'>
                <th className='text-left px-5 py-2 font-medium'>Aluno</th>
                <th className='text-center px-4 py-2 font-medium'>1.º P</th>
                <th className='text-center px-4 py-2 font-medium'>2.º P</th>
                <th className='text-center px-4 py-2 font-medium'>3.º P</th>
                <th className='text-center px-4 py-2 font-medium'>Total</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {pupils.map((pupil) => (
                <tr
                  key={pupil.id}
                  onClick={() => onSelectPupil(pupil)}
                  className='hover:bg-blue-50 cursor-pointer transition-colors'
                >
                  <td className='px-5 py-3 text-gray-800'>{pupil.name}</td>
                  <td className='px-4 py-3 text-center'>
                    <PeriodBadge count={pupil.p1_count} />
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <PeriodBadge count={pupil.p2_count} />
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <PeriodBadge count={pupil.p3_count} />
                  </td>
                  <td className='px-4 py-3 text-center'>
                    {pupil.total > 0 ? (
                      <span className='font-semibold text-gray-800'>
                        {pupil.total}
                      </span>
                    ) : (
                      <span className='text-gray-300'>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

function DetailView({ year, pupil, onBack }) {
  const [absences, setAbsences] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.absences
      .list(year.id, pupil.id)
      .then(setAbsences)
      .catch(() => setError('Erro ao carregar faltas'));
  }, [year.id, pupil.id]);

  const byPeriod = { 1: [], 2: [], 3: [] };
  for (const a of absences) byPeriod[a.period].push(a.date);

  return (
    <div>
      <button
        onClick={onBack}
        className='flex items-center gap-1 text-sm text-blue-600 hover:underline cursor-pointer mb-4'
      >
        <ChevronLeft size={15} />
        Voltar
      </button>

      <div className='bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden'>
        <div className='px-5 py-3 border-b border-gray-100 flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-medium text-gray-800'>{pupil.name}</h2>
            <p className='text-xs text-gray-400 mt-0.5'>
              Ano letivo {schoolYearLabel(year.start_year)}
            </p>
          </div>
          <span className='text-sm font-semibold text-gray-700'>
            {absences.length} {absences.length === 1 ? 'falta' : 'faltas'}
          </span>
        </div>

        {error && <p className='text-sm text-red-500 px-5 py-3'>{error}</p>}

        {absences.length === 0 ? (
          <p className='text-sm text-gray-400 px-5 py-4'>
            Sem faltas registadas.
          </p>
        ) : (
          <div className='divide-y divide-gray-100'>
            {[1, 2, 3].map(
              (p) =>
                byPeriod[p].length > 0 && (
                  <div key={p} className='px-5 py-4'>
                    <h3 className='text-xs font-medium text-gray-400 uppercase tracking-wide mb-3'>
                      {p}.º Período — {byPeriod[p].length}{' '}
                      {byPeriod[p].length === 1 ? 'falta' : 'faltas'}
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {byPeriod[p].map((date) => (
                        <span
                          key={date}
                          className='text-sm bg-red-50 text-red-700 border border-red-100 rounded-lg px-3 py-1'
                        >
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportView() {
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [pupils, setPupils] = useState([]);
  const [selectedPupil, setSelectedPupil] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.years
      .list()
      .then((ys) => {
        setYears(ys);
        if (ys.length > 0) setSelectedYear(ys[0]);
      })
      .catch(() => setError('Erro ao carregar anos'));
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setSelectedPupil(null);
    api.report
      .year(selectedYear.id)
      .then(setPupils)
      .catch(() => setError('Erro ao carregar relatório'));
  }, [selectedYear]);

  return (
    <div className='max-w-4xl mx-auto p-3 sm:p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>
        Relatório de Faltas
      </h1>

      {years.length === 0 ? (
        <p className='text-sm text-gray-400'>
          Ainda não há anos letivos criados.
        </p>
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
                    onClick={() => {
                      setSelectedYear(y);
                      setSelectedPupil(null);
                      setError('');
                    }}
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

          {/* Main content */}
          <div>
            {error && <p className='text-sm text-red-500 mb-4'>{error}</p>}
            {selectedYear && !selectedPupil && (
              <MasterView
                year={selectedYear}
                pupils={pupils}
                onSelectPupil={setSelectedPupil}
              />
            )}
            {selectedYear && selectedPupil && (
              <DetailView
                year={selectedYear}
                pupil={selectedPupil}
                onBack={() => setSelectedPupil(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
