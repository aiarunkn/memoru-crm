'use client'

import { useState } from 'react'
import Link from 'next/link'

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

const DEMO_CONTACTS: Contact[] = [
  {
    id: 1,
    name: 'Priya Mehta',
    role: 'Partner',
    company: 'Sequoia Capital',
    event: 'SaaStr Annual 2024',
    heat: 'hot',
    tags: 'vc, ai, series-a',
    notes: 'Really interested in AI-native productivity tools. Mentioned they\'re actively looking at seed deals in the space.',
    advice: 'Focus on retention metrics first — acquisition is easy to buy, but retention shows real product-market fit.',
    next_action: 'Hi Priya — great chatting at SaaStr! Would love to share our early retention numbers once we hit 60 days of data. Mind if I follow up then?',
  },
  {
    id: 2,
    name: 'Marcus Chen',
    role: 'General Partner',
    company: 'a16z',
    event: 'SF Tech Week',
    heat: 'hot',
    tags: 'vc, enterprise, ai',
    notes: 'Super engaged about AI agents in enterprise workflows. Wants to see traction before a formal meeting.',
    advice: 'Get 10 paying enterprise logos before Series A. Even small pilots count.',
    next_action: 'Hi Marcus — following up from SF Tech Week! We just closed our 3rd enterprise pilot. Would love to share numbers.',
  },
  {
    id: 3,
    name: 'James Park',
    role: 'Head of Product',
    company: 'Linear',
    event: 'ProductHunt Ship 2024',
    heat: 'warm',
    tags: 'product, b2b, saas',
    notes: 'Interested in how we handle contact deduplication. Building a new workflow feature himself.',
    advice: 'Ship early, get feedback, iterate fast. Don\'t wait for perfect.',
    next_action: 'Hi James — happy to share how we handle dedup if you want to compare notes.',
  },
  {
    id: 4,
    name: 'Yuki Nakamura',
    role: 'Founder & CEO',
    company: 'Deco Labs',
    event: 'YC Alumni Demo Day',
    heat: 'warm',
    tags: 'founder, ai, b2b',
    notes: 'Talked about async communication and how AI is replacing templated sales outreach.',
    advice: '',
    next_action: '',
  },
  {
    id: 5,
    name: 'Sarah O\'Brien',
    role: 'Head of Growth',
    company: 'Figma',
    event: 'Config 2024',
    heat: 'cold',
    tags: 'growth, design, plg',
    notes: 'Brief chat between sessions about product-led growth. Worth reconnecting at the next event.',
    advice: '',
    next_action: 'Connect on LinkedIn and share our growth write-up.',
  },
]

const heatColor = (heat: string) =>
  heat === 'hot' ? 'bg-red-100 text-red-700' :
  heat === 'warm' ? 'bg-amber-100 text-amber-700' :
  'bg-gray-100 text-gray-600'

export default function DemoPage() {
  const [showForm, setShowForm] = useState(false)
  const [showDebrief, setShowDebrief] = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [form, setForm] = useState({
    name: '', role: '', company: '', event: '',
    heat: 'warm', tags: '', notes: '', advice: '', next_action: '',
  })
  const [debriefNotes, setDebriefNotes] = useState('')
  const [debriefEvent, setDebriefEvent] = useState('')
  const [debriefSender, setDebriefSender] = useState('')

  const gate = () => setShowSignupPrompt(true)

  return (
    <main className="max-w-4xl mx-auto p-6">

      {/* demo banner */}
      <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-sm text-amber-800">
          <span className="font-medium">Demo mode</span> — browse freely. Sign up to save your own contacts.
        </p>
        <Link href="/" className="text-sm font-medium text-black underline underline-offset-2 whitespace-nowrap ml-4">
          Sign up free →
        </Link>
      </div>

      {/* header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">memoru</h1>
        <div className="flex items-center gap-3">
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

      {/* event debrief panel — browsable, run button gates to signup */}
      {showDebrief && (
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
                value={debriefNotes}
                onChange={e => setDebriefNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">event name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="AI Summit SF"
                value={debriefEvent}
                onChange={e => setDebriefEvent(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">your name & role</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Arun, founder of Memoru"
                value={debriefSender}
                onChange={e => setDebriefSender(e.target.value)}
              />
            </div>
          </div>
          <button onClick={gate} className="px-4 py-2 bg-black text-white rounded-lg text-sm">
            extract + research contacts →
          </button>
          <p className="text-xs text-gray-400 mt-2">Sign up to run the AI debrief on your own notes.</p>
        </div>
      )}

      {/* add contact form — fields are live, Save gates to signup */}
      {showForm && (
        <div className="border rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
          {[['name','Name'],['role','Role'],['company','Company'],['event','Where you met']].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={(form as Record<string, string>)[key]}
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
            <button onClick={gate} className="px-4 py-2 bg-black text-white rounded-lg text-sm">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* signup prompt modal */}
      {showSignupPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-lg mb-2">Sign up to save your data</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your contacts live in your account — not just this browser. Free to start.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="w-full py-2 bg-black text-white rounded-lg text-sm text-center"
              >
                Create free account
              </Link>
              <Link
                href="/"
                className="w-full py-2 border rounded-lg text-sm text-center text-gray-600"
              >
                Log in
              </Link>
              <button
                onClick={() => setShowSignupPrompt(false)}
                className="text-xs text-gray-400 mt-1"
              >
                Continue browsing demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* contacts list — identical markup to real app */}
      <div className="grid gap-4">
        {DEMO_CONTACTS.map(c => (
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
              <button onClick={gate} className="text-gray-300 hover:text-red-400 text-sm">×</button>
            </div>
            {c.next_action && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-xs text-gray-400 block mb-1">next action</span>
                {c.next_action}
              </div>
            )}
            {c.notes && <p className="text-sm text-gray-600 mt-3">{c.notes}</p>}
            {c.advice && <p className="text-sm italic text-gray-500 mt-2 border-l-2 pl-3">"{c.advice}"</p>}
            {c.tags && (
              <div className="flex gap-2 mt-3">
                {c.tags.split(',').map((t: string) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.trim()}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
