// src/screens/ProfileScreen.tsx
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';
import { useAppStore } from '../store/useAppStore';

export default function ProfileScreen() {
    const navigation = useNavigation();
    const logoutStore = useAppStore((s) => s.logout);
    const [profile, setProfile] = useState<{ full_name: string; daily_target: number } | null>(null);

    useEffect(() => {
        (async () => {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('full_name, daily_target')
                .eq('id', user.id)
                .single();
            if (data) {
                setProfile({ full_name: data.full_name || '', daily_target: data.daily_target || 0 });
            }
        })();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        logoutStore();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center p-4`}>
            {/* Profil Fotoğrafı */}
            <View style={tw`w-32 h-32 rounded-full bg-slate-gray mb-4`} />

            {/* İsim */}
            <Text style={tw`text-accent-gold text-2xl mb-2`}>
                {profile?.full_name || 'Kullanıcı İsmi'}
            </Text>

            {/* Günlük Hedef */}
            <Text style={tw`text-platinum-gray text-lg mb-6`}>
                Günlük Hedef: {profile?.daily_target || 0} kcal
            </Text>

            {/* Profil Düzenle Butonu */}
            <Pressable
                onPress={() => navigation.navigate('ProfileEdit' as never)}
                style={tw`bg-soft-black px-6 py-3 rounded-lg w-full mb-4`}
            >
                <Text style={tw`text-accent-gold text-center font-medium`}>Profili Düzenle</Text>
            </Pressable>

            {/* Çıkış Yap */}
            <PrimaryButton onPress={signOut}>Çıkış Yap</PrimaryButton>
        </SafeAreaView>
    );
}
