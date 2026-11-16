module.exports = {
  preset: 'react-native',
  transform: { '^.+\\.jsx$': 'babel-jest' },
  transformIgnorePatterns: ['node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation)/)'],
};
