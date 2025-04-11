
// ---------------------------------------------------------------------------
// From https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/ #1
// ---------------------------------------------------------------------------
/*
import type { Config } from 'jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
})

export default {
  ...presetConfig,
} satisfies Config
*/
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// From https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/ #2
// ---------------------------------------------------------------------------
/*
import type { Config } from 'jest'
import { TS_EXT_TO_TREAT_AS_ESM, ESM_TS_TRANSFORM_PATTERN } from 'ts-jest'

export default {
  extensionsToTreatAsEsm: [...TS_EXT_TO_TREAT_AS_ESM],
  transform: {
    [ESM_TS_TRANSFORM_PATTERN]: [
      'ts-jest',
      {
        //...other `ts-jest` options
        useESM: true,
      },
    ],
  },
} satisfies Config
*/
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// From https://stackoverflow.com/questions/68520619/jest-typescript-with-es-module-in-node-modules-error-must-use-import-to-load-e
// ---------------------------------------------------------------------------
import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  extensionsToTreatAsEsm: ['.ts'],
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['./dist'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },
  verbose: true,
}

export default config
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// From: unknown
// ---------------------------------------------------------------------------
/*
// jest.config.ts
import type { JestConfigWithTsJest } from 'ts-jest';
import createJestConfig from 'ts-jest';

const { createDefaultEsmPreset } = createJestConfig();

const config: JestConfigWithTsJest = {
  ...createDefaultEsmPreset(),
  testEnvironment: 'node',
  // Add any additional Jest configuration options here
};

export default config;
*/
// ---------------------------------------------------------------------------

