import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Modal,
    ActivityIndicator,
    FlatList,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as Device from 'expo-device';
import tw from '../theme/tw';
import { fetchProduct, Product } from '../services/openFoodApi';
import { supabase } from '../lib/supa';
import UnitPicker, { units } from '../components/UnitPicker';
import PrimaryButton from '../components/PrimaryButton';

export default function FoodScannerScreen() {
    const [hasPerm, setHasPerm] = useState<boolean | null>(null);
    const [mode, setMode] = useState<'idle' | 'scan' | 'manual'>('idle');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    const [quantity, setQuantity] = useState('100');
    const [unit, setUnit] = useState(units[0]);

    const canUseCamera = Device.isDevice;

    /* UID almak için */
    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    useEffect(() => {
        (async () => {
            if (canUseCamera) {
                const r = await Camera.requestCameraPermissionsAsync();
                setHasPerm(r.status === 'granted');
            }
            loadHistory();
        })();
    }, []);

    /* Son taramaları getir */
    const loadHistory = async () => {
        const uid = await getUid();
        if (!uid) return;

        const { data } = await supabase
            .from('scan_history')
            .select('product_code')
            .eq('user_id', uid)
            .order('scanned_at', { ascending: false })
            .limit(20);

        setHistory((data ?? []).map((x) => x.product_code));
    };

    /* Ürün verisini API’den çek ve kaydet */
    const handleFetch = async (code: string) => {
        if (!code) return;
        setLoading(true);

        const prod = await fetchProduct(code);
        setProduct(prod);

        const uid = await getUid();
        if (uid) {
            await supabase
                .from('scan_history')
                .insert({ user_id: uid, product_code: code });
            loadHistory();
        }

        setLoading(false);
    };

    /* Tracker’a ekle */
    const addToTracker = async () => {
        if (!product) return;
        const uid = await getUid();
        if (!uid) return;
        const n = product.nutriments;

        await supabase.from('meals').insert({
            user_id: uid,
            food_name: product.product_name || 'Ürün',
            calories: n['energy-kcal_100g'] || 0,
            protein: n.proteins_100g || 0,
            carbs: n.carbohydrates_100g || 0,
            fat: n.fat_100g || 0,
            quantity: Number(quantity),
            unit,
        });

        setProduct(null);
        setMode('idle');
    };

    /* Favoriye kaydet */
    const addFavorite = async () => {
        if (!product) return;
        const uid = await getUid();
        if (!uid) return;
        await supabase.from('favorites').upsert({
            user_id: uid,
            product_code: product.code,
        });
        alert('Favori olarak kaydedildi');
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {/* Üstte iki buton: Barkod Tara / Barkod Gir */}
            <View style={tw`flex-row mb-4`}>
                <Pressable
                    disabled={!canUseCamera}
                    onPress={() => setMode('scan')}
                    style={tw`flex-1 py-3 mr-2 rounded-lg ${
                        mode === 'scan' ? 'bg-accent-gold' : 'bg-slate-gray'
                    } ${!canUseCamera && 'opacity-40'}`}
                >
                    <Text
                        style={tw`text-center ${
                            mode === 'scan' ? 'text-premium-black' : 'text-platinum-gray'
                        }`}
                    >
                        Barkod Tara
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setMode('manual')}
                    style={tw`flex-1 py-3 rounded-lg ${
                        mode === 'manual' ? 'bg-accent-gold' : 'bg-slate-gray'
                    }`}
                >
                    <Text
                        style={tw`text-center ${
                            mode === 'manual' ? 'text-premium-black' : 'text-platinum-gray'
                        }`}
                    >
                        Barkod Gir
                    </Text>
                </Pressable>
            </View>

            {/* Manuel barkod girişi */}
            {mode === 'manual' && (
                <View style={tw`flex-row mb-4`}>
                    <TextInput
                        placeholder="Barkod numarası"
                        placeholderTextColor="#666"
                        style={tw`flex-1 border border-slate-gray text-platinum-gray px-3 py-2 rounded-lg`}
                        keyboardType="number-pad"
                        value={input}
                        onChangeText={setInput}
                    />
                    <PrimaryButton onPress={() => handleFetch(input)} style={tw`ml-2`}>
                        Ara
                    </PrimaryButton>
                </View>
            )}

            {/* Kamera ile tarama */}
            {mode === 'scan' && canUseCamera && hasPerm && (
                <Camera
                    onBarCodeScanned={({ data }) => {
                        setMode('idle');
                        handleFetch(data);
                    }}
                    style={tw`flex-1 mb-4`}
                />
            )}

            {/* Son taramalar listesi */}
            {history.length > 0 && (
                <View style={tw`flex-1`}>
                    <Text style={tw`text-accent-gold mb-2`}>Son Taramalar</Text>
                    <FlatList
                        data={history}
                        keyExtractor={(c) => c}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => {
                                    setInput(item);
                                    setMode('manual');
                                    handleFetch(item);
                                }}
                                style={tw`py-2 border-b border-slate-gray`}
                            >
                                <Text style={tw`text-platinum-gray`}>{item}</Text>
                            </Pressable>
                        )}
                    />
                </View>
            )}

            {/* Ürün Detay Modal’i */}
            <Modal visible={loading || !!product} animationType="slide">
                <SafeAreaView style={tw`flex-1 bg-premium-black p-6`}>
                    {loading && <ActivityIndicator size="large" color="#ffd700" />}

                    {product && (
                        <ScrollView>
                            <Text style={tw`text-accent-gold text-2xl font-bold mb-2`}>
                                {product.product_name}
                            </Text>

                            {/* Porsiyon seçimi */}
                            <View style={tw`flex-row items-center mb-3`}>
                                <Text style={tw`text-platinum-gray mr-2`}>Porsiyon:</Text>
                                <TextInput
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                    style={tw`border border-slate-gray w-20 text-center text-platinum-gray mr-2`}
                                />
                                <UnitPicker value={unit} onChange={setUnit} />
                            </View>

                            {/* Makro bilgisi */}
                            <Text style={tw`text-platinum-gray mb-2`}>
                                Kalori (100 g): {product.nutriments['energy-kcal_100g'] || 0} kcal
                            </Text>

                            {/* Öğününe Ekle */}
                            <PrimaryButton onPress={addToTracker}>Öğününe Ekle</PrimaryButton>

                            {/* Favoriye Kaydet */}
                            <PrimaryButton outlined onPress={addFavorite} style={tw`mt-2`}>
                                Favoriye Kaydet ⭐️
                            </PrimaryButton>

                            {/* Kapat */}
                            <Pressable
                                onPress={() => {
                                    setProduct(null);
                                    setLoading(false);
                                }}
                                style={tw`mt-4`}
                            >
                                <Text style={tw`text-platinum-gray text-center`}>Kapat</Text>
                            </Pressable>
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
