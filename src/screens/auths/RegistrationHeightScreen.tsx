import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';

export default function RegistrationHeightScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    const [localHeight, setLocalHeight] = useState(() =>
        useAppStore.getState().registrationForm.height
    );

    const handleContinue = () => {
        if (!localHeight.trim() || isNaN(Number(localHeight)) || Number(localHeight) <= 50) {
            Alert.alert('Geçersiz Değer', 'Lütfen geçerli bir boy değeri girin (cm cinsinden).');
            return;
        }
        setRegistrationFormField('height', localHeight.trim());

        navigation.navigate('RegistrationGoal' as never);
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
    }, [navigation, localHeight]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <Pressable style={tw`flex-1 items-center p-6`} onPress={Keyboard.dismiss}>
                <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                    Boyunuz ne kadar?
                </Text>

                <View style={tw`flex-row items-baseline justify-center`}>
                    <TextInput
                        value={localHeight}
                        onChangeText={setLocalHeight}
                        style={tw`text-white text-6xl font-bold w-40 text-center`}
                        keyboardType="number-pad"
                        maxLength={3}
                        autoFocus={true}
                    />
                    <Text style={tw`text-slate-400 text-2xl font-semibold ml-2`}>cm</Text>
                </View>
            </Pressable>
        </SafeAreaView>
    );
}