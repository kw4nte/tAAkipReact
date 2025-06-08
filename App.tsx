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

    // 1) Uygulama açıldığında mevcut Supabase oturumunu kontrol et
    useEffect(() => {
        // Uygulama her açıldığında, ne olursa olsun kayıt formunu temizle.
        useAppStore.getState().resetRegistrationForm();

        (async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                loginStore();
            } else {
                logoutStore();
            }
        })();
    }, []);

    // 2) Supabase auth state değişikliklerini dinle (SIGNED_OUT, TOKEN_REFRESH_FAILED, SIGNED_IN)
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
                logoutStore();
            } else if (event === 'SIGNED_IN') {
                loginStore();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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