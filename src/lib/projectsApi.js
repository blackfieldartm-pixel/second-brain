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

// Изменение проекта (название, эмодзи, цвет)
export async function updateProject(id, fields) {
  const { data, error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Удаление проекта: задачи не пропадают, а переезжают во «Входящие»;
// сам проект остаётся в базе, но нигде не показывается
export async function deleteProject(id) {
  const { error: tasksError } = await supabase
    .from('tasks')
    .update({ project_id: null })
    .eq('project_id', id)
  if (tasksError) throw tasksError

  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}