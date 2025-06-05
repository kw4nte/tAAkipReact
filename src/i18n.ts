import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  tr:{ login:'Giriş Yap', save:'Kaydet', deleteAcc:'Hesabı Sil', confirmDel:'Hesabı silmek istediğine emin misin?', name:'İsim', weight:'Kilo (kg)', height:'Boy (cm)' },
  en:{ login:'Sign In',  save:'Save',  deleteAcc:'Delete Account', confirmDel:'Are you sure you want to delete your account?', name:'Name', weight:'Weight (kg)', height:'Height (cm)' },
});
i18n.enableFallback = true;
i18n.locale = Localization.locale;
export default i18n;
