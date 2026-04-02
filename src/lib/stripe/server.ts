import Stripe from 'stripe'

let stripeServer: Stripe | null = null

export function getStripeServer() {
  if (stripeServer) {
    return stripeServer
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }

  stripeServer = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  })

  return stripeServer
}
