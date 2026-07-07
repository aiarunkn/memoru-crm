'use client'

import { useState } from 'react'
import type { Contact, ExtractedContact } from '../lib/types'
import { heatColor } from '../lib/utils'
import { callClaude, parseJsonResponse } from '../lib/claude-client'

type Props = { onSaveContact: (contact: Omit<Contact, 'id'>) => Promise<void> }

export default function DebriefPanel({ onSaveContact }: Props) {
  const [notes, setNotes] = useState('')
  const [event, setEvent] = useState('')
  const [sender, setSender] = useState('')
  const [status, setStatus] = useState('')
  const [contacts, setContacts] = useState<ExtractedContact[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState<Record<number, boolean>>({})

  async function runDebrief() {
    if (!notes.trim()) return
    setLoading(true)
    setContacts([])
    setSaved({})
    try {
      setStatus('extracting contacts...')
      const raw = await callClaude('extract', { notes, event })
      let parsed = parseJsonResponse(raw)
      if (!Array.isArray(parsed)) parsed = [parsed]
      const enriched: ExtractedContact[] = []
      for (let i = 0; i < (parsed as ExtractedContact[]).length; i++) {
        const c = (parsed as ExtractedContact[])[i]
        setStatus(`researching ${c.name}... (${i + 1}/${(parsed as ExtractedContact[]).length})`)
        const resRaw = await callClaude('enrich', {
          name: c.name,
          company: c.company,
          role: c.role,
          context: c.what_you_talked_about,
          event,
          senderName: sender,
        })
        const enrichment = parseJsonResponse(resRaw) as Partial<ExtractedContact>
        enriched.push({ ...c, ...enrichment })
      }
      setContacts(enriched)
      setStatus('done')
    } catch (e: unknown) {
      setStatus('error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setLoading(false)
  }

  async function handleSave(i: number, c: ExtractedContact) {
    try {
      await onSaveContact({
        name: c.name,
        role: c.enriched_role || c.role,
        company: c.company,
        event,
        notes: c.what_you_talked_about,
        heat: c.heat,
        tags: c.tags?.join(', ') || '',
        advice: '',
        next_action: c.linkedin_message || '',
      })
      setSaved(s => ({ ...s, [i]: true }))
    } catch (e) {
      alert('Failed to save contact: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  return (
    <div className="border rounded-xl p-6 mb-8">
      <h2 className="font-medium mb-1">event debrief</h2>
      <p className="text-xs text-gray-400 mb-4">dump your notes — agent extracts contacts, researches them, drafts outreach</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">your notes</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={4}
            placeholder="Met Sarah Kim, VC at Sequoia. Talked about AI agents. Also spoke with James from DeepMind..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">event name</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="AI Summit SF"
            value={event}
            onChange={e => setEvent(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">your name & role</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Arun, founder of Memoru"
            value={sender}
            onChange={e => setSender(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={runDebrief}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-50"
      >
        {loading ? 'working...' : 'extract + research contacts →'}
      </button>
      {status && <p className="text-xs text-gray-400 mt-2">{status}</p>}
      {contacts.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {contacts.map((c, i) => (
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
              {c.linkedin_message && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border-l-2 border-blue-200 mb-3">
                  {c.linkedin_message}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave(i, c)}
                  disabled={!!saved[i]}
                  className="text-xs px-3 py-1.5 bg-black text-white rounded-lg disabled:opacity-50"
                >
                  {saved[i] ? 'saved ✓' : 'save to memoru'}
                </button>
                {c.tags?.length > 0 && <span className="text-xs text-gray-400">{c.tags.join(', ')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
