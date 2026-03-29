import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { mobileApi } from '../lib/api'
import { supabase } from '../lib/supabase'

const COLUMNS = ['saved', 'applied', 'interviewing', 'offer', 'rejected']

export default function PipelineScreen() {
  const [pipeline, setPipeline] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        mobileApi.getPipeline(data.user.id).then(res => {
          setPipeline(res)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Pipeline 🔀</Text>
      <Text style={styles.sub}>Track every application from saved to offer.</Text>

      {loading ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 20 }} />
      ) : (
        COLUMNS.map(status => (
          <View key={status} style={styles.section}>
            <Text style={styles.sectionTitle}>{status.toUpperCase()} ({(pipeline[status] || []).length})</Text>
            {(pipeline[status] || []).map((uj: any) => (
              <View key={uj.id} style={styles.card}>
                <Text style={styles.cardTitle}>{uj.jobs?.title}</Text>
                <Text style={styles.cardSub}>{uj.jobs?.company}</Text>
                {uj.response_probability != null && (
                  <Text style={styles.scoreText}>Match score: {uj.response_probability}%</Text>
                )}
                {uj.tailored_resume_url && (
                  <TouchableOpacity onPress={() => Linking.openURL(uj.tailored_resume_url)}>
                    <Text style={styles.linkText}>View tailored resume</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content:   { padding: 20, paddingTop: 60 },
  heading:   { fontSize: 24, fontWeight: '600', color: '#111827' },
  sub:       { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  section:   { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10, letterSpacing: 0.5 },
  card:      { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSub:   { fontSize: 13, color: '#6B7280' },
  scoreText: { fontSize: 13, color: '#7C3AED', fontWeight: '500', marginTop: 6 },
  linkText:  { fontSize: 13, color: '#2563EB', marginTop: 6, textDecorationLine: 'underline' }
})
