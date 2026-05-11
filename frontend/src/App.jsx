import React, { useState, useEffect, useCallback } from 'react'

const API = '/api/users'

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6']

function avatarBg(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Toasts ───────────────────────────────────────────────────────────────────

let _id = 0

function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = useCallback((msg, type = 'success') => {
    const id = ++_id
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  return { toasts, push }
}

function Toasts({ items }) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50">
      {items.map(t => (
        <div key={t.id} className={`
          flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg
          ${t.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}
        `}>
          <span>{t.type === 'success' ? '✓' : '✕'}</span>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Modal formulaire (créer / éditer) ─────────────────────────────────────────

function UserModal({ user, onSave, onClose }) {
  const isEdit = Boolean(user)
  const [name, setName]   = useState(user?.name  ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (name.trim().length < 2)                           e.name  = 'Minimum 2 caractères'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Email invalide'
    return e
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    await onSave({ name: name.trim(), email: email.trim() }, user?.id).finally(() => setLoading(false))
  }

  return (
    <Modal title={isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text" value={name} onChange={e => { setName(e.target.value); setErrors(x => ({...x, name: ''})) }}
            placeholder="Jean Dupont" className={`input ${errors.name ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors(x => ({...x, email: ''})) }}
            placeholder="jean@exemple.fr" className={`input ${errors.email ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? '…' : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Modal confirmation suppression ────────────────────────────────────────────

function DeleteModal({ user, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)

  return (
    <Modal title="Supprimer l'utilisateur" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Supprimer <span className="font-semibold text-gray-900">{user.name}</span> ({user.email}) ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
          <button
            onClick={async () => { setLoading(true); await onConfirm() }}
            disabled={loading}
            className="btn-danger flex-1 disabled:opacity-50"
          >
            {loading ? '…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)   // null | 'create' | { type:'edit', user }
  const [delTarget, setDelTarget] = useState(null)
  const { toasts, push } = useToasts()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(API)
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch {
      push('Impossible de charger les utilisateurs', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function saveUser(body, id) {
    try {
      const res = await fetch(id ? `${API}/${id}` : API, {
        method:  id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Erreur serveur')
      push(id ? 'Utilisateur modifié' : 'Utilisateur créé')
      setModal(null)
      fetchUsers()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  async function deleteUser() {
    try {
      const res = await fetch(`${API}/${delTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      push('Utilisateur supprimé')
      setDelTarget(null)
      fetchUsers()
    } catch (err) {
      push(err.message, 'error')
    }
  }

  const q        = search.toLowerCase()
  const filtered = q ? users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) : users

  return (
    <>
      <div className="min-h-screen bg-gray-100">

        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Gestion des utilisateurs</span>
            <span className="text-xs text-gray-400 font-mono">DevSecOps</span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-4">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un nom ou email…"
              className="input max-w-xs"
            />
            <button onClick={() => setModal('create')} className="btn-primary whitespace-nowrap">
              + Nouvel utilisateur
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Créé le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {/* Squelette chargement */}
                {loading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                        <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><div className="h-3 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-3 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3" />
                  </tr>
                ))}

                {/* Vide */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-sm text-gray-400">
                      {search ? `Aucun résultat pour « ${search} »` : 'Aucun utilisateur'}
                    </td>
                  </tr>
                )}

                {/* Données */}
                {!loading && filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: avatarBg(u.name) }}
                        >
                          {initials(u.name)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{fmtDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal({ type: 'edit', user: u })}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Éditer
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => setDelTarget(u)}
                          className="text-xs text-red-500 hover:underline font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pied */}
            {!loading && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-400">
                  {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}
                  {q && ` · filtre : "${q}"`}
                </span>
              </div>
            )}
          </div>
        </main>
      </div>

      {modal === 'create' && <UserModal onSave={saveUser} onClose={() => setModal(null)} />}
      {modal?.type === 'edit' && <UserModal user={modal.user} onSave={saveUser} onClose={() => setModal(null)} />}
      {delTarget && <DeleteModal user={delTarget} onConfirm={deleteUser} onClose={() => setDelTarget(null)} />}

      <Toasts items={toasts} />
    </>
  )
}
