// src/screens/UserProfileScreen.tsx (Nihai Sürüm)

import { useState, useCallback } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supa';
import tw from '../theme/tw';
import PostItem from '../components/PostItem';
import { useAppStore } from '../store/useAppStore';



// Tipler
interface Profile { id: string; username: string; first_name: string; last_name: string; avatar_url: string | null; }
interface Post { id: number; user_id: string; content: string; media_url: string | null; created_at: string; first_name: string | null; last_name: string | null; avatar_url: string | null; likes_count: number; comments_count: number; is_liked_by_user: boolean; has_commented_by_user: boolean; }

export default function UserProfileScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { userId } = route.params as { userId: string };

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const currentUserId = useAppStore((s) => s.userProfile?.id);


    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !userId) { setLoading(false); return; }

        // DÜZELTME: Kendi profiline yönlendirme mantığı buradan kaldırıldı.

        const profilePromise = supabase.from('profiles').select('id, username, first_name, last_name, avatar_url').eq('id', userId).single();
        const followersPromise = supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId);
        const followingPromise = supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
        const isFollowingPromise = supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id).eq('following_id', userId);

        // DÜZELTME: Postları, tüm zengin verileriyle birlikte özel RPC fonksiyonu ile çekiyoruz.
        const postsPromise = supabase.rpc('get_posts_for_user', { profile_id: userId });

        const [{ data: profileData, error: profileError }, { count: followers }, { count: following }, { count: isFollowingStatus }, { data: postData, error: postError }] = await Promise.all([
            profilePromise, followersPromise, followingPromise, isFollowingPromise, postsPromise
        ]);

        if (profileError || !profileData) { Alert.alert('Hata', 'Kullanıcı profili bulunamadı.'); navigation.goBack(); return; }
        if (postError) console.error("Post çekme hatası:", postError.message);

        setProfile(profileData);
        setFollowerCount(followers ?? 0);
        setFollowingCount(following ?? 0);
        setIsFollowing((isFollowingStatus ?? 0) > 0);
        setPosts(postData as Post[] ?? []);
        setLoading(false);
    }, [userId, navigation]);

    useFocusEffect(
        useCallback(() => {
            // Bu yapı, effect'in kendisinin async olmasını engeller
            fetchProfileData();
        }, [fetchProfileData])
    );


    const handleFollow = async () => {
        if (!currentUserId) return;
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        const { error } = await supabase.from('followers').insert({ follower_id: currentUserId, following_id: userId });
        if (error) {
            setIsFollowing(false);
            setFollowerCount(prev => prev - 1);
            Alert.alert('Hata', 'Takip etme işlemi başarısız oldu.');
        }
    };

    const handleUnfollow = async () => {
        if (!currentUserId) return;
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        const { error } = await supabase.from('followers').delete().match({ follower_id: currentUserId, following_id: userId });
        if (error) {
            setIsFollowing(true);
            setFollowerCount(prev => prev + 1);
            Alert.alert('Hata', 'Takipten çıkma işlemi başarısız oldu.');
        }
    };

    const handleDeletePost = (deletedPostId: number) => setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));

    const handleToggleLike = (postId: number) => {
        setPosts(currentPosts =>
            currentPosts.map(p => {
                if (p.id === postId) {
                    const currentlyLiked = p.is_liked_by_user;
                    const newLikeCount = currentlyLiked ? p.likes_count - 1 : p.likes_count + 1;
                    return { ...p, is_liked_by_user: !currentlyLiked, likes_count: newLikeCount };
                }
                return p;
            })
        );
        // Arka planda Supabase'i güncelleme mantığı (FeedScreen'deki gibi) buraya da eklenebilir.
    };

    const navigateToProfile = (profileId: string) => {
        // Zaten bir profil sayfasındayken başka birine gitmek için 'push' kullanılır.
        navigation.dispatch({ type: 'PUSH', payload: { name: 'UserProfile', params: { userId: profileId } } });
    };


    if (loading || !profile) {
        return <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}><ActivityIndicator color="#ffd700" /></SafeAreaView>;
    }

    const isOwnProfile = currentUserId === userId;


    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <>
                        <View style={tw`p-4 items-center`}>
                            <Image source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.first_name}`}} style={tw`w-24 h-24 rounded-full mb-4 border-2 border-accent-gold`} />
                            <Text style={tw`text-white text-2xl font-bold`}>{profile.first_name} {profile.last_name}</Text>
                            <Text style={tw`text-slate-400 text-lg mb-4`}>@{profile.username}</Text>

                            <View style={tw`flex-row justify-around w-full mb-6`}>
                                <View style={tw`items-center`}><Text style={tw`text-white font-bold text-xl`}>{posts.length}</Text><Text style={tw`text-slate-400`}>Gönderi</Text></View>
                                <Pressable onPress={() => navigation.dispatch({ type: 'PUSH', payload: { name: 'FollowList', params: { userId: profile.id, mode: 'followers', initialUsername: profile.username } } })} style={tw`items-center`}><Text style={tw`text-white font-bold text-xl`}>{followerCount}</Text><Text style={tw`text-slate-400`}>Takipçi</Text></Pressable>
                                <Pressable onPress={() => navigation.dispatch({ type: 'PUSH', payload: { name: 'FollowList', params: { userId: profile.id, mode: 'following', initialUsername: profile.username } } })} style={tw`items-center`}><Text style={tw`text-white font-bold text-xl`}>{followingCount}</Text><Text style={tw`text-slate-400`}>Takip</Text></Pressable>
                            </View>

                            <View style={tw`w-full`}>
                                {!isOwnProfile && ( isFollowing ?
                                        (<Pressable onPress={handleUnfollow} style={tw`bg-slate-700 py-3 rounded-lg`}><Text style={tw`text-white text-center font-bold`}>Takipten Çık</Text></Pressable>) :
                                        (<Pressable onPress={handleFollow} style={tw`bg-accent-gold py-3 rounded-lg`}><Text style={tw`text-premium-black text-center font-bold`}>Takip Et</Text></Pressable>)
                                )}
                            </View>
                        </View>
                        {posts.length > 0 && <Text style={tw`text-white text-xl font-bold px-4 mb-2`}>Gönderiler</Text>}
                    </>
                }
                renderItem={({ item }) => (
                    <PostItem
                        post={item}
                        currentUserId={currentUserId}
                        onDelete={handleDeletePost}
                        onToggleLike={() => handleToggleLike(item.id)}
                        onOpenComments={() => { /* Yorum modalı burada da açılabilir */ }}
                        onNavigateToProfile={navigateToProfile}
                    />
                )}
                ListEmptyComponent={<View style={tw`pt-4 items-center`}><Text style={tw`text-slate-400`}>Henüz gönderi yok.</Text></View>}
            />
        </SafeAreaView>
    );
        }



