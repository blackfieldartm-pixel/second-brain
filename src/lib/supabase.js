import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '')
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Проверка: отвечает ли база на запрос
export async function checkConnection() {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Ключи не найдены. Проверь переменные в Vercel.' }
  }
  try {
    const res = await fetch(supabaseUrl + '/auth/v1/health', {
      headers: { apikey: supabaseAnonKey },
    })
    if (res.ok) {
      return { ok: true, message: 'Подключение к базе работает' }
    }
    return { ok: false, message: 'База ответила с ошибкой: ' + res.status }
  } catch (e) {
    return { ok: false, message: 'Нет связи с базой: ' + e.message }
  }
}