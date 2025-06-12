import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Mevcut ekran
import LoginScreen from '../screens/LoginScreen';

// Yeni eklenecek ekranlar (Bu dosyaları sonraki adımlarda tek tek oluşturacağız)
import AuthMethodSelectionScreen from '../screens/auths/AuthMethodSelectionScreen';
import RegistrationNameScreen from '../screens/auths/RegistrationNameScreen';
import RegistrationGenderScreen from '../screens/auths/RegistrationGenderScreen';
import RegistrationBirthdayScreen from '../screens/auths/RegistrationBirthdayScreen';
import RegistrationWeightScreen from '../screens/auths/RegistrationWeightScreen';
import RegistrationHeightScreen from '../screens/auths/RegistrationHeightScreen';
import RegistrationGoalScreen from '../screens/auths/RegistrationGoalScreen';
import RegistrationActivityLevelScreen from '../screens/auths/RegistrationActivityLevelScreen';
import RegistrationEmailScreen from '../screens/auths/RegistrationEmailScreen';
import RegistrationPasswordScreen from '../screens/auths/RegistrationPasswordScreen';
import RegistrationUsernameScreen from '../screens/auths/RegistrationUsernameScreen';


const Stack = createNativeStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator
            // Header'ı varsayılan olarak tüm ekranlar için kapalı tutuyoruz.
            // Kayıt ekranları, kendi başlıklarını (Geri/Devam butonları) kendileri yönetecek.
            screenOptions={{ headerShown: false }}
        >
            {/* Mevcut Giriş Ekranı */}
            <Stack.Screen name="Login" component={LoginScreen} />

            {/* Yeni Kayıt Akışı Ekranları */}
            <Stack.Screen name="AuthMethodSelection" component={AuthMethodSelectionScreen} />
            <Stack.Screen name="RegistrationName" component={RegistrationNameScreen} />
            <Stack.Screen name="RegistrationGender" component={RegistrationGenderScreen} />
            <Stack.Screen name="RegistrationBirthday" component={RegistrationBirthdayScreen} />
            <Stack.Screen name="RegistrationWeight" component={RegistrationWeightScreen} />
            <Stack.Screen name="RegistrationHeight" component={RegistrationHeightScreen} />
            <Stack.Screen name="RegistrationGoal" component={RegistrationGoalScreen} />
            <Stack.Screen name="RegistrationActivityLevel" component={RegistrationActivityLevelScreen} />
            <Stack.Screen name="RegistrationEmail" component={RegistrationEmailScreen} />
            <Stack.Screen name="RegistrationPassword" component={RegistrationPasswordScreen} />
            <Stack.Screen name="RegistrationUsername" component={RegistrationUsernameScreen} />
        </Stack.Navigator>
    );
}
