import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Image, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import FAB from '../components/FAB';

export default function FeedScreen() {
    const [posts, setPosts] = useState([]);
    const nav = useNavigation();

    const load = () =>
        supabase
            .rpc('feed_list') /* (opsiyonel view) */
            .then(({ data }) => setPosts(data ?? []));

    useEffect(() => {
        load();
        const ch = supabase.channel('likes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, load)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    const toggleLike = async (postId, liked) => {
        const user = (await supabase.auth.getUser()).data.user!.id;
        if (liked) {
            await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user);
        } else {
            await supabase.from('likes').insert({ post_id: postId, user_id: user });
        }
    };

    const render = ({ item }) => (
        <SafeAreaView style={tw`p-4 border-b border-slate-gray`}>
            <Text style={tw`text-antique-gold font-semibold mb-1`}>
                {item.full_name ?? 'Kullanıcı'}
            </Text>
            <Text style={tw`text-platinum-gray mb-2`}>{item.content}</Text>
            {item.media_url && <Image source={{ uri: item.media_url }} style={tw`h-52 rounded-lg mb-2`} />}
            <SafeAreaView style={tw`flex-row`}>
                <Pressable onPress={() => toggleLike(item.id, item.liked)}>
                    <Ionicons
                        name={item.liked ? 'heart' : 'heart-outline'}
                        size={24}
                        color={item.liked ? '#bfa76f' : '#5e6367'}
                    />
                </Pressable>
                <Text style={tw`text-platinum-gray ml-1 mr-4`}>{item.likes_count}</Text>
                <Pressable onPress={() => nav.navigate('PostDetail', { postId: item.id })}>
                    <Ionicons name="chatbubble-outline" size={24} color="#5e6367" />
                </Pressable>
                <Text style={tw`text-platinum-gray ml-1`}>{item.comments_count}</Text>
            </SafeAreaView>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList data={posts} keyExtractor={(i) => String(i.id)} renderItem={render} />
            <FAB onPress={() => nav.navigate('PostComposer')} />
        </SafeAreaView>
    );
}
