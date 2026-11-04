export type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  stock: number
  description: string
  imageUrl: string
  active: boolean
  createdAt?: unknown
}
export type StoreSettings = {
  storeName: string
  tagline: string
  phone: string
  whatsapp: string
  email: string
  address: string
  heroImage: string
  logoUrl: string
}
export type Review = {
  id: string
  customerName: string
  rating: number
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: unknown
}
