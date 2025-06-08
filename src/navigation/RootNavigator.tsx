import { NavigationContainer } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import AuthStack from './AuthStack';
import TabsNavigator from './TabsNavigator';

export default function RootNavigator() {
    const isAuth = useAppStore((s) => s.isAuth);
    return (
        <NavigationContainer>
            {isAuth ? <TabsNavigator /> : <AuthStack />}
        </NavigationContainer>
    );
}
