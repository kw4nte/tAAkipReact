import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';

export default function RegistrationGenderScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    const [localGender, setLocalGender] = useState(() =>
        useAppStore.getState().registrationForm.gender
    );

    const handleContinue = () => {
        if (!localGender) {
            Alert.alert('Eksik Bilgi', 'Lütfen cinsiyetinizi seçin.');
            return;
        }
        setRegistrationFormField('gender', localGender);

        navigation.navigate('RegistrationBirthday' as never);
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
    }, [navigation, localGender]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black items-center p-6`}>
            <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                Cinsiyetiniz?
            </Text>

            <Pressable
                onPress={() => setLocalGender('male')}
                style={tw`w-full rounded-lg p-5 mb-4 border-2 ${localGender === 'male' ? 'border-accent-gold bg-accent-gold/20' : 'border-slate-700'}`}
            >
                <Text style={tw`text-white text-lg text-center`}>Erkek</Text>
            </Pressable>

            <Pressable
                onPress={() => setLocalGender('female')}
                style={tw`w-full rounded-lg p-5 border-2 ${localGender === 'female' ? 'border-accent-gold bg-accent-gold/20' : 'border-slate-700'}`}
            >
                <Text style={tw`text-white text-lg text-center`}>Kadın</Text>
            </Pressable>
        </SafeAreaView>
    );
}