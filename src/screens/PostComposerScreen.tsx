import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Pressable, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { useNavigation } from '@react-navigation/native';

export default function PostComposerScreen() {
    const nav = useNavigation();
    const [text, setText] = useState('');
    const [media, setMedia] = useState<{ uri: string; type: string } | null>(null);

    const pickMedia = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.6,
        });
        if (!res.canceled) setMedia(res.assets[0]);
    };

    const share = async () => {
        let url = '';
        if (media) {
            const uid = (await supabase.auth.getUser()).data.user?.id!;
            const path = `${uid}_${Date.now()}`;
            await supabase.storage
                .from('feed_media')
                .upload(path, {
                    uri: media.uri,
                    type: media.type,
                    name: 'file',
                });
            url = supabase.storage.from('feed_media').getPublicUrl(path).data.publicUrl;
        }
        await supabase.from('posts').insert({ content: text, media_url: url });
        nav.goBack();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            <TextInput
                multiline
                placeholder="Ne paylaşmak istersin?"
                placeholderTextColor="#666"
                value={text}
                onChangeText={setText}
                style={tw`flex-1 text-platinum-gray mb-4`}
            />
            {media && <Image source={{ uri: media.uri }} style={tw`h-40 mb-4`} />}
            <Pressable onPress={pickMedia} style={tw`bg-antique-gold p-3 rounded-lg mb-2`}>
                <Text style={tw`text-premium-black text-center`}>Foto/Video Seç</Text>
            </Pressable>
            <Pressable onPress={share} style={tw`bg-antique-gold p-3 rounded-lg`}>
                <Text style={tw`text-premium-black text-center`}>Gönder</Text>
            </Pressable>
        </SafeAreaView>
    );
}
