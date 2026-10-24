import React, { useEffect, useState } from 'react'
import { checkConnection } from './lib/supabase.js'

function App() {
  const [status, setStatus] = useState('Проверяю подключение к базе…')

  useEffect(() => {
    checkConnection().then((result) => {
      setStatus((result.ok ? '✅ ' : '❌ ') + result.message)
    })
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '50px' }}>
      <h1>Привет! 👋</h1>
      <p>Это твой «Второй мозг». Скоро здесь появятся задачи.</p>
      <p>{status}</p>
    </div>
  )
}

export default App