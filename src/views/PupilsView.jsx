import { useState, useEffect } from 'react';
import { Pencil, X, Check, UserX, UserCheck, Trash2 } from 'lucide-react';
import { api } from '../api';

function ConfirmModal({ pupil, onConfirm, onCancel }) {
  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4'>
        <h3 className='text-base font-semibold text-gray-800 mb-2'>
          Eliminar aluno {pupil.name}?
        </h3>
        <p className='text-sm text-gray-500 mb-6'>
          Esta ação é irreversível.
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

export default function PupilsView() {
  const [pupils, setPupils] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.pupils
      .list(true)
      .then(setPupils)
      .catch(() => setError('Erro ao carregar os alunos'));
  }, []);

  const visible = showInactive ? pupils : pupils.filter((p) => p.active);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const name = newName.trim();
    if (!name) return;
    if (pupils.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Já existe um aluno com esse nome.');
      return;
    }
    setLoading(true);
    try {
      const created = await api.pupils.create({ name });
      setPupils((ps) => [...ps, created]);
      setNewName('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(pupil) {
    setEditingId(pupil.id);
    setEditingName(pupil.name);
    setError('');
  }

  async function confirmEdit(pupil) {
    const name = editingName.trim();
    if (!name) return;
    if (
      name.toLowerCase() !== pupil.name.toLowerCase() &&
      pupils.some((p) => p.id !== pupil.id && p.name.toLowerCase() === name.toLowerCase())
    ) {
      setError('Já existe um aluno com esse nome.');
      return;
    }
    try {
      const updated = await api.pupils.update(pupil.id, { name });
      setPupils((ps) => ps.map((p) => (p.id === pupil.id ? updated : p)));
      setEditingId(null);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
    setError('');
  }

  async function handleDelete() {
    try {
      await api.pupils.delete(confirmDelete.id);
      setPupils((ps) => ps.filter((p) => p.id !== confirmDelete.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function toggleActive(pupil) {
    try {
      const updated = await api.pupils.update(pupil.id, { active: !pupil.active });
      setPupils((ps) => ps.map((p) => (p.id === pupil.id ? updated : p)));
    } catch (e) {
      setError(e.message);
    }
  }

  const activeCount = pupils.filter((p) => p.active).length;
  const inactiveCount = pupils.filter((p) => !p.active).length;

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <h1 className='text-2xl font-semibold text-gray-800 mb-6'>Alunos</h1>

      {/* Add form */}
      <div className='bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm'>
        <h2 className='text-base font-medium text-gray-700 mb-4'>Adicionar Aluno</h2>
        <form onSubmit={handleAdd} className='flex gap-2'>
          <input
            type='text'
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            placeholder='Nome do aluno'
            required
            className='flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
          <button
            type='submit'
            disabled={loading}
            className='bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer'
          >
            {loading ? 'A guardar…' : 'Adicionar'}
          </button>
        </form>
        {error && <p className='text-sm text-red-500 mt-2'>{error}</p>}
      </div>

      {/* List header */}
      <div className='flex items-center justify-between mb-3'>
        <p className='text-sm text-gray-500'>
          {activeCount} {activeCount === 1 ? 'aluno ativo' : 'alunos ativos'}
          {inactiveCount > 0 && ` · ${inactiveCount} inativo${inactiveCount > 1 ? 's' : ''}`}
        </p>
        {inactiveCount > 0 && (
          <button
            onClick={() => setShowInactive((v) => !v)}
            className='text-xs text-blue-600 hover:underline cursor-pointer'
          >
            {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
          </button>
        )}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className='text-sm text-gray-400 text-center'>Ainda não há alunos adicionados.</p>
      ) : (
        <ul className='space-y-2'>
          {visible.map((pupil) => (
            <li
              key={pupil.id}
              className={`bg-white border rounded-xl px-5 py-3 flex items-center justify-between shadow-sm ${
                pupil.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              {editingId === pupil.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmEdit(pupil);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className='flex-1 border border-blue-400 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2'
                />
              ) : (
                <span className='text-sm text-gray-800'>{pupil.name}</span>
              )}

              <div className='flex gap-1 shrink-0'>
                {editingId === pupil.id ? (
                  <>
                    <button
                      onClick={() => confirmEdit(pupil)}
                      title='Guardar'
                      className='p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer'
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      title='Cancelar'
                      className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(pupil)}
                      title='Editar'
                      className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer'
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(pupil)}
                      title={pupil.active ? 'Desativar aluno' : 'Reativar aluno'}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        pupil.active
                          ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {pupil.active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                    {!pupil.absence_count && (
                      <button
                        onClick={() => setConfirmDelete(pupil)}
                        title='Eliminar'
                        className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer'
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmDelete && (
        <ConfirmModal
          pupil={confirmDelete}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
