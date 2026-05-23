import { useState } from 'react';
import { Menu, X, House } from 'lucide-react';
import HomeView from './views/HomeView';
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
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  function navigate(id) {
    setView(id);
    setMenuOpen(false);
  }

  const currentLabel = view === 'home' ? 'Início' : VIEWS.find((v) => v.id === view)?.label;

  return (
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white border-b border-gray-200'>
        {/* Mobile header */}
        <div className='flex items-center justify-between px-4 py-2 md:hidden'>
          <button
            onClick={() => navigate('home')}
            className='text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors cursor-pointer'
          >
            {currentLabel}
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className='p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer'
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className='md:hidden border-t border-gray-100 py-1'>
            <button
              onClick={() => navigate('home')}
              className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ${
                view === 'home' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Início
            </button>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => navigate(v.id)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ${
                  view === v.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Desktop nav */}
        <div className='hidden md:block max-w-4xl mx-auto px-4'>
          <div className='flex gap-1 py-2'>
            <button
              onClick={() => navigate('home')}
              title='Início'
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                view === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <House size={16} />
            </button>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => navigate(v.id)}
                className={`text-sm whitespace-nowrap px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  view === v.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {view === 'home' && <HomeView onNavigate={navigate} />}
      {view === 'years' && <YearsView />}
      {view === 'pupils' && <PupilsView />}
      {view === 'enrollments' && <EnrollmentsView />}
      {view === 'calendar' && <SchoolCalendarView />}
      {view === 'absences' && <AbsencesView />}
      {view === 'report' && <ReportView />}
    </div>
  );
}
