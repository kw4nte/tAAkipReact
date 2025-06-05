import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';

export default function CalorieTrackerScreen() {
    const nav = useNavigation();
    const [entries, setEntries] = useState<any[]>([]);
    const [waterMl, setWaterMl] = useState(0);

    /* UID almak için yardımcı */
    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    /* Öğünleri çek */
    const loadMeals = async () => {
        const uid = await getUid();
        if (!uid) return;
        const { data } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', uid)
            .order('eaten_at', { ascending: false });
        setEntries(data ?? []);
    };

    /* Su miktarını çek */
    const loadWater = async () => {
        const uid = await getUid();
        if (!uid) return;
        const { data } = await supabase
            .from('water')
            .select('ml')
            .eq('user_id', uid);
        const total = (data ?? []).reduce((sum, row) => sum + Number(row.ml), 0);
        setWaterMl(total);
    };

    useEffect(() => {
        loadMeals();
        loadWater();
    }, []);

    /* +250 ml su ekle */
    const addWater = async () => {
        const uid = await getUid();
        if (!uid) return;
        await supabase.from('water').insert({ user_id: uid, ml: 250 });
        loadWater();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            {/* Üst kısım: su toplamı ve butonlar */}
            <SafeAreaView style={tw`p-4 border-b border-slate-gray`}>
                <Text style={tw`text-accent-gold text-lg mb-2`}>
                    Toplam Su: {waterMl} ml
                </Text>

                <PrimaryButton onPress={addWater}>+250 ml Su</PrimaryButton>
                <PrimaryButton
                    outlined
                    onPress={() => nav.navigate('Favorites' as never)}
                    style={tw`mt-2`}
                >
                    Favori Ürünler
                </PrimaryButton>
            </SafeAreaView>

            {/* Öğün listesi */}
            <FlatList
                data={entries}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <SafeAreaView style={tw`p-4 border-b border-slate-gray`}>
                        <Text style={tw`text-accent-gold font-semibold`}>
                            {item.food_name} ({item.quantity} {item.unit})
                        </Text>
                        <Text style={tw`text-platinum-gray`}>
                            {item.calories} kcal • P{item.protein} C{item.carbs} F{item.fat}
                        </Text>
                    </SafeAreaView>
                )}
            />
        </SafeAreaView>
    );
}
