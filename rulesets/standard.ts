import { RuleConfig } from './RuleConfig';

const defaultSeverity = 'error';
const rulesDirectory = './rules';

/**
 * My Rules.
 */
const rules: RuleConfig = {
  'no-return-readonly-array': [true, 'include-type-arguments', 'deep']
};

export default {
  defaultSeverity,
  rulesDirectory,
  rules
};
