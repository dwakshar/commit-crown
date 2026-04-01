import { NextResponse } from 'next/server'
import { z } from 'zod'

import { stripeServer } from '@/src/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

const checkoutSchema = z.object({
  itemId: z.uuid(),
})

type ShopItemRow = {
  id: string
  name: string
  price_cents: number
  stripe_price_id: string | null
  is_free: boolean | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = await request.json().catch(() => null)
  const parsed = checkoutSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_APP_URL' }, { status: 500 })
  }

  const [{ data: item, error: itemError }, { data: existingOwnership, error: ownershipError }] =
    await Promise.all([
      supabase
        .from('shop_items')
        .select('id, name, price_cents, stripe_price_id, is_free')
        .eq('id', parsed.data.itemId)
        .maybeSingle(),
      supabase
        .from('owned_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', parsed.data.itemId)
        .maybeSingle(),
    ])

  if (itemError) {
    return NextResponse.json({ error: itemError.message }, { status: 500 })
  }

  if (ownershipError) {
    return NextResponse.json({ error: ownershipError.message }, { status: 500 })
  }

  const typedItem = item as ShopItemRow | null

  if (!typedItem) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (typedItem.is_free || typedItem.price_cents <= 0) {
    return NextResponse.json({ error: 'Free items must be claimed separately' }, { status: 400 })
  }

  if (!typedItem.stripe_price_id) {
    return NextResponse.json({ error: 'Item is not configured for Stripe checkout' }, { status: 400 })
  }

  if (existingOwnership) {
    return NextResponse.json({ error: 'Item already owned' }, { status: 409 })
  }

  try {
    const session = await stripeServer.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: typedItem.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/marketplace?success=true`,
      cancel_url: `${appUrl}/marketplace`,
      metadata: {
        userId: user.id,
        itemId: typedItem.id,
      },
      customer_email: user.email,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 })
    }

    return NextResponse.json({ sessionUrl: session.url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create checkout session' },
      { status: 500 },
    )
  }
}
