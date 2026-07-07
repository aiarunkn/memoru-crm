export type Contact = {
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

export type ExtractedContact = {
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
