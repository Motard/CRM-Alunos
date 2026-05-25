import { CalendarDays, Users, ClipboardList, CalendarCheck, AlertCircle, BarChart2, StickyNote } from 'lucide-react';

const TILES = [
  {
    id: 'years',
    label: 'Anos Letivos',
    description: 'Criar e gerir anos letivos e períodos.',
    icon: CalendarDays,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'pupils',
    label: 'Alunos',
    description: 'Adicionar e gerir a lista de alunos.',
    icon: Users,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'enrollments',
    label: 'Inscrições',
    description: 'Inscrever alunos num ano letivo.',
    icon: ClipboardList,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'calendar',
    label: 'Calendário Escolar',
    description: 'Marcar dias sem escola (feriados, greves).',
    icon: CalendarCheck,
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'calendar-notes',
    label: 'Notas do Calendário',
    description: 'Consultar as notas adicionadas aos dias do calendário.',
    icon: StickyNote,
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    id: 'absences',
    label: 'Faltas',
    description: 'Registar faltas por aluno e por dia.',
    icon: AlertCircle,
    color: 'bg-red-50 text-red-600',
  },
  {
    id: 'report',
    label: 'Relatório de Faltas',
    description: 'Consultar faltas por aluno e por período.',
    icon: BarChart2,
    color: 'bg-gray-50 text-gray-600',
  },
];

export default function HomeView({ onNavigate }) {
  return (
    <div className='max-w-4xl mx-auto p-4 sm:p-8'>
      <div className='mb-8'>
        <h1 className='text-2xl sm:text-3xl font-semibold text-gray-800'>Bem-vinda 👋</h1>
        <p className='text-sm text-gray-400 mt-1'>O que pretende fazer hoje?</p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {TILES.map(({ id, label, description, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className='bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group'
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${color}`}>
              <Icon size={20} />
            </div>
            <h2 className='text-sm font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors'>
              {label}
            </h2>
            <p className='text-xs text-gray-400 leading-relaxed'>{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
