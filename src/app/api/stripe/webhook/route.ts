import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { stripeServer } from '@/src/lib/stripe'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export const runtime = 'nodejs'

type OwnedItemRow = {
  id: string
}

type NotificationRow = {
  id: string
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const itemId = session.metadata?.itemId

  if (!userId || !itemId) {
    throw new Error('Checkout session is missing required metadata')
  }

  if (session.payment_status !== 'paid') {
    return
  }

  const [{ data: existingOwnership, error: ownershipLookupError }, { data: existingNotification, error: notificationLookupError }] =
    await Promise.all([
      supabaseAdmin
        .from('owned_items')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle(),
      supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'purchase_complete')
        .contains('data', { checkout_session_id: session.id })
        .maybeSingle(),
    ])

  if (ownershipLookupError || notificationLookupError) {
    throw new Error(ownershipLookupError?.message ?? notificationLookupError?.message ?? 'Unable to load purchase state')
  }

  const purchasedAt =
    typeof session.created === 'number'
      ? new Date(session.created * 1000).toISOString()
      : new Date().toISOString()

  const writes = []

  if (!(existingOwnership as OwnedItemRow | null)) {
    writes.push(
      supabaseAdmin.from('owned_items').insert({
        user_id: userId,
        item_id: itemId,
        purchased_at: purchasedAt,
      }),
    )
  }

  if (!(existingNotification as NotificationRow | null)) {
    writes.push(
      supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'purchase_complete',
        message: 'Your marketplace purchase is ready in CodeKingdom.',
        data: {
          item_id: itemId,
          checkout_session_id: session.id,
        },
      }),
    )
  }

  if (writes.length > 0) {
    const results = await Promise.all(writes)
    const failedResult = results.find((result) => result.error)

    if (failedResult?.error) {
      throw new Error(failedResult.error.message)
    }
  }

  await checkAndAwardAchievements(userId, supabaseAdmin)
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe webhook configuration' }, { status: 500 })
  }

  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripeServer.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid Stripe signature' },
      { status: 400 },
    )
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 },
    )
  }
}
