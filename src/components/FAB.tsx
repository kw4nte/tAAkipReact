import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from "../theme/tw";

export default function FAB({ onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={{
                position: 'absolute',
                right: 24,
                bottom: 24,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FFD700',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
            }}
        >
            <Ionicons name="add" size={32} color={tw.color('premium-black')} />
        </Pressable>
    );
}
