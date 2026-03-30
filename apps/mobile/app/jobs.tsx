import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, TextInput, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { mobileApi } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function JobsScreen() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tailoring, setTailoring] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    mobileApi.getJobs(20)
      .then(r => { setJobs(r.jobs || []) })
      .catch((e: any) => console.error('Failed to load jobs:', e))
      .finally(() => setLoading(false))
  }, [])

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
  )

  async function handleTailor(jobId: string) {
    if (!user) { Alert.alert('Error', 'Please login first'); return; }
    setTailoring(jobId)
    try {
      const r = await mobileApi.tailorResume(jobId, user.id)
      if (r.doc_url) Linking.openURL(r.doc_url)
      else Alert.alert('Success', 'Resume tailored and saved. Check Pipeline.')
    } catch (e: any) {
      Alert.alert('Tailoring Failed', e.message || 'Check your settings.')
    }
    setTailoring(null)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Fresh jobs 💼</Text>
      <Text style={styles.sub}>Posted in the last 24 hours</Text>
      <TextInput
        style={styles.input}
        placeholder="Search role or company..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 20 }} />
      ) : (
        filtered.map((job: any) => (
          <View key={job.id} style={styles.card}>
            <TouchableOpacity onPress={() => Linking.openURL(job.url)}>
              <Text style={styles.cardTitle}>{job.title}</Text>
              <Text style={styles.cardSub}>
                {job.company} · {job.location || 'Remote'}
              </Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleTailor(job.id)} disabled={tailoring === job.id} style={[styles.btn, tailoring === job.id && styles.btnDisabled]}>
                <Text style={styles.btnText}>{tailoring === job.id ? 'Tailoring...' : 'Tailor resume'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 20, paddingTop: 60 },
  heading: { fontSize: 24, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#4B5563', marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-start' },
  btn: { backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '500' }
})
