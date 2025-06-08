// src/screens/FoodScannerScreen.tsx

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
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as Device from 'expo-device';
import tw from '../theme/tw';
import { fetchProduct, Product } from '../services/openFoodApi';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';

export default function FoodScannerScreen() {
    const [hasPerm, setHasPerm] = useState<boolean | null>(null);
    const [mode, setMode] = useState<'idle' | 'scan' | 'manual'>('idle');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [history, setHistory] = useState<string[]>([]);

    const [portion, setPortion] = useState('100');
    const [displayUnit, setDisplayUnit] = useState<'g' | 'ml'>('g');

    const canUseCamera = Device.isDevice;

    // UID helper
    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    // 1) On mount: request camera permission & load history
    useEffect(() => {
        (async () => {
            if (canUseCamera) {
                const r = await Camera.requestCameraPermissionsAsync();
                setHasPerm(r.status === 'granted');
            }
            await loadHistory();
        })();
    }, []);

    // 2) Load scan history
    const loadHistory = async () => {
        const uid = await getUid();
        if (!uid) return;
        const { data, error } = await supabase
            .from('scan_history')
            .select('product_code')
            .eq('user_id', uid)
            .order('scanned_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('History load error:', error.message);
            return;
        }
        setHistory((data ?? []).map((x) => x.product_code));
    };

    // 3) Fetch product from API & save to history
    const handleFetch = async (code: string) => {
        if (!code.trim()) return;
        setLoading(true);

        // 3a) Fetch from API
        const fetched = await fetchProduct(code.trim());
        if (!fetched) {
            Alert.alert('Ürün Bulunamadı', 'Bu barkoda ait ürün bulunamadı.');
            setLoading(false);
            return;
        }

        setProduct(fetched);
        setDisplayUnit(fetched.serving_quantity_unit === 'ml' ? 'ml' : 'g');
        setPortion('100');

        // 3b) Insert into scan_history
        const uid = await getUid();
        if (uid) {
            const { error: insertErr } = await supabase.from('scan_history').insert({
                user_id: uid,
                product_code: code.trim(),
            });
            if (insertErr) {
                console.error('History insert error:', insertErr.message);
            } else {
                await loadHistory();
            }
        }

        setLoading(false);
    };

    // 4) Add to tracker
    const addToTracker = async () => {
        if (!product) return;
        const uid = await getUid();
        if (!uid) {
            Alert.alert('Hata', 'Kullanıcı bulunamadı.');
            return;
        }

        const n = product.nutriments;
        const factor = Number(portion) / 100;

        const { error } = await supabase.from('meals').insert({
            user_id: uid,
            food_name: product.product_name || 'Ürün',
            calories: Math.round((n['energy-kcal_100g'] ?? 0) * factor),
            protein: (n.proteins_100g ?? 0) * factor,
            carbs: (n.carbohydrates_100g ?? 0) * factor,
            fat: (n.fat_100g ?? 0) * factor,
            quantity: Number(portion),
            unit: displayUnit,
        });

        if (error) {
            console.error('Add to tracker error:', error.message);
            Alert.alert('Hata', 'Öğün eklenemedi.');
        } else {
            Alert.alert('Başarılı', 'Öğün kaydedildi.');
            setProduct(null);
        }
    };

    // 5) Add to favorites
    const addFavorite = async () => {
        if (!product) return;
        const uid = await getUid();
        if (!uid) {
            Alert.alert('Hata', 'Kullanıcı bulunamadı.');
            return;
        }
        // Sadece user_id ve product_code minimal olarak gönderiyoruz.
        const { error } = await supabase.from('favorites').upsert({
            user_id: uid,
            product_code: product.code,
            // Eğer favoriler tablonuzda product_name veya image_url alanı varsa,
            // burada bu iki alanı da ekleyebilirsiniz. Ama eğer tablonuzda bu sütunlar yoksa,
            // aşağıdaki yorum içindeki satırları kaldırıp yalnızca user_id/product_code gönderin.
            // product_name: product.product_name,
            // image_url: product.image_url ?? '',
        });
        if (error) {
            console.error('Favorite insert error:', error.message);
            Alert.alert('Hata', 'Favoriye eklenemedi.');
        } else {
            Alert.alert('Başarılı', 'Favorilere eklendi.');
        }
    };

    // Render history item
    const renderHistoryItem = ({ item }: { item: string }) => (
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
    );

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {/* 1) Scan / Manual Buttons */}
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

            {/* 2) Manual barcode input */}
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

            {/* 3) Camera View */}
            {mode === 'scan' && canUseCamera && hasPerm && (
                <Camera
                    onBarCodeScanned={({ data }) => {
                        setMode('idle');
                        handleFetch(data);
                    }}
                    style={tw`flex-1 mb-4`}
                />
            )}

            {/* 4) History List */}
            {history.length > 0 && !product && (
                <View style={tw`flex-1`}>
                    <Text style={tw`text-accent-gold mb-2`}>Son Taramalar</Text>
                    <FlatList
                        data={history}
                        keyExtractor={(code, index) => `${code}-${index}`} // <-- Burada değişiklik oldu
                        renderItem={renderHistoryItem}
                    />
                </View>
            )}

            {/* 5) Product Detail Modal */}
            <Modal visible={loading || !!product} animationType="slide">
                <SafeAreaView style={tw`flex-1 bg-premium-black`}>
                    {loading && (
                        <View style={tw`flex-1 justify-center items-center`}>
                            <ActivityIndicator size="large" color="#ffd700" />
                        </View>
                    )}

                    {product && (
                        <ScrollView
                            contentContainerStyle={tw`p-4 pb-8`}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* 5.1) Product Image */}
                            {product.image_url && (
                                <Image
                                    source={{ uri: product.image_url }}
                                    style={tw`w-full h-48 rounded-lg mb-4`}
                                    resizeMode="cover"
                                />
                            )}

                            {/* 5.2) Product Name */}
                            <Text style={tw`text-accent-gold text-2xl font-bold mb-4`}>
                                {product.product_name}
                            </Text>

                            {/* 5.3) Portion / Unit Row */}
                            <View style={tw`flex-row items-center mb-4`}>
                                <Text style={tw`text-platinum-gray mr-2`}>Porsiyon:</Text>
                                <TextInput
                                    value={portion}
                                    onChangeText={setPortion}
                                    keyboardType="numeric"
                                    style={tw`border border-accent-gold bg-soft-black text-accent-gold text-center w-16 px-2 py-1 rounded-lg mr-2`}
                                />
                                <View style={tw`border border-accent-gold bg-soft-black rounded-lg`}>
                                    <Text style={tw`text-accent-gold px-2 py-1`}>
                                        {displayUnit}
                                    </Text>
                                </View>
                            </View>

                            {/* 5.4) Add to Tracker & Favorite Buttons */}
                            <Pressable
                                onPress={addToTracker}
                                style={tw`bg-accent-gold py-3 rounded-lg mb-2`}
                            >
                                <Text style={tw`text-premium-black text-center font-medium`}>
                                    Öğününe Ekle
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={addFavorite}
                                style={tw`border border-accent-gold py-3 rounded-lg mb-4`}
                            >
                                <Text style={tw`text-accent-gold text-center font-medium`}>
                                    Favoriye Kaydet ⭐️
                                </Text>
                            </Pressable>

                            {/* 5.5) Main Macros (Calories, Fat, Carbs, Protein) */}
                            {(() => {
                                const n = product.nutriments;
                                const f = Number(portion) / 100;

                                const cal = (n['energy-kcal_100g'] ?? 0) * f;
                                const fat = (n.fat_100g ?? 0) * f;
                                const carbs = (n.carbohydrates_100g ?? 0) * f;
                                const protein = (n.proteins_100g ?? 0) * f;

                                return (
                                    <>
                                        <Text style={tw`text-accent-gold text-lg mb-2`}>
                                            Kalori ({portion} {displayUnit}): {Math.round(cal)} kcal
                                        </Text>
                                        <Text style={tw`text-platinum-gray mb-1`}>
                                            Yağ ({portion} {displayUnit}): {fat.toFixed(1)} g
                                        </Text>
                                        <Text style={tw`text-platinum-gray mb-1`}>
                                            Karbonhidrat ({portion} {displayUnit}): {carbs.toFixed(1)} g
                                        </Text>
                                        <Text style={tw`text-platinum-gray mb-4`}>
                                            Protein ({portion} {displayUnit}): {protein.toFixed(1)} g
                                        </Text>
                                    </>
                                );
                            })()}

                            {/* 5.6) Additional Nutrients (Fiber, Sugars, Sodium, Saturated Fat) */}
                            {(() => {
                                const n = product.nutriments;
                                const f = Number(portion) / 100;

                                const fiber = (n.fiber_100g ?? 0) * f;
                                const sugars = (n.sugars_100g ?? 0) * f;
                                const sodium = (n.sodium_100g ?? 0) * f;
                                const satFat = (n['saturated-fat_100g'] ?? 0) * f;

                                return (
                                    <>
                                        <Text style={tw`text-platinum-gray mb-1`}>
                                            Lif ({portion} {displayUnit}): {fiber.toFixed(1)} g
                                        </Text>
                                        <Text style={tw`text-platinum-gray mb-1`}>
                                            Şeker ({portion} {displayUnit}): {sugars.toFixed(1)} g
                                        </Text>
                                        <Text style={tw`text-platinum-gray mb-1`}>
                                            Sodyum ({portion} {displayUnit}): {sodium.toFixed(1)} g
                                        </Text>
                                        <Text style={tw`text-platinum-gray mb-4`}>
                                            Doymuş Yağ ({portion} {displayUnit}): {satFat.toFixed(1)} g
                                        </Text>
                                    </>
                                );
                            })()}

                            {/* 5.7) Close Button */}
                            <Pressable
                                onPress={() => {
                                    setProduct(null);
                                    setLoading(false);
                                }}
                                style={tw`mb-8`}
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
