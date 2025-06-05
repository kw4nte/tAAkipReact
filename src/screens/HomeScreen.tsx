import { View, Text, Pressable } from 'react-native';
import tw from '../theme/tw';

export default function HomeScreen({ navigation }: any) {
    return (
        <View style={tw`flex-1 items-center justify-center bg-premium-black`}>
            <Text style={tw`text-classic-gold text-2xl font-semibold mb-4`}>
                Merhaba tAAkip 👋
            </Text>
            <Pressable
                style={tw`bg-royal-gold px-4 py-2 rounded-lg`}
                onPress={() => navigation.navigate('Details', { itemId: 1 })}
            >
                <Text style={tw`text-premium-black font-medium`}>Detaya git</Text>
            </Pressable>
        </View>
    );
}
