// src/screens/ProfileEditScreen.tsx
import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    View,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import i18n from '../i18n';
import DeleteAccountSheet from '../components/DeleteAccountSheet';

interface Profile {
    id: string;
    avatar_url: string | null;
    first_name: string | null;
    last_name: string | null;
    gender: string | null;
    age: number | null;
    email: string | null;
    account_type: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    created_at: string;
}

export default function ProfileEditScreen() {
    const navigation = useNavigation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Form alanları için local state’ler
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [age, setAge] = useState<string>(''); // string olarak saklayıp Number’a çevireceğiz
    const [weight, setWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [accountType, setAccountType] = useState<string>('');
    // E-posta sadece gösteriliyor, değiştirme isterseniz Supabase Auth updateUser kullanmanız gerekir
    const [email, setEmail] = useState<string>('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
    const [showDel, setShowDel] = useState<boolean>(false);

    // Kullanıcının UID’sini al
    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    // Mount olduğunda mevcut profili çek, form alanlarını doldur
    useEffect(() => {
        (async () => {
            setLoading(true);
            const {
                data: { user },
                error: authErr,
            } = await supabase.auth.getUser();
            if (authErr || !user) {
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
                navigation.goBack();
                return;
            }

            // “profiles” tablosundan yeni sütunları çek
            const { data, error } = await supabase
                .from<Profile>('profiles')
                .select(`
          id,
          avatar_url,
          first_name,
          last_name,
          gender,
          age,
          email,
          account_type,
          weight_kg,
          height_cm,
          created_at
        `)
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Profil yükleme hatası:', error.message);
                Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
                navigation.goBack();
            } else if (data) {
                setProfile(data);

                // State’leri doldur:
                setFirstName(data.first_name ?? '');
                setLastName(data.last_name ?? '');
                setGender(data.gender ?? '');
                setAge(data.age != null ? String(data.age) : '');
                setWeight(data.weight_kg != null ? String(data.weight_kg) : '');
                setHeight(data.height_cm != null ? String(data.height_cm) : '');
                setAccountType(data.account_type ?? '');
                setEmail(data.email ?? '');
                setAvatarUrl(data.avatar_url);
            }

            setLoading(false);
        })();
    }, []);

    // Avatar / Profil fotoğrafı seç & Supabase Storage’a yükleme
    const pickAvatar = async () => {
        try {
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.7,
            });
            if (!res.canceled) return;

            const asset = res.assets[0];
            if (!asset.uri) return;

            setUploadingAvatar(true);
            const uid = await getUid();
            if (!uid) {
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
                setUploadingAvatar(false);
                return;
            }

            // Benzersiz bir isim oluştur: userId-timestamp.extension
            const fileExt = asset.uri.split('.').pop();
            const fileName = `avatars/${uid}_${Date.now()}.${fileExt}`;

            // Storage'a yükle
            const { error: uploadError } = await supabase.storage
                .from('avatars') // "avatars" adında bir bucket olduğunu varsayıyoruz
                .upload(fileName, {
                    uri: asset.uri,
                    name: fileName,
                    type: asset.type ?? 'image/jpeg',
                });

            if (uploadError) {
                console.error('Avatar yükleme hatası:', uploadError.message);
                Alert.alert('Hata', 'Avatar yüklenirken bir sorun oluştu.');
                setUploadingAvatar(false);
                return;
            }

            // Public URL al
            const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const publicUrl = publicData.publicUrl;

            // “profiles.avatar_url” alanını güncelle
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', uid);

            if (updateErr) {
                console.error('Avatar URL güncelleme hatası:', updateErr.message);
                Alert.alert('Hata', 'Profil resmi güncellenemedi.');
            } else {
                setAvatarUrl(publicUrl);
            }
        } catch (err) {
            console.error('Avatar seçme hatası:', err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    // “Kaydet” işlemi: tüm alanları güncelle
    const save = async () => {
        const uid = await getUid();
        if (!uid) {
            Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
            return;
        }

        // Zorunlu alanları kontrol edebilirsiniz. Örneğin isim boşsa uyar:
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Uyarı', 'Lütfen ad ve soyad girin.');
            return;
        }

        // Numeric dönüşümleri
        const ageNum = age ? Number(age) : null;
        const weightNum = weight ? Number(weight) : null;
        const heightNum = height ? Number(height) : null;

        const updates: Partial<Omit<Profile, 'id' | 'created_at'>> = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            gender: gender.trim() || null,
            age: ageNum,
            account_type: accountType.trim() || null,
            weight_kg: weightNum,
            height_cm: heightNum,
            // Eğer e-posta güncellemesini de desteklemek isterseniz, aşağıdaki satırı kullanın
            // email: email.trim() || null
        };

        const { error } = await supabase.from('profiles').update(updates).eq('id', uid);

        if (error) {
            console.error('Profil güncelleme hatası:', error.message);
            Alert.alert('Hata', 'Profil güncelleme işlemi başarısız oldu.');
        } else {
            Alert.alert('Başarılı', 'Profiliniz başarıyla güncellendi.');
            navigation.goBack();
        }
    };

    if (loading || !profile) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}>
                <ActivityIndicator size="large" color="#ffd700" />
                <Text style={tw`text-platinum-gray mt-2`}>Profil yükleniyor...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <ScrollView contentContainerStyle={tw`p-4 pb-8`}>
                {/* 1) Avatar Göster / Seç Butonu */}
                <View style={tw`items-center mb-6`}>
                    {avatarUrl ? (
                        <Image
                            source={{ uri: avatarUrl }}
                            style={tw`w-32 h-32 rounded-full mb-3`}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={tw`w-32 h-32 rounded-full bg-slate-gray justify-center items-center mb-3`}
                        >
                            <Text style={tw`text-platinum-gray`}>Fotoğraf Yok</Text>
                        </View>
                    )}

                    <Pressable
                        onPress={pickAvatar}
                        style={tw`bg-soft-black py-2 px-4 rounded-lg ${
                            uploadingAvatar ? 'opacity-60' : ''
                        }`}
                        disabled={uploadingAvatar}
                    >
                        {uploadingAvatar ? (
                            <ActivityIndicator color="#ffd700" />
                        ) : (
                            <Text style={tw`text-accent-gold`}>Fotoğraf Seç</Text>
                        )}
                    </Pressable>
                </View>

                {/* 2) Ad ve Soyad */}
                <TextInput
                    placeholder={i18n.t('firstName') || 'Ad'}
                    placeholderTextColor="#666"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                <TextInput
                    placeholder={i18n.t('lastName') || 'Soyad'}
                    placeholderTextColor="#666"
                    value={lastName}
                    onChangeText={setLastName}
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* 3) Cinsiyet */}
                <TextInput
                    placeholder={i18n.t('gender') || 'Cinsiyet'}
                    placeholderTextColor="#666"
                    value={gender}
                    onChangeText={setGender}
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* 4) Yaş */}
                <TextInput
                    placeholder={i18n.t('age') || 'Yaş'}
                    placeholderTextColor="#666"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* 5) E-Mail (pasif, güncelleme desteklemiyoruz) */}
                <TextInput
                    placeholder={i18n.t('email') || 'E-Mail'}
                    placeholderTextColor="#666"
                    value={email}
                    editable={false}
                    style={tw`border border-slate-gray bg-soft-black rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* 6) Hesap Tipi */}
                <TextInput
                    placeholder={i18n.t('accountType') || 'Hesap Tipi'}
                    placeholderTextColor="#666"
                    value={accountType}
                    onChangeText={setAccountType}
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* 7) Kilo (kg) */}
                <TextInput
                    placeholder={i18n.t('weight') || 'Kilo (kg)'}
                    placeholderTextColor="#666"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* 8) Boy (cm) */}
                <TextInput
                    placeholder={i18n.t('height') || 'Boy (cm)'}
                    placeholderTextColor="#666"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-6 text-platinum-gray`}
                />

                {/* 9) Kaydet Butonu */}
                <Pressable
                    onPress={save}
                    style={tw`bg-accent-gold py-3 rounded-lg mb-4`}
                >
                    <Text style={tw`text-premium-black text-center font-medium`}>
                        {i18n.t('save') || 'Kaydet'}
                    </Text>
                </Pressable>

                {/* 10) Hesap Silme Butonu */}
                <Pressable
                    onPress={() => setShowDel(true)}
                    style={tw`border border-accent-gold py-2 rounded-lg`}
                >
                    <Text style={tw`text-accent-gold text-center font-medium`}>
                        {i18n.t('deleteAcc') || 'Hesabı Sil'}
                    </Text>
                </Pressable>
            </ScrollView>

            {/* Hesap Silme Sheet */}
            <DeleteAccountSheet
                visible={showDel}
                onClose={() => setShowDel(false)}
            />
        </SafeAreaView>
    );
}
