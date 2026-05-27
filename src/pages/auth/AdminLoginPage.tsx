import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import client from '../../api/client'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import type { Admin } from '../../store/adminAuthStore'

// ── Schemas ───────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'),
})

const verifySchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
  password: z.string().min(1, 'Password is required'),
})

type PhoneFormData  = z.infer<typeof phoneSchema>
type VerifyFormData = z.infer<typeof verifySchema>

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

  const [step,        setStep]        = useState<'phone' | 'verify'>('phone')
  const [phone,       setPhone]       = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [otpSent,     setOtpSent]     = useState(false)

  // ── Step 1: phone form ──────────────────────────────────────────────────────

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const sendOtp = async (data: PhoneFormData) => {
    setServerError(null)
    try {
      await client.post('/api/v1/auth/send-otp', {
        phone:     data.phone,
        purpose:   'login',
        adminOnly: true,
      })
      setPhone(data.phone)
      setOtpSent(true)
      setStep('verify')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      if (e.response?.status === 403) {
        setServerError('This phone number is not registered as an admin account.')
      } else {
        setServerError(e.response?.data?.message ?? 'Failed to send OTP. Try again.')
      }
    }
  }

  // ── Step 2: OTP + password form ─────────────────────────────────────────────

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  })

  const verifyOtp = async (data: VerifyFormData) => {
    setServerError(null)
    try {
      const res = await client.post('/api/v1/auth/verify-otp', {
        phone,
        otp:        data.otp,
        password:   data.password,
        adminLogin: true,
      })
      const { user, accessToken } = res.data.data as { user: Admin; accessToken: string }
      login(user, accessToken)
      navigate('/admin/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      if (e.response?.status === 403) {
        setServerError('This account does not have admin access.')
      } else {
        setServerError(e.response?.data?.message ?? 'Verification failed. Try again.')
      }
    }
  }

  const handleResend = async () => {
    setServerError(null)
    try {
      await client.post('/api/v1/auth/send-otp', {
        phone,
        purpose:   'login',
        adminOnly: true,
      })
      setOtpSent(true)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      if (e.response?.status === 403) {
        setServerError('This phone number is not registered as an admin account.')
      } else {
        setServerError(e.response?.data?.message ?? 'Failed to resend OTP. Try again.')
      }
    }
  }

  const handleBack = () => {
    setStep('phone')
    setServerError(null)
    verifyForm.reset()
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
          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: '#1C1A17',
            }}
          >
            Prayosha Crystal
          </div>
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

        {/* ── Step 1: Phone ── */}
        {step === 'phone' && (
          <form onSubmit={phoneForm.handleSubmit(sendOtp)} noValidate>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Phone Number</label>
              <input
                {...phoneForm.register('phone')}
                type="tel"
                placeholder="e.g. 9876543210"
                className="admin-input"
                style={fieldStyle}
                autoComplete="tel"
              />
              {phoneForm.formState.errors.phone && (
                <p style={errorStyle}>{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>

            {serverError && <ErrorBanner message={serverError} />}

            <button
              type="submit"
              disabled={phoneForm.formState.isSubmitting}
              style={submitButtonStyle(phoneForm.formState.isSubmitting)}
            >
              {phoneForm.formState.isSubmitting ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP + Password ── */}
        {step === 'verify' && (
          <form onSubmit={verifyForm.handleSubmit(verifyOtp)} noValidate>
            {/* Phone display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                padding: '8px 12px',
                background: '#F5F0E8',
                border: '1px solid #E2DAC8',
                borderRadius: 2,
              }}
            >
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: '#1C1A17' }}>
                {phone}
              </span>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 11,
                  color: '#7B5EA7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: 0,
                }}
              >
                <ArrowLeft size={12} /> Change
              </button>
            </div>

            {/* OTP hint */}
            {otpSent && (
              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 12,
                  color: '#6B6057',
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                OTP sent to your phone. Enter it below along with your password.
              </p>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>OTP (6 digits)</label>
              <input
                {...verifyForm.register('otp')}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="——————"
                className="admin-input"
                style={{ ...fieldStyle, letterSpacing: '0.3em', textAlign: 'center' }}
                autoComplete="one-time-code"
              />
              {verifyForm.formState.errors.otp && (
                <p style={errorStyle}>{verifyForm.formState.errors.otp.message}</p>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Password</label>
              <input
                {...verifyForm.register('password')}
                type="password"
                className="admin-input"
                style={fieldStyle}
                autoComplete="current-password"
              />
              {verifyForm.formState.errors.password && (
                <p style={errorStyle}>{verifyForm.formState.errors.password.message}</p>
              )}
            </div>

            {serverError && <ErrorBanner message={serverError} />}

            <button
              type="submit"
              disabled={verifyForm.formState.isSubmitting}
              style={submitButtonStyle(verifyForm.formState.isSubmitting)}
            >
              {verifyForm.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 12,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Jost', sans-serif",
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9E9590',
                padding: '8px 0',
              }}
            >
              Resend OTP
            </button>
          </form>
        )}
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
