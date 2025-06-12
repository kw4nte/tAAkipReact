// src/screens/RegistrationUsernameScreen.tsx

import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert, Keyboard, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../../lib/supa';

// Kullanıcı adında sadece harf, rakam ve alt çizgiye izin veren kural
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function RegistrationUsernameScreen() {
    const navigation = useNavigation();
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    const [localUsername, setLocalUsername] = useState(() =>
        useAppStore.getState().registrationForm.username
    );
    const [isChecking, setIsChecking] = useState(false); // Kullanıcı adı kontrolü için loading state'i

    const handleContinue = async () => {
        const cleanedUsername = localUsername.trim().toLowerCase();

        // --- Temel Kontroller ---
        if (cleanedUsername.length < 3) {
            Alert.alert('Çok Kısa', 'Kullanıcı adı en az 3 karakter olmalıdır.');
            return;
        }
        if (!USERNAME_REGEX.test(cleanedUsername)) {
            Alert.alert('Geçersiz Karakter', 'Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir.');
            return;
        }

        setIsChecking(true);

        // --- Supabase'de Kullanıcı Adının Benzersizliğini Kontrol Etme ---
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', cleanedUsername)
                .single();

            if (data) { // Eğer data geldiyse, bu kullanıcı adı alınmış demektir.
                Alert.alert('Kullanıcı Adı Alınmış', 'Bu kullanıcı adı başkası tarafından kullanılıyor. Lütfen farklı bir tane seçin.');
                setIsChecking(false);
                return;
            }

            if (error && error.code !== 'PGRST116') { // PGRST116 = "kayıt bulunamadı" hatası, ki bu bizim istediğimiz bir şey.
                throw error;
            }

            // --- Başarılı: State'i güncelle ve sonraki ekrana geç ---
            setRegistrationFormField('username', cleanedUsername);
            navigation.navigate('RegistrationEmail' as never);

        } catch (err: any) {
            Alert.alert('Hata', 'Kullanıcı adı kontrol edilirken bir sorun oluştu.');
        } finally {
            setIsChecking(false);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
                <Pressable onPress={() => navigation.goBack()} disabled={isChecking}>
                    <AntDesign name="left" size={24} color={tw.color('platinum-gray')} />
                </Pressable>
            ),
            headerRight: () => (
                <Pressable onPress={handleContinue} disabled={isChecking}>
                    {isChecking ? (
                        <ActivityIndicator color={tw.color('accent-gold')} />
                    ) : (
                        <Text style={tw`text-accent-gold font-bold text-lg`}>Devam</Text>
                    )}
                </Pressable>
            ),
        });
    }, [navigation, localUsername, isChecking]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <Pressable style={tw`flex-1 items-center p-6`} onPress={Keyboard.dismiss}>
                <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                    Kendine bir kullanıcı adı seç
                </Text>

                <TextInput
                    placeholder="kullanici_adi"
                    placeholderTextColor="#666"
                    value={localUsername}
                    onChangeText={setLocalUsername}
                    style={[
                        tw`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 text-white text-lg`,
                        { height: 50, textAlignVertical: 'center' }
                    ]}
                    autoCapitalize="none"
                    autoFocus={true}
                />
            </Pressable>
        </SafeAreaView>
    );
}