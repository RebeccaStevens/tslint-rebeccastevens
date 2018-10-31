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
fs.outputJson(
  'tslint-rebeccastevens.json',
  standardRuleSet,
  {
    spaces: 2
  }
);

// Create the recommended rule set.
fs.outputJson(
  'tslint-rebeccastevens-recommended.json',
  recommendedRuleSet,
  {
    spaces: 2
  }
);

// Create the tslint.json file for the project.
fs.outputJson(
  'tslint.json',
  {
    ...recommendedRuleSet
    // Add overrides here.
  },
  {
    spaces: 2
  }
);
