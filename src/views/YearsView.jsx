import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';

function schoolYearLabel(startYear) {
  return `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}`;
}

const emptyForm = { start_year: '', p1_end: '', p2_end: '' };

function ConfirmModal({ year, onConfirm, onCancel }) {
  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4'>
        <h3 className='text-base font-semibold text-gray-800 mb-2'>
          Eliminar ano letivo {schoolYearLabel(year.start_year)}?
        </h3>
        <p className='text-sm text-gray-500 mb-6'>
          Esta ação é irreversível. Todas as faltas registadas neste ano serão também eliminadas.
        </p>
        <div className='flex gap-2 justify-end'>
          <button
            onClick={onCancel}
            className='text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer'
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className='text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer'
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function YearsView() {
  const [years, setYears] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.years
      .list()
      .then(setYears)
      .catch(() => setError('Erro ao carregar os anos letivos'));
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!editing && years.some((y) => y.start_year === Number(form.start_year))) {
      setError('Já existe um ano letivo com esse ano de início.');
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        const updated = await api.years.update(editing, {
          p1_end: form.p1_end,
          p2_end: form.p2_end,
        });
        setYears((ys) => ys.map((y) => (y.id === editing ? updated : y)));
        setEditing(null);
      } else {
        const created = await api.years.create({
          start_year: Number(form.start_year),
          p1_end: form.p1_end,
          p2_end: form.p2_end,
        });
        setYears((ys) => [created, ...ys]);
      }
      setForm(emptyForm);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(year) {
    setEditing(year.id);
    setForm({ start_year: year.start_year, p1_end: year.p1_end, p2_end: year.p2_end });
    setError('');
  }

  function handleCancel() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleDelete() {
    try {
      await api.years.delete(confirmDelete.id);
      setYears((ys) => ys.filter((y) => y.id !== confirmDelete.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>Anos Letivos</h1>

      {/* Form */}
      <div className='bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm'>
        <h2 className='text-base font-medium text-gray-700 mb-4'>
          {editing ? `Editar ${schoolYearLabel(form.start_year)}` : 'Adicionar Novo Ano'}
        </h2>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm text-gray-600 mb-1'>Ano</label>
            <input
              type='number'
              name='start_year'
              value={form.start_year}
              onChange={handleChange}
              disabled={!!editing}
              placeholder='ex: 2026'
              min='2000'
              max='2100'
              required
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
            />
            {form.start_year && (
              <p className='text-xs text-gray-400 mt-1'>
                Ano letivo:{' '}
                <span className='font-medium text-gray-600'>
                  {schoolYearLabel(Number(form.start_year))}
                </span>
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>Fim do 1.º Período</label>
              <input
                type='date'
                name='p1_end'
                value={form.p1_end}
                onChange={handleChange}
                required
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>Fim do 2.º Período</label>
              <input
                type='date'
                name='p2_end'
                value={form.p2_end}
                onChange={handleChange}
                required
                className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          {error && <p className='text-sm text-red-500'>{error}</p>}

          <div className='flex gap-2 pt-1'>
            <button
              type='submit'
              disabled={loading}
              className='bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer'
            >
              {loading ? 'A guardar…' : editing ? 'Guardar Alterações' : 'Adicionar Novo Ano'}
            </button>
            {editing && (
              <button
                type='button'
                onClick={handleCancel}
                className='text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer'
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      {years.length === 0 ? (
        <p className='text-sm text-gray-400 text-center'>Ainda não há anos adicionados.</p>
      ) : (
        <ul className='space-y-3'>
          {years.map((year) => (
            <li
              key={year.id}
              className='bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm'
            >
              <div>
                <span className='text-lg font-semibold text-gray-800'>
                  {schoolYearLabel(year.start_year)}
                </span>
                <div className='text-xs text-gray-400 mt-0.5 space-x-3'>
                  <span>1.º P termina a {year.p1_end}</span>
                  <span>·</span>
                  <span>2.º P termina a {year.p2_end}</span>
                  {year.pupil_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{year.pupil_count} {year.pupil_count === 1 ? 'aluno' : 'alunos'}</span>
                    </>
                  )}
                </div>
              </div>
              <div className='flex gap-1'>
                <button
                  onClick={() => handleEdit(year)}
                  title='Editar'
                  className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                >
                  <Pencil size={16} />
                </button>
                {!year.pupil_count && (
                  <button
                    onClick={() => setConfirmDelete(year)}
                    title='Eliminar'
                    className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmModal
          year={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
