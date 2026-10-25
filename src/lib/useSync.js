import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Автообновление данных: подписка на изменения таблиц в базе,
// дозагрузка при возврате в приложение и при появлении сети.
// Возвращает актуальный статус сети (true — интернет есть).
export function useAutoRefresh(onRefresh) {
  const [online, setOnline] = useState(() => navigator.onLine)

  // Появилась или пропала сеть
  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      onRefresh()
    }
    function handleOffline() {
      setOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onRefresh])

  // Вернулись в приложение или на вкладку
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState === 'visible') onRefresh()
    }
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('pageshow', handleVisible)
    return () => {
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('pageshow', handleVisible)
    }
  }, [onRefresh])

  // Realtime-подписка: база сама сообщает об изменениях в таблицах.
  // События приходят только вошедшему пользователю (работает RLS),
  // а регистрация у нас закрыта, поэтому в таблицах только твои строки.
  useEffect(() => {
    let timer = null
    function schedule() {
      // собираем события за 0.7 секунды в одно обновление
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        onRefresh()
      }, 700)
    }
    const channel = supabase
      .channel('second-brain-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, schedule)
      .subscribe()
    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [onRefresh])

  return online
}