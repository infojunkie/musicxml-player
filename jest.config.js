// @ts-check
/* eslint-env browser */

/**
 * An object with Jest options.
 * @type {import('@jest/types').Config.InitialOptions}
 */
const options = {
  preset: 'ts-jest',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'jsdom',
};

module.exports = options;
