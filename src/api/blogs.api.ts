import client from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type BlogCategory =
  | "Crystal Guides"
  | "Rituals"
  | "Wellness"
  | "Gemstone Spotlight"
  | "Spiritual Practice";

export interface BlogSection {
  type?: "paragraph" | "heading" | "subheading" | "quote" | "list" | "image";
  title?: string;
  description?: string;
  text?: string;
  items?: string[];
  image?: string;
}

export interface Blog {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: BlogCategory;
  images: string[];
  featured: boolean;
  isPublished: boolean;
  content: BlogSection[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogInput {
  slug?: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  category: BlogCategory;
  images?: string[];
  featured?: boolean;
  isPublished?: boolean;
  content?: BlogSection[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getAdminBlogs(): Promise<Blog[]> {
  const res = await client.get("/api/v1/admin/blogs");
  return res.data.data.blogs as Blog[];
}

export async function createBlog(data: BlogInput): Promise<Blog> {
  const res = await client.post("/api/v1/admin/blogs", data);
  return res.data.data.blog as Blog;
}

export async function updateBlog(
  id: string,
  data: Partial<BlogInput>,
): Promise<Blog> {
  const res = await client.patch(`/api/v1/admin/blogs/${id}`, data);
  return res.data.data.blog as Blog;
}

export async function deleteBlog(id: string): Promise<void> {
  await client.delete(`/api/v1/admin/blogs/${id}`);
}

// Uploads one or more image files (max 6 per call, matching the backend route)
// and returns their Cloudinary secure_urls in the same order.
export async function uploadBlogImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const res = await client.post("/api/v1/admin/blogs/upload-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.images as string[];
}
