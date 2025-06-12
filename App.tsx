import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { supabase } from './src/lib/supa';
import { useAppStore } from './src/store/useAppStore';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerForPushNotificationsAsync } from './src/lib/notificationManager';


function ThemedStatusBar() {
    const { background } = useThemeColors();
    return (
        <StatusBar style="auto" backgroundColor={background} translucent={false} />
    );
}

export default function App() {
    const loginStore = useAppStore((s) => s.login);
    const logoutStore = useAppStore((s) => s.logout);
    const fetchUserProfile = useAppStore((s) => s.fetchUserProfile);

    async function registerForPushNotificationsAsync() {
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                // Kullanıcı izin vermedi
                return;
            }
            // Token'ı al
            const token = (await Notifications.getExpoPushTokenAsync()).data;

            // Token'ı Supabase'e kaydet
            const { data: { user } } = await supabase.auth.getUser();
            if (user && token) {
                await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
            }
        }
    }

    // 1) Uygulama açıldığında mevcut Supabase oturumunu kontrol et
    useEffect(() => {
        useAppStore.getState().resetRegistrationForm();
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                loginStore();
                fetchUserProfile(); // <-- YENİ: Oturum varsa profili hemen çek
            } else {
                logoutStore();
            }
        })();
    }, [fetchUserProfile, loginStore, logoutStore]);

    // 2) Supabase auth state değişikliklerini dinle (SIGNED_OUT, TOKEN_REFRESH_FAILED, SIGNED_IN)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => { // async eklendi
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
                logoutStore();
            } else if (event === 'SIGNED_IN') {
                loginStore();
                await fetchUserProfile(); // profili çekmesini bekle
                await registerForPushNotificationsAsync(); // YENİ: Giriş yapıldığında token'ı kaydet
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchUserProfile, loginStore, logoutStore]);

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <ThemeProvider>
                    <ThemedStatusBar />
                    <RootNavigator />
                </ThemeProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}