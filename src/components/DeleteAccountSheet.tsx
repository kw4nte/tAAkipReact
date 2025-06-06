import { Modal, View, Text, Pressable } from 'react-native';
import tw from '../theme/tw';
import { supabase } from '../lib/supa';
import i18n from '../i18n';

export default function DeleteAccountSheet({ visible, onClose }) {
  const del = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    const { error } = await supabase.functions.invoke('delete_user', {
      body: { user_id: uid }
    });
    if (error) {
      console.error('Delete user function error:', error.message);
      return;
    }
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) {
      console.error('Sign out error:', signOutErr.message);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={tw`flex-1 bg-premium-black p-6 justify-center`}>
        <Text style={tw`text-platinum-gray text-center mb-4`}>{i18n.t('confirmDel')}</Text>
        <Pressable onPress={del} style={tw`bg-antique-gold py-3 rounded-lg mb-2`}>
          <Text style={tw`text-premium-black text-center`}>{i18n.t('deleteAcc')}</Text>
        </Pressable>
        <Pressable onPress={onClose}>
          <Text style={tw`text-antique-gold text-center`}>{i18n.t('cancel')}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
