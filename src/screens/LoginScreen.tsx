// src/screens/LoginScreen.tsx
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable } from 'react-native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { useAppStore } from '../store/useAppStore';

export default function LoginScreen() {
    const loginDone = useAppStore((s) => s.login);
    const [u, setU] = useState('');
    const [p, setP] = useState('');

    const onLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email: u,
            password: p,
        });
        if (!error) loginDone();
        else alert(error.message);
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

            <Pressable onPress={onLogin} style={tw`bg-accent-gold px-6 py-3 rounded-lg w-full mt-4`}>
                <Text style={tw`text-premium-black text-center font-medium`}>Giriş Yap</Text>
            </Pressable>
        </SafeAreaView>
    );
}
