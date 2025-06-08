import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';
// Bu sefer 'shallow' importuna gerek yok.

export default function RegistrationNameScreen() {
    const navigation = useNavigation();

    // --- YENİ YÖNTEM ---
    // 1. Sadece state'i GÜNCELLEYECEK olan fonksiyonu seçiyoruz.
    // Fonksiyonlar stabildir ve gereksiz render'a sebep olmaz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerlerini SADECE BİR KERE okumak için store'un 'getState' metodunu kullanıyoruz.
    // Bu, bileşeni bu değerlerin değişimine abone yapmaz, sadece ilk değeri alır.
    const [localFirstName, setLocalFirstName] = useState(() =>
        useAppStore.getState().registrationForm.firstName
    );
    const [localLastName, setLocalLastName] = useState(() =>
        useAppStore.getState().registrationForm.lastName
    );

    const handleContinue = () => {
        if (!localFirstName.trim() || !localLastName.trim()) {
            Alert.alert('Eksik Bilgi', 'Lütfen isim ve soyisim alanlarını doldurun.');
            return;
        }
        // State'i güncellemek için daha önce çektiğimiz fonksiyonu kullanıyoruz.
        setRegistrationFormField('firstName', localFirstName.trim());
        setRegistrationFormField('lastName', localLastName.trim());

        navigation.navigate('RegistrationGender' as never);
    };

    // Bu kısım aynı kalabilir, bir sorun teşkil etmiyor.
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
    }, [navigation, localFirstName, localLastName]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <Pressable style={tw`flex-1 items-center p-6`} onPress={Keyboard.dismiss}>
                <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                    İsminiz ve soyisminiz?
                </Text>

                <TextInput
                    placeholder="İsim"
                    placeholderTextColor="#666"
                    value={localFirstName}
                    onChangeText={setLocalFirstName}
                    style={tw`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 mb-4 text-white text-lg`}
                />
                <TextInput
                    placeholder="Soyisim"
                    placeholderTextColor="#666"
                    value={localLastName}
                    onChangeText={setLocalLastName}
                    style={tw`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg`}
                />
            </Pressable>
        </SafeAreaView>
    );
}