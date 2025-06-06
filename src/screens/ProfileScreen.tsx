// src/screens/ProfileScreen.tsx
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, Image, Pressable, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';
import { useAppStore } from '../store/useAppStore';

interface Profile {
    id: string;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    age: number | null;
    email: string | null;
    account_type: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    created_at: string;
}

export default function ProfileScreen() {
    const navigation = useNavigation();
    const logoutStore = useAppStore((s) => s.logout);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (!isFocused) return;
        (async () => {
            setLoading(true);
            const {
                data: { user },
                error: authErr,
            } = await supabase.auth.getUser();
            if (authErr || !user) {
                // Kullanıcı oturumu yoksa (örneğin zaman aşımına uğramışsa) anasayfaya veya login ekranına yönlendirebilirsiniz.
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
                logoutStore();
                return;
            }

            // "profiles" tablosundan yeni şemaya göre tüm gerekli alanları çektik:
            const { data, error } = await supabase
                .from<Profile>('profiles')
                .select(`
          id,
          avatar_url,
          first_name,
          last_name,
          gender,
          age,
          email,
          account_type,
          weight_kg,
          height_cm,
          created_at
        `)
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Profil yükleme hatası:', error.message);
                Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
            } else {
                setProfile(data);
            }
            setLoading(false);
        })();
    }, [isFocused]);

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Çıkış hatası:', error.message);
            Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
            return;
        }
        logoutStore();
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}>
                <Text style={tw`text-platinum-gray text-lg`}>Profil bilgileri yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    // Eğer profile null ise:
    if (!profile) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center p-4`}>
                <Text style={tw`text-platinum-gray text-lg mb-4`}>
                    Profil bulunamadı. Lütfen tekrar deneyin.
                </Text>
                <PrimaryButton onPress={() => navigation.navigate('Login' as never)}>
                    Giriş Yap
                </PrimaryButton>
            </SafeAreaView>
        );
    }

    // fullName oluştur
    const fullName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black justify-start items-center p-4`}>
            {/* 1) Profil Fotoğrafı */}
            <View style={tw`mb-6`}>
                {profile.avatar_url ? (
                    <Image
                        source={{ uri: profile.avatar_url }}
                        style={tw`w-32 h-32 rounded-full`}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={tw`w-32 h-32 rounded-full bg-slate-gray justify-center items-center`}>
                        <Text style={tw`text-platinum-gray`}>Fotoğraf Yok</Text>
                    </View>
                )}
            </View>

            {/* 2) İsim */}
            <Text style={tw`text-accent-gold text-2xl mb-2`}>
                {fullName || 'Kullanıcı İsmi'}
            </Text>

            {/* 3) E-mail */}
            <Text style={tw`text-platinum-gray text-base mb-4`}>
                {profile.email ?? ''}
            </Text>

            {/* 4) Diğer Profil Bilgileri: */}
            <View style={tw`w-full mb-6`}>
                {/* Account Type */}
                <View style={tw`flex-row mb-2`}>
                    <Text style={tw`text-accent-gold w-32`}>Hesap Tipi:</Text>
                    <Text style={tw`text-platinum-gray`}>{profile.account_type ?? '-'}</Text>
                </View>

                {/* Cinsiyet */}
                <View style={tw`flex-row mb-2`}>
                    <Text style={tw`text-accent-gold w-32`}>Cinsiyet:</Text>
                    <Text style={tw`text-platinum-gray`}>{profile.gender ?? '-'}</Text>
                </View>

                {/* Yaş */}
                <View style={tw`flex-row mb-2`}>
                    <Text style={tw`text-accent-gold w-32`}>Yaş:</Text>
                    <Text style={tw`text-platinum-gray`}>{profile.age != null ? profile.age : '-'}</Text>
                </View>

                {/* Kilo */}
                <View style={tw`flex-row mb-2`}>
                    <Text style={tw`text-accent-gold w-32`}>Kilo (kg):</Text>
                    <Text style={tw`text-platinum-gray`}>
                        {profile.weight_kg != null ? profile.weight_kg : '-'}
                    </Text>
                </View>

                {/* Boy */}
                <View style={tw`flex-row mb-2`}>
                    <Text style={tw`text-accent-gold w-32`}>Boy (cm):</Text>
                    <Text style={tw`text-platinum-gray`}>
                        {profile.height_cm != null ? profile.height_cm : '-'}
                    </Text>
                </View>

                {/* Hesap Oluşturulma Tarihi */}
                <View style={tw`flex-row mb-2`}>
                    <Text style={tw`text-accent-gold w-32`}>Oluşturulma:</Text>
                    <Text style={tw`text-platinum-gray`}>
                        {profile.created_at
                            ? new Date(profile.created_at).toLocaleDateString()
                            : '-'}
                    </Text>
                </View>
            </View>

            {/* 5) Profili Düzenle Butonu */}
            <Pressable
                onPress={() => navigation.navigate('ProfileEdit' as never)}
                style={tw`bg-soft-black px-6 py-3 rounded-lg w-full mb-4`}
            >
                <Text style={tw`text-accent-gold text-center font-medium`}>Profili Düzenle</Text>
            </Pressable>

            {/* 6) Çıkış Yap Butonu */}
            <PrimaryButton onPress={signOut} style={tw`w-full`}>
                Çıkış Yap
            </PrimaryButton>
        </SafeAreaView>
    );
}
