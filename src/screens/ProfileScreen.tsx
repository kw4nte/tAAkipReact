// src/screens/ProfileScreen.tsx (Nihai ve Tüm Düzeltmeleri İçeren Sürüm)

import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, Image, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { useAppStore } from '../store/useAppStore';
import PostItem from '../components/PostItem';
import CommentsModal from '../components/CommentsModal';


interface Post { id: number; user_id: string; content: string; media_url: string | null; created_at: string; first_name: string | null; last_name: string | null; avatar_url: string | null; likes_count: number; comments_count: number; is_liked_by_user: boolean; has_commented_by_user: boolean; }

export default function ProfileScreen() {
    const navigation = useNavigation();
    const logoutStore = useAppStore((s) => s.logout);
    const userProfile = useAppStore((s) => s.userProfile);

    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activePost, setActivePost] = useState<{ id: number; ownerId: string } | null>(null);

    const fetchData = useCallback(async () => {
        if (!userProfile) return;
        setLoading(true);

        const followersPromise = supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userProfile.id);
        const followingPromise = supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userProfile.id);
        const postsPromise = supabase.rpc('get_posts_for_user', { profile_id: userProfile.id });

        const [ { count: followers }, { count: following }, { data: postData, error: postError } ] = await Promise.all([followersPromise, followingPromise, postsPromise]);

        if (postError) console.error("Post çekme hatası (ProfileScreen):", postError.message);

        setFollowerCount(followers ?? 0);
        setFollowingCount(following ?? 0);
        setPosts(postData as Post[] ?? []);
        setLoading(false);
    }, [userProfile]);

    // DÜZELTİLMİŞ KULLANIM
    useFocusEffect(
        useCallback(() => {
            // Bu yapı, effect'in kendisinin async olmasını engeller
            fetchData();
        }, [fetchData])
    );

    const signOut = () => {
        supabase.auth.signOut();
        logoutStore();
    };

    const navigateToUserProfile = (profileId: string) => {
        // Kullanıcı kendi profilindeyken kendi ismine tıklarsa bir şey yapma
        if (profileId === userProfile?.id) {
            return;
        }
        // Başka bir profile gitmek için 'push' kullanılır
        navigation.dispatch({ type: 'PUSH', payload: { name: 'UserProfile', params: { userId: profileId } } });
    };

    const handleDeletePost = (deletedPostId: number) => {
        setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));
    };

    if (loading || !userProfile) {
        return <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}><ActivityIndicator color={tw.color('accent-gold')} /></SafeAreaView>;
    }

    const toggleLike = async (postId: number) => {
        if (!userProfile) return;

        const postToUpdate = posts.find(p => p.id === postId);
        if (!postToUpdate) return;

        const currentlyLiked = postToUpdate.is_liked_by_user;
        const newLikeCount = currentlyLiked ? postToUpdate.likes_count - 1 : postToUpdate.likes_count + 1;

        // 1. Arayüzü anında güncelle (Optimistic Update)
        setPosts(currentPosts =>
            currentPosts.map(p =>
                p.id === postId ? { ...p, is_liked_by_user: !currentlyLiked, likes_count: newLikeCount } : p
            )
        );

        // 2. Arka planda veritabanını güncelle
        if (currentlyLiked) {
            await supabase.from('likes').delete().match({ post_id: postId, user_id: userProfile.id });
        } else {
            await supabase.from('likes').insert({ post_id: postId, user_id: userProfile.id });
        }
    };

    const handleCommentAdded = (postId: number) => {
        setPosts(currentPosts =>
            currentPosts.map(p =>
                p.id === postId ? { ...p, comments_count: p.comments_count + 1, has_commented_by_user: true } : p
            )
        );
    };
    const handleModalClose = () => {
        setActivePost(null);
    };

    const fullName = `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim();

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        <View style={tw`flex-row justify-between items-center p-4`}>
                            <Pressable onPress={signOut} style={tw`p-1`}>
                                <Ionicons name="log-out-outline" size={28} color={tw.color('slate-400')} />
                            </Pressable>
                            <Pressable onPress={() => navigation.navigate('ProfileEdit' as never)} style={tw`p-1`}>
                                <Ionicons name="settings-outline" size={26} color={tw.color('slate-400')} />
                            </Pressable>
                        </View>
                        <View style={tw`items-center px-4`}>
                            <Image source={{ uri: userProfile.avatar_url || `https://ui-avatars.com/api/?name=${fullName}` }} style={tw`w-24 h-24 rounded-full`} />
                            <Text style={tw`text-white text-2xl mt-4 font-bold`}>{fullName}</Text>
                            <Text style={tw`text-slate-400 text-lg mb-4`}>@{userProfile.username}</Text>
                        </View>
                        <View style={tw`flex-row justify-around w-full my-4 border-y border-slate-700 py-4`}>
                            {/* Gönderi Sayısı (Tıklanamaz) */}
                            <View style={tw`items-center`}>
                                <Text style={tw`text-white font-bold text-xl`}>{posts.length}</Text>
                                <Text style={tw`text-slate-400`}>Gönderi</Text>
                            </View>

                            {/* Takipçi Sayısı (Tıklanabilir) */}
                            <Pressable onPress={() => navigation.navigate('FollowList' as never, { userId: userProfile.id, mode: 'followers', initialUsername: userProfile.username } as never)} style={tw`items-center`}>
                                <Text style={tw`text-white font-bold text-xl`}>{followerCount}</Text>
                                <Text style={tw`text-slate-400`}>Takipçi</Text>
                            </Pressable>

                            {/* Takip Edilen Sayısı (Tıklanabilir) */}
                            <Pressable onPress={() => navigation.navigate('FollowList' as never, { userId: userProfile.id, mode: 'following', initialUsername: userProfile.username } as never)} style={tw`items-center`}>
                                <Text style={tw`text-white font-bold text-xl`}>{followingCount}</Text>
                                <Text style={tw`text-slate-400`}>Takip</Text>
                            </Pressable>
                        </View>
                        {posts.length > 0 && <Text style={tw`text-white text-xl font-bold px-4 mb-2`}>Gönderiler</Text>}
                    </>
                }
                renderItem={({ item }) => (
                    <PostItem
                        post={item}
                        currentUserId={userProfile.id}
                        onDelete={handleDeletePost}
                        onToggleLike={() => toggleLike(item.id)}
                        onOpenComments={() => setActivePost({ id: item.id, ownerId: item.user_id })}
                        onNavigateToProfile={navigateToUserProfile}
                    />
                )}
                ListEmptyComponent={
                    <View style={tw`pt-4 items-center`}><Text style={tw`text-slate-400`}>Henüz gönderi yok.</Text></View>
                }
            />
            {/* DÜZELTME: Yorumlar modalı JSX'e eklendi */}
            <CommentsModal
                post={activePost}
                visible={!!activePost}
                onClose={handleModalClose}
                onCommentAdded={() => handleCommentAdded(activePost!.id)}
            />
        </SafeAreaView>
    );
}
