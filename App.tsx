import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { supabase } from './src/lib/supa';
import { useAppStore } from './src/store/useAppStore';

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
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
                logoutStore();
            } else if (event === 'SIGNED_IN') {
                loginStore();
                fetchUserProfile(); // <-- YENİ: Giriş yapıldığında profili hemen çek
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