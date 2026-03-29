import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) return
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync()
    status = newStatus
  }
  if (status !== 'granted') return

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data

  await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId)
}
