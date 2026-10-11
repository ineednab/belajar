/** @type {import('jest').Config} */
module.exports = {
  // Pure logic and the SQL layer run in plain Node. Component tests (later epics) can add
  // a second project with the `jest-expo/ios` preset.
  preset: 'jest-expo/node',
  roots: ['<rootDir>/src'],
};
