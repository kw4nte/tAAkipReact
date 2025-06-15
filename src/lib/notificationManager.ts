// src/lib/notificationManager.ts

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supa';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotificationsAsync() {
    // Fiziksel bir cihazda çalışıp çalışmadığını kontrol et
    if (!Device.isDevice) {
        // Geliştirme ortamında can sıkıcı olmaması için alert'i console.warn ile değiştirebilirsiniz.
        console.warn('Push bildirimleri için fiziksel bir cihaz kullanılmalıdır.');
        return;
    }

    // Mevcut izin durumunu al
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Eğer izin verilmemişse, kullanıcıdan izin iste
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    // Kullanıcı yine de izin vermediyse, işlemi sonlandır
    if (finalStatus !== 'granted') {
        console.log('Kullanıcı bildirimlere izin vermedi.');
        return;
    }

    // Android için bildirim kanalı ayarla (gerekli bir adım)
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        if (!token) {
            console.log("Push token alınamadı.");
            return;
        }
        console.log('Alınan Expo Push Token:', token);

        // Veritabanı işlemleri yerine Edge Function'ı çağırıyoruz
        const { error } = await supabase.functions.invoke('update-push-token', {
            body: { pushToken: token },
        })

        if (error) {
            console.error('Push token güncellenirken Edge Function hatası:', error.message);
        } else {
            console.log('Push token, Edge Function aracılığıyla başarıyla güncellendi.');
        }
    } catch (e: any) {
        console.error('Push token kayıt sürecinde genel bir hata oluştu:', e.message);
    }
}