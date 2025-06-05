import { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from '../theme/tw';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any) {
        console.error('Unhandled error:', error);
    }

    reset = () => this.setState({ hasError: false });

    render() {
        if (this.state.hasError) {
            return (
                <View style={tw`flex-1 items-center justify-center bg-premium-black p-6`}>
                    <Text style={tw`text-classic-gold text-xl mb-4`}>
                        Bir şeyler ters gitti 🚧
                    </Text>
                    <Pressable
                        onPress={this.reset}
                        style={tw`bg-royal-gold px-4 py-2 rounded-lg`}
                    >
                        <Text style={tw`text-premium-black font-medium`}>Yeniden Dene</Text>
                    </Pressable>
                </View>
            );
        }
        return this.props.children;
    }
}
