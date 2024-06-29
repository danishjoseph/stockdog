import { Config } from '@jest/types';

const config: Config.InitialOptions = {
  displayName: 'backend',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['text', 'html'],
  coverageDirectory: '../../coverage/apps/backend',
};

export default config;
