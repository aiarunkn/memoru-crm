type Action = 'extract' | 'enrich'

export async function callClaude(action: Action, payload: Record<string, string>): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.text
}

export function parseJsonResponse(raw: string): unknown {
  try { return JSON.parse(raw) } catch {}
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) {
    try { return JSON.parse(match[1].trim()) } catch {}
  }
  const start = raw.search(/[{[]/)
  if (start !== -1) {
    try { return JSON.parse(raw.slice(start)) } catch {}
  }
  throw new Error('Failed to parse Claude response as JSON')
}
