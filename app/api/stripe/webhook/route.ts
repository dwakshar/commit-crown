import { POST as stripeWebhookPost } from '@/src/app/api/stripe/webhook/route'

export const POST = stripeWebhookPost
export const runtime = 'nodejs'
