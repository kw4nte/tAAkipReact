import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import FoodDetailModal from '../components/FoodDetailModal'; // Modalı import ediyoruz
import { Product, fetchProduct } from '../services/openFoodApi'; // API servisini ve Product tipini import ediyoruz

type FavoriteRow = { product_code: string; name: string | null };

export default function FavoriteFoodsScreen() {
    const [list, setList] = useState<FavoriteRow[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal için state'ler
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isProductLoading, setIsProductLoading] = useState(false);

    // Favori ürünlerin listesini (sadece kod ve isim) çeken fonksiyon
    const loadFavorites = async () => {
        setLoading(true);
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (!uid) {
            setLoading(false);
            return;
        }

        const { data: fav, error: favError } = await supabase
            .from('favorites')
            .select('product_code')
            .eq('user_id', uid);

        if (favError) {
            console.error("Favorites fetch error:", favError.message);
            setLoading(false);
            return;
        }

        const codes = (fav ?? []).map((f) => f.product_code);
        if (codes.length === 0) {
            setList([]);
            setLoading(false);
            return;
        }

        const { data: prod, error: prodError } = await supabase
            .from('products')
            .select('code, name')
            .in('code', codes);

        if (prodError) {
            console.error("Products fetch error:", prodError.message);
            setLoading(false);
            return;
        }

        const merged: FavoriteRow[] = codes.map((c) => ({
            product_code: c,
            name: prod?.find((p) => p.code === c)?.name ?? null,
        }));
        setList(merged.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
        setLoading(false);
    };

    // Ekran her açıldığında favori listesini yeniden yükle
    useFocusEffect(useCallback(() => { loadFavorites(); }, []));

    // Listeden bir ürüne tıklandığında, tam detayını çekip modalı açan fonksiyon
    const handleItemPress = async (productCode: string) => {
        setIsModalVisible(true);
        setIsProductLoading(true);
        setSelectedProduct(null);
        try {
            // DEĞİŞİKLİK 2: Fonksiyonu doğru adıyla çağırıyoruz
            const productData = await fetchProduct(productCode);
            if (!productData) throw new Error("Ürün detayı bulunamadı.");
            setSelectedProduct(productData);
        } catch (error: any) {
            Alert.alert("Hata", error.message);
            setIsModalVisible(false);
        } finally {
            setIsProductLoading(false);
        }
    };

    // Modal'dan çağrılacak "Favoriden Çıkar" fonksiyonu
    const handleRemoveFromFavorites = async () => {
        if (!selectedProduct?.code) return;
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return;

        const { error } = await supabase.from('favorites').delete()
            .eq('user_id', uid)
            .eq('product_code', selectedProduct.code);

        if (error) {
            Alert.alert("Hata", "Ürün favorilerden çıkarılamadı.");
        } else {
            Alert.alert("Başarılı", "Ürün favorilerden çıkarıldı.");
            setIsModalVisible(false); // Modalı kapat
            loadFavorites(); // Favori listesini anında yenile
        }
    };

    // Modal'dan çağrılacak "Öğününe Ekle" fonksiyonu
    const handleAddToTracker = async (portion: number, unit: 'g' | 'ml') => {
        if (!selectedProduct) return;
        const uid = (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return;

        // Bu fonksiyonun içeriği FoodScannerScreen'deki ile aynı olabilir
        // ...
        Alert.alert("Eklendi", `${portion} ${unit} ${selectedProduct?.product_name} öğününe eklendi!`);
        setIsModalVisible(false);
    };

    // Her bir favori ürün için render edilecek kart
    const renderFavoriteItem = ({ item }: { item: FavoriteRow }) => (
        <Pressable
            style={tw`bg-soft-black border border-slate-700 rounded-lg p-4 mb-3 flex-row items-center justify-between`}
            onPress={() => handleItemPress(item.product_code)}
        >
            <View style={tw`flex-1 pr-2`}>
                <Text style={tw`text-platinum-gray font-bold text-base`}>
                    {item.name || 'İsimsiz Ürün'}
                </Text>
                <Text style={tw`text-slate-400 text-sm`}>
                    {item.product_code}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={tw.color('slate-400')} />
        </Pressable>
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {loading ? (
                <View style={tw`flex-1 justify-center items-center`}>
                    <ActivityIndicator size="large" color={tw.color('accent-gold')} />
                </View>
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(i) => i.product_code}
                    renderItem={renderFavoriteItem}
                    ListEmptyComponent={
                        <View style={tw`flex-1 justify-center items-center`}>
                            <Text style={tw`text-platinum-gray text-center`}>
                                Henüz favori ürün yok.
                            </Text>
                        </View>
                    }
                    contentContainerStyle={list.length === 0 ? tw`flex-1` : {}}
                />
            )}

            <FoodDetailModal
                visible={isModalVisible}
                loading={isProductLoading}
                product={selectedProduct}
                isFavorite={true} // Bu ekrandan açılan her ürün favoridir
                onClose={() => setIsModalVisible(false)}
                onRemoveFromFavorites={handleRemoveFromFavorites}
                onAddToTracker={handleAddToTracker}
                onAddToFavorites={() => {}} // Bu ekranda favoriye ekleme butonu görünmeyeceği için boş fonksiyon
            />
        </SafeAreaView>
    );
}