import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';

export default function RegistrationWeightScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    const [localWeight, setLocalWeight] = useState(() =>
        useAppStore.getState().registrationForm.weight
    );

    const handleContinue = () => {
        if (!localWeight.trim() || isNaN(Number(localWeight)) || Number(localWeight) <= 20) {
            Alert.alert('Geçersiz Değer', 'Lütfen geçerli bir kilo değeri girin.');
            return;
        }
        setRegistrationFormField('weight', localWeight.trim());

        navigation.navigate('RegistrationHeight' as never);
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
    }, [navigation, localWeight]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <Pressable style={tw`flex-1 items-center p-6`} onPress={Keyboard.dismiss}>
                <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                    Mevcut kilonuz nedir?
                </Text>

                <View style={tw`flex-row items-baseline justify-center`}>
                    <TextInput
                        value={localWeight}
                        onChangeText={setLocalWeight}
                        style={tw`text-white text-6xl font-bold w-40 text-center`}
                        keyboardType="number-pad"
                        maxLength={3}
                        autoFocus={true}
                    />
                    <Text style={tw`text-slate-400 text-2xl font-semibold ml-2`}>kg</Text>
                </View>
            </Pressable>
        </SafeAreaView>
    );
}