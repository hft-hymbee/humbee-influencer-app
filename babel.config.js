module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Must be LAST. Reanimated's plugin rewrites worklets; anything after it is not transformed.
    'react-native-reanimated/plugin',
  ],
};
