import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';

const EMAIL_REGEX = /\S+@\S+\.\S+/;

export default function RegistrationEmailScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    const [localEmail, setLocalEmail] = useState(() =>
        useAppStore.getState().registrationForm.email
    );

    const handleContinue = () => {
        const cleanedEmail = localEmail.trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanedEmail)) {
            Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.');
            return;
        }
        setRegistrationFormField('email', cleanedEmail);

        navigation.navigate('RegistrationPassword' as never);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
                <Pressable onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={24} color={tw.color('platinum-gray')} />
                </Pressable>
            ),
            headerRight: () => (
                <Pressable onPress={handleContinue}>
                    <Text style={tw`text-accent-gold font-bold text-lg`}>Devam</Text>
                </Pressable>
            ),
        });
    }, [navigation, localEmail]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <Pressable style={tw`flex-1 items-center p-6`} onPress={Keyboard.dismiss}>
                <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                    E-posta adresin nedir?
                </Text>

                <TextInput
                    placeholder="ornek@mail.com"
                    placeholderTextColor="#666"
                    value={localEmail}
                    onChangeText={setLocalEmail}
                    style={[
                        tw`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 text-white text-lg`,
                        { height: 50, textAlignVertical: 'center' } // Dikey hizalama için
                    ]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus={true}
                />
            </Pressable>
        </SafeAreaView>
    );
}