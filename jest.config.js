module.exports = {
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'libs/**/*.{js,jsx}',
    'source/**/*.{js,jsx}',
  ],
  roots: [
    '<rootDir>/tests/',
  ],
  moduleNameMapper: {
    '^.+\\.(css|scss)$': 'identity-obj-proxy',
  },
  setupFiles: ['./tests/jestsetup.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
};
