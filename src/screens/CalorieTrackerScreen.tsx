// src/screens/CalorieTrackerScreen.tsx

import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    FlatList,
    Text,
    View,
    TextInput,
    Pressable,
    RefreshControl,
    Alert,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';

export default function CalorieTrackerScreen() {
    const nav = useNavigation();

    // Öğün ve su verileri
    const [entries, setEntries] = useState<any[]>([]);
    const [waterMl, setWaterMl] = useState(0);

    // Pull-to-refresh durumu
    const [refreshing, setRefreshing] = useState(false);

    // Su ekleme için input state’i
    const [waterInput, setWaterInput] = useState<string>('');

    // Kullanıcının UID’sini dönen yardımcı fonksiyon
    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    // Öğünleri çeken fonksiyon
    const loadMeals = useCallback(async () => {
        const uid = await getUid();
        if (!uid) return;

        const { data, error } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', uid)
            .order('eaten_at', { ascending: false });

        if (error) {
            console.error('Meals load error:', error.message);
            return;
        }
        setEntries(data ?? []);
    }, []);

    // Su miktarını çeken fonksiyon
    const loadWater = useCallback(async () => {
        const uid = await getUid();
        if (!uid) return;

        const { data, error } = await supabase
            .from('water')
            .select('ml')
            .eq('user_id', uid);

        if (error) {
            console.error('Water load error:', error.message);
            return;
        }
        const total = (data ?? []).reduce((sum, row) => sum + Number(row.ml), 0);
        setWaterMl(total);
    }, []);

    // Uygulama açıldığında bir kez çalışacak:
    // • Öğünleri ve suyu yükle
    // • Realtime abonelikleri başlat
    useEffect(() => {
        loadMeals();
        loadWater();

        // “meals” tablosundaki değişiklikleri dinle
        const mealsChannel = supabase
            .channel('realtime-meals')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'meals' },
                () => {
                    loadMeals();
                }
            )
            .subscribe();

        // “water” tablosundaki değişiklikleri dinle
        const waterChannel = supabase
            .channel('realtime-water')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'water' },
                () => {
                    loadWater();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(mealsChannel);
            supabase.removeChannel(waterChannel);
        };
    }, [loadMeals, loadWater]);

    // Su ekleme fonksiyonu (kullanıcı girdiği mL’ye göre)
    const addWater = async () => {
        const uid = await getUid();
        if (!uid) {
            Alert.alert('Hata', 'Kullanıcı bulunamadı.');
            return;
        }
        const mlValue = Number(waterInput);
        if (isNaN(mlValue) || mlValue <= 0) {
            Alert.alert('Uyarı', 'Lütfen geçerli bir miktar girin (ör. 250).');
            return;
        }

        // Supabase’e yeni su kaydı ekle
        const { error } = await supabase.from('water').insert({
            user_id: uid,
            ml: mlValue,
        });
        if (error) {
            console.error('Add water error:', error.message);
            Alert.alert('Hata', 'Su eklenemedi.');
            return;
        }

        // Başarılı ekleme sonrası inputu sıfırla ve hemen su toplamını yenile
        setWaterInput('');
        loadWater();
        // Realtime dinleyici zaten loadWater()’u tetikleyecek
    };

    // Pull-to-refresh: listeyi ve suyu yeniden yükler
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([loadMeals(), loadWater()]).finally(() => {
            setRefreshing(false);
        });
    }, [loadMeals, loadWater]);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            {/* Üst kısım: su toplamı, su ekleme inputu ve butonlar */}
            <View style={tw`p-4 border-b border-slate-gray`}>
                {/* Toplam su */}
                <Text style={tw`text-accent-gold text-lg mb-3`}>
                    Toplam Su: {waterMl} ml
                </Text>

                {/* Su miktarı için input + ML yazısı + Ekle butonu */}
                <View style={tw`flex-row items-center mb-4`}>
                    <TextInput
                        placeholder="mL"
                        placeholderTextColor="#666"
                        keyboardType="number-pad"
                        value={waterInput}
                        onChangeText={setWaterInput}
                        style={tw`border border-accent-gold text-accent-gold text-right w-20 px-2 py-1 rounded-lg mr-2`}
                    />
                    <Text style={tw`text-accent-gold mr-4`}>ml</Text>
                    <Pressable
                        onPress={addWater}
                        style={tw`bg-accent-gold py-2 px-4 rounded-lg`}
                    >
                        <Text style={tw`text-premium-black text-center font-medium`}>
                            Ekle
                        </Text>
                    </Pressable>
                </View>

                {/* Favoriler sayfasına geçiş */}
                <PrimaryButton
                    outlined
                    onPress={() => nav.navigate('Favorites' as never)}
                    style={tw`mb-2`}
                >
                    Favori Ürünler
                </PrimaryButton>
            </View>

            {/* Öğün Listesi */}
            {entries.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center`}>
                    <Text style={tw`text-platinum-gray text-lg`}>
                        Henüz öğün eklenmedi.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    keyExtractor={(item) => String(item.id)}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#ffd700"
                        />
                    }
                    renderItem={({ item }) => (
                        <View style={tw`p-4 border-b border-slate-gray`}>
                            <Text style={tw`text-accent-gold font-semibold`}>
                                {item.food_name} ({item.quantity} {item.unit})
                            </Text>
                            <Text style={tw`text-platinum-gray`}>
                                {item.calories} kcal • P{item.protein.toFixed(1)}{' '}
                                C{item.carbs.toFixed(1)} F{item.fat.toFixed(1)}
                            </Text>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
</TouchableWithoutFeedback>

    );
}
