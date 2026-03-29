import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mobileApi } from '../lib/api'

export default function DashboardScreen() {
  const [signals, setSignals] = useState<any[]>([])
  const [jobs, setJobs]       = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('profiles').select('*').eq('id', data.user.id).single()
        .then(({ data: p }) => setProfile(p))
    })
    mobileApi.getSignals().then(r => setSignals(r.signals.slice(0, 3)))
    mobileApi.getJobs(5).then(r => setJobs(r.jobs))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>HireSignal 📡</Text>
      <Text style={styles.sub}>Your hiring intelligence briefing</Text>

      {signals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top signals</Text>
          {signals.map((s: any) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle}>{s.company}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Score {s.signal_score}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>{s.signal_type.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fresh jobs (24h)</Text>
        {jobs.map((j: any) => (
          <TouchableOpacity key={j.id} style={styles.card} onPress={() => Linking.openURL(j.url)}>
            <Text style={styles.cardTitle}>{j.title}</Text>
            <Text style={styles.cardSub}>{j.company} · {j.location || 'Remote'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content:   { padding: 20, paddingTop: 60 },
  heading:   { fontSize: 24, fontWeight: '600', color: '#111827' },
  sub:       { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
  section:   { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  cardRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
  cardSub:   { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
  badge:     { backgroundColor: '#EDE9FE', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#6D28D9', fontWeight: '600' },
})
