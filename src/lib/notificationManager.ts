// src/lib/notificationManager.ts

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supa'; // supabase client'ınızın olduğu yolu doğrulayın

// Bildirimlerin uygulama ön plandayken nasıl davranacağını belirler
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
        alert('Push bildirimleri için fiziksel bir cihaz kullanılmalıdır.');
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
        // Cihazın benzersiz Expo Push Token'ını al
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Expo Push Token:', token); // Token'ı kontrol etmek için logla

        // Token'ı Supabase'deki kullanıcının profiline kaydet
        const { data: { user } } = await supabase.auth.getUser();
        if (user && token) {
            const { error } = await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', user.id);

            if (error) {
                console.error('Push token güncellenirken hata:', error.message);
            } else {
                console.log('Push token başarıyla kaydedildi.');
            }
        }
    } catch (e) {
        console.error('Push token alınırken hata oluştu:', e);
    }
}