// src/screens/FoodScannerScreen.tsx

import { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    Alert,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import tw from '../theme/tw';
import { fetchProduct, Product } from '../services/openFoodApi';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';
import FoodDetailModal from '../components/FoodDetailModal';

interface ScanHistoryItem {
    product_code: string;
    product_name: string | null;
}

export default function FoodScannerScreen() {
    const selectedDate = useAppStore((s) => s.selectedDate);
    const [permission, requestPermission] = useCameraPermissions();
    const [mode, setMode] = useState<'idle' | 'scan' | 'manual'>('idle');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [history, setHistory] = useState<ScanHistoryItem[]>([]);

    const [isFlashOn, setIsFlashOn] = useState(false);
    const isFocused = useIsFocused();
    const isScanningRef = useRef(false);

    const canUseCamera = Device.isDevice;
    const getUid = async () => (await supabase.auth.getUser()).data.user?.id;

    useEffect(() => {
        if (canUseCamera && !permission?.granted) {
            requestPermission();
        }
        loadHistory();
    }, []);

    useEffect(() => {
        if (!isFocused) {
            setIsFlashOn(false);
        }
    }, [isFocused]);

    const loadHistory = async () => {
        const uid = await getUid();
        if (!uid) return;
        const { data, error } = await supabase
            .from('scan_history')
            .select('product_code, product_name')
            .eq('user_id', uid)
            .order('scanned_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('History load error:', error.message);
            return;
        }
        setHistory(data ?? []);
    };


    // handleFetch fonksiyonunu bulun ve içeriğini güncelleyin
    const handleFetch = async (code: string) => {
        if (!code.trim()) return;
        setLoading(true);
        setMode('idle');

        try {
            const fetched = await fetchProduct(code.trim());
            if (!fetched) {
                Alert.alert('Ürün Bulunamadı', 'Bu barkoda ait ürün bulunamadı.');
                return;
            }
            setProduct(fetched);

            const uid = await getUid();
            if (uid) {
                // --- YENİ EKLENEN BÖLÜM ---
                // Ürün bilgilerini kendi 'products' tablomuza da kaydedelim.
                // upsert: kayıt varsa günceller, yoksa yeni kayıt oluşturur.
                const { error: upsertError } = await supabase.from('products').upsert({
                    code: fetched.code,
                    name: fetched.product_name,
                    // Diğer ürün detaylarını da buraya ekleyebilirsiniz (image_url vs.)
                });
                if (upsertError) console.error('Product upsert error:', upsertError.message);
                // --- YENİ BÖLÜM SONU ---


                const { error: insertErr } = await supabase.from('scan_history').insert({
                    user_id: uid,
                    product_code: code.trim(),
                    product_name: fetched.product_name || 'İsimsiz Ürün',
                });
                if (insertErr) console.error('History insert error:', insertErr.message);
                else await loadHistory();
            }
        } catch (error) {
            console.error("handleFetch error:", error);
            Alert.alert("Hata", "Ürün bilgisi alınırken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };


    const handleAddToTracker = async (portion: number, unit: 'g' | 'ml') => {
        console.log('1. Öğüne ekleme fonksiyonu tetiklendi.'); // DEBUG
        if (!product) {
            console.log('HATA: Ürün bulunamadı (product state is null).'); // DEBUG
            return;
        }

        setLoading(true);

        const uid = await getUid();
        if (!uid) {
            Alert.alert('Hata', 'Kullanıcı bulunamadı.');
            setLoading(false);
            return;
        }

        const eatenAtDate = selectedDate ? new Date(selectedDate) : new Date();

        console.log(`2. Öğün şu tarihe eklenecek: ${eatenAtDate.toISOString()}`); // DEBUG

        const n = product.nutriments;
        const factor = portion / 100;

        const mealData = {
            user_id: uid,
            food_name: product.product_name || 'Ürün',
            calories: Math.round((n['energy-kcal_100g'] ?? 0) * factor),
            protein: (n.proteins_100g ?? 0) * factor,
            carbs: (n.carbohydrates_100g ?? 0) * factor,
            fat: (n.fat_100g ?? 0) * factor,
            quantity: portion,
            unit: unit,
            eaten_at: eatenAtDate.toISOString(),
        };

        console.log('3. Supabase\'e gönderilecek veri:', mealData); // DEBUG

        const { error } = await supabase.from('meals').insert(mealData);


        setLoading(false);

        if (error) {
            console.error('Add to tracker error:', error.message); // DEBUG
            Alert.alert('Hata', `Öğün eklenemedi. Hata: ${error.message}`);
        } else {
            console.log('4. Öğün başarıyla eklendi.'); // DEBUG
            Alert.alert('Başarılı', 'Öğün kaydedildi.');
            setProduct(null);
        }
    };

    const handleAddFavorite = async () => {
        if (!product) return;
        const uid = await getUid();
        if (!uid) { Alert.alert('Hata', 'Kullanıcı bulunamadı.'); return; }

        const { error } = await supabase.from('favorites').upsert({
            user_id: uid,
            product_code: product.code,
        });

        if (error) { Alert.alert('Hata', 'Favoriye eklenemedi.'); }
        else { Alert.alert('Başarılı', 'Favorilere eklendi.'); }
    };

    const handleModalClose = () => {
        setProduct(null);
        setLoading(false);
        // Tarama kilidini burada açmıyoruz, çünkü tarama moduna girerken açılıyor.
    };


    // Render history item
    const renderHistoryItem = ({ item }: { item: ScanHistoryItem }) => (
        <Pressable
            onPress={() => {
                setInput(item.product_code);
                setMode('manual');
                handleFetch(item.product_code);
            }}
            // Dikey boşluk py-4 oldu, sınır rengi değişti
            style={tw`py-4 border-b border-slate-700`}
        >
            <Text
                // Font büyütüldü ve kalınlaştırıldı
                style={tw`text-platinum-gray text-base font-semibold`}
            >
                {item.product_name || item.product_code}
            </Text>
        </Pressable>
    );

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <SafeAreaView style={tw`flex-1 bg-premium-black p-4 justify-center items-center`}>
                <Text style={tw`text-platinum-gray text-center mb-4`}>
                    Kamerayı kullanmak için izin vermelisiniz.
                </Text>
                <PrimaryButton onPress={requestPermission}>İzin Ver</PrimaryButton>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black p-4`}>
            {/* 1) Scan / Manual Buttons */}
            <View style={tw`flex-row mb-4`}>
                <Pressable
                    disabled={!canUseCamera}
                    onPress={() => {
                        // Tarama moduna girerken ref'i sıfırla
                        isScanningRef.current = false;
                        setMode('scan');
                    }}
                    style={tw`flex-1 py-3 mr-2 rounded-lg ${
                        mode === 'scan' ? 'bg-accent-gold' : 'bg-slate-gray'
                    } ${!canUseCamera && 'opacity-40'}`}
                >
                    <Text style={tw`text-center ${mode === 'scan' ? 'text-premium-black' : 'text-platinum-gray'}`}>
                        Barkod Tara
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setMode('manual')}
                    style={tw`flex-1 py-3 rounded-lg ${
                        mode === 'manual' ? 'bg-accent-gold' : 'bg-slate-gray'
                    }`}
                >
                    <Text style={tw`text-center ${mode === 'manual' ? 'text-premium-black' : 'text-platinum-gray'}`}>
                        Barkod Gir
                    </Text>
                </Pressable>
            </View>

            {/* 2) Manual barcode input */}
            {mode === 'manual' && (
                <View style={tw`flex-row items-center mb-4`}>
                    <TextInput
                        placeholder="Barkod numarası"
                        placeholderTextColor="#666"
                        style={tw`flex-1 border border-slate-gray text-platinum-gray px-3 py-2 rounded-lg`}
                        keyboardType="number-pad"
                        value={input}
                        onChangeText={setInput}
                    />
                    {/* Madde 1: Input temizleme ve klavye kapatma butonu */}
                    {input.length > 0 && (
                        <Pressable
                            onPress={() => {
                                setInput('');
                                Keyboard.dismiss();
                            }}
                            style={tw`p-2 ml-2`}
                        >
                            <Ionicons name="close-circle" size={24} color="grey" />
                        </Pressable>
                    )}
                    <PrimaryButton onPress={() => handleFetch(input)} style={tw`ml-2`}>
                        Ara
                    </PrimaryButton>
                </View>
            )}

            {/* Madde 2: Yeni Kamera ve Flaş Butonu Alanı */}
            {mode === 'scan' && canUseCamera && (
                <View style={tw`flex-1 justify-center items-center`}>
                    {/* Kamera için kare alan */}
                    <View style={tw`w-full aspect-1 overflow-hidden rounded-lg`}>
                        <CameraView
                            enableTorch={isFlashOn}
                            onBarcodeScanned={(scanningResult) => {
                                // Senkron kilit mekanizması
                                if (!isScanningRef.current) {
                                    isScanningRef.current = true;
                                    handleFetch(scanningResult.data);
                                }
                            }}
                            style={tw`flex-1`}
                        />
                        {/* Tarama Çerçevesi ve Çizgisi */}
                        <View style={tw`absolute inset-0 justify-center items-center`}>
                            <View style={tw`w-3/4 h-1/2 border-2 border-white/50 rounded-lg`} />
                            <View style={tw`absolute w-3/4 h-px bg-red-500`} />
                        </View>
                    </View>
                    {/* Flaş Butonu */}
                    <Pressable
                        onPress={() => setIsFlashOn(prev => !prev)}
                        style={tw`mt-4 p-3 rounded-full ${isFlashOn ? 'bg-yellow-400' : 'bg-slate-600'}`}
                    >
                        <Ionicons name={isFlashOn ? "flash" : "flash-off"} size={24} color="white" />
                    </Pressable>
                </View>
            )}

            {/* History List */}
            {mode !== 'scan' && history.length > 0 && !product && (
                <View style={tw`flex-1`}>
                    <Text style={tw`text-accent-gold mb-2 text-xl font-bold`}>Son Taramalar</Text>
                    <FlatList
                        data={history}
                        // Madde 3: Benzersiz key için index kullanıldı
                        keyExtractor={(item, index) => `${item.product_code}-${index}`}
                        renderItem={renderHistoryItem}
                    />
                </View>
            )}

            {/* Product Detail Modal */}
            <FoodDetailModal
                visible={loading || !!product}
                loading={loading}
                product={product}
                onClose={handleModalClose}
                onAddToTracker={handleAddToTracker}
                onAddToFavorites={handleAddFavorite}
            />
        </SafeAreaView>
    );
}
