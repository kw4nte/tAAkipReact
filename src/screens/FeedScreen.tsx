// src/screens/FeedScreen.tsx

import { useEffect, useState, useCallback, useRef } from 'react';
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
    Keyboard,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PostItem from '../components/PostItem';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import FAB from '../components/FAB';
import CommentsModal from '../components/CommentsModal';
import { useAppStore } from '../store/useAppStore';


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

interface SearchProfile {
    id: string;
    username: string;
    avatar_url: string | null;
}

export default function FeedScreen() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const nav = useNavigation();
    const [isZoomModalVisible, setIsZoomModalVisible] = useState(false);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
    const [activePost, setActivePost] = useState<{ id: number; ownerId: string } | null>(null);

    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const currentUserId = useAppStore((s) => s.userProfile?.id);


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

    const handleDeletePost = (deletedPostId: number) => {
        setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));
    };

// YENİ: Sadece modalı kapatmak için kullanılır.
    const handleModalClose = () => {
        setActivePost(null);
    };

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        if (searchText.trim().length > 1) {
            setIsSearching(true);
            searchTimeout.current = setTimeout(async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .ilike('username', `%${searchText.trim()}%`)
                    .limit(10);

                if (error) console.error('Search error:', error);
                else setSearchResults(data ?? []);
                setIsSearching(false);
            }, 300); // 300ms bekle
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [searchText]);

     // Zaten eklemiştik

    const navigateToUserProfile = (postAuthorId: string) => {
        setIsSearchModalVisible(false); // Arama modalını her durumda kapat

        // Eğer tıklanan postun sahibi, giriş yapmış kullanıcı ise, onu 'Profile' TAB'ına yönlendir.
        if (postAuthorId === currentUserId) {
            nav.navigate('Profile' as never);
        } else {
            // Değilse, normal şekilde UserProfile EKRANINA yönlendir.
            nav.navigate('UserProfile' as never, { userId: postAuthorId } as never);
        }
    };

    const renderItem = ({ item }: { item: Post }) => (
        <PostItem
            post={item}
            currentUserId={currentUserId}
            onDelete={handleDeletePost}
            onToggleLike={toggleLike}
            onOpenComments={setActivePost}
            onNavigateToProfile={navigateToUserProfile}
        />
    );


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
                        <View style={tw`flex-1 items-center justify-center mt-20`}>
                            <Text style={tw`text-platinum-gray text-lg text-center px-4`}>
                                Takip ettiğin kimse yok ya da henüz bir şey paylaşmadılar.
                            </Text>
                            <Text style={tw`text-slate-400 text-base mt-2`}>
                                Arama butonuyla yeni kişileri keşfet!
                            </Text>
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

            {/* Mevcut Yorumlar Modalı */}
            <CommentsModal
                post={activePost}
                visible={!!activePost}
                onClose={handleModalClose}
                onCommentAdded={handleCommentAdded}
            />

            {/* Mevcut Post Ekleme Butonu (sağ altta) */}
            <FAB
                onPress={() => nav.navigate('PostComposer' as never)}
            />

            {/* 2. Arama için Yeni, Bağımsız Buton (FAB yerine Pressable kullanıyoruz) */}
            <Pressable
                onPress={() => setIsSearchModalVisible(true)}
                style={{
                    position: 'absolute',
                    left: 24,
                    bottom: 24,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#FFD700',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 5,
                }}
            >
                <Ionicons name="search" size={28} color={tw.color('premium-black')} />
            </Pressable>

            {/* Mevcut Resim Büyütme Modalı */}
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
                    >
                        <Image
                            source={{ uri: zoomedImageUrl ?? '' }}
                            style={tw`w-full h-full`}
                            resizeMode="contain"
                        />
                    </ScrollView>
                    <Pressable
                        onPress={() => setIsZoomModalVisible(false)}
                        style={tw`absolute top-16 right-5 bg-black/50 p-2 rounded-full`}
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </Pressable>
                </SafeAreaView>
            </Modal>

            {/* YENİ Arama Modalı */}
            <Modal
                visible={isSearchModalVisible}
                animationType="slide"
                onRequestClose={() => setIsSearchModalVisible(false)}
            >
                <SafeAreaView style={tw`flex-1 bg-premium-black`} onTouchStart={Keyboard.dismiss} accessible={false}>
                    {/* Arama Input'u ve Kapat Butonu */}
                    <View style={tw`flex-row items-center p-4 border-b border-slate-gray`}>
                        <Ionicons name="search" size={20} color={tw.color('slate-400')} style={tw`mr-2`} />
                        <TextInput
                            placeholder="Kullanıcı adı ara..."
                            placeholderTextColor="#888"
                            value={searchText}
                            onChangeText={setSearchText}
                            style={tw`flex-1 text-white text-lg`}
                            autoCapitalize="none"
                            autoFocus
                        />
                        <Pressable onPress={() => setIsSearchModalVisible(false)}>
                            <Text style={tw`text-accent-gold`}>Vazgeç</Text>
                        </Pressable>
                    </View>

                    {/* Arama Sonuçları */}
                    {isSearching ? (
                        <ActivityIndicator style={tw`mt-10`} color={tw.color('accent-gold')} />
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <Pressable onPress={() => navigateToUserProfile(item.id)} style={tw`flex-row items-center p-4 border-b border-slate-800`}>
                                    <Image source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.username}&background=random` }} style={tw`w-12 h-12 rounded-full bg-slate-700`} />
                                    <Text style={tw`text-white font-bold text-base ml-4`}>@{item.username}</Text>
                                </Pressable>
                            )}
                            ListEmptyComponent={
                                <View style={tw`p-10 items-center`}>
                                    <Text style={tw`text-slate-400`}>
                                        {searchText.length > 1 ? 'Sonuç bulunamadı.' : 'Kullanıcıları bulmak için yazmaya başlayın.'}
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
