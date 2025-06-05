// src/screens/PostComposerScreen.tsx

import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    TextInput,
    Pressable,
    Image,
    Text,
    View,
    ActivityIndicator,
    Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { useAppStore } from '../store/useAppStore';

export default function PostComposerScreen() {
    const navigation = useNavigation();
    const logout = useAppStore((s) => s.logout);
    const [text, setText] = useState('');
    const [media, setMedia] = useState<{ uri: string; type: string } | null>(null);
    const [uploading, setUploading] = useState(false);

    // Ekran yüklendiğinde oturum kontrolü yap
    useEffect(() => {
        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session || !session.user) {
                Alert.alert('Oturum Gerekli', 'Lütfen önce giriş yapın.');

                // Supabase'ten çıkış yap ve Zustand'taki isAuth'i false yap
                await supabase.auth.signOut();
                logout();

                // Böylece RootNavigator "isAuth = false" -> AuthStack(Login) gösterir
            }
        };

        checkSession();
    }, []);

    // Galeriden resim seçme
    const pickMedia = async () => {
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.6,
            });
            if (!res.canceled) {
                setMedia(res.assets[0]);
            }
        } catch (error) {
            Alert.alert('Hata', 'Resim seçilemedi.');
        }
    };

    // Gönderiyi Supabase'e kaydetme
    const share = async () => {
        if (!text.trim() && !media) {
            Alert.alert('Uyarı', 'Lütfen en az metin veya bir resim ekleyin.');
            return;
        }

        setUploading(true);
        let url: string | null = null;

        // 1) Eğer medya var ise, önce Storage'a yükle
        if (media) {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) {
                    throw new Error('Kullanıcı oturumu bulunamadı.');
                }
                const uid = user.id;

                // Dosya uzantısını çıkar
                const fileExt = media.uri.split('.').pop();
                const fileName = `${uid}_${Date.now()}.${fileExt}`;

                const result = await supabase.storage
                    .from('feed_media')
                    .upload(fileName, {
                        uri: media.uri,
                        type: media.type ?? 'image/jpeg',
                        name: fileName,
                    });

                if (result.error) {
                    console.error('Storage upload error:', result.error.message);
                    throw new Error('Görsel yüklenemedi.');
                }

                const {
                    data: { publicUrl },
                } = supabase.storage.from('feed_media').getPublicUrl(fileName);
                url = publicUrl;
            } catch (err: any) {
                console.error('Media upload hatası:', err.message);
                Alert.alert(
                    'Hata',
                    err.message.startsWith('Görsel') ? err.message : 'Resim yüklenirken bir sorun oluştu.'
                );
                setUploading(false);
                return;
            }
        }

        // 2) Gönderiyi posts tablosuna ekle
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
                setUploading(false);
                return;
            }

            const newPost = {
                user_id: user.id,
                content: text.trim(),
                media_url: url,
            };

            const { error } = await supabase.from('posts').insert(newPost);
            if (error) {
                console.error('Post insert error:', error.message);
                Alert.alert('Hata', 'Gönderi kaydedilemedi: ' + error.message);
            } else {
                // Başarıyla kaydedildiyse Feed ekranına geri dön
                navigation.goBack();
            }
        } catch (err: any) {
            console.error('Post paylaşma hatası:', err.message);
            Alert.alert('Hata', 'Gönderi paylaşırken bir sorun oluştu.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {/* 1) Gri arka planlı, geniş TextInput */}
            <View style={tw`bg-slate-gray rounded-lg p-2 mb-4`}>
                <TextInput
                    multiline
                    placeholder="Ne paylaşmak istersin?"
                    placeholderTextColor="#666"
                    value={text}
                    onChangeText={setText}
                    style={tw`min-h-32 text-platinum-gray text-base`}
                />
            </View>

            {/* 2) Eğer bir medya seçilmişse önizleme */}
            {media && (
                <Image
                    source={{ uri: media.uri }}
                    style={tw`w-full h-40 rounded-lg mb-4`}
                    resizeMode="cover"
                />
            )}

            {/* 3) Galeriden/Camera’dan fotoğraf ekle butonu */}
            <Pressable
                onPress={pickMedia}
                style={tw`flex-row items-center justify-center bg-accent-gold py-3 rounded-lg mb-2`}
                disabled={uploading}
            >
                <Text style={tw`text-premium-black text-center font-medium mr-2`}>
                    📷 Fotoğraf Ekle
                </Text>
            </Pressable>

            {/* 4) Gönder butonu */}
            <Pressable
                onPress={share}
                style={tw`bg-accent-gold py-3 rounded-lg ${uploading ? 'opacity-60' : ''}`}
                disabled={uploading}
            >
                {uploading ? (
                    <View style={tw`flex-row justify-center items-center`}>
                        <ActivityIndicator color="#0d0d0d" />
                        <Text style={tw`text-premium-black text-center font-medium ml-2`}>
                            Gönderiliyor...
                        </Text>
                    </View>
                ) : (
                    <Text style={tw`text-premium-black text-center font-medium`}>Gönder</Text>
                )}
            </Pressable>
        </SafeAreaView>
    );
}
