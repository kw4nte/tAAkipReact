// __mocks__/asyncStorageMock.js

const mockAsyncStorage = jest.genMockFromModule('@react-native-async-storage/async-storage');

let storage = {};

mockAsyncStorage.setItem = jest.fn((key, value) => {
    return new Promise((resolve) => {
        storage[key] = value;
        resolve(value);
    });
});

mockAsyncStorage.getItem = jest.fn((key) => {
    return new Promise((resolve) => {
        resolve(storage[key] ?? null);
    });
});

mockAsyncStorage.removeItem = jest.fn((key) => {
    return new Promise((resolve) => {
        delete storage[key];
        resolve();
    });
});

mockAsyncStorage.clear = jest.fn(() => {
    return new Promise((resolve) => {
        storage = {};
        resolve();
    });
});

module.exports = mockAsyncStorage;
