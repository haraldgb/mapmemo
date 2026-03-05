// eslint-disable-next-line import/no-default-export
export default {
  testEnvironment: 'node',
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    // TS151002: isolatedModules:true (required for NodeNext) breaks ESM output in this setup.
    // Type safety is covered by `pnpm type-check` (tsc --noEmit), not ts-jest.
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { useESM: true, diagnostics: { ignoreCodes: [151002] } },
    ],
  },
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
