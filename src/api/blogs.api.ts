import client from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlogSectionType = 'paragraph' | 'heading' | 'subheading' | 'quote' | 'list'

export type BlogCategory =
  | 'Crystal Guides'
  | 'Rituals'
  | 'Wellness'
  | 'Gemstone Spotlight'
  | 'Spiritual Practice'

export interface BlogSection {
  type: BlogSectionType
  text?: string
  items?: string[]
}

export interface Blog {
  _id: string
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  category: BlogCategory
  readTime: string
  date: string
  emoji: string
  gradient: string
  featured: boolean
  isPublished: boolean
  content: BlogSection[]
  createdAt: string
  updatedAt: string
}

export interface BlogInput {
  slug?: string
  title: string
  subtitle?: string
  excerpt: string
  category: BlogCategory
  readTime: string
  date: string
  emoji: string
  gradient: string
  featured?: boolean
  isPublished?: boolean
  content?: BlogSection[]
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAdminBlogs(): Promise<Blog[]> {
  const res = await client.get('/api/v1/admin/blogs')
  return res.data.data.blogs as Blog[]
}

export async function createBlog(data: BlogInput): Promise<Blog> {
  const res = await client.post('/api/v1/admin/blogs', data)
  return res.data.data.blog as Blog
}

export async function updateBlog(id: string, data: Partial<BlogInput>): Promise<Blog> {
  const res = await client.patch(`/api/v1/admin/blogs/${id}`, data)
  return res.data.data.blog as Blog
}

export async function deleteBlog(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/blogs/${id}`)
}
