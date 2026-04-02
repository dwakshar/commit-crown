export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (appUrl) {
    return appUrl
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3000'
  }

  throw new Error('Missing NEXT_PUBLIC_APP_URL')
}
