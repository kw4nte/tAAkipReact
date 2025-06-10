// src/screens/FeedScreen.tsx

import { useEffect, useState, useCallback } from 'react';
import {
    SafeAreaView,
    FlatList,
    Image,
    Text,
    Pressable,
    View,
    RefreshControl,
    ScrollView,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import FAB from '../components/FAB';
import CommentsModal from '../components/CommentsModal';


interface Post {
    id: number;
    user_id: string;
    content: string;
    media_url: string | null;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    likes_count: number;
    comments_count: number;
    is_liked_by_user: boolean;
    has_commented_by_user: boolean;
}

export default function FeedScreen() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const nav = useNavigation();
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
    const [activePost, setActivePost] = useState<{ id: number; ownerId: string } | null>(null);


    // 1) Post listesini Supabase'ten çekme fonksiyonu
    const loadPosts = async () => {
        if (!loading) setLoading(true);

        // RPC (Remote Procedure Call) ile fonksiyonu çağırıyoruz
        const { data, error } = await supabase.rpc('get_feed_posts');

        if (error) {
            console.error('Posts load error:', error.message);
            setPosts([]);
        } else {
            // Gelen veri zaten istediğimiz formatta olduğu için ek bir map'leme işlemine gerek yok.
            setPosts(data as Post[] ?? []);
        }
        setLoading(false);
    };

    // 2) Ekran her “focus” olduğunda load() çağrılsın
    useFocusEffect(useCallback(() => { loadPosts(); }, []));useFocusEffect(useCallback(() => { loadPosts(); }, []));


    // 3) Pull-to-refresh için callback
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
    }, []);

    // 4) Like/Unlike işlemi ve ardından listeyi yeniden yükleme
    // YENİDEN YAZILDI: "Optimistic Update" ile anında arayüz güncellemesi
    const toggleLike = async (postId: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Güncellenecek postu ve mevcut durumunu yerel state'ten bul
        const postToUpdate = posts.find(p => p.id === postId);
        if (!postToUpdate) return;

        const currentlyLiked = postToUpdate.is_liked_by_user;
        const newLikeCount = currentlyLiked ? postToUpdate.likes_count - 1 : postToUpdate.likes_count + 1;

        // 2. Arayüzü anında güncelle (Optimistic Update)
        setPosts(currentPosts =>
            currentPosts.map(p =>
                p.id === postId
                    ? { ...p, is_liked_by_user: !currentlyLiked, likes_count: newLikeCount }
                    : p
            )
        );

        // 3. Arka planda Supabase veritabanını güncelle
        if (currentlyLiked) {
            // Beğeniyi geri al
            const { error } = await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
            if (error) {
                console.error('Error unliking post:', error);
                // Hata durumunda isteğe bağlı olarak arayüzü geri alabilirsiniz
                setPosts(posts); // Eski hale döndür
            }
        } else {
            // Yeni beğeni ekle
            const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
            if (error) {
                console.error('Error liking post:', error);
                // Hata durumunda isteğe bağlı olarak arayüzü geri alabilirsiniz
                setPosts(posts); // Eski hale döndür
            }
        }
    };

    const openZoomModal = (url: string) => {
        setZoomedImageUrl(url);
        setIsZoomModalVisible(true);
    };


    // YENİ: Yorum eklendiğinde çalışır, ama modalı KAPATMAZ.
    const handleCommentAdded = () => {
        if (activePost) {
            setPosts(currentPosts =>
                currentPosts.map(p =>
                    p.id === activePost.id
                        ? {
                            ...p,
                            comments_count: p.comments_count + 1,
                            has_commented_by_user: true,
                        }
                        : p
                )
            );
        }
    };

// YENİ: Sadece modalı kapatmak için kullanılır.
    const handleModalClose = () => {
        setActivePost(null);
    };

    // 5) Her bir post için renderItem fonksiyonu
    // GÜNCELLENDİ: renderItem fonksiyonu yeni veri yapısına göre düzenlendi.
    const renderItem = ({ item }: { item: Post }) => {
        const fullName = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();

        return (
            <View style={tw`bg-soft-black border border-slate-gray rounded-lg p-4 mb-4`}>
                <View style={tw`flex-row items-center mb-3`}>
                    <Image
                        source={{ uri: item.avatar_url || 'https://ui-avatars.com/api/?name=' + fullName }}
                        style={tw`w-10 h-10 rounded-full bg-slate-700`}
                    />
                    <Text style={tw`text-accent-gold font-semibold ml-3`}>
                        {fullName || 'Kullanıcı'}
                    </Text>
                </View>

                {item.content ? (
                    <Text style={tw`text-platinum-gray mb-3`}>{item.content}</Text>
                ) : null}

                {item.media_url && (
                    <Pressable onPress={() => openZoomModal(item.media_url!)} style={tw`mb-3`}>
                        <Image
                            source={{ uri: item.media_url }}
                            style={[tw`w-full rounded-lg`, { aspectRatio: 1 }]}
                            resizeMode="cover"
                        />
                    </Pressable>
                )}

                <View style={tw`flex-row items-center`}>
                    {/* Beğeni Butonu: Artık 'is_liked_by_user' kullanıyor */}
                    <Pressable onPress={() => toggleLike(item.id)} style={tw`flex-row items-center mr-4`}>
                        <Ionicons
                            name={item.is_liked_by_user ? 'heart' : 'heart-outline'}
                            size={24}
                            color={item.is_liked_by_user ? tw.color('accent-gold') : '#5e6367'}
                        />
                        <Text style={tw`text-platinum-gray ml-2`}>{item.likes_count}</Text>
                    </Pressable>

                    {/* Yorum Butonu: Artık 'has_commented_by_user' kullanıyor */}
                    <Pressable onPress={() => setActivePost({ id: item.id, ownerId: item.user_id })} style={tw`flex-row items-center`}>
                        <Ionicons
                            name={item.has_commented_by_user ? 'chatbubble' : 'chatbubble-outline'}
                            size={24}
                            color={item.has_commented_by_user ? tw.color('accent-gold') : '#5e6367'}
                        />
                        <Text style={tw`text-platinum-gray ml-2`}>{item.comments_count}</Text>
                    </Pressable>
                </View>
            </View>
        );
    };


    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {loading && posts.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color={tw.color('accent-gold')} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={tw`flex-1 items-center justify-center`}>
                            <Text style={tw`text-platinum-gray text-lg`}>Henüz gönderi yok.</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                />
            )}

            <CommentsModal
                post={activePost}
                visible={!!activePost}
                onClose={handleModalClose}
                onCommentAdded={handleCommentAdded} // Yeni prop'u buraya ekleyin
            />

            <FAB onPress={() => nav.navigate('PostComposer')} />

            <Modal
                visible={isZoomModalVisible}
                transparent={true}
                onRequestClose={() => setIsZoomModalVisible(false)}
            >
                <SafeAreaView
                    style={tw`flex-1 bg-black/80`}
                    onStartShouldSetResponder={() => true}
                    onResponderRelease={() => setIsZoomModalVisible(false)}
                >
                    <ScrollView
                        contentContainerStyle={tw`flex-1 items-center justify-center`}
                        maximumZoomScale={3}
                        minimumZoomScale={1}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                    >
                        <Image
                            source={{ uri: zoomedImageUrl ?? '' }}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                        />
                    </ScrollView>
                    <Pressable
                        onPress={() => setIsZoomModalVisible(false)}
                        style={tw`absolute top-12 right-5 bg-black/50 p-2 rounded-full`}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </Pressable>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
