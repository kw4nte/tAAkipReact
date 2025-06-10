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
    Keyboard,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import { useAppStore } from '../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export default function PostComposerScreen() {
    const navigation = useNavigation();
    const logout = useAppStore((s) => s.logout);
    const [text, setText] = useState('');
    const [media, setMedia] = useState<{ uri: string; type?: string; fileName?: string } | null>(null);
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
    const pickImage = () => {
        Alert.alert(
            "Fotoğraf Ekle",
            "Nereden bir fotoğraf seçmek istersiniz?",
            [
                { text: "Kamera", onPress: openCamera },
                { text: "Galeri", onPress: openLibrary },
                { text: "İptal", style: "cancel" },
            ]
        );
    };

    const openCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Hata", "Kamera kullanımı için izin vermeniz gerekiyor.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled) {
            // KIRPMA YOK: Direkt state'e ata
            const asset = result.assets[0];
            setMedia({ uri: asset.uri, type: asset.mimeType, fileName: asset.fileName });
        }
    };

    const openLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });
        if (!result.canceled) {
            // KIRPMA YOK: Direkt state'e ata
            const asset = result.assets[0];
            setMedia({ uri: asset.uri, type: asset.mimeType, fileName: asset.fileName });
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

        if (media) {
            try {
                const uid = (await supabase.auth.getUser()).data.user?.id;
                if (!uid) throw new Error('Kullanıcı oturumu bulunamadı.');

                const fileExt = media.uri.split('.').pop() || 'jpg';
                const fileName = media.fileName || `${Date.now()}.${fileExt}`;
                const filePath = `${uid}/${fileName}`;

                const formData = new FormData();
                formData.append('file', { uri: media.uri, name: fileName, type: media.type || 'image/jpeg' } as any);

                const { error: uploadError } = await supabase.storage.from('feed-media').upload(filePath, formData);
                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage.from('feed-media').getPublicUrl(filePath);
                url = publicData.publicUrl;
            } catch (err: any) {
                Alert.alert('Hata', 'Resim yüklenirken bir sorun oluştu.');
                setUploading(false);
                return;
            }
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

            await supabase.from('posts').insert({
                user_id: user.id,
                content: text.trim(),
                media_url: url,
            });
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Hata', 'Gönderi paylaşılırken bir sorun oluştu.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Pressable style={tw`flex-1 bg-premium-black`} onPress={Keyboard.dismiss}>
            <SafeAreaView style={tw`flex-1`}>
                <ScrollView contentContainerStyle={tw`p-4`}>
                    {media && (
                        <View style={tw`mb-4`}>
                            {/* Kırpma olmadığı için artık kare değil, orijinal en boy oranını daha iyi yansıtan bir yükseklik kullanalım */}
                            <Image
                                source={{ uri: media.uri }}
                                style={tw`w-full h-64 rounded-lg`} // aspectRatio kaldırıldı, h-64 eklendi
                                resizeMode="contain" // Fotoğrafın tamamının görünmesi için 'contain'
                            />
                            <Pressable
                                onPress={() => setMedia(null)}
                                style={tw`absolute top-2 right-2 bg-black/70 rounded-full p-2`}
                            >
                                <Ionicons name="close" size={20} color="white" />
                            </Pressable>
                        </View>
                    )}

                    <View style={tw`bg-slate-800 rounded-lg p-3 mb-4`}>
                        <TextInput
                            multiline
                            placeholder="Bugünkü gelişmenizi arkadaşlarınızla paylaşın..."
                            placeholderTextColor="#9ca3af"
                            value={text}
                            onChangeText={setText}
                            style={tw`min-h-32 text-platinum-gray text-base`}
                        />
                    </View>

                    {!media && (
                        <Pressable
                            onPress={pickImage}
                            style={tw`flex-row items-center justify-center bg-slate-700 py-3 rounded-lg mb-2`}
                            disabled={uploading}
                        >
                            <Text style={tw`text-platinum-gray text-center font-medium mr-2`}>
                                📷 Fotoğraf Ekle
                            </Text>
                        </Pressable>
                    )}

                    <Pressable
                        onPress={share}
                        style={tw`bg-accent-gold py-3 rounded-lg ${uploading || (!text.trim() && !media) ? 'opacity-50' : ''}`}
                        disabled={uploading || (!text.trim() && !media)}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#0d0d0d" />
                        ) : (
                            <Text style={tw`text-premium-black text-center font-medium`}>Gönder</Text>
                        )}
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </Pressable>
    );
}
