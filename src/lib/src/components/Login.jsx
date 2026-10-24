import React, { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px',
  fontSize: '16px',
  borderRadius: '10px',
  border: '1px solid #bbb',
  marginBottom: '12px',
}

const buttonStyle = {
  width: '100%',
  padding: '14px',
  fontSize: '16px',
  borderRadius: '10px',
  border: 'none',
  background: '#2563eb',
  color: '#fff',
}

function explainError(message) {
  const m = (message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Неверный email или пароль.'
  if (m.includes('already registered')) return 'Такой пользователь уже есть. Нажми «Войти».'
  if (m.includes('at least')) return 'Пароль слишком короткий. Нужно не меньше 8 символов.'
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return 'Регистрация новых пользователей отключена.'
  }
  if (m.includes('rate limit')) return 'Слишком много попыток. Подожди немного и попробуй снова.'
  if (m.includes('email not confirmed')) {
    return 'Email не подтверждён. Проверь, что в Supabase выключен Confirm email.'
  }
  return message
}

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    const credentials = { email: email.trim(), password }
    const { data, error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials)
    setBusy(false)
    if (error) {
      setError(explainError(error.message))
      return
    }
    if (mode === 'signup' && !data.session) {
      setInfo('Аккаунт создан. Подтверди email по письму, потом нажми «Войти».')
    }
  }

  const isSignin = mode === 'signin'

  return (
    <div style={{ maxWidth: '360px', margin: '60px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>Второй мозг</h1>
      <p style={{ textAlign: 'center' }}>{isSignin ? 'Вход' : 'Создание аккаунта'}</p>

      <form onSubmit={submit}>
        <input
          style={inputStyle}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          style={inputStyle}
          type="password"
          autoComplete={isSignin ? 'current-password' : 'new-password'}
          placeholder={isSignin ? 'Пароль' : 'Пароль (не меньше 8 символов)'}
          minLength={isSignin ? undefined : 8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button style={buttonStyle} type="submit" disabled={busy}>
          {busy ? 'Подожди…' : isSignin ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      <p style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => { setMode(isSignin ? 'signup' : 'signin'); setError(''); setInfo('') }}
          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '15px' }}
        >
          {isSignin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
        </button>
      </p>

      {error && <p style={{ color: '#c00' }}>{error}</p>}
      {info && <p style={{ color: '#166534' }}>{info}</p>}
    </div>
  )
}