import { Config } from '@jest/types';

const config: Config.InitialOptions = {
  displayName: 'cli',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/cli',
  coverageReporters: ['text', 'html'],
  passWithNoTests: true,
};

export default config;
