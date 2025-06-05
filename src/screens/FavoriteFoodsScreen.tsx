import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';

type Row = { product_code: string; name: string | null };

export default function FavoriteFoodsScreen() {
    const [list, setList] = useState<Row[]>([]);
    const uidRef = useState<string | undefined>(undefined);

    /* tek sefer uid al */
    useFocusEffect(
        useCallback(() => {
            (async () => {
                uidRef[1]((await supabase.auth.getUser()).data.user?.id);
                load();
            })();
        }, [])
    );

    /* her fokus’ta yenile */
    const load = async () => {
        const uid = uidRef[0];
        if (!uid) return;

        /* favori kodları */
        const { data: fav } = await supabase
            .from('favorites')
            .select('product_code')
            .eq('user_id', uid);

        const codes = (fav ?? []).map((f) => f.product_code);
        if (codes.length === 0) {
            setList([]);
            return;
        }

        /* products tablosundan isimleri getir */
        const { data: prod } = await supabase
            .from('products')
            .select('code,name')
            .in('code', codes);

        const merged: Row[] = codes.map((c) => ({
            product_code: c,
            name: prod?.find((p) => p.code === c)?.name ?? null,
        }));
        setList(merged);
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <FlatList
                data={list}
                keyExtractor={(i) => i.product_code}
                renderItem={({ item }) => (
                    <SafeAreaView style={tw`p-4 border-b border-slate-gray`}>
                        <Text style={tw`text-platinum-gray`}>
                            {item.name || item.product_code}
                        </Text>
                    </SafeAreaView>
                )}
                ListEmptyComponent={
                    <Text style={tw`text-platinum-gray text-center mt-10`}>
                        Henüz favori ürün yok
                    </Text>
                }
            />
        </SafeAreaView>
    );
}
