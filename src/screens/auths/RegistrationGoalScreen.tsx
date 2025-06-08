import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';

const GOAL_OPTIONS = [
    { key: 'lose_weight', label: 'Kilo Vermek' },
    { key: 'stay_healthy', label: 'Sağlıklı Kalmak' },
    { key: 'gain_muscle', label: 'Kas Kazanmak' },
];

export default function RegistrationGoalScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    const [localGoal, setLocalGoal] = useState(() =>
        useAppStore.getState().registrationForm.goal
    );

    const handleContinue = () => {
        if (!localGoal) {
            Alert.alert('Eksik Bilgi', 'Lütfen bir hedef seçin.');
            return;
        }
        setRegistrationFormField('goal', localGoal);

        navigation.navigate('RegistrationActivityLevel' as never);
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
    }, [navigation, localGoal]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black items-center p-6`}>
            <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                Hedefin nedir?
            </Text>

            {GOAL_OPTIONS.map((option) => (
                <Pressable
                    key={option.key}
                    onPress={() => setLocalGoal(option.label)}
                    style={tw`w-full rounded-lg p-5 mb-4 border-2 ${localGoal === option.label ? 'border-accent-gold bg-accent-gold/20' : 'border-slate-700'}`}
                >
                    <Text style={tw`text-white text-lg text-center`}>{option.label}</Text>
                </Pressable>
            ))}
        </SafeAreaView>
    );
}