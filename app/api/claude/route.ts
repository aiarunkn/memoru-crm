import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { system, user } = await req.json()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ text })
}
