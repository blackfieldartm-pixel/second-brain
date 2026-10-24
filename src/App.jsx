import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase.js'
import Login from './components/Login.jsx'
import Layout from './components/Layout.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const box = { padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }

  if (!isSupabaseConfigured) {
    return <div style={box}>Ключи Supabase не найдены. Проверь переменные в Vercel.</div>
  }

  if (loading) {
    return <div style={box}>Загрузка…</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <Layout
      email={session.user.email}
      onSignOut={() => supabase.auth.signOut()}
    />
  )
}

export default App