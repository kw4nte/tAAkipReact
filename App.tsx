import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeProvider';
import RootNavigator from './src/navigation/RootNavigator';
import i18n from './src/i18n';

function ThemedStatusBar() {
    const { background } = useThemeColors();
    return (
        <StatusBar style="auto" backgroundColor={background} translucent={false} />
    );
}

export default function App() {
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