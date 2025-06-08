import { useState, useLayoutEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Pressable, View, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../theme/tw';
import { useAppStore } from '../../store/useAppStore';
import { AntDesign } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const formatDateForSupabase = (d: Date): string => {
    return d.toISOString().split('T')[0];
};

export default function RegistrationBirthdayScreen() {
    const navigation = useNavigation();

    // Düzeltilmiş Yöntem:
    // 1. Sadece aksiyonu seçiyoruz.
    const setRegistrationFormField = useAppStore((s) => s.setRegistrationFormField);

    // 2. Başlangıç değerini sadece bir kere okuyoruz.
    // Store'da kayıtlı bir tarih varsa onu Date objesine çeviriyoruz, yoksa bugünü alıyoruz.
    const [date, setDate] = useState(() => {
        const dobString = useAppStore.getState().registrationForm.dateOfBirth;
        return dobString ? new Date(dobString) : new Date();
    });

    const [showPicker, setShowPicker] = useState(false);

    const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleContinue = () => {
        if (new Date().getFullYear() - date.getFullYear() > 100) {
            Alert.alert('Geçersiz Tarih', 'Lütfen geçerli bir doğum tarihi seçin.');
            return;
        }

        const formattedDate = formatDateForSupabase(date);
        setRegistrationFormField('dateOfBirth', formattedDate);

        navigation.navigate('RegistrationWeight' as never);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerLeft: () => (
                <Pressable onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={24} color={tw.color('platinum-gray')} />
                </Pressable>
            ),
            headerRight: () => (
                <Pressable onPress={handleContinue}>
                    <Text style={tw`text-accent-gold font-bold text-lg`}>Devam</Text>
                </Pressable>
            ),
        });
    }, [navigation, date]);

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black items-center p-6`}>
            <Text style={tw`text-platinum-gray text-2xl font-bold mt-20 mb-8 w-full text-center`}>
                Doğum tarihiniz?
            </Text>

            <Pressable
                onPress={() => setShowPicker(true)}
                style={tw`w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-4`}
            >
                <Text style={tw`text-white text-lg`}>{date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </Pressable>

            {showPicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode="date"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'inline' : 'default'} // ÖNEMLİ DEĞİŞİKLİK
                    onChange={onChange}
                    maximumDate={new Date()}
                    // iOS için stil ayarı
                    style={Platform.OS === 'ios' ? tw`h-80 w-full` : {}}
                    themeVariant="dark" // iOS için karanlık tema
                />
            )}
        </SafeAreaView>
    );
}