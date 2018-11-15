import { RuleConfig } from './RuleConfig';

const defaultSeverity = 'error';
const rulesDirectory = './rules';

/**
 * My Rules.
 */
const rules: RuleConfig = {
  'no-return-readonly-array': [true, 'include-type-arguments', 'deep'],
  'ternary-format': [true, 'allow-single-line']
};

export default {
  defaultSeverity,
  rulesDirectory,
  rules
};
