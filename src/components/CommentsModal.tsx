import { useEffect, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    TextInput,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { Session, User } from '@supabase/supabase-js';

// Yorum ve profil verisini birleştiren bir arayüz tanımlıyoruz
interface CommentWithProfile {
    id: number;
    text: string;
    created_at: string;
    user_id: string;
    profiles: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
    } | null;
}

// Component'in alacağı propları tanımlıyoruz
interface CommentsModalProps {
    visible: boolean;
    onClose: () => void; // Tekrar parametresiz oldu
    onCommentAdded: () => void; // Yeni prop eklendi
    post: { id: number; ownerId: string } | null;
}

export default function CommentsModal({ visible, onClose, post, onCommentAdded }: CommentsModalProps) {
    const [comments, setComments] = useState<CommentWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Mevcut kullanıcıyı bir kere alıp state'e kaydediyoruz
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    // Yorumları çeken fonksiyon
    const fetchComments = useCallback(async (postId: number) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                profiles:user_id ( first_name, last_name, avatar_url )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching comments:', error.message);
        } else {
            setComments(data as CommentWithProfile[]);
        }
        setLoading(false);
    }, []);

    // Modal her görünür olduğunda ve post değiştiğinde yorumları çek
    useEffect(() => {
        if (post?.id) {
            fetchComments(post.id);
        } else {
            // Modal kapandığında listeyi temizle
            setComments([]);
        }
    }, [post, fetchComments]);

    // Yeni yorum gönderme fonksiyonu
    const handleAddComment = async () => {
        if (newComment.trim() === '' || !post || !currentUser) return;

        const tempCommentText = newComment;
        setNewComment(''); // Input'u anında temizle

        // Optimistic Update için geçici bir yorum objesi oluştur
        const tempComment: CommentWithProfile = {
            id: Date.now(), // Geçici ID
            text: tempCommentText,
            created_at: new Date().toISOString(),
            user_id: currentUser.id,
            profiles: { // Bu bilgiyi mevcut kullanıcıdan alabiliriz, ama şimdilik null bırakabiliriz
                first_name: 'Siz',
                last_name: '',
                avatar_url: null, // veya mevcut kullanıcının avatarı
            },
        };
        // Yorumu anında listeye ekle
        setComments(currentComments => [...currentComments, tempComment]);

        // Supabase'e yeni yorumu ekle
        const { error } = await supabase.from('comments').insert({
            post_id: post.id,
            user_id: currentUser.id,
            text: tempCommentText,
            post_owner_id: post.ownerId,
        });

        if (error) {
            console.error('Error adding comment:', error.message);
            // Hata durumunda iyimser güncellemeyi geri al
            setComments(currentComments => currentComments.filter(c => c.id !== tempComment.id));
            setNewComment(tempCommentText); // Kullanıcının yazdığını geri getir
        } else {
            onCommentAdded();

            // 2. Modal açık kalacağı için, yeni yorumu görmek adına listeyi yenile.
            if (post) {
                fetchComments(post.id);
            }
        }
    };

    // Her bir yorum satırını render eden component
    const renderCommentItem = ({ item }: { item: CommentWithProfile }) => {
        const fullName = `${item.profiles?.first_name ?? ''} ${item.profiles?.last_name ?? ''}`.trim();
        return (
            <View style={tw`flex-row items-start mb-4`}>
                <Image
                    source={{ uri: item.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=' + fullName }}
                    style={tw`w-9 h-9 rounded-full bg-slate-700 mr-3`}
                />
                <View style={tw`flex-1 bg-premium-black p-3 rounded-lg`}>
                    <Text style={tw`text-accent-gold font-semibold mb-1`}>{fullName || 'Kullanıcı'}</Text>
                    <Text style={tw`text-platinum-gray`}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                {/* Arka planı karartıp, dokunulduğunda kapanmasını sağlayan katman */}
                <Pressable style={tw`flex-1 bg-black/70`} onPress={onClose} />

                {/* Asıl modal içeriği */}
                <View style={tw`bg-soft-black h-[80%] p-4 rounded-t-2xl`}>
                    <SafeAreaView edges={['bottom']} style={tw`flex-1`}>
                        {/* Başlık ve Kapatma Butonu */}
                        <View style={tw`flex-row justify-between items-center pb-4 border-b border-slate-gray mb-4`}>
                            <Text style={tw`text-accent-gold text-xl font-bold`}>Yorumlar</Text>
                            <Pressable onPress={onClose} style={tw`p-1`}>
                                <Ionicons name="close" size={28} color={tw.color('platinum-gray')} />
                            </Pressable>
                        </View>

                        {/* Yorum Listesi */}
                        {loading ? (
                            <ActivityIndicator size="large" color={tw.color('accent-gold')} />
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderCommentItem}
                                ListEmptyComponent={
                                    <Text style={tw`text-center text-platinum-gray mt-10`}>
                                        Henüz yorum yapılmamış. İlk yorumu sen yap!
                                    </Text>
                                }
                            />
                        )}

                        {/* Yorum Yazma Alanı */}
                        <View style={tw`flex-row items-center mt-4 pt-3 border-t border-slate-gray`}>
                            <TextInput
                                value={newComment}
                                onChangeText={setNewComment}
                                placeholder="Yorumunu yaz..."
                                placeholderTextColor="#888"
                                style={tw`flex-1 bg-premium-black text-white px-4 py-2 rounded-full mr-3`}
                            />
                            <Pressable onPress={handleAddComment} style={tw`bg-accent-gold p-2 rounded-full`}>
                                <Ionicons name="send" size={20} color={tw.color('premium-black')} />
                            </Pressable>
                        </View>
                    </SafeAreaView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
