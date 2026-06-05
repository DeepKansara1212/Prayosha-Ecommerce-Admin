import { forwardRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { useToast } from '../../store/toastStore'
import client from '../../api/client'
import { getAdminSettings, updateAdminSettings } from '../../api/settings.api'

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT  = "'Jost', sans-serif"
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

const CARD_BODY: React.CSSProperties = { padding: 24 }

const FIELD_ERROR: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 12,
  color: '#A85050',
  marginTop: 4,
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function updateProfile(data: { name: string }) {
  const res = await client.patch('/api/v1/auth/me', data)
  return res.data.data as { _id: string; name: string; email: string; role: string }
}

async function changePassword(data: { currentPassword: string; newPassword: string }) {
  await client.patch('/api/v1/auth/change-password', data)
}

function apiMessage(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  )
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
})
type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type PasswordFormData = z.infer<typeof passwordSchema>

// ── SaveButton ────────────────────────────────────────────────────────────────

function SaveButton({ isPending, label = 'Save Changes' }: { isPending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '9px 20px',
        background: isPending ? '#C4B89A' : '#C49A3C',
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
      {isPending ? 'Saving…' : label}
    </button>
  )
}

// ── PasswordField (forwardRef for RHF register compat) ────────────────────────

const PasswordField = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ placeholder, ...rest }, ref) => {
    const [visible, setVisible] = useState(false)
    return (
      <div style={{ position: 'relative' }}>
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          style={{ ...INPUT_BASE, paddingRight: 38 }}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
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
)
PasswordField.displayName = 'PasswordField'

// ── ProfileSection ────────────────────────────────────────────────────────────

function ProfileSection() {
  const { admin, setAdmin } = useAdminAuthStore()
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: admin?.name ?? '' },
  })

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      setAdmin({ ...admin!, name: updated.name })
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(apiMessage(err, 'Failed to update profile')),
  })

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

        <form
          onSubmit={handleSubmit((data) => mutation.mutate({ name: data.name.trim() }))}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}
        >
          <div>
            <label style={LABEL}>Display Name</label>
            <input {...register('name')} type="text" style={INPUT_BASE} />
            {errors.name && <p style={FIELD_ERROR}>{errors.name.message}</p>}
          </div>

          <div>
            <SaveButton isPending={mutation.isPending} />
          </div>
        </form>
      </div>
    </div>
  )
}

// ── PasswordSection ───────────────────────────────────────────────────────────

function PasswordSection() {
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully')
      reset()
    },
    onError: (err) => toast.error(apiMessage(err, 'Failed to change password')),
  })

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
        <form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })
          )}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}
        >
          <div>
            <label style={LABEL}>Current Password</label>
            <PasswordField {...register('currentPassword')} placeholder="Enter current password" />
            {errors.currentPassword && (
              <p style={FIELD_ERROR}>{errors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label style={LABEL}>New Password</label>
            <PasswordField {...register('newPassword')} placeholder="Min. 6 characters" />
            {errors.newPassword && <p style={FIELD_ERROR}>{errors.newPassword.message}</p>}
          </div>

          <div>
            <label style={LABEL}>Confirm New Password</label>
            <PasswordField {...register('confirmPassword')} placeholder="Repeat new password" />
            {errors.confirmPassword && (
              <p style={FIELD_ERROR}>{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <SaveButton isPending={mutation.isPending} label="Update Password" />
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
          {INFO_ROWS.map((row) => (
            <div
              key={row.label}
              style={{
                padding: '12px 16px',
                background: '#F5F0E8',
                border: '1px solid #E2DAC8',
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#9E9590',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 4,
                }}
              >
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

// ── FreeGiftSection ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? '#7B5EA7' : '#D4CFC8',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

function FreeGiftSection() {
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: getAdminSettings,
  })

  const [freeGiftEnabled, setFreeGiftEnabled] = useState<boolean | null>(null)

  // Sync local state when query data arrives (only once)
  const resolved = freeGiftEnabled !== null ? freeGiftEnabled : (settings?.freeGiftEnabled ?? false)

  const mutation = useMutation({
    mutationFn: () => updateAdminSettings({ freeGiftEnabled: resolved }),
    onSuccess: () => {
      toast.success('Settings saved successfully')
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => toast.error('Failed to save settings'),
  })

  return (
    <div style={CARD}>
      <div style={CARD_HEADER}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#1C1A17' }}>
          Free Gift Settings
        </div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: '#9E9590', marginTop: 2 }}>
          Control whether customers receive a free gift with their order
        </div>
      </div>

      <div style={CARD_BODY}>
        {isLoading ? (
          <div style={{ fontFamily: FONT, fontSize: 13, color: '#9E9590' }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <Toggle
                checked={resolved}
                onChange={() => setFreeGiftEnabled(!resolved)}
              />
              <div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: '#1C1A17' }}>
                  Enable Free Gift on all orders
                </div>
                <div style={{ fontFamily: FONT, fontSize: 12, color: '#9E9590', marginTop: 2 }}>
                  When enabled, every order will be marked with a free gift regardless of the products purchased
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '9px 20px',
                background: mutation.isPending ? '#C4B89A' : '#C49A3C',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 500,
                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em',
                transition: 'background 0.2s',
              }}
            >
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        )}
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
      <FreeGiftSection />
    </div>
  )
}
