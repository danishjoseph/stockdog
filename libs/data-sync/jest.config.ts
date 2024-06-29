import { Config } from '@jest/types';

const config: Config.InitialOptions = {
  displayName: 'data-sync',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/data-sync',
  coverageReporters: ['text', 'html'],
};

export default config;
