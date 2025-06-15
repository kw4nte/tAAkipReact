import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { supabase } from './src/lib/supa';
import { useAppStore } from './src/store/useAppStore';
import { registerForPushNotificationsAsync } from './src/lib/notificationManager';

function ThemedStatusBar() {
    const { background } = useThemeColors();
    return (
        <StatusBar style="auto" backgroundColor={background} translucent={false} />
    );
}

export default function App() {
    // Store'dan ihtiyacımız olan her şeyi tek seferde alıyoruz
    const { login, logout, fetchUserProfile } = useAppStore();
    // Yüklenme durumunu yönetmek için
    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        // Formu resetleme işlemini listener dışına alabiliriz, sadece bir kez çalışsın.
        useAppStore.getState().resetRegistrationForm();

        // TEK bir useEffect ile hem başlangıç durumunu hem de sonraki değişiklikleri yönetiyoruz.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                // event'i SIGNED_IN veya INITIAL_SESSION olarak da kontrol edebilirsiniz, ama session kontrolü en temizi.
                if (session && session.user) {
                    // Oturum varsa (ilk açılışta veya yeni girişte)
                    login(session.user);
                    await fetchUserProfile();
                    // notificationManager'dan import ettiğimiz fonksiyonu çağırıyoruz
                    await registerForPushNotificationsAsync();
                } else {
                    // Oturum yoksa veya çıkış yapıldıysa
                    logout();
                }

                // Oturum durumu ne olursa olsun, kontrol bittiğinde uygulamayı hazır hale getir.
                // Bu, "flicker" (ekran titremesi) sorununu çözer.
                setIsAppReady(true);
            }
        );

        // Component kaldırıldığında listener'ı temizle
        return () => {
            subscription.unsubscribe();
        };
    }, [login, logout, fetchUserProfile]);

    // Oturum kontrolü bitene kadar bir yüklenme animasyonu göster
    if (!isAppReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

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