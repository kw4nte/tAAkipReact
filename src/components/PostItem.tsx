// src/components/PostItem.tsx (Nihai ve Tam Sürüm)

import React from 'react';
import { View, Text, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';

// Tipler
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

interface PostItemProps {
    post: Post;
    currentUserId: string | null;
    onDelete: (postId: number) => void;
    onToggleLike: (postId: number) => void;
    onOpenComments: (post: { id: number; ownerId: string }) => void;
    onNavigateToProfile: (userId: string) => void;
}

// DÜZELTME: Eksik olan fonksiyonu bu dosyanın içine ekliyoruz.
const formatPostTimestamp = (timestamp: string): string => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = (now.getTime() - postDate.getTime()) / 1000;
    const diffInHours = diffInSeconds / 3600;
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        return `${diffInMinutes}m`;
    }
    if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h`;
    }
    if (diffInDays < 7) {
        return `${Math.floor(diffInDays)}d`;
    }
    return postDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};


const PostItem = ({ post, currentUserId, onDelete, onToggleLike, onOpenComments, onNavigateToProfile }: PostItemProps) => {
    const isOwner = post.user_id === currentUserId;
    const fullName = `${post.first_name ?? ''} ${post.last_name ?? ''}`.trim();

    const confirmDelete = () => {
        Alert.alert(
            "Gönderiyi Sil",
            "Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz?",
            [
                { text: "Vazgeç", style: "cancel" },
                { text: "Sil", style: "destructive", onPress: handleDeletePost }
            ]
        );
    };

    const handleDeletePost = async () => {
        const { error } = await supabase
            .from('posts')
            .delete()
            .match({ id: post.id });

        if (error) {
            Alert.alert('Hata', 'Gönderi silinirken bir sorun oluştu.');
        } else {
            onDelete(post.id);
        }
    };

    return (
        <View style={tw`bg-soft-black border border-slate-gray rounded-lg p-4 mb-4 mx-4`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
                <Pressable onPress={() => onNavigateToProfile(post.user_id)} style={tw`flex-row items-center flex-1`}>
                    <Image source={{ uri: post.avatar_url || `https://ui-avatars.com/api/?name=${fullName}`}} style={tw`w-10 h-10 rounded-full bg-slate-700`} />
                    <Text style={tw`text-accent-gold font-semibold ml-3`}>{fullName || 'Kullanıcı'}</Text>
                </Pressable>
                <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-slate-400 text-xs mr-2`}>
                        {formatPostTimestamp(post.created_at)}
                    </Text>
                    {isOwner && (
                        <Pressable onPress={confirmDelete} style={tw`p-1`}>
                            <Ionicons name="ellipsis-horizontal" size={20} color={tw.color('slate-400')} />
                        </Pressable>
                    )}
                </View>
            </View>

            {post.content ? <Text style={tw`text-platinum-gray mb-3`}>{post.content}</Text> : null}
            {post.media_url && (<Image source={{ uri: post.media_url }} style={[tw`w-full rounded-lg mb-3`, { aspectRatio: 1 }]} resizeMode="cover" />)}

            <View style={tw`flex-row items-center`}>
                <Pressable onPress={() => onToggleLike(post.id)} style={tw`flex-row items-center mr-4`}>
                    <Ionicons name={post.is_liked_by_user ? 'heart' : 'heart-outline'} size={24} color={post.is_liked_by_user ? tw.color('accent-gold') : '#5e6367'} />
                    <Text style={tw`text-platinum-gray ml-2`}>{post.likes_count}</Text>
                </Pressable>
                <Pressable onPress={() => onOpenComments({ id: post.id, ownerId: post.user_id })} style={tw`flex-row items-center`}>
                    <Ionicons name={post.has_commented_by_user ? 'chatbubble' : 'chatbubble-outline'} size={24} color={post.has_commented_by_user ? tw.color('accent-gold') : '#5e6367'} />
                    <Text style={tw`text-platinum-gray ml-2`}>{post.comments_count}</Text>
                </Pressable>
            </View>
        </View>
    );
};

export default PostItem;