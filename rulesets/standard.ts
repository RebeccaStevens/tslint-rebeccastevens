const defaultSeverity = 'error';
const rulesDirectory = './rules';

/**
 * My Rules.
 */
const rules = {
  'no-return-readonly-array': [true, 'include-type-arguments', 'deep']
};

export default {
  defaultSeverity,
  rulesDirectory,
  rules
};
