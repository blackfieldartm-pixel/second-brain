import { supabase } from './supabase.js'

// Секции одного проекта
export async function fetchSections(projectId) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addSection(projectId, title, sortOrder) {
  const { data, error } = await supabase
    .from('sections')
    .insert({ project_id: projectId, title, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function renameSection(id, title) {
  const { data, error } = await supabase
    .from('sections')
    .update({ title })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Удаление секции: задачи остаются в проекте без секции,
// сама секция помечается удалённой и нигде не показывается
export async function deleteSection(id) {
  const { error: tasksError } = await supabase
    .from('tasks')
    .update({ section_id: null })
    .eq('section_id', id)
  if (tasksError) throw tasksError

  const { error } = await supabase
    .from('sections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}