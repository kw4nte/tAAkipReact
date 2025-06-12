// src/screens/UserProfileScreen.tsx

import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supa';
import tw from '../theme/tw';

// Profil verisinin tip tanımı
interface Profile {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
}

export default function UserProfileScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { userId } = route.params as { userId: string };

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false); // Ben bu kullanıcıyı takip ediyor muyum?
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchProfileData = useCallback(async () => {
        setLoading(true);

        // Mevcut giriş yapmış kullanıcının ID'sini al
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }
        setCurrentUserId(user.id);

        // Ziyaret edilen profilin bilgilerini çek
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, first_name, last_name, avatar_url')
            .eq('id', userId)
            .single();

        if (profileError || !profileData) {
            Alert.alert('Hata', 'Kullanıcı profili bulunamadı.');
            navigation.goBack();
            return;
        }
        setProfile(profileData);

        // Takipçi sayısını çek
        const { count: followers } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId);
        setFollowerCount(followers ?? 0);

        // Takip edilen sayısını çek
        const { count: following } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
        setFollowingCount(following ?? 0);

        // Ben bu kullanıcıyı takip ediyor muyum?
        const { count: isFollowingStatus } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id).eq('following_id', userId);
        setIsFollowing((isFollowingStatus ?? 0) > 0);

        setLoading(false);
    }, [userId, navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchProfileData();
        }, [fetchProfileData])
    );

    // Takip Etme fonksiyonu
    const handleFollow = async () => {
        if (!currentUserId) return;
        setIsFollowing(true); // Arayüzü anında güncelle
        setFollowerCount(prev => prev + 1);

        const { error } = await supabase.from('followers').insert({
            follower_id: currentUserId,
            following_id: userId,
        });

        if (error) {
            setIsFollowing(false); // Hata olursa geri al
            setFollowerCount(prev => prev - 1);
            Alert.alert('Hata', 'Takip etme işlemi başarısız oldu.');
        }
    };

    // Takipten Çıkma fonksiyonu
    const handleUnfollow = async () => {
        if (!currentUserId) return;
        setIsFollowing(false); // Arayüzü anında güncelle
        setFollowerCount(prev => prev - 1);

        const { error } = await supabase.from('followers').delete().match({
            follower_id: currentUserId,
            following_id: userId,
        });

        if (error) {
            setIsFollowing(true); // Hata olursa geri al
            setFollowerCount(prev => prev + 1);
            Alert.alert('Hata', 'Takipten çıkma işlemi başarısız oldu.');
        }
    };


    if (loading || !profile) {
        return <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}><ActivityIndicator color="#ffd700" /></SafeAreaView>;
    }

    const isOwnProfile = currentUserId === userId;

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <View style={tw`p-4 items-center`}>
                <Image
                    source={{ uri: profile.avatar_url || 'https://default-avatar-url.com/default.png' }}
                    style={tw`w-24 h-24 rounded-full mb-4 border-2 border-accent-gold`}
                />
                <Text style={tw`text-white text-2xl font-bold`}>{profile.first_name} {profile.last_name}</Text>
                <Text style={tw`text-slate-400 text-lg mb-4`}>@{profile.username}</Text>

                <View style={tw`flex-row justify-around w-full mb-6`}>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white font-bold text-xl`}>{/* Post sayısı eklenebilir */ 0}</Text>
                        <Text style={tw`text-slate-400`}>Gönderi</Text>
                    </View>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white font-bold text-xl`}>{followerCount}</Text>
                        <Text style={tw`text-slate-400`}>Takipçi</Text>
                    </View>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white font-bold text-xl`}>{followingCount}</Text>
                        <Text style={tw`text-slate-400`}>Takip</Text>
                    </View>
                </View>

                {!isOwnProfile && (
                    isFollowing ? (
                        <Pressable onPress={handleUnfollow} style={tw`bg-slate-700 w-full py-3 rounded-lg`}>
                            <Text style={tw`text-white text-center font-bold`}>Takipten Çık</Text>
                        </Pressable>
                    ) : (
                        <Pressable onPress={handleFollow} style={tw`bg-accent-gold w-full py-3 rounded-lg`}>
                            <Text style={tw`text-premium-black text-center font-bold`}>Takip Et</Text>
                        </Pressable>
                    )
                )}
            </View>
            {/* Buraya kullanıcının postlarının listesi eklenebilir */}
        </SafeAreaView>
    );
}