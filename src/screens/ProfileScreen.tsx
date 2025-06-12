// src/screens/ProfileScreen.tsx
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, Image, Pressable, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';
import { useAppStore } from '../store/useAppStore';

// 1. Profile arayüzünü yeni veritabanı şemasına göre güncelleyelim
interface Profile {
    id: string;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    date_of_birth: string | null;
    account_type: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    created_at: string;
    username: string | null;
}

// 2. Doğum tarihinden yaş hesaplayan bir yardımcı fonksiyon ekleyelim
const calculateAge = (dobString: string | null): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


export default function ProfileScreen() {
    const navigation = useNavigation();
    const logoutStore = useAppStore((s) => s.logout);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null); // 2. E-posta için ayrı state eklendi.
    const [loading, setLoading] = useState<boolean>(true);
    const isFocused = useIsFocused();
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [posts, setPosts] = useState<Post[]>([]);

    // src/screens/ProfileScreen.tsx

// Lütfen mevcut useEffect bloğunuzu aşağıdaki daha sağlam versiyonuyla değiştirin.
    useEffect(() => {
        if (!isFocused) return;

        // Referans hatasını önlemek için kendi kendini çağıran async fonksiyon kullanalım
        (async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
                const { data: postData } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { descending: true });
                setPosts(postData ?? []);
                logoutStore();
                setLoading(false);
                return;
            }

            console.log(`======== ProfileScreen Veri Çekme Başladı ========`);
            console.log(`Profil verisi şu kullanıcı için çekiliyor: ${user.email} (ID: ${user.id})`);


            setUserEmail(user.email ?? null);

            // 1. Profil bilgilerini ve kullanıcı adını çek
            const { data, error } = await supabase
                .from('profiles')
                .select(`*, username`)
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Profil yükleme hatası:', error.message);
                Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
                setLoading(false);
                return;
            }

            setProfile(data as Profile);

            // 2. Takipçi sayısını çek
            console.log(`Takipçi sayısı sorgusu: "following_id" = ${user.id} olanları say`);
            const { count: followers } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
            console.log(`==> Dönen takipçi sayısı: ${followers}`);
            setFollowerCount(followers ?? 0);

            // 3. Takip edilen sayısını çek
            console.log(`Takip edilen sayısı sorgusu: "follower_id" = ${user.id} olanları say`);
            const { count: following } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
            console.log(`==> Dönen takip edilen sayısı: ${following}`);
            setFollowingCount(following ?? 0);

            setLoading(false);
            console.log(`======== ProfileScreen Veri Çekme Bitti ========`);
        })(); // Bu parantezler fonksiyonu hemen çalıştırır.

    }, [isFocused, logoutStore]);


    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Çıkış hatası:', error.message);
            Alert.alert('Hata', 'Çıkış yapılırken bir sorun oluştu.');
            return;
        }
        logoutStore();
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}>
                <Text style={tw`text-platinum-gray text-lg`}>Profil bilgileri yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    // Eğer profile null ise:
    if (!profile) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center p-4`}>
                <Text style={tw`text-platinum-gray text-lg mb-4`}>
                    Profil bulunamadı. Lütfen tekrar deneyin.
                </Text>
                <PrimaryButton onPress={() => navigation.navigate('Login' as never)}>
                    Giriş Yap
                </PrimaryButton>
            </SafeAreaView>
        );
    }

    // fullName oluştur
    const fullName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();

    const userAge = calculateAge(profile.date_of_birth);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}

                // Listenin en üstünde görünecek olan profil bilgileri
                ListHeaderComponent={
                    <>
                        <View style={tw`items-center p-4`}>
                            {/* Profil Fotoğrafı */}
                            <View style={tw`mb-6`}>
                                {profile.avatar_url ? (
                                    <Image
                                        source={{ uri: profile.avatar_url }}
                                        style={tw`w-32 h-32 rounded-full`}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={tw`w-32 h-32 rounded-full bg-slate-gray justify-center items-center`}>
                                        <Text style={tw`text-platinum-gray`}>Fotoğraf Yok</Text>
                                    </View>
                                )}
                            </View>

                            {/* İsim ve Kullanıcı Adı */}
                            <Text style={tw`text-accent-gold text-2xl mb-1`}>
                                {fullName || 'Kullanıcı İsmi'}
                            </Text>
                            <Text style={tw`text-slate-400 text-lg mb-4`}>
                                @{profile.username ?? ''}
                            </Text>

                            {/* İstatistikler */}
                            <View style={tw`flex-row justify-around w-full mb-6 border-y border-slate-700 py-4`}>
                                <View style={tw`items-center`}>
                                    <Text style={tw`text-white font-bold text-xl`}>{posts.length}</Text>
                                    <Text style={tw`text-slate-400`}>Gönderi</Text>
                                </View>
                                <View style={tw`items-center`}>
                                    <Text style={tw`text-white font-bold text-xl`}>{followerCount}</Text>
                                    <Text style={tw`text-slate-400`}>Takipçi</Text>
                                </View>
                                <View style={tw`items-center`}>
                                    <Text style={tw`text-white font-bold text-xl`}>{followingCount}</Text>
                                    <Text style={tw`text-slate-400`}>Takip</Text>
                                </View>
                            </View>

                            {/* Butonlar */}
                            <Pressable
                                onPress={() => navigation.navigate('ProfileEdit' as never)}
                                style={tw`bg-soft-black px-6 py-3 rounded-lg w-full mb-4`}
                            >
                                <Text style={tw`text-accent-gold text-center font-medium`}>Profili Düzenle</Text>
                            </Pressable>
                            <PrimaryButton onPress={signOut} style={tw`w-full`}>
                                Çıkış Yap
                            </PrimaryButton>
                        </View>

                        {/* Gönderiler Başlığı */}
                        {posts.length > 0 && (
                            <Text style={tw`text-white text-xl font-bold p-4 pt-0`}>Gönderiler</Text>
                        )}
                    </>
                }

                // Postların render edileceği kısım
                renderItem={({ item }) => (
                    <View style={tw`bg-soft-black border-t border-slate-800 p-4 mx-4 mb-4 rounded-lg`}>
                        {item.content ? <Text style={tw`text-platinum-gray mb-3`}>{item.content}</Text> : null}
                        {item.media_url && (
                            <Image
                                source={{ uri: item.media_url }}
                                style={[tw`w-full rounded-lg`, { aspectRatio: 1 }]}
                                resizeMode="cover"
                            />
                        )}
                        {/* Gerekirse buraya beğeni/yorum sayıları da eklenebilir */}
                    </View>
                )}

                // Post yoksa gösterilecek mesaj
                ListEmptyComponent={
                    <View style={tw`p-10 items-center`}>
                        <Text style={tw`text-slate-400`}>Henüz gönderi yok.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
