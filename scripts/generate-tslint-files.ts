/**
 * Generate the following files:
 * - tslint.json
 * - tslint-rebeccastevens.json
 * - tslint-rebeccastevens-recommended.json
 */

import * as fs from 'fs-extra';

import recommendedRuleSet from '../rulesets/recommended';
import standardRuleSet from '../rulesets/standard';

// Create the standard rule set.
const writeStandard = fs.outputJson(
  'tslint-rebeccastevens.json',
  standardRuleSet,
  {
    spaces: 2
  }
);

// Create the recommended rule set.
const writeRecommended = fs.outputJson(
  'tslint-rebeccastevens-recommended.json',
  recommendedRuleSet,
  {
    spaces: 2
  }
);

// Create the tslint.json file for the project.
const writeTslint = fs.outputJson(
  'tslint.json',
  {
    ...recommendedRuleSet
    // Add overrides here.
  },
  {
    spaces: 2
  }
);

// Wait for all the promises to resolve.
Promise.all([
  writeStandard,
  writeRecommended,
  writeTslint
])
  .then(() => {
    console.error('TSLint files have been generated.');
  })
  .catch((error: unknown) => {
    console.error('Something went wrong.', error);
    process.exit(1);
  });
