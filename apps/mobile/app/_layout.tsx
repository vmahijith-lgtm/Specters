import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { registerPushToken } from '../lib/notifications'

export default function RootLayout() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) registerPushToken(data.user.id)
    })
  }, [])

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#7C3AED',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: { borderTopColor: '#F3F4F6' },
      headerShown: false,
    }}>
      <Tabs.Screen name="index"    options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="home"         size={size} color={color} /> }}/>
      <Tabs.Screen name="radar"    options={{ title: 'Radar',     tabBarIcon: ({ color, size }) => <Ionicons name="radio"        size={size} color={color} /> }}/>
      <Tabs.Screen name="jobs"     options={{ title: 'Jobs',      tabBarIcon: ({ color, size }) => <Ionicons name="briefcase"    size={size} color={color} /> }}/>
      <Tabs.Screen name="pipeline" options={{ title: 'Pipeline',  tabBarIcon: ({ color, size }) => <Ionicons name="git-branch"   size={size} color={color} /> }}/>
      <Tabs.Screen name="settings" options={{ title: 'Settings',  tabBarIcon: ({ color, size }) => <Ionicons name="settings"     size={size} color={color} /> }}/>
    </Tabs>
  )
}
