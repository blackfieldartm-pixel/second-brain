import { supabase } from './supabase.js'

// Проекты верхнего уровня (вложенные добавим позже)
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .is('parent_id', null)
    .is('deleted_at', null)
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addProject({ title, emoji, color }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title, emoji: emoji || null, color: color || null })
    .select()
    .single()
  if (error) throw error
  return data
}