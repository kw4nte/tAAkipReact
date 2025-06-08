import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';

const ACTIVITY_OPTIONS = [
    { key: 'sedentary', label: 'Hareketsiz (Ofis işi)' },
    { key: 'light', label: 'Az Aktif (Hafif egzersiz)' },
    { key: 'moderate', label: 'Aktif (Orta düzey egzersiz)' },
    { key: 'active', label: 'Çok Aktif (Yoğun egzersiz)' },
];

export default function RegistrationActivityLevelScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    const [localActivityLevel, setLocalActivityLevel] = useState(() =>
        useAppStore.getState().registrationForm.activityLevel
    );

    const handleContinue = () => {
        if (!localActivityLevel) {
            Alert.alert('Eksik Bilgi', 'Lütfen aktivite seviyenizi seçin.');
            return;
        }
        setRegistrationFormField('activityLevel', localActivityLevel);

        navigation.navigate('RegistrationEmail' as never);
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
    }, [navigation, localActivityLevel]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black items-center p-6`}>
            <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                Aktivite seviyen nasıl?
            </Text>

            {ACTIVITY_OPTIONS.map((option) => (
                <Pressable
                    key={option.key}
                    onPress={() => setLocalActivityLevel(option.key)}
                    style={tw`w-full rounded-lg p-5 mb-4 border-2 ${localActivityLevel === option.key ? 'border-accent-gold bg-accent-gold/20' : 'border-slate-700'}`}
                >
                    <Text style={tw`text-white text-lg text-center`}>{option.label}</Text>
                </Pressable>
            ))}
        </SafeAreaView>
    );
}