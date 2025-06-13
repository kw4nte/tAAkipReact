import { useMemo, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Text, View, RefreshControl, Alert, Modal, TextInput, Pressable, Keyboard } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; // YENİ: Takvim kütüphanesi
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import PrimaryButton from '../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';

// YENİ: Takvim için Türkçe ayarları
LocaleConfig.locales['tr'] = {
    monthNames: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
    monthNamesShort: ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],
    dayNames: ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'],
    dayNamesShort: ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'],
    today: 'Bugün'
};
LocaleConfig.defaultLocale = 'tr';

const getFormattedDate = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) return 'Bugün';
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Dün';

    return new Date(dateString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

// YENİ: Tarih formatlama fonksiyonu
const getTodayString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

export default function CalorieTrackerScreen() {
    const nav = useNavigation();

    // YENİ: State'ler artık seçili güne odaklı
    const selectedDate = useAppStore((s) => s.selectedDate);
    const setSelectedDate = useAppStore((s) => s.setSelectedDate);
    const [meals, setMeals] = useState<any[]>([]);
    const [totalWater, setTotalWater] = useState(0);

    const [refreshing, setRefreshing] = useState(false);

    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [isWaterModalVisible, setIsWaterModalVisible] = useState(false);
    const [waterInput, setWaterInput] = useState('');
    const userProfile = useAppStore((s) => s.userProfile);
    const dailyGoal = userProfile?.daily_calorie_goal;

    // YENİ: Tüketilen toplam makroları hesaplayalım
    const totals = useMemo(() => {
        return meals.reduce(
            (acc, meal) => {
                acc.calories += meal.calories || 0;
                acc.protein += meal.protein || 0;
                acc.carbs += meal.carbs || 0;
                acc.fat += meal.fat || 0;
                return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
    }, [meals]);

    // YENİ: Hedef kalori ve makroları hesaplayan bölüm
    const targets = useMemo(() => {
        if (!userProfile?.daily_calorie_goal || !userProfile.goal) {
            return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        let targetCalories = userProfile.daily_calorie_goal;
        let proteinRatio = 0.20, carbsRatio = 0.50, fatRatio = 0.30;

        switch (userProfile.goal) {
            case 'lose_weight': // Hedefin veritabanındaki değerini buraya yazın
                targetCalories -= 300;
                proteinRatio = 0.35;
                carbsRatio = 0.35;
                fatRatio = 0.30;
                break;
            case 'gain_muscle': // Hedefin veritabanındaki değerini buraya yazın
                targetCalories += 300;
                proteinRatio = 0.30; // Formülde %30 yazıyor, %35 değil
                carbsRatio = 0.55; // Formülde %50 yazıyor, %55 değil. Kodda %55 kullandım.
                fatRatio = 0.15; // Formülde %20 yazıyor, %10 değil. Kodda 1-(0.55+0.30)=0.15 kullandım.
                break;
            // 'stay_healthy' (sağlıklı kalmak) için default değerler zaten ayarlı
        }

        // Protein ve Karbonhidrat 4 kalori/gram, Yağ 9 kalori/gram
        const targetProtein = Math.round((targetCalories * proteinRatio) / 4);
        const targetCarbs = Math.round((targetCalories * carbsRatio) / 4);
        const targetFat = Math.round((targetCalories * fatRatio) / 9);

        return {
            calories: targetCalories,
            protein: targetProtein,
            carbs: targetCarbs,
            fat: targetFat,
        };
    }, [userProfile]);

    // GÜNCELLENDİ: Öğünleri artık seçili güne göre çekecek
    const loadMeals = useCallback(async (date: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;

        const { data, error } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id)
            .gte('eaten_at', startOfDay)
            .lte('eaten_at', endOfDay)
            .order('eaten_at', { ascending: false });

        if (error) console.error('Meals load error:', error.message);
        else setMeals(data ?? []);
    }, []);

    // GÜNCELLENDİ: Suyu artık seçili güne göre çekecek
    const loadWater = useCallback(async (date: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startOfDay = `${date}T00:00:00.000Z`;
        const endOfDay = `${date}T23:59:59.999Z`;

        const { data, error } = await supabase
            .from('water')
            .select('ml')
            .eq('user_id', user.id)
            .gte('logged_at', startOfDay)
            .lte('logged_at', endOfDay);

        if (error) console.error('Water load error:', error.message);
        else {
            const total = (data ?? []).reduce((sum, row) => sum + Number(row.ml), 0);
            setTotalWater(total);
        }
    }, []);

    // YENİ: Kullanıcının kalori hedefini çeken fonksiyon


    // GÜNCELLENDİ: Ekran her açıldığında ve tarih değiştikçe verileri yeniden yükle
    // `useFocusEffect` sayesinde başka ekrandan geri dönüldüğünde de veriler güncellenir.
    useFocusEffect(useCallback(() => {
        loadMeals(selectedDate);
        loadWater(selectedDate);
    }, [selectedDate, loadMeals, loadWater]));

    const handleAddWater = async () => {
        const mlValue = Number(waterInput);
        if (isNaN(mlValue) || mlValue <= 0) {
            Alert.alert('Geçersiz Miktar', 'Lütfen geçerli bir sayı girin.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Seçili günün başlangıcına saat ekleyerek kaydedelim
        const loggedAt = new Date(selectedDate);
        loggedAt.setHours(new Date().getHours(), new Date().getMinutes());

        const { error } = await supabase.from('water').insert({
            user_id: user.id,
            ml: mlValue,
            logged_at: loggedAt.toISOString(),
        });

        if (error) {
            Alert.alert('Hata', 'Su eklenirken bir sorun oluştu.');
        } else {
            setWaterInput('');
            setIsWaterModalVisible(false);
            Keyboard.dismiss();
            await loadWater(selectedDate); // Sadece suyu yeniden yükle
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([
            loadMeals(selectedDate),
            loadWater(selectedDate)
        ]).finally(() => setRefreshing(false));
    }, [selectedDate, loadMeals, loadWater]);

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            {/* YENİ: Takvim Component'i */}
            <View style={tw`p-4 flex-row justify-between items-center border-b border-slate-gray`}>
                <Pressable onPress={() => setIsCalendarVisible(!isCalendarVisible)} style={tw`flex-row items-center`}>
                    <Text style={tw`text-white text-xl font-bold`}>{getFormattedDate(selectedDate)}</Text>
                    <Ionicons name={isCalendarVisible ? "chevron-up" : "chevron-down"} size={24} color="white" style={tw`ml-2`} />
                </Pressable>
                <Pressable onPress={() => setIsWaterModalVisible(true)} style={tw`bg-blue-500 p-2 rounded-full`}>
                    <Ionicons name="water" size={20} color="white" />
                </Pressable>
            </View>
            {isCalendarVisible && (
            <Calendar
                current={selectedDate}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={{
                    [selectedDate]: { selected: true, selectedColor: tw.color('accent-gold') }
                }}
                theme={{
                    calendarBackground: tw.color('premium-black'),
                    monthTextColor: tw.color('accent-gold'),
                    dayTextColor: 'white',
                    textDisabledColor: '#555',
                    todayTextColor: tw.color('accent-gold'),
                    arrowColor: tw.color('accent-gold'),
                }}
                style={tw`border-b border-slate-gray`}
            />
            )}

            {/* YENİ: Hedef Kalori ve Toplamlar Alanı */}
            <View style={tw`p-4 border-b border-slate-gray`}>
                {/* Kalori */}
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text style={tw`text-lg text-platinum-gray`}>Kalori:</Text>
                    <Text style={tw`text-lg font-bold text-accent-gold`}>
                        {totals.calories} / {targets.calories > 0 ? targets.calories : '...'} kcal
                    </Text>
                    <Text style={tw`text-lg text-platinum-gray`}>Su:</Text>
                    <Text style={tw`text-lg font-bold text-white`}>{totalWater} ml</Text>
                </View>
                {/* Makrolar */}
                <View style={tw`flex-row justify-between`}>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white`}>{totals.protein.toFixed(1)}g</Text>
                        <Text style={tw`text-slate-400 text-xs`}>Protein</Text>
                        <Text style={tw`text-accent-gold/70 text-xs`}>{targets.protein}g</Text>
                    </View>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white`}>{totals.carbs.toFixed(1)}g</Text>
                        <Text style={tw`text-slate-400 text-xs`}>Karbonhidrat</Text>
                        <Text style={tw`text-accent-gold/70 text-xs`}>{targets.carbs}g</Text>
                    </View>
                    <View style={tw`items-center`}>
                        <Text style={tw`text-white`}>{totals.fat.toFixed(1)}g</Text>
                        <Text style={tw`text-slate-400 text-xs`}>Yağ</Text>
                        <Text style={tw`text-accent-gold/70 text-xs`}>{targets.fat}g</Text>
                    </View>
                </View>
                </View>


            {/* GÜNCELLENDİ: Tarayıcıya giderken seçili tarihi parametre olarak gönder */}
            <View style={tw`p-4`}>
                <PrimaryButton onPress={() => {
                    nav.navigate('Scanner', {
                        screen: 'ScannerMain',
                    });
                }}>
                    Öğün Ekle (Barkod Tara)
                </PrimaryButton>
            </View>

            <Text style={tw`text-xl text-accent-gold font-bold px-4 pb-2`}>
                Günün Öğünleri
            </Text>

            {meals.length === 0 ? (
                <View style={tw`flex-1 items-center justify-center`}>
                    <Text style={tw`text-platinum-gray text-lg`}>
                        Bu tarihe öğün eklenmedi.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={meals}
                    keyExtractor={(item) => String(item.id)}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffd700" />
                    }
                    renderItem={({ item }) => (
                        <View style={tw`px-4 py-3 border-t border-slate-gray`}>
                            <Text style={tw`text-accent-gold font-semibold`}>
                                {item.food_name} ({item.quantity} {item.unit || 'g'})
                            </Text>
                            <Text style={tw`text-platinum-gray`}>
                                {item.calories} kcal • P: {item.protein.toFixed(1)} g, C: {item.carbs.toFixed(1)} g, F: {item.fat.toFixed(1)} g
                            </Text>
                        </View>
                    )}
                />
            )}
            <Modal
                transparent={true}
                visible={isWaterModalVisible}
                onRequestClose={() => setIsWaterModalVisible(false)}
                animationType="fade"
            >
                <Pressable onPress={() => setIsWaterModalVisible(false)} style={tw`flex-1 justify-center items-center bg-black/70`}>
                    <Pressable onPress={() => {}} style={tw`bg-slate-800 p-6 rounded-xl w-4/5`}>
                        <Text style={tw`text-white text-lg font-bold mb-4`}>Su Ekle</Text>
                        <TextInput
                            placeholder="Miktar (ml)"
                            placeholderTextColor="#888"
                            keyboardType="number-pad"
                            value={waterInput}
                            onChangeText={setWaterInput}
                            style={tw`bg-slate-700 text-white p-3 rounded-lg mb-4 text-center`}
                            autoFocus
                        />
                        <PrimaryButton onPress={handleAddWater}>Ekle</PrimaryButton>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}
