import { Pressable, Text, StyleProp, ViewStyle } from 'react-native';
import tw from '../theme/tw';

type Props = {
    children: string;
    onPress: () => void;
    outlined?: boolean;
    style?: StyleProp<ViewStyle>;
};

export default function PrimaryButton({
    children,
    onPress,
    outlined,
    style,
}: Props) {
    const base = outlined
        ? 'border border-accent-gold px-4 py-3'
        : 'bg-accent-gold px-4 py-3';
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) =>
                tw.style(
                    base,
                    'rounded-lg',
                    pressed && (outlined ? 'bg-accent-gold-dark' : 'opacity-80'),
                    style
                )
            }
        >
            <Text
                style={tw.style(
                    outlined ? 'text-accent-gold' : 'text-premium-black',
                    'text-center font-medium'
                )}
            >
                {children}
            </Text>
        </Pressable>
    );
}
