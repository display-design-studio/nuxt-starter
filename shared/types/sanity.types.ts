export type HomeQueryResult = {
  _id: string
  _type: 'home'
  title: string | null
} | null

export type PageQueryResult = {
  _id: string
  _type: 'page'
  [key: string]: unknown
} | null
