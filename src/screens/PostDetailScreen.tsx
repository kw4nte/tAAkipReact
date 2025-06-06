import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Text, TextInput, Pressable } from 'react-native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';

export default function PostDetailScreen({ route }) {
    const postId = route.params.postId;
    const [comments, setComments] = useState([]);
    const [txt, setTxt] = useState('');

    const load = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('id,text,created_at,profiles(full_name)')
            .eq('post_id', postId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Comments load error:', error.message);
            setComments([]);
        } else {
            setComments(data ?? []);
        }
    };

    useEffect(() => {
        load();
        // realtime
        const ch = supabase.channel('comments')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
                load
            )
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, []);

    const send = async () => {
        if (!txt) return;
        const { error } = await supabase
            .from('comments')
            .insert({ post_id: postId, text: txt });
        if (error) {
            console.error('Comment send error:', error.message);
        } else {
            setTxt('');
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList
                data={comments}
                keyExtractor={(i) => String(i.id)}
                renderItem={({ item }) => (
                    <SafeAreaView style={tw`p-4 border-b border-slate-gray`}>
                        <Text style={tw`text-antique-gold font-semibold`}>
                            {item.profiles?.full_name ?? 'Kullanıcı'}
                        </Text>
                        <Text style={tw`text-platinum-gray`}>{item.text}</Text>
                    </SafeAreaView>
                )}
            />
            <SafeAreaView style={tw`flex-row p-2 border-t border-slate-gray`}>
                <TextInput
                    value={txt}
                    onChangeText={setTxt}
                    placeholder="Yorum yaz..."
                    placeholderTextColor="#666"
                    style={tw`flex-1 border border-slate-gray rounded-lg px-3 py-1 text-platinum-gray`}
                />
                <Pressable onPress={send} style={tw`ml-2 bg-antique-gold px-4 rounded-lg items-center justify-center`}>
                    <Text style={tw`text-premium-black`}>Gönder</Text>
                </Pressable>
            </SafeAreaView>
        </SafeAreaView>
    );
}
