'use client'

import { useEffect, useState } from 'react'
import { createClient } from './lib/supabase'

type Contact = {
  id: number
  name: string
  role: string
  company: string
  event: string
  heat: string
  tags: string
  notes: string
  advice: string
  next_action: string
}

interface ExtractedContact {
  name: string
  role: string
  company: string
  what_you_talked_about: string
  heat: 'hot' | 'warm' | 'cold'
  tags: string[]
  linkedin_url?: string
  enriched_role?: string
  one_line_bio?: string
  linkedin_message?: string
}

export default function Home() {
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [form, setForm] = useState({
    name: '', role: '', company: '', event: '',
    heat: 'warm', tags: '', notes: '', advice: '', next_action: ''
  })

  // debrief state
  const [debriefNotes, setDebriefNotes] = useState('')
  const [debriefEvent, setDebriefEvent] = useState('')
  const [debriefSender, setDebriefSender] = useState('')
  const [debriefStatus, setDebriefStatus] = useState('')
  const [debriefContacts, setDebriefContacts] = useState<ExtractedContact[]>([])
  const [debriefLoading, setDebriefLoading] = useState(false)
  const [debriefSaved, setDebriefSaved] = useState<Record<number, boolean>>({})

  // delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
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
  }, [])

  useEffect(() => {
    if (session) fetchContacts()
  }, [session])

  async function fetchContacts() {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    if (error) console.error('Failed to fetch contacts:', error.message)
    setContacts(data || [])
    setLoading(false)
  }

  async function handleAuth() {
    setAuthError('')
    setAuthMessage('')
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setAuthError(error.message)
      else setAuthMessage('Check your email to confirm your account, then log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthError(error.message)
    }
  }

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

  async function addContact() {
    const { error } = await supabase.from('contacts').insert([{ ...form }])
    if (error) { alert('Failed to save contact: ' + error.message); return }
    setForm({ name: '', role: '', company: '', event: '', heat: 'warm', tags: '', notes: '', advice: '', next_action: '' })
    setShowForm(false)
    fetchContacts()
  }

  async function deleteContact(id: number) {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) { alert('Failed to delete contact: ' + error.message); return }
    fetchContacts()
  }

  async function callClaude(system: string, user: string) {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, user }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `API error ${res.status}`)
    }
    const data = await res.json()
    return data.text
  }

  async function runDebrief() {
    if (!debriefNotes.trim()) return
    setDebriefLoading(true)
    setDebriefContacts([])
    setDebriefSaved({})
    try {
      setDebriefStatus('extracting contacts...')
      const extractPrompt = `Extract contacts from networking notes. Return ONLY valid JSON array. Each object: { "name": string, "role": string, "company": string, "what_you_talked_about": string, "heat": "hot"|"warm"|"cold", "tags": string[] }`
      const raw = await callClaude(extractPrompt, `Notes: ${debriefNotes}\nEvent: ${debriefEvent}`)
      let parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      if (!Array.isArray(parsed)) parsed = [parsed]
      const enriched: ExtractedContact[] = []
      for (let i = 0; i < parsed.length; i++) {
        const c = parsed[i]
        setDebriefStatus(`researching ${c.name}... (${i + 1}/${parsed.length})`)
        const resPrompt = `Fill in info and write a LinkedIn message. Return ONLY JSON: { "linkedin_url": string|null, "enriched_role": string, "one_line_bio": string, "linkedin_message": string (max 150 chars, personal) }`
        const resRaw = await callClaude(resPrompt, `Person: ${c.name}\nCompany: ${c.company}\nRole: ${c.role}\nTalked about: ${c.what_you_talked_about}\nEvent: ${debriefEvent}\nMy name: ${debriefSender}`)
        const res = JSON.parse(resRaw.replace(/```json|```/g, '').trim())
        enriched.push({ ...c, ...res })
      }
      setDebriefContacts(enriched)
      setDebriefStatus('done')
    } catch (e: unknown) {
      setDebriefStatus('error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setDebriefLoading(false)
  }

  async function saveDebriefContact(i: number, c: ExtractedContact) {
    const { error } = await supabase.from('contacts').insert([{
      name: c.name,
      role: c.enriched_role || c.role,
      company: c.company,
      event: debriefEvent,
      notes: c.what_you_talked_about,
      heat: c.heat,
      tags: c.tags?.join(', '),
      next_action: c.linkedin_message,
    }])
    if (error) { alert('Failed to save contact: ' + error.message); return }
    setDebriefSaved(s => ({ ...s, [i]: true }))
    fetchContacts()
  }

  const heatColor = (heat: string) => heat === 'hot' ? 'bg-red-100 text-red-700' : heat === 'warm' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'

  if (authLoading) return <div className="flex items-center justify-center min-h-screen text-gray-400 text-sm">Loading...</div>

  if (!session) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
      <div className="w-full max-w-sm bg-white border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">memoru</h1>
        <p className="text-sm text-gray-400 mb-6">your personal network, remembered</p>
        <div className="flex gap-2 mb-6 text-sm">
          <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthMessage('') }} className={`px-3 py-1 rounded-full ${authMode === 'login' ? 'bg-black text-white' : 'text-gray-500'}`}>Log in</button>
          <button onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthMessage('') }} className={`px-3 py-1 rounded-full ${authMode === 'signup' ? 'bg-black text-white' : 'text-gray-500'}`}>Sign up</button>
        </div>
        <div className="flex flex-col gap-3">
          <input type="email" placeholder="Email" className="border rounded-lg px-3 py-2 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="border rounded-lg px-3 py-2 text-sm" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()} />
          {authError && <p className="text-xs text-red-500">{authError}</p>}
          {authMessage && <p className="text-xs text-green-600">{authMessage}</p>}
          <button onClick={handleAuth} className="w-full py-2 bg-black text-white rounded-lg text-sm mt-1">
            {authMode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-6">
          Not sure yet?{' '}
          <a href="/demo" className="underline underline-offset-2 hover:text-gray-600">Browse the demo</a>
        </p>
      </div>
    </div>
  )

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">memoru</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{session.user.email}</span>
          <button onClick={exportData} className="text-xs text-gray-400 hover:text-gray-700">Export data</button>
          <button onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError('') }} className="text-xs text-red-300 hover:text-red-500">Delete account</button>
          <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-gray-700">Sign out</button>
          <button onClick={() => { setShowDebrief(!showDebrief); setShowForm(false) }} className="px-4 py-2 border border-black text-black rounded-lg text-sm">+ Event notes</button>
          <button onClick={() => { setShowForm(!showForm); setShowDebrief(false) }} className="px-4 py-2 bg-black text-white rounded-lg text-sm">+ Add contact</button>
        </div>
      </div>

      {showDebrief && (
        <div className="border rounded-xl p-6 mb-8">
          <h2 className="font-medium mb-1">event debrief</h2>
          <p className="text-xs text-gray-400 mb-4">dump your notes — agent extracts contacts, researches them, drafts outreach</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">your notes</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} placeholder="Met Sarah Kim, VC at Sequoia. Talked about AI agents. Also spoke with James from DeepMind..." value={debriefNotes} onChange={e => setDebriefNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">event name</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="AI Summit SF" value={debriefEvent} onChange={e => setDebriefEvent(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">your name & role</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Arun, founder of Memoru" value={debriefSender} onChange={e => setDebriefSender(e.target.value)} />
            </div>
          </div>
          <button onClick={runDebrief} disabled={debriefLoading} className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-50">
            {debriefLoading ? 'working...' : 'extract + research contacts →'}
          </button>
          {debriefStatus && <p className="text-xs text-gray-400 mt-2">{debriefStatus}</p>}
          {debriefContacts.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              {debriefContacts.map((c, i) => (
                <div key={i} className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600">
                      {c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{c.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${heatColor(c.heat)}`}>{c.heat}</span>
                      </div>
                      <p className="text-xs text-gray-500">{c.enriched_role || c.role}{c.company ? ` · ${c.company}` : ''}</p>
                    </div>
                  </div>
                  {c.one_line_bio && <p className="text-xs text-gray-500 mb-2">{c.one_line_bio}</p>}
                  <p className="text-xs text-gray-600 mb-2">talked about: {c.what_you_talked_about}</p>
                  {c.linkedin_message && <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border-l-2 border-blue-200 mb-3">{c.linkedin_message}</div>}
                  <div className="flex items-center gap-3">
                    <button onClick={() => saveDebriefContact(i, c)} className="text-xs px-3 py-1.5 bg-black text-white rounded-lg">
                      {debriefSaved[i] ? 'saved ✓' : 'save to memoru'}
                    </button>
                    {c.tags?.length > 0 && <span className="text-xs text-gray-400">{c.tags.join(', ')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="border rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
          {[['name','Name'],['role','Role'],['company','Company'],['event','Where you met']].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.value})} />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Heat</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.heat} onChange={e => setForm({...form, heat: e.target.value})}>
              <option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tags</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Notes</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Advice they gave you</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} value={form.advice} onChange={e => setForm({...form, advice: e.target.value})} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Next action</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.next_action} onChange={e => setForm({...form, next_action: e.target.value})} />
          </div>
          <div className="col-span-2 flex gap-3">
            <button onClick={addContact} className="px-4 py-2 bg-black text-white rounded-lg text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-lg mb-2">Delete your account</h2>
            <p className="text-sm text-gray-500 mb-4">
              This permanently deletes your account and all your contacts. There is no undo.
            </p>
            <p className="text-xs text-gray-400 mb-2">Type <span className="font-mono font-medium text-gray-700">delete my account</span> to confirm</p>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="delete my account"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
            />
            {deleteError && <p className="text-xs text-red-500 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== 'delete my account' || deleteLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
              >
                {deleteLoading ? 'Deleting...' : 'Delete everything'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="grid gap-4">
          {contacts.map(c => (
            <div key={c.id} className="border rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium">{c.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${heatColor(c.heat)}`}>{c.heat}</span>
                  </div>
                  <p className="text-sm text-gray-500">{c.role}{c.company ? ` · ${c.company}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.event}</p>
                </div>
                <button onClick={() => deleteContact(c.id)} className="text-gray-300 hover:text-red-400 text-sm">×</button>
              </div>
              {c.next_action && <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm"><span className="text-xs text-gray-400 block mb-1">next action</span>{c.next_action}</div>}
              {c.notes && <p className="text-sm text-gray-600 mt-3">{c.notes}</p>}
              {c.advice && <p className="text-sm italic text-gray-500 mt-2 border-l-2 pl-3">"{c.advice}"</p>}
              {c.tags && <div className="flex gap-2 mt-3">{c.tags.split(',').map((t: string) => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.trim()}</span>)}</div>}
            </div>
          ))}
          {contacts.length === 0 && <p className="text-gray-400 text-sm">No contacts yet. Add your first one.</p>}
        </div>
      )}
    </main>
  )
}