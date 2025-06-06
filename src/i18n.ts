import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  tr:{
    login:'Giriş Yap',
    save:'Kaydet',
    deleteAcc:'Hesabı Sil',
    confirmDel:'Hesabı silmek istediğine emin misin?',
    name:'İsim',
    firstName:'Ad',
    lastName:'Soyad',
    gender:'Cinsiyet',
    age:'Yaş',
    email:'E-posta',
    accountType:'Hesap Tipi',
    weight:'Kilo (kg)',
    height:'Boy (cm)',
    cancel:'İptal'
  },
  en:{
    login:'Sign In',
    save:'Save',
    deleteAcc:'Delete Account',
    confirmDel:'Are you sure you want to delete your account?',
    name:'Name',
    firstName:'First Name',
    lastName:'Last Name',
    gender:'Gender',
    age:'Age',
    email:'Email',
    accountType:'Account Type',
    weight:'Weight (kg)',
    height:'Height (cm)',
    cancel:'Cancel'
  },
});
i18n.enableFallback = true;
i18n.locale = Localization.locale;
export default i18n;
