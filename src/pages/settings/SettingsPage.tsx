import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Eye, EyeOff } from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import client from '../../api/client'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT = "'Jost', sans-serif"
const SERIF = "'Cormorant Garamond', serif"

const INPUT_BASE: React.CSSProperties = {
  padding: '9px 12px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 4,
  fontFamily: FONT,
  fontSize: 13,
  color: '#1C1A17',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const LABEL: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 11,
  fontWeight: 600,
  color: '#6B6057',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  display: 'block',
  marginBottom: 6,
}

const CARD: React.CSSProperties = {
  background: '#EDE8DC',
  border: '1px solid #E2DAC8',
  borderRadius: 6,
  marginBottom: 24,
}

const CARD_HEADER: React.CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid #E2DAC8',
}

const CARD_BODY: React.CSSProperties = {
  padding: 24,
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function updateProfile(data: { name: string }) {
  const res = await client.patch('/api/v1/auth/me', data)
  return res.data.data
}

async function changePassword(data: { currentPassword: string; newPassword: string }) {
  await client.patch('/api/v1/auth/change-password', data)
}

// ── SaveButton ────────────────────────────────────────────────────────────────

function SaveButton({
  isPending,
  saved,
  label = 'Save Changes',
}: {
  isPending: boolean
  saved: boolean
  label?: string
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '9px 20px',
        background: saved ? '#5A8A6A' : isPending ? '#C4B89A' : '#C49A3C',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        fontFamily: FONT,
        fontSize: 13,
        fontWeight: 500,
        cursor: isPending ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
        transition: 'background 0.2s',
      }}
    >
      {saved && <Check size={14} />}
      {isPending ? 'Saving…' : saved ? 'Saved' : label}
    </button>
  )
}

// ── PasswordField ─────────────────────────────────────────────────────────────

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{ ...INPUT_BASE, paddingRight: 38 }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9E9590',
          display: 'flex',
          padding: 0,
        }}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

// ── ProfileSection ────────────────────────────────────────────────────────────

function ProfileSection() {
  const { admin, setAdmin } = useAdminAuthStore()
  const [name, setName] = useState(admin?.name ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      const updated = data as { name: string; email: string; role: string; _id: string }
      setAdmin({ ...admin!, name: updated.name })
      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 2500)
    },
    onError: () => setError('Failed to update profile. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    mutation.mutate({ name: name.trim() })
  }

  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#1C1A17' }}>
          Profile
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
          Update your admin display name
        </div>
      </div>

      <div style={CARD_BODY}>
        {/* Avatar + info row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            padding: 16,
            background: '#F5F0E8',
            border: '1px solid #E2DAC8',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#7B5EA7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: SERIF,
              fontSize: 22,
              fontWeight: 500,
              color: '#fff',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            {admin?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: '#1C1A17' }}>
              {admin?.name}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', marginTop: 2 }}>
              {admin?.email}
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 4,
                padding: '2px 8px',
                borderRadius: 10,
                background: '#F0EAF7',
                color: '#7B5EA7',
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {admin?.role}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label style={LABEL}>Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              style={INPUT_BASE}
            />
          </div>

          {error && (
            <div style={{ fontFamily: FONT, fontSize: 12, color: '#A85050' }}>{error}</div>
          )}

          <div>
            <SaveButton isPending={mutation.isPending} saved={saved} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ── PasswordSection ───────────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setSaved(true)
      setError('')
      setCurrent('')
      setNext('')
      setConfirm('')
      setTimeout(() => setSaved(false), 2500)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to change password.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) {
      setError('New passwords do not match.')
      return
    }
    if (next.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    mutation.mutate({ currentPassword: current, newPassword: next })
  }

  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#1C1A17' }}>
          Change Password
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
          Choose a strong password with at least 6 characters
        </div>
      </div>

      <div style={CARD_BODY}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
          <div>
            <label style={LABEL}>Current Password</label>
            <PasswordField value={current} onChange={setCurrent} placeholder="Enter current password" />
          </div>

          <div>
            <label style={LABEL}>New Password</label>
            <PasswordField value={next} onChange={setNext} placeholder="Min. 6 characters" />
          </div>

          <div>
            <label style={LABEL}>Confirm New Password</label>
            <PasswordField value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 12,
                color: '#A85050',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <SaveButton isPending={mutation.isPending} saved={saved} label="Update Password" />
          </div>
        </form>
      </div>
    </div>
  )
}

// ── StoreInfoSection ──────────────────────────────────────────────────────────

function StoreInfoSection() {
  const INFO_ROWS = [
    { label: 'Store Name',    value: 'Prayosha Crystal' },
    { label: 'Currency',      value: '₹ INR' },
    { label: 'Country',       value: 'India' },
    { label: 'Payment',       value: 'COD + Razorpay' },
    { label: 'Image Storage', value: 'Cloudinary' },
  ]

  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#1C1A17' }}>
          Store Information
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
          Read-only overview of your store configuration
        </div>
      </div>

      <div style={CARD_BODY}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {INFO_ROWS.map(row => (
            <div
              key={row.label}
              style={{
                padding: '12px 16px',
                background: '#F5F0E8',
                border: '1px solid #E2DAC8',
                borderRadius: 6,
              }}
            >
              <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: '#9E9590', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {row.label}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 500,
          color: '#1C1A17',
          marginBottom: 28,
        }}
      >
        Settings
      </h1>

      <ProfileSection />
      <PasswordSection />
      <StoreInfoSection />
    </div>
  )
}
