// src/components/FoodDetailModal.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    Pressable,
    ScrollView,
    Image,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import tw from '../theme/tw';
import { Product } from '../services/openFoodApi';

// Props tipini tanımlıyoruz: Bu component dışarıdan hangi verileri alacak?
type FoodDetailModalProps = {
    product: Product | null;
    visible: boolean;
    loading: boolean;
    onClose: () => void;
    onAddToTracker: (portion: number, unit: 'g' | 'ml') => void;
    onAddToFavorites: () => void;
};

// Madde 3: Besin değerlerini gösterecek olan küçük kutu component'i
const NutrientBox = ({ label, value, unit, style = '' }: { label: string, value: string, unit: string, style?: string }) => (
    <View style={tw`bg-slate-800 rounded-lg p-3 items-center justify-center ${style}`}>
        <Text style={tw`text-white font-bold text-lg`}>{value}</Text>
        <Text style={tw`text-slate-400 text-xs`}>{label}</Text>
        <Text style={tw`text-slate-400 text-xs`}>{unit}</Text>
    </View>
);

const FoodDetailModal = ({
                             product,
                             visible,
                             loading,
                             onClose,
                             onAddToTracker,
                             onAddToFavorites,
                         }: FoodDetailModalProps) => {
    // Porsiyon state'leri artık bu component'in içinde
    const [portion, setPortion] = useState('100');
    const [displayUnit, setDisplayUnit] = useState<'g' | 'ml'>('g');

    // Ürün değiştiğinde porsiyon ve birimi sıfırla
    useEffect(() => {
        if (product) {
            setPortion('100');
            setDisplayUnit(product.serving_quantity_unit === 'ml' ? 'ml' : 'g');
        }
    }, [product]);

    if (!product && !loading) return null;

    const n = product?.nutriments;
    const factor = Number(portion) / 100;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={tw`flex-1 bg-premium-black`}>
                {loading && (
                    <View style={tw`flex-1 justify-center items-center`}>
                        <ActivityIndicator size="large" color="#ffd700" />
                    </View>
                )}

                {product && n && (
                    <ScrollView contentContainerStyle={tw`p-4 pb-8`}>
                        {/* Madde 1: Üstten boşluk için pt-4 eklendi */}
                        <View style={tw`pt-4`}>
                            {product.image_url && (
                                <Image
                                    source={{ uri: product.image_url }}
                                    style={tw`w-full h-48 rounded-lg mb-4`}
                                    resizeMode="cover"
                                />
                            )}
                            <Text style={tw`text-accent-gold text-2xl font-bold mb-4`}>
                                {product.product_name}
                            </Text>
                        </View>

                        {/* Porsiyon Ayarı */}
                        <View style={tw`flex-row items-center mb-4 bg-slate-800 p-3 rounded-lg`}>
                            <Text style={tw`text-platinum-gray mr-3 font-semibold text-base`}>Porsiyon:</Text>
                            <TextInput
                                value={portion}
                                onChangeText={setPortion}
                                keyboardType="numeric"
                                // Değişiklikler burada: Stil güncellendi ve maxLength eklendi
                                style={tw`border border-accent-gold bg-soft-black text-accent-gold text-center w-24 text-lg px-2 py-1 rounded-lg mr-2`}
                                maxLength={5} // 5 haneden fazla giriş engellendi
                            />
                            <View style={tw`border border-accent-gold bg-soft-black rounded-lg`}>
                                {/* Değişiklik burada: Stil güncellendi */}
                                <Text style={tw`text-accent-gold px-3 py-1 text-lg`}>{displayUnit}</Text>
                            </View>
                        </View>

                        {/* Ana Buton */}
                        <Pressable
                            onPress={() => onAddToTracker(Number(portion), displayUnit)}
                            style={tw`bg-accent-gold py-3 rounded-lg mb-2`}
                        >
                            <Text style={tw`text-premium-black text-center font-medium`}>Öğününe Ekle</Text>
                        </Pressable>

                        {/* Madde 4: Yeni Buton Tasarımı */}
                        <View style={tw`flex-row justify-between mb-6`}>
                            <Pressable
                                onPress={onAddToFavorites}
                                style={tw`border border-accent-gold py-3 rounded-lg w-[48%] items-center`}
                            >
                                <Text style={tw`text-accent-gold text-center font-medium`}>Favoriye Kaydet ⭐️</Text>
                            </Pressable>
                            <Pressable
                                onPress={onClose}
                                style={tw`bg-slate-700 py-3 rounded-lg w-[48%] items-center`}
                            >
                                <Text style={tw`text-white text-center font-medium`}>Kapat</Text>
                            </Pressable>
                        </View>

                        {/* Madde 3: Yeni Besin Değerleri Tasarımı */}
                        <View style={tw`mb-4`}>
                            <NutrientBox
                                label="Kalori"
                                value={Math.round((n['energy-kcal_100g'] ?? 0) * factor).toString()}
                                unit="kcal"
                                style="bg-accent-gold/20 border border-accent-gold"
                            />
                        </View>

                        <View style={tw`flex-row justify-between mb-4`}>
                            <NutrientBox label="Karbonhidrat" value={((n.carbohydrates_100g ?? 0) * factor).toFixed(1)} unit="g" style="w-[32%]" />
                            <NutrientBox label="Protein" value={((n.proteins_100g ?? 0) * factor).toFixed(1)} unit="g" style="w-[32%]" />
                            <NutrientBox label="Yağ" value={((n.fat_100g ?? 0) * factor).toFixed(1)} unit="g" style="w-[32%]" />
                        </View>

                        <View style={tw`flex-row justify-between flex-wrap`}>
                            <NutrientBox label="Lif" value={((n.fiber_100g ?? 0) * factor).toFixed(1)} unit="g" style="w-[48%] mb-4" />
                            <NutrientBox label="Şeker" value={((n.sugars_100g ?? 0) * factor).toFixed(1)} unit="g" style="w-[48%] mb-4" />
                            <NutrientBox label="Doymuş Yağ" value={((n['saturated-fat_100g'] ?? 0) * factor).toFixed(1)} unit="g" style="w-[48%]" />
                            <NutrientBox label="Sodyum" value={((n.sodium_100g ?? 0) * factor).toFixed(1)} unit="g" style="w-[48%]" />
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
};

export default FoodDetailModal;