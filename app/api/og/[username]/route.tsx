import {
  GET as ogGet,
} from '@/src/app/api/og/[username]/route'

export const GET = ogGet
export const alt = 'CodeKingdom scout card'
export const contentType = 'image/png'
export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
