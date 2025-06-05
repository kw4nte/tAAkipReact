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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import FAB from '../components/FAB';

interface Post {
    id: number;                // bigint → JS’de number
    user_id: string;           // uuid → string
    content: string;
    media_url: string | null;
    likes_count: number;
    comments_count: number;
    full_name: string | null;
    liked: boolean;
}

export default function FeedScreen() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const nav = useNavigation();

    // Gönderileri Supabase'ten çekmek için fonksiyon
    const load = async () => {
        const { data, error } = await supabase
            .from<Post>('feed_list')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('feed_list error:', error.message);
            setPosts([]);
        } else {
            setPosts(data ?? []);
        }
    };

    // Ekran her odaklandığında "load()" çalışsın
    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    // Pull-to-refresh işlemi
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, []);

    // Beğeni toggle ve anlık yenileme
    const toggleLike = async (postId: number, liked: boolean) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        if (liked) {
            await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);
        } else {
            await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
        }
        // Beğeni güncellendikten hemen sonra listeyi yenile
        load();
    };

    // RenderItem
    const renderItem = ({ item }: { item: Post }) => (
        <View style={tw`bg-soft-black border border-slate-gray rounded-lg p-4 mb-3`}>
            {/* Media varsa */}
            {item.media_url ? (
                <Image
                    source={{ uri: item.media_url }}
                    style={tw`w-full h-52 rounded-lg mb-3`}
                    resizeMode="cover"
                />
            ) : null}

            {/* Kullanıcı adı ve içerik */}
            <Text style={tw`text-accent-gold font-semibold mb-1`}>
                {item.full_name ?? 'Kullanıcı'}
            </Text>
            <Text style={tw`text-platinum-gray mb-3`}>{item.content}</Text>

            {/* Beğeni ve yorum ikonları */}
            <View style={tw`flex-row items-center`}>
                <Pressable onPress={() => toggleLike(item.id, item.liked)}>
                    <Ionicons
                        name={item.liked ? 'heart' : 'heart-outline'}
                        size={24}
                        color={item.liked ? '#bfa76f' : '#5e6367'}
                    />
                </Pressable>
                <Text style={tw`text-platinum-gray ml-2 mr-4`}>{item.likes_count}</Text>

                <Pressable onPress={() => nav.navigate('PostDetail', { postId: item.id })}>
                    <Ionicons name="chatbubble-outline" size={24} color="#5e6367" />
                </Pressable>
                <Text style={tw`text-platinum-gray ml-2`}>{item.comments_count}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {posts.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center`}>
                    <Text style={tw`text-platinum-gray text-lg`}>Henüz gönderi yok.</Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#fff"
                        />
                    }
                />
            )}

            {/* FAB: Yeni gönderi oluşturmak için + butonu */}
            <FAB onPress={() => nav.navigate('PostComposer')} />
        </SafeAreaView>
    );
}
