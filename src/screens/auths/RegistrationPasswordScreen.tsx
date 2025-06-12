import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert, Keyboard, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../../lib/supa';

export default function RegistrationPasswordScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece 'reset' aksiyonunu seçiyoruz. Bu stabildir ve render tetiklemez.
    const resetRegistrationForm = useAppStore((s) => s.resetRegistrationForm);

    const [localPassword, setLocalPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateAccount = async () => {
        if (localPassword.length < 6) {
            Alert.alert('Zayıf Şifre', 'Şifreniz en az 6 karakter olmalıdır.');
            return;
        }
        setLoading(true);

        // 2. Tüm form verilerini, sadece ihtiyaç duyulduğu anda, 'getState' ile direkt okuyoruz.
        // Bu, bileşenin form verilerindeki değişikliklere abone olmasını engeller.
        const registrationForm = useAppStore.getState().registrationForm;

        // --- AUTH KULLANICISI OLUŞTURMA ---
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: registrationForm.email,
            password: localPassword,
        });

        if (authError || !authData.user) {
            setLoading(false);
            Alert.alert('Kayıt Hatası', authError?.message || 'Kullanıcı oluşturulamadı, lütfen tekrar deneyin.');
            return;
        }

        // --- PROFİL BİLGİLERİNİ VERİTABANINA EKLEME ---
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            first_name: registrationForm.firstName,
            last_name: registrationForm.lastName,
            username: registrationForm.username,
            date_of_birth: registrationForm.dateOfBirth,
            gender: registrationForm.gender,
            weight_kg: Number(registrationForm.weight),
            height_cm: Number(registrationForm.height),
            goal: registrationForm.goal,
            activity_level: registrationForm.activityLevel,
            account_type: 'free',
        });

        if (profileError) {
            setLoading(false);
            Alert.alert(
                'Profil Oluşturma Hatası',
                'Hesabınız oluşturuldu ancak profil bilgileriniz kaydedilemedi. Lütfen destek ile iletişime geçin. Hata: ' + profileError.message
            );
            return;
        }

        const { error: invokeError } = await supabase.functions.invoke('calculate-user-metrics');
        if (invokeError) {
            // Bu hatayı kullanıcıya göstermek zorunda değiliz,
            // arka planda loglayabiliriz. Profil zaten oluşturuldu.
            console.error('Initial calorie calculation failed:', invokeError.message);
        }

        resetRegistrationForm();
        setLoading(false);
        Alert.alert(
            'Hesap Oluşturuldu!',
            'Kaydınız başarıyla tamamlandı. Lütfen e-postanızı kontrol ederek hesabınızı doğrulayın.'
        );
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
                <Pressable onPress={() => navigation.goBack()} disabled={loading}>
                    <AntDesign name="left" size={24} color={tw.color('platinum-gray')} />
                </Pressable>
            ),
            headerRight: () => null,
        });
    }, [navigation, loading]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <Pressable style={tw`flex-1 items-center p-6`} onPress={Keyboard.dismiss}>
                <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                    Güvenli bir şifre oluşturun
                </Text>

                <TextInput
                    placeholder="En az 6 karakter"
                    placeholderTextColor="#666"
                    value={localPassword}
                    onChangeText={setLocalPassword}
                    style={tw`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg mb-8`}
                    secureTextEntry
                    autoCapitalize="none"
                    autoFocus={true}
                />

                <Pressable
                    onPress={handleCreateAccount}
                    style={tw`bg-accent-gold w-full py-4 rounded-lg items-center justify-center`}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={tw.color('premium-black')} />
                    ) : (
                        <Text style={tw`text-premium-black text-lg font-bold`}>Hesap Oluştur</Text>
                    )}
                </Pressable>
            </Pressable>
        </SafeAreaView>
    );
}