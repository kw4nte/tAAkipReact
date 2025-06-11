import { useEffect, useState, useCallback } from 'react';
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
    const [dailyGoal, setDailyGoal] = useState<number | null>(null);

    const [refreshing, setRefreshing] = useState(false);

    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [isWaterModalVisible, setIsWaterModalVisible] = useState(false);
    const [waterInput, setWaterInput] = useState('');


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
    const loadUserData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('daily_calorie_goal')
            .eq('id', user.id)
            .single();

        if (error) Alert.alert('Hata', 'Kullanıcı verileri yüklenemedi.');
        else setDailyGoal(data?.daily_calorie_goal ?? null);
    }, []);

    // GÜNCELLENDİ: Ekran her açıldığında ve tarih değiştikçe verileri yeniden yükle
    // `useFocusEffect` sayesinde başka ekrandan geri dönüldüğünde de veriler güncellenir.
    useFocusEffect(useCallback(() => {
        loadUserData();
        loadMeals(selectedDate);
        loadWater(selectedDate);
    }, [selectedDate]));

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
            loadUserData(),
            loadMeals(selectedDate),
            loadWater(selectedDate)
        ]).finally(() => setRefreshing(false));
    }, [selectedDate, loadUserData, loadMeals, loadWater]);

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
                <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-lg text-platinum-gray`}>Hedef:</Text>
                    <Text style={tw`text-lg font-bold text-accent-gold`}>
                        {dailyGoal ? `${dailyGoal} kcal` : 'Hesaplanıyor...'}
                    </Text>
                </View>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-lg text-platinum-gray`}>Alınan:</Text>
                    <Text style={tw`text-lg font-bold text-white`}>{totalCalories} kcal</Text>
                </View>
                <View style={tw`flex-row justify-between items-center`}>
                    <Text style={tw`text-lg text-platinum-gray`}>Su:</Text>
                    <Text style={tw`text-lg font-bold text-white`}>{totalWater} ml</Text>
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