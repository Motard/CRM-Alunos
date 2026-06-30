import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

function PeriodBadge({ count, period }) {
  if (!count) return <span className='text-gray-300'>—</span>;
  return <span className='font-medium text-gray-700'>{count}</span>;
}

const COLUMNS = [
  { key: 'name',     label: 'Aluno',  align: 'left'   },
  { key: 'p1_count', label: '1.º P',  align: 'center' },
  { key: 'p2_count', label: '2.º P',  align: 'center' },
  { key: 'p3_count', label: '3.º P',  align: 'center' },
  { key: 'total',    label: 'Total',  align: 'center' },
];

function MasterView({ year, pupils, onSelectPupil }) {
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const totalAbsences = pupils.reduce((s, p) => s + p.total, 0);

  const sorted = useMemo(() => {
    return [...pupils].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : (aVal ?? 0) - (bVal ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [pupils, sortCol, sortDir]);

  function handleSort(key) {
    if (sortCol === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ colKey }) {
    if (sortCol !== colKey) return <ChevronUp size={12} className='opacity-20 ml-0.5 inline' />;
    return sortDir === 'desc'
      ? <ChevronDown size={12} className='ml-0.5 inline text-blue-500' />
      : <ChevronUp size={12} className='ml-0.5 inline text-blue-500' />;
  }

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
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-2 font-medium cursor-pointer select-none hover:text-gray-600 transition-colors ${
                      col.align === 'left' ? 'text-left px-5' : 'text-center px-4'
                    } ${sortCol === col.key ? 'text-gray-600' : ''}`}
                  >
                    {col.label}<SortIcon colKey={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {sorted.map((pupil) => (
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
                      <span className='font-semibold'>
                        <span className='text-blue-500'>{pupil.total}</span>
                        {(pupil.total - pupil.justified_count) > 0 && (
                          <>
                            <span className='text-gray-400'>(</span>
                            <span className='text-red-500'>{pupil.total - pupil.justified_count}</span>
                            <span className='text-gray-400'>)</span>
                          </>
                        )}
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
  for (const a of absences) byPeriod[a.period].push(a);

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
          <div className='text-right'>
            <span className='text-sm font-semibold text-gray-700'>
              {absences.length} {absences.length === 1 ? 'falta' : 'faltas'}
            </span>
            {absences.filter(a => a.justified).length > 0 && (
              <p className='text-xs font-medium text-blue-500 mt-0.5'>
                {absences.filter(a => a.justified).length}{' '}
                {absences.filter(a => a.justified).length === 1 ? 'justificada' : 'justificadas'}
              </p>
            )}
          </div>
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
                    <h3 className='text-xs font-medium uppercase tracking-wide mb-3'>
                      <span className='text-gray-400'>
                        {p}.º Período — {byPeriod[p].length}{' '}
                        {byPeriod[p].length === 1 ? 'falta' : 'faltas'}
                      </span>
                      {byPeriod[p].filter(a => a.justified).length > 0 && (
                        <span className='text-blue-500'>
                          {' · '}
                          {byPeriod[p].filter(a => a.justified).length}{' '}
                          {byPeriod[p].filter(a => a.justified).length === 1 ? 'falta justificada' : 'faltas justificadas'}
                        </span>
                      )}
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {byPeriod[p].map((a) => (
                        <span
                          key={a.date}
                          className={`text-sm rounded-lg px-3 py-1 border ${
                            a.justified
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                          }`}
                        >
                          {a.date}
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
