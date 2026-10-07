import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Trash2,
  X,
  Plus,
  GripVertical,
  ChevronDown,
  ImageOff,
  ImagePlus,
} from "lucide-react";
import {
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImages,
  type Blog,
  type BlogInput,
  type BlogSection,
  type BlogCategory,
} from "../../api/blogs.api";
import { useToast } from "../../store/toastStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif";

const CATEGORIES: BlogCategory[] = [
  "Crystal Guides",
  "Rituals",
  "Wellness",
  "Gemstone Spotlight",
  "Spiritual Practice",
];

// ── Shared styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: "10px 12px",
  fontFamily: FONT,
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#9E9590",
  textAlign: "left",
  borderBottom: "1px solid #E2DAC8",
  background: "#EDE8DC",
  whiteSpace: "nowrap",
};

const TD: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #E2DAC8",
  verticalAlign: "middle",
};

const INPUT_BASE: React.CSSProperties = {
  padding: "8px 10px",
  background: "#F5F0E8",
  border: "1px solid #E2DAC8",
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 12,
  color: "#1C1A17",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 600,
  color: "#6B6057",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  display: "block",
  marginBottom: 6,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

// ── ActiveToggle ──────────────────────────────────────────────────────────────

function ActiveToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: value ? "#ECFDF5" : "#F3F4F6",
        color: value ? "#5A8A6A" : "#9E9590",
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 500,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: value ? "#5A8A6A" : "#9E9590",
          flexShrink: 0,
        }}
      />
      {label}: {value ? "Yes" : "No"}
    </button>
  );
}

// ── ImagesField ───────────────────────────────────────────────────────────────
// Native file picker: selected files upload straight to Cloudinary via the
// backend's /admin/blogs/upload-images route, and the returned secure_urls
// are what actually get stored on the blog.

