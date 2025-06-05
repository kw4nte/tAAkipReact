import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
                backgroundColor: '#bfa76f',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
            }}
        >
            <Ionicons name="add" size={32} color="#0d0d0d" />
        </Pressable>
    );
}
