import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { mobileApi } from '../lib/api'

const TYPE_LABELS: Record<string, string> = {
  funding_round:    '💰 Funding round',
  headcount_growth: '📈 Team growth',
  github_spike:     '⚡ GitHub spike',
  glassdoor_review: '⭐ Glassdoor surge',
  exec_hire:        '👔 Exec hire',
  product_launch:   '🚀 Product launch',
}

export default function RadarScreen() {
  const [signals, setSignals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    mobileApi.getSignals()
      .then(r => { setSignals(r.signals || []) })
      .catch((e: any) => console.error('Failed to load signals:', e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Hiring radar 📡</Text>
      <Text style={styles.sub}>Companies showing pre-posting signals. Get in before the job goes live.</Text>

      {loading ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 20 }} />
      ) : signals.length === 0 ? (
        <Text style={styles.empty}>No signals yet. Add companies to your watchlist.</Text>
      ) : (
        signals.map((s: any) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{s.company}</Text>
              <View style={[styles.badge, s.signal_score >= 80 ? styles.badgeHigh : s.signal_score >= 60 ? styles.badgeMedium : styles.badgeLow]}>
                <Text style={[styles.badgeText, s.signal_score >= 80 ? styles.badgeTextHigh : s.signal_score >= 60 ? styles.badgeTextMedium : styles.badgeTextLow]}>
                  Score {s.signal_score}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{TYPE_LABELS[s.signal_type] || s.signal_type}</Text>
            {s.headline && <Text style={styles.headline}>{s.headline}</Text>}
            {s.source_url && (
              <TouchableOpacity onPress={() => Linking.openURL(s.source_url)} style={styles.linkBtn}>
                <Text style={styles.linkText}>Source →</Text>
              </TouchableOpacity>
            )}
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
  empty:     { fontSize: 14, color: '#9CA3AF' },
  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  cardRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  cardSub:   { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  headline:  { fontSize: 12, color: '#9CA3AF' },
  badge:     { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeLow:  { backgroundColor: '#DBEAFE' },
  badgeMedium: { backgroundColor: '#FEF3C7' },
  badgeHigh: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextLow: { color: '#1D4ED8' },
  badgeTextMedium: { color: '#B45309' },
  badgeTextHigh: { color: '#B91C1C' },
  linkBtn:   { marginTop: 10, alignSelf: 'flex-start' },
  linkText:  { fontSize: 13, color: '#7C3AED', fontWeight: '500' }
})
