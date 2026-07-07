'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from './lib/supabase'
import type { Contact } from './lib/types'
import AuthScreen from './components/auth-screen'
import ContactCard from './components/contact-card'
import ContactForm from './components/contact-form'
import DebriefPanel from './components/debrief-panel'
import DeleteModal from './components/delete-modal'

export default function Home() {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    if (error) console.error('Failed to fetch contacts:', error.message)
    setContacts(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (session) fetchContacts()
  }, [session, fetchContacts])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setContacts([])
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `memoru-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function deleteAccount() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setDeleteError(body.error || 'Something went wrong.')
        setDeleteLoading(false)
        return
      }
      await supabase.auth.signOut()
      setShowDeleteModal(false)
    } catch {
      setDeleteError('Network error. Please try again.')
      setDeleteLoading(false)
    }
  }

  async function addContact(form: Omit<Contact, 'id'>) {
    const { error } = await supabase.from('contacts').insert([form])
    if (error) throw new Error(error.message)
    setShowForm(false)
    fetchContacts()
  }

  async function deleteContact(id: number) {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) { alert('Failed to delete contact: ' + error.message); return }
    fetchContacts()
  }

  async function saveDebriefContact(contact: Omit<Contact, 'id'>) {
    const { error } = await supabase.from('contacts').insert([contact])
    if (error) throw new Error(error.message)
    fetchContacts()
  }

  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Loading...</div>
  )

  if (!session) return <AuthScreen supabase={supabase} />

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">memoru</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{session.user.email}</span>
          <button onClick={exportData} className="text-xs text-gray-400 hover:text-gray-700">Export data</button>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteError('') }}
            className="text-xs text-red-300 hover:text-red-500"
          >
            Delete account
          </button>
          <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-700">Sign out</button>
          <button
            onClick={() => { setShowDebrief(!showDebrief); setShowForm(false) }}
            className="px-4 py-2 border border-black text-black rounded-lg text-sm"
          >
            + Event notes
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowDebrief(false) }}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm"
          >
            + Add contact
          </button>
        </div>
      </div>

      {showDebrief && <DebriefPanel onSaveContact={saveDebriefContact} />}
      {showForm && <ContactForm onSave={addContact} onCancel={() => setShowForm(false)} />}
      {showDeleteModal && (
        <DeleteModal
          onConfirm={deleteAccount}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid gap-4">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} onDelete={deleteContact} />
          ))}
          {contacts.length === 0 && (
            <p className="text-gray-400 text-sm">No contacts yet. Add your first one.</p>
          )}
        </div>
      )}
    </main>
  )
}
