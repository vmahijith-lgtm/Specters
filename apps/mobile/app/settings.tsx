import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SettingsScreen() {
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => setProfile(p))
      }
    })
  }, [])

  function update(key: string, value: any) {
    setProfile((prev: any) => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!profile) return
    setSaving(true)

    const targetRolesRaw = profile.target_roles_raw ?? (profile.target_roles || []).join(', ')
    const targetLocationsRaw = profile.target_locations_raw ?? (profile.target_locations || []).join(', ')

    await supabase.from('profiles').update({
      full_name: profile.full_name,
      target_roles: targetRolesRaw.split(',').map((s: string) => s.trim()).filter(Boolean),
      target_locations: targetLocationsRaw.split(',').map((s: string) => s.trim()).filter(Boolean),
      llm_api_key: profile.llm_api_key,
    }).eq('id', profile.id)
    setSaving(false)
    Alert.alert('Success', 'Settings saved')
  }

  if (!profile) return (
    <View style={[styles.container, { justifyContent: 'center' }]}>
      <ActivityIndicator color="#7C3AED" />
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings ⚙️</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={profile.full_name || ''} onChangeText={t => update('full_name', t)} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Target Roles</Text>
        <TextInput style={styles.input} value={profile.target_roles_raw ?? (profile.target_roles || []).join(', ')} onChangeText={t => update('target_roles_raw', t)} placeholder="e.g. Software Engineer" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>LLM API Key</Text>
        <TextInput style={styles.input} value={profile.llm_api_key || ''} onChangeText={t => update('llm_api_key', t)} secureTextEntry placeholder="sk-..." />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  heading: { fontSize: 24, fontWeight: '600', color: '#111827', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 14 },
  saveBtn: { backgroundColor: '#7C3AED', padding: 14, borderRadius: 12, marginTop: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' }
})
