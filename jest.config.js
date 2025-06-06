// jest.config.js

module.exports = {
  preset: 'react-native',

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { babelConfig: true }],
    '^.+\\.[jt]sx?$': 'babel-jest'
  },

  transformIgnorePatterns: [
    // Diğer paketleri olduğu gibi bırakıyoruz; expo-local-authentication'ı artık buraya eklemeye gerek kalmadı
    'node_modules/(?!(react-native|@react-native\\/js-polyfills|@react-native-community|@react-navigation|@react-native-url-polyfill|expo|@expo|@unimodules)/)'
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  roots: ['<rootDir>/src'],

  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/asyncStorageMock.js',
    // Aşağıdaki satır sayesinde "expo-local-authentication" import’u doğrudan bizim mock’a yönlenecek:
    '^expo-local-authentication$': '<rootDir>/__mocks__/expo-local-authentication.ts'
  },

  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect']
};
