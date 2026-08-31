import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import client from '../../api/client'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import type { Admin } from '../../store/adminAuthStore'

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#F5F0E8',
  border: '1px solid #E2DAC8',
  borderRadius: 2,
  fontFamily: "'Jost', sans-serif",
  fontSize: 14,
  color: '#1C1A17',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Jost', sans-serif",
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#6B6057',
  marginBottom: 6,
}

const errorStyle: React.CSSProperties = {
  color: '#C0392B',
  fontSize: 12,
  marginTop: 4,
  fontFamily: "'Jost', sans-serif",
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const login    = useAdminAuthStore(state => state.login)

  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const loginWithEmail = async (data: LoginFormData) => {
    setServerError(null)
    try {
      const res = await client.post('/api/v1/auth/email-login', data)
      const { user, accessToken } = res.data.data as { user: Admin; accessToken: string }
      login(user, accessToken)
      navigate('/admin/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      setServerError(e.response?.data?.message ?? 'Invalid email or password.')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F0E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#EDE8DC',
          border: '1px solid #E2DAC8',
          borderRadius: 4,
          padding: 48,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src="/prayosha-logo.png"
            alt="Prayosha Crystals"
            style={{ height: 60, width: 'auto', objectFit: 'contain', margin: '0 auto' }}
          />
          <div
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#9E9590',
              marginTop: 6,
            }}
          >
            Admin Panel
          </div>
        </div>

        <form onSubmit={form.handleSubmit(loginWithEmail)} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address</label>
            <input {...form.register('email')} type="email" placeholder="admin@example.com" className="admin-input" style={fieldStyle} autoComplete="email" />
            {form.formState.errors.email && <p style={errorStyle}>{form.formState.errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input {...form.register('password')} type="password" placeholder="Your password" className="admin-input" style={fieldStyle} autoComplete="current-password" />
            {form.formState.errors.password && <p style={errorStyle}>{form.formState.errors.password.message}</p>}
          </div>

          {serverError && <ErrorBanner message={serverError} />}

          <button type="submit" disabled={form.formState.isSubmitting} style={submitButtonStyle(form.formState.isSubmitting)}>
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: '#FDF2F2',
        border: '1px solid #E8C5C5',
        borderRadius: 2,
        padding: '10px 14px',
        marginBottom: 16,
        fontFamily: "'Jost', sans-serif",
        fontSize: 13,
        color: '#C0392B',
      }}
    >
      {message}
    </div>
  )
}

function submitButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px',
    background: '#C4A35A',
    border: 'none',
    borderRadius: 2,
    fontFamily: "'Jost', sans-serif",
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#1C1A17',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    fontWeight: 500,
  }
}
