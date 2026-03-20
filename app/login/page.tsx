'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const { setCurrentUser, currentUserId } = useUIStore()
  const [tab, setTab] = useState<Tab>('login')

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // If already logged in, redirect
  useEffect(() => {
    const saved = localStorage.getItem('kanban_user')
    if (saved) {
      const u = JSON.parse(saved)
      setCurrentUser(u.id, u.name)
      router.replace('/boards')
    }
  }, [setCurrentUser, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Preencha email e senha')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao entrar'); return }
      localStorage.setItem('kanban_user', JSON.stringify({ id: data.id, name: data.name }))
      setCurrentUser(data.id, data.name)
      router.push('/boards')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Preencha todos os campos')
      return
    }
    if (regPassword !== regConfirm) {
      setError('As senhas não coincidem')
      return
    }
    if (regPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), email: regEmail.trim(), password: regPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar conta'); return }
      localStorage.setItem('kanban_user', JSON.stringify({ id: data.id, name: data.name }))
      setCurrentUser(data.id, data.name)
      router.push('/boards')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1923 0%, #1a2d42 50%, #0f1923 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      {/* Background pattern */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(79,142,247,0.4)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <rect x="3" y="3" width="7" height="18" rx="2"/>
              <rect x="14" y="3" width="7" height="11" rx="2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.5px' }}>Kanban</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Organize sua equipe com eficiência</p>
        </div>

        {/* Card */}
        <div style={{ background: '#1a2535', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess('') }}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  background: 'transparent',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: tab === t ? 700 : 400,
                  color: tab === t ? '#4f8ef7' : '#64748b',
                  cursor: 'pointer',
                  borderBottom: tab === t ? '2px solid #4f8ef7' : '2px solid transparent',
                  transition: 'all 0.15s',
                  marginBottom: -1,
                }}
              >
                {t === 'login' ? 'Entrar' : 'Criar Conta'}
              </button>
            ))}
          </div>

          <div style={{ padding: '32px 32px 28px' }}>
            {/* Error / Success */}
            {error && (
              <div style={{ background: 'rgba(235,90,70,0.15)', border: '1px solid rgba(235,90,70,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div style={{ background: 'rgba(97,189,79,0.15)', border: '1px solid rgba(97,189,79,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#86efac' }}>
                ✓ {success}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Senha</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ marginTop: 4, padding: '11px', fontSize: 15, fontWeight: 600, borderRadius: 8 }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Não tem conta?{' '}
                  <button type="button" onClick={() => { setTab('register'); setError('') }} style={{ background: 'none', border: 'none', color: '#4f8ef7', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Criar agora
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Seu nome</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="João Silva"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="seu@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Senha</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirmar senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type="password"
                      placeholder="Repita a senha"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      autoComplete="new-password"
                      style={{ paddingRight: regConfirm ? 36 : 12 }}
                    />
                    {regConfirm && (
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: regConfirm === regPassword ? '#61bd4f' : '#eb5a46' }}>
                        {regConfirm === regPassword ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ marginTop: 4, padding: '11px', fontSize: 15, fontWeight: 600, borderRadius: 8 }}
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                  Já tem conta?{' '}
                  <button type="button" onClick={() => { setTab('login'); setError('') }} style={{ background: 'none', border: 'none', color: '#4f8ef7', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    Entrar
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 24 }}>
          Kanban — Sistema de Organização Multi-Equipe
        </p>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}
