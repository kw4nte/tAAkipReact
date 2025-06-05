import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import tw from '../theme/tw';

export default function FitnessScreen() {
    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black justify-center items-center`}>
            <Text style={tw`text-accent-gold text-xl`}>Coming Soon 🎯</Text>
        </SafeAreaView>
    );
}