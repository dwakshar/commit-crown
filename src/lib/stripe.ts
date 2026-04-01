import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

if (!stripePublishableKey) {
  throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
}

export const stripeServer = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
})

export const stripePublic = loadStripe(stripePublishableKey)
