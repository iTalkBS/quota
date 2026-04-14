'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required'); return }
    setLoading(true)
    setError('')

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      if (loginError.message.includes('Email not confirmed')) {
        setError('Please confirm your email before signing in. Check your inbox.')
      } else if (loginError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(loginError.message)
      }
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
      .single()

    if (!profile?.business_name) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="q-page" style={{ background: 'linear-gradient(160deg, #6c47ff 0%, #9b6bff 50%, var(--bg) 100%)' }}>
      <div style={{ padding: '60px 24px 40px' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Qouta</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>Sign in to your account</div>
      </div>

      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '24px 24px 0 0', padding: '32px 20px 40px' }}>
        {error && <div className="q-error">{error}</div>}

        <div className="q-form-group">
          <label className="q-label">Email address</label>
          <input
            className="q-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="q-form-group">
          <label className="q-label">Password</label>
          <input
            className="q-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="q-btn-primary"
          style={{ marginBottom: 12 }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>OR</div>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="q-btn-secondary"
          style={{ marginBottom: 20 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--text3)' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}