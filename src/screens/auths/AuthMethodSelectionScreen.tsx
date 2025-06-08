import { useEffect } from 'react'; // EKLENDİ
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable, View, Alert } from 'react-native';
import tw from '../../theme/tw';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore'; // EKLENDİ

export default function AuthMethodSelectionScreen() {
    const navigation = useNavigation();
    const resetRegistrationForm = useAppStore((s) => s.resetRegistrationForm); // EKLENDİ

    // --- YENİ EKLENEN BÖLÜM ---
    // Bu useEffect, bu ekran her açıldığında değil,
    // sadece ekrandan ÇIKILDIĞINDA çalışacak bir temizlik fonksiyonu ayarlar.
    useEffect(() => {
        // Bu fonksiyon, component unmount olduğunda (ekrandan kaldırıldığında) çalışır.
        return () => {
            resetRegistrationForm();
        };
    }, []);
    // --- YENİ BÖLÜM SONU ---


    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black items-center justify-between p-6`}>
            {/* ... dosyanın geri kalanı aynı ... */}
            <View style={tw`w-full items-center`}>
                <Pressable onPress={() => navigation.goBack()} style={tw`self-start mb-10`}>
                    <AntDesign name="left" size={24} color={tw.color('platinum-gray')} />
                </Pressable>

                <Text style={tw`text-platinum-gray text-3xl font-bold text-center mb-12`}>Create an account</Text>

                <Pressable
                    onPress={() => navigation.navigate('RegistrationName' as never)}
                    style={tw`bg-green-500 w-full py-4 rounded-lg items-center justify-center mb-4`}
                >
                    <Text style={tw`text-white text-lg font-bold`}>Use Email</Text>
                </Pressable>

                <Pressable
                    onPress={() => Alert.alert('Çok Yakında!', 'Apple ile devam etme özelliği geliştirme aşamasındadır.')}
                    style={tw`bg-white w-full py-4 rounded-lg items-center justify-center flex-row mb-4`}
                >
                    <AntDesign name="apple1" size={24} color="black" style={tw`mr-2`} />
                    <Text style={tw`text-black text-lg font-bold`}>Continue with Apple</Text>
                </Pressable>

                <Pressable
                    onPress={() => Alert.alert('Çok Yakında!', 'Google ile devam etme özelliği geliştirme aşamasındadır.')}
                    style={tw`bg-blue-600 w-full py-4 rounded-lg items-center justify-center flex-row`}
                >
                    <AntDesign name="google" size={24} color="white" style={tw`mr-2`} />
                    <Text style={tw`text-white text-lg font-bold`}>Continue with Google</Text>
                </Pressable>
            </View>

            <View style={tw`flex-row`}>
                <Text style={tw`text-slate-gray`}>Got an account? </Text>
                <Pressable onPress={() => navigation.navigate('Login' as never)}>
                    <Text style={tw`text-accent-gold font-bold`}>Sign in</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}