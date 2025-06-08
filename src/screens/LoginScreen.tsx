import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, View, Alert } from 'react-native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { useAppStore } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native'; // EKLENDİ

export default function LoginScreen() {
    const navigation = useNavigation(); // EKLENDİ
    const loginDone = useAppStore((s) => s.login);
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [loading, setLoading] = useState(false); // EKLENDİ

    const onLogin = async () => {
        if (loading) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: u,
            password: p,
        });

        if (error) {
            Alert.alert('Giriş Hatası', error.message);
        }
        // Başarılı girişte App.tsx'teki onAuthStateChange zaten loginDone() çağıracak.
        setLoading(false);
    };

    return (
        <SafeAreaView style={tw`flex-1 items-center justify-start bg-premium-black p-6 pt-12`}>
            <Text style={tw`text-accent-gold text-2xl mb-6`}>Giriş Yap</Text>

            <TextInput
                placeholder="E-posta"
                placeholderTextColor="#666"
                value={u}
                onChangeText={setU}
                style={tw`w-full border border-slate-gray rounded-lg px-3 py-2 mb-4 text-platinum-gray`}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                placeholder="Şifre"
                placeholderTextColor="#666"
                secureTextEntry
                value={p}
                onChangeText={setP}
                style={tw`w-full border border-slate-gray rounded-lg px-3 py-2 mb-6 text-platinum-gray`}
            />

            <Pressable
                onPress={onLogin}
                style={tw`bg-accent-gold px-6 py-3 rounded-lg w-full mt-4`}
                disabled={loading}
            >
                <Text style={tw`text-premium-black text-center font-medium`}>Giriş Yap</Text>
            </Pressable>

            {/* --- YENİ EKLENEN BÖLÜM --- */}
            <View style={tw`flex-row mt-8`}>
                <Text style={tw`text-slate-gray`}>Hesabın yok mu? </Text>
                <Pressable onPress={() => navigation.navigate('AuthMethodSelection' as never)}>
                    <Text style={tw`text-accent-gold font-bold`}>Kayıt Ol</Text>
                </Pressable>
            </View>
            {/* --- YENİ BÖLÜM SONU --- */}
        </SafeAreaView>
    );
}