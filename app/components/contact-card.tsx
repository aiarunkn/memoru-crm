import type { Contact } from '../lib/types'
import { heatColor } from '../lib/utils'

type Props = { contact: Contact; onDelete: (id: number) => void }

export default function ContactCard({ contact: c, onDelete }: Props) {
  return (
    <div className="border rounded-xl p-5">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-medium">{c.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${heatColor(c.heat)}`}>{c.heat}</span>
          </div>
          <p className="text-sm text-gray-500">{c.role}{c.company ? ` · ${c.company}` : ''}</p>
          <p className="text-xs text-gray-400 mt-0.5">{c.event}</p>
        </div>
        <button onClick={() => onDelete(c.id)} className="text-gray-300 hover:text-red-400 text-sm">×</button>
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
  )
}
