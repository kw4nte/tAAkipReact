// src/screens/FitnessScreen.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';
import tw from '../theme/tw';

export default function FitnessScreen() {
    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}>
            <Text style={tw`text-accent-gold text-2xl mb-2`}>Yakında Eklenecek 🎯</Text>
            <Text style={tw`text-platinum-gray text-center px-4`}>
                Sağlık ve egzersiz bölümü üzerinde çalışıyoruz. Biraz sabırlı olun!
            </Text>
        </SafeAreaView>
    );
}
