// src/screens/FollowListScreen.tsx

import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supa';
import tw from '../theme/tw';

interface ListedProfile {
    id: string;
    username: string;
    avatar_url: string | null;
}

export default function FollowListScreen() {
    const route = useRoute();
    const navigation = useNavigation();

    // Parametreleri alıyoruz: kimin listesi, hangi liste (takipçi/takip) ve başlık için kullanıcı adı
    const { userId, mode, initialUsername } = route.params as { userId: string; mode: 'followers' | 'following', initialUsername: string };

    const [profiles, setProfiles] = useState<ListedProfile[]>([]);
    const [loading, setLoading] = useState(true);

    // Başlığı dinamik olarak ayarla
    useEffect(() => {
        const title = mode === 'followers' ? 'Takipçiler' : 'Takip Edilenler';
        navigation.setOptions({ title: `${initialUsername} - ${title}` });
    }, [navigation, mode, initialUsername]);

    // Veriyi çekme
    useEffect(() => {
        const fetchList = async () => {
            setLoading(true);

            let query;

            if (mode === 'followers') {
                // Bu kullanıcının takipçilerini çek (yani bu kullanıcının ID'sinin 'following_id' olduğu satırlar)
                // ve o satırlardaki 'follower_id'ye ait profil bilgilerini getir.
                query = supabase
                    .from('followers')
                    .select('profiles!follower_id(id, username, avatar_url)')
                    .eq('following_id', userId);
            } else {
                // Bu kullanıcının takip ettiklerini çek (yani bu kullanıcının ID'sinin 'follower_id' olduğu satırlar)
                // ve o satırlardaki 'following_id'ye ait profil bilgilerini getir.
                query = supabase
                    .from('followers')
                    .select('profiles!following_id(id, username, avatar_url)')
                    .eq('follower_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                console.error(`Error fetching ${mode}:`, error);
            } else {
                // Gelen veri iç içe olabilir, onu düzeltelim.
                const fetchedProfiles = data.map((item: any) => item.profiles).filter(Boolean);
                setProfiles(fetchedProfiles);
            }
            setLoading(false);
        };

        fetchList();
    }, [userId, mode]);

    const navigateToUserProfile = (profileId: string) => {
        // Aynı ekranda yeni bir profil açmak için 'push' kullanmak daha iyi bir deneyim sunar
        navigation.dispatch({
            type: 'PUSH',
            payload: {
                name: 'UserProfile',
                params: { userId: profileId },
            },
        });
    };

    if (loading) {
        return <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}><ActivityIndicator color={tw.color('accent-gold')} /></SafeAreaView>;
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList
                data={profiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable onPress={() => navigateToUserProfile(item.id)} style={tw`flex-row items-center p-4 border-b border-slate-800`}>
                        <Image source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.username}&background=random` }} style={tw`w-12 h-12 rounded-full bg-slate-700`} />
                        <Text style={tw`text-white font-bold text-base ml-4`}>@{item.username}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View style={tw`p-10 items-center`}>
                        <Text style={tw`text-slate-400`}>Liste boş.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}