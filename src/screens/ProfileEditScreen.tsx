import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import i18n from '../i18n';
import DeleteAccountSheet from '../components/DeleteAccountSheet';

export default function ProfileEditScreen() {
    const navigation = useNavigation();
    const uid = supabase.auth.getUserSync()?.id;

    const [name,   setName]   = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [showDel, setShowDel] = useState(false);

    /* profil verisini çek */
    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('profiles')
                .select('full_name, weight_kg, height_cm')
                .eq('id', uid)
                .single();

            if (data) {
                setName(data.full_name || '');
                setWeight(String(data.weight_kg ?? ''));
                setHeight(String(data.height_cm ?? ''));
            }
        })();
    }, []);

    /* kaydet */
    const save = async () => {
        await supabase
            .from('profiles')
            .update({
                full_name: name,
                weight_kg: weight ? Number(weight) : null,
                height_cm: height ? Number(height) : null,
            })
            .eq('id', uid);

        navigation.goBack();
    };

    return (
        <SafeAreaView style={tw`flex-1 bg-premium-black`}>
            <ScrollView contentContainerStyle={tw`p-4`}>
                {/* isim */}
                <TextInput
                    placeholder={i18n.t('name')}
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* kilo */}
                <TextInput
                    placeholder={i18n.t('weight')}
                    placeholderTextColor="#666"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-3 text-platinum-gray`}
                />

                {/* boy */}
                <TextInput
                    placeholder={i18n.t('height')}
                    placeholderTextColor="#666"
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    style={tw`border border-slate-gray rounded-lg px-3 py-2 mb-6 text-platinum-gray`}
                />

                {/* kaydet */}
                <Pressable
                    onPress={save}
                    style={tw`bg-antique-gold py-3 rounded-lg mb-4`}
                >
                    <Text style={tw`text-premium-black text-center font-medium`}>
                        {i18n.t('save')}
                    </Text>
                </Pressable>

                {/* hesap sil */}
                <Pressable
                    onPress={() => setShowDel(true)}
                    style={tw`border border-antique-gold py-2 rounded-lg`}
                >
                    <Text style={tw`text-antique-gold text-center font-medium`}>
                        {i18n.t('deleteAcc')}
                    </Text>
                </Pressable>
            </ScrollView>

            {/* hesap silme sheet */}
            <DeleteAccountSheet visible={showDel} onClose={() => setShowDel(false)} />
        </SafeAreaView>
    );
}
