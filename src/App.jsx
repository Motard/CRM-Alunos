import { useState } from 'react';
import YearsView from './views/YearsView';
import PupilsView from './views/PupilsView';
import EnrollmentsView from './views/EnrollmentsView';
import AbsencesView from './views/AbsencesView';
import SchoolCalendarView from './views/SchoolCalendarView';
import ReportView from './views/ReportView';

const VIEWS = [
  { id: 'years', label: 'Anos Letivos' },
  { id: 'pupils', label: 'Alunos' },
  { id: 'enrollments', label: 'Inscrições' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'absences', label: 'Faltas' },
  { id: 'report', label: 'Relatório de Faltas' },
];

export default function App() {
  const [view, setView] = useState('years');

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white border-b border-gray-200'>
        <div className='max-w-2xl mx-auto px-6 flex gap-1 py-2'>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                view === v.id
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </nav>

      {view === 'years' && <YearsView />}
      {view === 'pupils' && <PupilsView />}
      {view === 'enrollments' && <EnrollmentsView />}
      {view === 'calendar' && <SchoolCalendarView />}
      {view === 'absences' && <AbsencesView />}
      {view === 'report' && <ReportView />}
    </div>
  );
}
