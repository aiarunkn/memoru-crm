import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

// In-memory rate limit — resets on cold start; use Upstash Redis for multi-instance production
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

type Action = 'extract' | 'enrich'

const SYSTEM_PROMPTS: Record<Action, string> = {
  extract: 'Extract contacts from networking notes. Return ONLY valid JSON array. Each object: { "name": string, "role": string, "company": string, "what_you_talked_about": string, "heat": "hot"|"warm"|"cold", "tags": string[] }',
  enrich: 'Fill in info and write a LinkedIn message. Return ONLY a JSON object: { "linkedin_url": string|null, "enriched_role": string, "one_line_bio": string, "linkedin_message": string (max 150 chars, personal, reference something specific from the conversation) }',
}

function buildUserMessage(action: Action, payload: Record<string, string>): string {
  if (action === 'extract') {
    return `Notes: ${String(payload.notes || '').slice(0, 10000)}\nEvent: ${String(payload.event || '').slice(0, 200)}`
  }
  return [
    `Person: ${String(payload.name || '').slice(0, 200)}`,
    `Company: ${String(payload.company || '').slice(0, 200)}`,
    `Role: ${String(payload.role || '').slice(0, 200)}`,
    `Talked about: ${String(payload.context || '').slice(0, 2000)}`,
    `Event: ${String(payload.event || '').slice(0, 200)}`,
    `My name: ${String(payload.senderName || '').slice(0, 200)}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 })
  }

  const body = await req.json()
  const { action, ...payload } = body

  if (!['extract', 'enrich'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPTS[action as Action],
      messages: [{ role: 'user', content: buildUserMessage(action as Action, payload) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Anthropic API error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
