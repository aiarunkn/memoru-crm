'use client'

import { useState } from 'react'
import type { Contact } from '../lib/types'

type FormData = Omit<Contact, 'id'>
type Props = { onSave: (data: FormData) => Promise<void>; onCancel: () => void }

const INITIAL: FormData = {
  name: '', role: '', company: '', event: '',
  heat: 'warm', tags: '', notes: '', advice: '', next_action: '',
}

const TEXT_FIELDS = [
  ['name', 'Name'],
  ['role', 'Role'],
  ['company', 'Company'],
  ['event', 'Where you met'],
] as const

export default function ContactForm({ onSave, onCancel }: Props) {
  const [form, setForm] = useState<FormData>(INITIAL)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(form)
    } catch (e) {
      alert('Failed to save contact: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
    setSaving(false)
  }

  return (
    <div className="border rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
      {TEXT_FIELDS.map(([key, label]) => (
        <div key={key}>
          <label className="text-xs text-gray-500 mb-1 block">{label}</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={form[key]}
            onChange={e => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Heat</label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={form.heat}
          onChange={e => setForm({ ...form, heat: e.target.value })}
        >
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Tags</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={form.tags}
          onChange={e => setForm({ ...form, tags: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          rows={2}
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-gray-500 mb-1 block">Advice they gave you</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          rows={2}
          value={form.advice}
          onChange={e => setForm({ ...form, advice: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <label className="text-xs text-gray-500 mb-1 block">Next action</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          value={form.next_action}
          onChange={e => setForm({ ...form, next_action: e.target.value })}
        />
      </div>
      <div className="col-span-2 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
      </div>
    </div>
  )
}