function ImagesField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);
    setPendingCount(files.length);
    try {
      const urls = await uploadBlogImages(files);
      onChange([...images, ...urls]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload image(s)";
      toast.error(msg);
    } finally {
      setUploading(false);
      setPendingCount(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: "transparent",
          border: "1px solid #E2DAC8",
          borderRadius: 4,
          fontFamily: FONT,
          fontSize: 12,
          color: "#6B6057",
          cursor: uploading ? "not-allowed" : "pointer",
          marginBottom: 10,
        }}
      >
        <ImagePlus size={14} />
        {uploading ? `Uploading ${pendingCount}…` : "Select Images"}
      </button>

      {(images.length > 0 || uploading) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #E2DAC8",
                background: "#F5F0E8",
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                title="Remove image"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(28,26,23,0.65)",
                  color: "#fff",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={11} />
              </button>
            </div>
          ))}

          {uploading &&
            Array.from({ length: pendingCount }).map((_, i) => (
              <div
                key={`pending-${i}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 4,
                  border: "1px dashed #C4B89A",
                  background: "#EDE8DC",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT,
                  fontSize: 10,
                  color: "#9E9590",
                }}
              >
                …
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Section editor row (title + description only) ────────────────────────────

interface SectionRowProps {
  section: BlogSection & { _id: string };
  index: number;
  onChange: (index: number, updated: BlogSection & { _id: string }) => void;
  onRemove: (index: number) => void;
}

function SectionRow({ section, index, onChange, onRemove }: SectionRowProps) {
  return (
    <div
      style={{
        background: "#EDE8DC",
        border: "1px solid #E2DAC8",
        borderRadius: 4,
        padding: 10,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          paddingTop: 6,
          color: "#C4B89A",
          cursor: "grab",
          flexShrink: 0,
        }}
      >
        <GripVertical size={14} />
      </div>

      <div
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}
      >
        <input
          type="text"
          value={section.title}
          onChange={(e) =>
            onChange(index, { ...section, title: e.target.value })
          }
          placeholder="Section title"
          style={{ ...INPUT_BASE, fontWeight: 500 }}
        />
        <textarea
          value={section.description}
          onChange={(e) =>
            onChange(index, { ...section, description: e.target.value })
          }
          placeholder="Section description"
          rows={4}
          style={{ ...INPUT_BASE, resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        style={{
          padding: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#A85050",
          flexShrink: 0,
          marginTop: 4,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── BlogDrawer ────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  editing: Blog | null;
  onClose: () => void;
  onSave: (data: BlogInput, id?: string) => void;
  isPending: boolean;
}

function BlogDrawer({
  open,
  editing,
  onClose,
  onSave,
  isPending,
}: DrawerProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<BlogCategory>("Crystal Guides");
  const [images, setImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [sections, setSections] = useState<
    Array<BlogSection & { _id: string }>
  >([]);

  useEffect(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title);
        setSlug(editing.slug);
        setSlugManual(true);
        setSubtitle(editing.subtitle ?? "");
        setExcerpt(editing.excerpt);
        setCategory(editing.category);
        setImages(editing.images ?? []);
        setFeatured(editing.featured);
        setIsPublished(editing.isPublished);
        setSections(editing.content.map((s) => ({ ...s, _id: makeId() })));
      } else {
        setTitle("");
        setSlug("");
        setSlugManual(false);
        setSubtitle("");
        setExcerpt("");
        setCategory("Crystal Guides");
        setImages([]);
        setFeatured(false);
        setIsPublished(true);
        setSections([]);
      }
    }
  }, [open, editing]);

  useEffect(() => {
    if (!slugManual) setSlug(toSlug(title));
  }, [title, slugManual]);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      { _id: makeId(), title: "", description: "" },
    ]);
  };

  const updateSection = (
    index: number,
    updated: BlogSection & { _id: string },
  ) => {
    setSections((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content: BlogSection[] = sections.map(
      ({ _id: _removed, ...rest }) => rest,
    );
    onSave(
      {
        slug,
        title,
        subtitle: subtitle || undefined,
        excerpt,
        category,
        images,
        featured,
        isPublished,
        content,
      },
      editing?._id,
    );
  };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,26,23,0.4)",
            zIndex: 100,
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: 560,
          background: "#F5F0E8",
          borderLeft: "1px solid #E2DAC8",
          zIndex: 101,
          boxShadow: "-4px 0 24px rgba(28,26,23,0.12)",
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 64,
            borderBottom: "1px solid #E2DAC8",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 500,
              color: "#1C1A17",
            }}
          >
            {editing ? "Edit Blog Post" : "New Blog Post"}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9E9590",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Title */}
          <div>
            <label style={LABEL}>Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to Choose Your First Crystal"
              style={INPUT_BASE}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={LABEL}>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManual(true);
              }}
              placeholder="auto-generated from title"
              style={{ ...INPUT_BASE, color: "#6B6057" }}
            />
            <span
              style={{
                fontFamily: FONT,
                fontSize: 10,
                color: "#9E9590",
                marginTop: 4,
                display: "block",
              }}
            >
              Used in the URL: /blog/<strong>{slug || "…"}</strong>
            </span>
          </div>

          {/* Subtitle */}
          <div>
            <label style={LABEL}>Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional sub-headline"
              style={INPUT_BASE}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label style={LABEL}>Excerpt *</label>
            <textarea
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Short summary shown on the blog listing page"
              style={{ ...INPUT_BASE, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* Category */}
          <div>
            <label style={LABEL}>Category *</label>
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value as BlogCategory)}
                style={{
                  ...INPUT_BASE,
                  paddingRight: 28,
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: "absolute",
                  right: 10,
                  pointerEvents: "none",
                  color: "#9E9590",
                }}
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label style={LABEL}>Images</label>
            <ImagesField images={images} onChange={setImages} />
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <ActiveToggle
              label="Featured"
              value={featured}
              onChange={setFeatured}
            />
            <ActiveToggle
              label="Published"
              value={isPublished}
              onChange={setIsPublished}
            />
          </div>

          {/* Content sections */}
          <div>
            <label style={{ ...LABEL, marginBottom: 10 }}>
              Article Content
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sections.map((section, index) => (
                <SectionRow
                  key={section._id}
                  section={section}
                  index={index}
                  onChange={updateSection}
                  onRemove={removeSection}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addSection}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 12px",
                marginTop: 10,
                background: "transparent",
                border: "1px solid #E2DAC8",
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 11,
                color: "#6B6057",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#7B5EA7")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  "#E2DAC8")
              }
            >
              <Plus size={11} />
              Add Section
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              marginTop: 8,
              padding: "10px 20px",
              background: isPending ? "#C4B89A" : "#C49A3C",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 500,
              cursor: isPending ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
              transition: "background 0.15s",
            }}
          >
            {isPending ? "Saving…" : editing ? "Save Changes" : "Publish Post"}
          </button>
        </form>
      </div>
    </>
  );
}

// ── DeleteButton ──────────────────────────────────────────────────────────────

function DeleteButton({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
      timerRef.current = setTimeout(() => setConfirming(false), 3000);
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={confirming ? "Click again to confirm delete" : "Delete post"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: confirming ? "auto" : 30,
        height: 30,
        padding: confirming ? "0 10px" : "0",
        borderRadius: 4,
        border: "1px solid",
        borderColor: confirming ? "#A85050" : "#E2DAC8",
        background: confirming ? "#FEF2F2" : "transparent",
        color: confirming ? "#A85050" : "#9E9590",
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: confirming ? 500 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        gap: 4,
      }}
    >
      {confirming ? "Confirm?" : <Trash2 size={13} />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BlogsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: getAdminBlogs,
  });

  const saveMutation = useMutation({
    mutationFn: ({ data, id }: { data: BlogInput; id?: string }) =>
      id ? updateBlog(id, data) : createBlog(data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      setDrawerOpen(false);
      setEditingBlog(null);
      toast.success(id ? "Blog post updated" : "Blog post created");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save blog post";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blogs"] });
      toast.success("Blog post deleted");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete blog post";
      toast.error(msg);
    },
  });

  const openCreate = () => {
    setEditingBlog(null);
    setDrawerOpen(true);
  };
  const openEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingBlog(null);
  };

  const blogs = data ?? [];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 500,
            color: "#1C1A17",
            margin: 0,
          }}
        >
          Blog Posts
        </h1>
        <button
          onClick={openCreate}
          style={{
            padding: "8px 18px",
            background: "#C49A3C",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#B8892E")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background =
              "#C49A3C")
          }
        >
          + New Post
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          background: "#EDE8DC",
          border: "1px solid #E2DAC8",
          borderRadius: 4,
          overflowX: "auto",
        }}
      >
        {isLoading ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 13,
              color: "#9E9590",
            }}
          >
            Loading blog posts…
          </div>
        ) : isError ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 13,
              color: "#A85050",
            }}
          >
            Failed to load blog posts. Please try again.
          </div>
        ) : blogs.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              fontFamily: FONT,
              fontSize: 13,
              color: "#9E9590",
            }}
          >
            No blog posts yet. Create your first one above.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 48 }}>Image</th>
                <th style={TH}>Title</th>
                <th style={TH}>Category</th>
                <th style={TH}>Status</th>
                <th style={{ ...TH, width: 70, textAlign: "center" as const }}>
                  Featured
                </th>
                <th style={{ ...TH, textAlign: "right" as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr
                  key={blog._id}
                  onMouseEnter={(e) => {
                    const cells = (
                      e.currentTarget as HTMLTableRowElement
                    ).querySelectorAll("td");
                    cells.forEach(
                      (td) =>
                        ((td as HTMLElement).style.background = "#F0EAF7"),
                    );
                  }}
                  onMouseLeave={(e) => {
                    const cells = (
                      e.currentTarget as HTMLTableRowElement
                    ).querySelectorAll("td");
                    cells.forEach(
                      (td) =>
                        ((td as HTMLElement).style.background = "transparent"),
                    );
                  }}
                >
                  {/* Cover thumbnail */}
                  <td style={TD}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        overflow: "hidden",
                        background: "#F5F0E8",
                        border: "1px solid #E2DAC8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#C4B89A",
                        flexShrink: 0,
                      }}
                    >
                      {blog.images?.[0] ? (
                        <img
                          src={blog.images[0]}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <ImageOff size={14} />
                      )}
                    </div>
                  </td>

                  {/* Title + slug */}
                  <td style={TD}>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#1C1A17",
                        maxWidth: 280,
                      }}
                    >
                      {blog.title}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 11,
                        color: "#9E9590",
                        marginTop: 2,
                      }}
                    >
                      /blog/{blog.slug}
                    </div>
                  </td>

                  {/* Category */}
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: FONT,
                        fontSize: 11,
                        color: "#7B5EA7",
                        background: "rgba(123,94,167,0.08)",
                        padding: "2px 8px",
                        borderRadius: 10,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {blog.category}
                    </span>
                  </td>

                  {/* Published status */}
                  <td style={TD}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: blog.isPublished ? "#ECFDF5" : "#F3F4F6",
                        color: blog.isPublished ? "#5A8A6A" : "#9E9590",
                        fontFamily: FONT,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: blog.isPublished ? "#5A8A6A" : "#9E9590",
                        }}
                      />
                      {blog.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>

                  {/* Featured */}
                  <td style={{ ...TD, textAlign: "center" as const }}>
                    {blog.featured ? (
                      <span
                        style={{
                          fontFamily: FONT,
                          fontSize: 11,
                          color: "#C49A3C",
                          fontWeight: 500,
                        }}
                      >
                        ★ Yes
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: FONT,
                          fontSize: 11,
                          color: "#C4B89A",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ ...TD, textAlign: "right" as const }}>
                    <div
                      style={{
                        display: "inline-flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={() => openEdit(blog)}
                        title="Edit"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 30,
                          height: 30,
                          borderRadius: 4,
                          border: "1px solid #E2DAC8",
                          background: "transparent",
                          color: "#6B6057",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#F5F0E8")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "transparent")
                        }
                      >
                        <Pencil size={13} />
                      </button>
                      <DeleteButton
                        onConfirm={() => deleteMutation.mutate(blog._id)}
                        disabled={deleteMutation.isPending}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      <BlogDrawer
        open={drawerOpen}
        editing={editingBlog}
        onClose={closeDrawer}
        onSave={(data, id) => saveMutation.mutate({ data, id })}
        isPending={saveMutation.isPending}
      />
    </div>
  );
}
