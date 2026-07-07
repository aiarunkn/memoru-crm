'use client'

import { useState } from 'react'

type Props = {
  onConfirm: () => Promise<void>
  onCancel: () => void
  loading: boolean
  error: string
}

export default function DeleteModal({ onConfirm, onCancel, loading, error }: Props) {
  const [confirmText, setConfirmText] = useState('')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold text-lg mb-2">Delete your account</h2>
        <p className="text-sm text-gray-500 mb-4">
          This permanently deletes your account and all your contacts. There is no undo.
        </p>
        <p className="text-xs text-gray-400 mb-2">
          Type <span className="font-mono font-medium text-gray-700">delete my account</span> to confirm
        </p>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
          placeholder="delete my account"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
        />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'delete my account' || loading}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-40"
          >
            {loading ? 'Deleting...' : 'Delete everything'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-500 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
