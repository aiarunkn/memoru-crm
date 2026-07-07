'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Contact } from '../lib/types'

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

const HEAT_CONFIG = {
  hot:  { bg: 'rgba(240,115,106,0.14)', text: '#ffb4ad', dot: '#f0736a' },
  warm: { bg: 'rgba(224,169,74,0.14)',  text: '#f2cf87', dot: '#e0a94a' },
  cold: { bg: 'rgba(106,165,240,0.14)', text: '#a8caf7', dot: '#6aa5f0' },
} as const

function HeatBadge({ heat }: { heat: string }) {
  const cfg = HEAT_CONFIG[heat as keyof typeof HEAT_CONFIG] ?? HEAT_CONFIG.cold
  return (
    <span
      className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {heat}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="text-[10px] text-[#8b8b93] hover:text-[#d4d4d8] transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const inputCls = 'w-full bg-[#0e0e10] border border-[#2a2a30] text-[#e4e4e7] placeholder:text-[#52525b] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#52525b]'
const labelCls = 'text-xs text-[#71717a] mb-1 block'

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
    <div className="bg-[#09090b] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* demo banner */}
        <div className="mb-6 flex items-center justify-between bg-[rgba(224,169,74,0.08)] border border-[rgba(224,169,74,0.18)] rounded-xl px-4 py-3">
          <p className="text-sm text-[#f2cf87]">
            <span className="font-medium">Demo mode</span> — browse freely. Sign up to save your own contacts.
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-[#f2cf87] underline underline-offset-2 whitespace-nowrap ml-4 hover:text-[#fef3c7]"
          >
            Sign up free →
          </Link>
        </div>

        {/* header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-[#f4f4f5]">memoru</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowDebrief(!showDebrief); setShowForm(false) }}
              className="px-4 py-2 border border-[#2a2a30] text-[#d4d4d8] rounded-lg text-sm hover:border-[#3f3f46]"
            >
              + Event notes
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setShowDebrief(false) }}
              className="px-4 py-2 bg-[#fafafa] text-[#09090b] rounded-lg text-sm font-medium hover:bg-white"
            >
              + Add contact
            </button>
          </div>
        </div>

        {/* event debrief panel */}
        {showDebrief && (
          <div className="bg-[#141416] border border-[#26262b] rounded-2xl p-6 mb-8">
            <h2 className="font-medium text-[#f4f4f5] mb-1">event debrief</h2>
            <p className="text-xs text-[#71717a] mb-4">dump your notes — agent extracts contacts, researches them, drafts outreach</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className={labelCls}>your notes</label>
                <textarea
                  className={inputCls}
                  rows={4}
                  placeholder="Met Sarah Kim, VC at Sequoia. Talked about AI agents. Also spoke with James from DeepMind..."
                  value={debriefNotes}
                  onChange={e => setDebriefNotes(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>event name</label>
                <input className={inputCls} placeholder="AI Summit SF" value={debriefEvent} onChange={e => setDebriefEvent(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>your name & role</label>
                <input className={inputCls} placeholder="Arun, founder of Memoru" value={debriefSender} onChange={e => setDebriefSender(e.target.value)} />
              </div>
            </div>
            <button onClick={gate} className="px-4 py-2 bg-[#fafafa] text-[#09090b] rounded-lg text-sm font-medium">
              extract + research contacts →
            </button>
            <p className="text-xs text-[#52525b] mt-2">Sign up to run the AI debrief on your own notes.</p>
          </div>
        )}

        {/* add contact form */}
        {showForm && (
          <div className="bg-[#141416] border border-[#26262b] rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
            {([['name', 'Name'], ['role', 'Role'], ['company', 'Company'], ['event', 'Where you met']] as const).map(([key, label]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input
                  className={inputCls}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className={labelCls}>Heat</label>
              <select
                className={inputCls}
                value={form.heat}
                onChange={e => setForm({ ...form, heat: e.target.value })}
              >
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <input className={inputCls} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea className={inputCls} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Advice they gave you</label>
              <textarea className={inputCls} rows={2} value={form.advice} onChange={e => setForm({ ...form, advice: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Next action</label>
              <input className={inputCls} value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button onClick={gate} className="px-4 py-2 bg-[#fafafa] text-[#09090b] rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[#71717a] text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* signup prompt modal */}
        {showSignupPrompt && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#141416] border border-[#26262b] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <h2 className="font-semibold text-lg text-[#f4f4f5] mb-2">Sign up to save your data</h2>
              <p className="text-sm text-[#a1a1aa] mb-6">
                Your contacts live in your account — not just this browser. Free to start.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/"
                  className="w-full py-2 bg-[#fafafa] text-[#09090b] rounded-lg text-sm text-center font-medium"
                >
                  Create free account
                </Link>
                <Link
                  href="/"
                  className="w-full py-2 border border-[#2a2a30] text-[#d4d4d8] rounded-lg text-sm text-center"
                >
                  Log in
                </Link>
                <button
                  onClick={() => setShowSignupPrompt(false)}
                  className="text-xs text-[#52525b] mt-1 hover:text-[#71717a]"
                >
                  Continue browsing demo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* contacts list */}
        <div className="grid gap-4">
          {DEMO_CONTACTS.map(c => (
            <div key={c.id} className="bg-[#141416] border border-[#26262b] rounded-2xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-medium text-[#f4f4f5]">{c.name}</h2>
                    <HeatBadge heat={c.heat} />
                  </div>
                  <p className="text-sm text-[#a1a1aa]">{c.role}{c.company ? ` · ${c.company}` : ''}</p>
                  <p className="text-xs text-[#71717a] mt-0.5">{c.event}</p>
                </div>
                <button onClick={gate} className="text-[#3f3f46] hover:text-[#f0736a] text-sm transition-colors">×</button>
              </div>

              {c.next_action && (
                <div className="mt-4 bg-[#0e0e10] border border-[#2a2a30] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-medium text-[#8b8b93]">
                      Next Action · Draft Message
                    </span>
                    <CopyButton text={c.next_action} />
                  </div>
                  <p className="text-sm text-[#e4e4e7] leading-relaxed">{c.next_action}</p>
                </div>
              )}

              {c.notes && (
                <p className="text-sm text-[#c4c4cc] mt-3 leading-relaxed">{c.notes}</p>
              )}

              {c.advice && (
                <p className="text-sm italic text-[#d4d4d8] mt-3 pl-4 border-l-2 border-[#4b4b52]">
                  "{c.advice}"
                </p>
              )}

              {c.tags && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {c.tags.split(',').map((t: string) => (
                    <span key={t} className="text-xs bg-[#232329] text-[#b4b4bc] px-2.5 py-0.5 rounded-full">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
