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
    Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import i18n from '../i18n';
import DeleteAccountSheet from '../components/DeleteAccountSheet';

// 1. Arayüzü yeni şemaya göre güncelle: age -> date_of_birth, email kaldırıldı
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
}


export default function ProfileEditScreen() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState<boolean>(true);

    // Form alanları için local state’ler
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
    const [showDel, setShowDel] = useState<boolean>(false);
    const [activityLevel, setActivityLevel] = useState<string>('');


    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    // Mount olduğunda mevcut profili çek, form alanlarını doldur
    useEffect(() => {
        (async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı.');
                navigation.goBack();
                return;
            }

            // E-postayı auth.user'dan al
            setUserEmail(user.email ?? 'E-posta bulunamadı');

            // 2. “profiles” tablosundan doğru sütunları çek
            const { data, error } = await supabase
                .from<Profile>('profiles')
                .select(`
                    id, avatar_url, first_name, last_name, gender,
                    date_of_birth, account_type, weight_kg, height_cm, created_at
                `)
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Profil yükleme hatası:', error.message);
                Alert.alert('Hata', 'Profil bilgileri yüklenemedi.');
                navigation.goBack();
            } else if (data) {
                setFirstName(data.first_name ?? '');
                setLastName(data.last_name ?? '');
                setGender(data.gender ?? '');
                setWeight(data.weight_kg != null ? String(data.weight_kg) : '');
                setHeight(data.height_cm != null ? String(data.height_cm) : '');
                setAvatarUrl(data.avatar_url);
                setActivityLevel(data.activity_level ?? '');
                // Gelen doğum tarihi string'ini Date objesine çevir
                if (data.date_of_birth) {
                    setDateOfBirth(new Date(data.date_of_birth));
                }
            }
            setLoading(false);
        })();
    }, []);

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(Platform.OS === 'ios'); // iOS'te açık kalmalı, Android'de kapanmalı
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };

    // Avatar / Profil fotoğrafı seç & Supabase Storage’a yükleme
    const pickAvatar = async () => {
        // Kullanıcıya seçenek sun
        Alert.alert(
            "Fotoğraf Ekle",
            "Nereden bir fotoğraf seçmek istersiniz?",
            [
                {
                    text: "Kamera",
                    onPress: async () => {
                        // Kamera izinlerini iste
                        const permission = await ImagePicker.requestCameraPermissionsAsync();
                        if (permission.granted === false) {
                            Alert.alert("Hata", "Kamera kullanımı için izin vermeniz gerekiyor.");
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            quality: 0.7,
                        });
                        if (!result.canceled) {
                            uploadAvatar(result.assets[0]);
                        }
                    },
                },
                {
                    text: "Galeri",
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.7,
                        });
                        if (!result.canceled) {
                            uploadAvatar(result.assets[0]);
                        }
                    },
                },
                {
                    text: "İptal",
                    style: "cancel",
                },
            ]
        );
    };

    // Yükleme mantığını ayrı bir fonksiyona taşıyalım
    const uploadAvatar = async (asset: ImagePicker.ImagePickerAsset) => {
        if (!asset.uri) return;

        try {
            setUploadingAvatar(true);
            const uid = await getUid();
            if (!uid) throw new Error('Kullanıcı oturumu bulunamadı.');

            const fileExt = asset.uri.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`; // Dosya adı sadece tarih olsun
            const filePath = `${uid}/${fileName}`; // Dosya yolu "kullanici_id/dosya_adi.jpg" olsun


            // Dosya yüklemek için FormData kullanmak en sağlam yöntemdir.
            const formData = new FormData();
            formData.append('file', {
                uri: asset.uri,
                name: fileName,
                type: asset.mimeType ?? 'image/jpeg',
            } as any);

            // 1. Storage'a Yükleme
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, formData);

            if (uploadError) {
                throw uploadError;
            }

            // 2. Yüklenen Dosyanın Public URL'ini Alma
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            // 3. 'profiles' Tablosundaki 'avatar_url' Kolonunu Güncelleme
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', uid);

            if (updateError) {
                throw updateError;
            }

            // 4. Arayüzdeki state'i güncelleme
            setAvatarUrl(publicUrl);
            Alert.alert("Başarılı", "Profil fotoğrafınız güncellendi.");

        } catch (err: any) {
            console.error("Avatar yükleme hatası:", err);
            Alert.alert('Hata', err.message || 'Fotoğraf yüklenirken bir sorun oluştu.');
        } finally {
            setUploadingAvatar(false);
        }
    };


    // “Kaydet” işlemi: tüm alanları güncelle
    const save = async () => {
        const uid = await getUid();
        if (!uid) return;

        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Uyarı', 'Lütfen ad ve soyad girin.');
            return;
        }

        const genderToSave = gender ? gender.toLowerCase().trim() : null;

        const updates = {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            gender: genderToSave,
            weight_kg: weight ? Number(weight) : null,
            height_cm: height ? Number(height) : null,
            // Date objesini 'YYYY-MM-DD' formatına çevir
            date_of_birth: dateOfBirth.toISOString().split('T')[0],
        };

        const { error } = await supabase.from('profiles').update(updates).eq('id', uid);

        if (error) {
            console.error('Profil güncelleme hatası:', error.message);
            Alert.alert('Hata', 'Profil güncelleme işlemi başarısız oldu.');
        } else {
            await supabase.functions.invoke('calculate-user-metrics');
            Alert.alert('Başarılı', 'Profiliniz başarıyla güncellendi.');
            navigation.goBack();
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}>
                <ActivityIndicator size="large" color="#ffd700" />
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
                            <Text style={tw`text-accent-gold`}>Fotoğraf Ekle</Text>
                        )}
                    </Pressable>
                </View>

                {/* Düzeltilmiş Dikey Hizalama Stilleriyle Inputlar */}
                <TextInput
                    placeholder="Ad"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={[tw`border border-slate-gray rounded-lg px-3 mb-3 text-platinum-gray`, {height: 50, textAlignVertical: 'center'}]}
                />
                <TextInput
                    placeholder="Soyad"
                    value={lastName}
                    onChangeText={setLastName}
                    style={[tw`border border-slate-gray rounded-lg px-3 mb-3 text-platinum-gray`, {height: 50, textAlignVertical: 'center'}]}
                />
                {/* Cinsiyet için TextInput yerine butonlar */}
                <Text style={tw`text-slate-400 text-sm ml-1 mb-1 mt-3`}>Cinsiyet</Text>
                <View style={tw`flex-row justify-between mb-3`}>
                    <Pressable
                        onPress={() => setGender('male')}
                        style={[tw`flex-1 mr-1 rounded-lg p-3 border-2`, gender === 'male' ? tw`border-accent-gold bg-accent-gold/20` : tw`border-slate-700`]}
                    >
                        <Text style={tw`text-white text-center`}>Erkek</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => setGender('female')}
                        style={[tw`flex-1 ml-1 rounded-lg p-3 border-2`, gender === 'female' ? tw`border-accent-gold bg-accent-gold/20` : tw`border-slate-700`]}
                    >
                        <Text style={tw`text-white text-center`}>Kadın</Text>
                    </Pressable>
                </View>

                <TextInput
                    placeholder="Kilo (kg)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    style={[tw`border border-slate-gray rounded-lg px-3 mb-3 text-platinum-gray`, {height: 50, textAlignVertical: 'center'}]}
                />
                <TextInput
                    placeholder="Boy (cm)"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    style={[tw`border border-slate-gray rounded-lg px-3 mb-6 text-platinum-gray`, {height: 50, textAlignVertical: 'center'}]}
                />

                {/* YENİ: Aktivite Seviyesi Seçimi */}
                <Text style={tw`text-slate-400 text-sm ml-1 mb-1 mt-3`}>Aktivite Seviyesi</Text>
                <View style={tw`flex-col mb-3`}>
                    <Pressable onPress={() => setActivityLevel('sedentary')} style={[tw`w-full p-3 border-2 rounded-lg mb-2`, activityLevel === 'sedentary' ? tw`border-accent-gold bg-accent-gold/20` : tw`border-slate-700`]}><Text style={tw`text-white text-center`}>Masa başı / Hareketsiz</Text></Pressable>
                    <Pressable onPress={() => setActivityLevel('light')} style={[tw`w-full p-3 border-2 rounded-lg mb-2`, activityLevel === 'light' ? tw`border-accent-gold bg-accent-gold/20` : tw`border-slate-700`]}><Text style={tw`text-white text-center`}>Az Hareketli / Hafif Egzersiz</Text></Pressable>
                    <Pressable onPress={() => setActivityLevel('moderate')} style={[tw`w-full p-3 border-2 rounded-lg mb-2`, activityLevel === 'moderate' ? tw`border-accent-gold bg-accent-gold/20` : tw`border-slate-700`]}><Text style={tw`text-white text-center`}>Orta Derecede Hareketli</Text></Pressable>
                    <Pressable onPress={() => setActivityLevel('active')} style={[tw`w-full p-3 border-2 rounded-lg`, activityLevel === 'active' ? tw`border-accent-gold bg-accent-gold/20` : tw`border-slate-700`]}><Text style={tw`text-white text-center`}>Çok Aktif</Text></Pressable>
                </View>

                {/* 4. Yaş yerine Doğum Tarihi Düzenleyici */}
                <Text style={tw`text-slate-400 text-sm ml-1 mb-1`}>Doğum Tarihi</Text>
                <Pressable
                    onPress={() => setShowPicker(true)}
                    style={[tw`border border-slate-gray rounded-lg px-3 mb-3 text-platinum-gray`, {height: 50, justifyContent: 'center'}]}
                >
                    <Text style={tw`text-platinum-gray`}>
                        {dateOfBirth.toLocaleDateString('tr-TR')}
                    </Text>
                </Pressable>

                {showPicker && (
                    <DateTimePicker
                        value={dateOfBirth}
                        mode="date"
                        // DEĞİŞİKLİK: 'spinner' yerine platforma özel en iyi görünümü kullan
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        onChange={onDateChange}
                        themeVariant="dark" // iOS için
                        style={Platform.OS === 'ios' ? tw`h-80 w-full` : {}} // iOS için
                    />
                )}

                {/* E-posta (düzenlenemez) */}
                <Text style={tw`text-slate-400 text-sm ml-1 mb-1`}>E-posta (değiştirilemez)</Text>
                <TextInput
                    value={userEmail}
                    editable={false}
                    style={[tw`border border-slate-gray bg-soft-black rounded-lg px-3 mb-6 text-platinum-gray`, {height: 50, textAlignVertical: 'center'}]}
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
