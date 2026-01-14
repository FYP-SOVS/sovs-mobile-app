module.exports = {
  preset: 'jest-expo',

  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],

  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native' +
      '|@react-native' +
      '|expo(nent)?' +
      '|@expo(nent)?' +
      '|expo-router' +
      '|react-navigation' +
      '|@react-navigation' +
      ')',
  ],
};
