import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { checkAndAwardAchievements } from '@/src/lib/achievements'
import { getStripeServer } from '@/src/lib/stripe/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export const runtime = 'nodejs'

type NotificationRow = {
  id: string
}

type StripeWebhookEventRow = {
  event_id: string
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

  const [{ data: existingNotification, error: notificationLookupError }] =
    await Promise.all([
      supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'purchase_complete')
        .contains('data', { checkout_session_id: session.id })
        .maybeSingle(),
    ])

  if (notificationLookupError) {
    throw new Error(notificationLookupError.message)
  }

  const purchasedAt =
    typeof session.created === 'number'
      ? new Date(session.created * 1000).toISOString()
      : new Date().toISOString()

  const writes = []

  writes.push(
    supabaseAdmin.from('owned_items').upsert(
      {
        user_id: userId,
        item_id: itemId,
        purchased_at: purchasedAt,
      },
      { onConflict: 'user_id,item_id', ignoreDuplicates: true },
    ),
  )

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
    const stripeServer = getStripeServer()
    event = stripeServer.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid Stripe signature' },
      { status: 400 },
    )
  }

  try {
    const { data: existingEvent, error: existingEventError } = await supabaseAdmin
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle()

    if (existingEventError) {
      return NextResponse.json({ error: existingEventError.message }, { status: 500 })
    }

    if (existingEvent as StripeWebhookEventRow | null) {
      return NextResponse.json({ received: true })
    }

    const { error: eventInsertError } = await supabaseAdmin.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
    })

    if (eventInsertError) {
      if (eventInsertError.code === '23505') {
        return NextResponse.json({ received: true })
      }

      return NextResponse.json({ error: eventInsertError.message }, { status: 500 })
    }

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
