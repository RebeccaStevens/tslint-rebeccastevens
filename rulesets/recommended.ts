import { RuleConfig } from './RuleConfig';

const defaultSeverity = 'error';
const rulesDirectory = './rules';
const tslintExtends: ReadonlyArray<string> = [
  'tslint-microsoft-contrib',
  'tslint-consistent-codestyle',
  'tslint-clean-code',
  'tslint-sonarts',
  'tslint-immutable'
];

const mutablePrefixes: ReadonlyArray<string> = [
  'mutable',
  '_mutable',
  'this.mutable',
  'this._mutable'
];

/**
 * My Rules.
 */
const myRules: RuleConfig = {
  'no-return-readonly-array': [true, 'include-type-arguments', 'deep']
};

/**
 * Built In Rules.
 */
const builtInRules: RuleConfig = {
  // TypeScript-specific
  'adjacent-overload-signatures': true,
  'ban-types': true,
  'member-access': [true, 'check-accessor', 'check-constructor'],
  'member-ordering': [
    true,
    {
      order: [
        'static-field',
        'instance-field',
        'static-method',
        'instance-method'
      ]
    }
  ],
  'no-any': {
    severity: 'warn'
  },
  'no-empty-interface': false,
  'no-import-side-effect': true,
  'no-inferrable-types': [true, 'ignore-params'],
  'no-internal-module': true,
  'no-magic-numbers': [true, -1, 0, 1, 2, 8, 10, 16, 32],
  'no-namespace': true,
  'no-non-null-assertion': true,
  'no-parameter-reassignment': true,
  'no-reference': true,
  'no-unnecessary-type-assertion': true,
  'no-var-requires': true,
  'only-arrow-functions': [true, 'allow-declarations'],
  'prefer-for-of': true,
  'promise-function-async': true,
  'typedef': [
    true,
    'call-signature',
    'parameter',
    'property-declaration',
    'member-variable-declaration'
  ],
  'typedef-whitespace': [
    true,
    {
      'call-signature': 'nospace',
      'index-signature': 'nospace',
      'parameter': 'nospace',
      'property-declaration': 'nospace',
      'variable-declaration': 'nospace'
    },
    {
      'call-signature': 'onespace',
      'index-signature': 'onespace',
      'parameter': 'onespace',
      'property-declaration': 'onespace',
      'variable-declaration': 'onespace'
    }
  ],
  'unified-signatures': true,

  // Functionality
  'await-promise': true,
  'ban-comma-operator': true,
  'ban': false,
  'curly': true,
  'forin': true,
  'import-blacklist': false,
  'label-position': true,
  'no-arg': true,
  'no-bitwise': true,
  'no-conditional-assignment': true,
  'no-console': [
    true,
    // 'assert',
    'clear',
    'count',
    'debug',
    'dir',
    'dirxml',
    // 'error',
    'group',
    'groupCollapsed',
    'groupEnd',
    // 'info',
    'log',
    'table',
    'time',
    'timeEnd',
    'timeStamp',
    'trace'
    // 'warn'
  ],
  'no-construct': true,
  'no-debugger': true,
  'no-duplicate-super': true,
  'no-duplicate-switch-case': true,
  'no-duplicate-variable': [true, 'check-parameters'],
  'no-dynamic-delete': true,
  'no-empty': [true, 'allow-empty-catch'],
  'no-eval': true,
  'no-floating-promises': true,
  'no-for-in-array': true,
  'no-implicit-dependencies': true,
  'no-inferred-empty-object-type': true,
  'no-invalid-template-strings': {
    severity: 'warn'
  },
  'no-invalid-this': true,
  'no-misused-new': true,
  'no-null-keyword': true,
  'no-object-literal-type-assertion': false,
  'no-return-await': true,
  'no-shadowed-variable': [
    true,
    {
      temporalDeadZone: false
    }
  ],
  'no-sparse-arrays': true,
  'no-string-literal': true,
  'no-string-throw': true,
  'no-submodule-imports': false,
  'no-switch-case-fall-through': true,
  'no-this-assignment': true,
  'no-unbound-method': [true, 'ignore-static'],
  'no-unnecessary-class': [
    true,
    'allow-constructor-only',
    'allow-empty-class',
    'allow-static-only'
  ],
  'no-unsafe-any': {
    severity: 'warn'
  },
  'no-unsafe-finally': true,
  'no-unused-expression': true,
  'no-use-before-declare': true,
  'no-var-keyword': true,
  'no-void-expression': true,
  'prefer-conditional-expression': [true, 'check-else-if'],
  'prefer-object-spread': true,
  'radix': true,
  'restrict-plus-operands': true,
  'strict-boolean-expressions': true,
  'strict-type-predicates': true,
  'switch-default': true,
  'triple-equals': [true, 'allow-undefined-check'],
  'use-default-type-parameter': true,
  'use-isnan': true,

  // Maintainability
  'cyclomatic-complexity': [true, 20],
  'deprecation': {
    severity: 'warn'
  },
  'eofline': true,
  'indent': [true, 'spaces', 2],
  'linebreak-style': [true, 'LF'],
  'max-classes-per-file': [true, 1, 'exclude-class-expressions'],
  'max-file-line-count': false,
  'max-line-length': [true, 140],
  'no-default-export': true,
  'no-duplicate-imports': true,
  'no-mergeable-namespace': true,
  'no-require-imports': true,
  'object-literal-sort-keys': false,
  'prefer-const': true,
  'prefer-readonly': true,
  'trailing-comma': [
    true,
    {
      singleline: 'never',
      multiline: 'never',
      esSpecCompliant: true
    }
  ],

  // Style
  'align': [true, 'parameters', 'statements'],
  'array-type': [true, 'generic'],
  'arrow-parens': true,
  'arrow-return-shorthand': true,
  'binary-expression-operand-order': true,
  'callable-types': true,
  'class-name': true,
  'comment-format': [true, 'check-space'],
  'completed-docs': [
    true,
    {
      classes: true,
      enums: true,
      functions: true,
      methods: true,
      properties: {
        tags: {
          content: {
            see: ['#.*']
          },
          existence: ['inheritdoc']
        }
      }
    }
  ],
  'encoding': true,
  'file-header': false,
  'import-spacing': true,
  'interface-name': [true, 'never-prefix'],
  'interface-over-type-literal': true,
  'jsdoc-format': [true, 'check-multiline-start'],
  'match-default-export-name': false,
  'newline-before-return': false,
  'newline-per-chained-call': true,
  'new-parens': true,
  'no-angle-bracket-type-assertion': true,
  'no-boolean-literal-compare': true,
  'no-consecutive-blank-lines': true,
  'no-irregular-whitespace': true,
  'no-parameter-properties': true,
  'no-redundant-jsdoc': true,
  'no-reference-import': true,
  'no-trailing-whitespace': [true, 'ignore-template-strings'],
  'no-unnecessary-callback-wrapper': true,
  'no-unnecessary-initializer': true,
  'no-unnecessary-qualifier': true,
  'number-literal-format': true,
  'object-literal-key-quotes': [true, 'consistent-as-needed'],
  'object-literal-shorthand': true,
  'one-line': [
    true,
    'check-open-brace',
    'check-catch',
    'check-finally',
    'check-else',
    'check-whitespace'
  ],
  'one-variable-per-declaration': [true, 'ignore-for-loop'],
  'ordered-imports': [
    true,
    {
      'import-sources-order': 'case-insensitive',
      'named-imports-order': 'case-insensitive',
      'grouped-imports': true,
      'module-source-path': 'full'
    }
  ],
  'prefer-function-over-method': [true, 'allow-public', 'allow-protected'],
  'prefer-method-signature': false,
  'prefer-switch': true,
  'prefer-template': [true, 'allow-single-concat'],
  'prefer-while': true,
  'quotemark': [true, 'single', 'jsx-double'],
  'return-undefined': true,
  'semicolon': [true, 'always', 'strict-bound-class-methods'],
  'space-before-function-paren': [
    true,
    {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
      method: 'never',
      constructor: 'never'
    }
  ],
  'space-within-parens': [true, 0],
  'switch-final-break': [true, 'always'],
  'type-literal-delimiter': true,
  'variable-name': false, // using `naming-convention`
  'whitespace': [
    true,
    'check-branch',
    'check-decl',
    'check-operator',
    'check-module',
    'check-separator',
    'check-rest-spread',
    'check-type',
    'check-typecast',
    'check-type-operator',
    'check-preblock'
  ]
};

/**
 * tslint-clean-code rules.
 */
const cleanCodeRules: RuleConfig = {
  'newspaper-order': true
};

/**
 * SonarTS rules.
 */
const sonarTSRules: RuleConfig = {
  'no-nested-template-literals': false,
  'no-small-switch': false
};

/**
 * consistent-codestyle rules.
 */
const consistentCodestyleRules: RuleConfig = {
  'early-exit': false,
  'naming-convention': [
    true,
    // Forbid leading and trailing underscores and enforce camelCase on EVERY name.
    // (Will be overridden by subtypes if needed).
    {
      type: 'default',
      format: 'camelCase',
      leadingUnderscore: 'forbid',
      trailingUnderscore: 'forbid'
    },
    // Require all global constants to be camelCase or UPPER_CASE.
    {
      type: 'variable',
      modifiers: ['global', 'const'],
      format: ['camelCase', 'UPPER_CASE']
    },
    // Exported constants can be PascalCase, camelCase or UPPER_CASE
    // (as their type cannot be determined i.e. could be initilizes to a class).
    {
      type: 'variable',
      modifiers: ['export', 'const'],
      format: ['PascalCase', 'camelCase', 'UPPER_CASE']
    },
    // Require exported constant variables that are initialized with functions to be camelCase.
    {
      type: 'functionVariable',
      modifiers: ['export', 'const'],
      format: 'camelCase'
    },
    // Allow leading underscores for unused parameters (--noUnusedParameters).
    {
      type: 'parameter',
      modifiers: 'unused',
      leadingUnderscore: 'allow'
    },
    // Require leading underscores for private properties and methods.
    {
      type: 'member',
      modifiers: 'private',
      leadingUnderscore: 'require'
    },
    // Require leading underscores for protected properties and methods.
    {
      type: 'member',
      modifiers: 'protected',
      leadingUnderscore: 'require'
    },
    // Explicitly disable the format check only for method toJSON.
    {
      type: 'method',
      filter: '^toJSON$',
      format: null
    },
    // Enforce UPPER_CASE for all public static readonly(!) properties.
    {
      type: 'property',
      modifiers: ['public', 'static', 'const'],
      format: 'UPPER_CASE'
    },
    // Enforce PascalCase for classes, interfaces, enums, etc.
    {
      type: 'type',
      format: 'PascalCase'
    },
    // Abstract classes must have the prefix "Abstract". The following part of the name must be valid PascalCase
    {
      type: 'class',
      modifiers: 'abstract',
      prefix: 'Abstract'
    },
    // // Interface names must start with "I". The following part of the name must be valid PascalCase
    // // Using interface-name
    // {
    //   type: 'interface',
    //   prefix: 'I'
    // },
    // Enum members must be in PascalCase.
    {
      type: 'enumMember',
      format: 'PascalCase'
    }
  ],
  'no-as-type-assertion': false,
  'no-accessor-recursion': true,
  'no-collapsible-if': true,
  'no-static-this': true,
  'no-unnecessary-else': true,
  'no-unnecessary-type-annotation': true,
  'object-shorthand-properties-first': false,
  'prefer-const-enum': true
};

/**
 * Immutable rules
 */
const immutableRules: RuleConfig = {
  'readonly-keyword': [
    true,
    {
      'ignore-prefix': mutablePrefixes
    }
  ],
  'readonly-array': [
    true, // This rule is not ready for uses yet - more exception needed.
    {
      'ignore-prefix': mutablePrefixes,
      'ignore-rest-parameters': true,
      'ignore-return-type': true
    }
  ],
  'no-let': true,
  'no-array-mutation': [
    true,
    {
      'ignore-prefix': mutablePrefixes,
      'ignore-mutation-following-accessor': true
    }
  ],
  'no-object-mutation': [
    true,
    {
      'ignore-prefix': mutablePrefixes
    }
  ],
  'no-delete': false, // using `no-array-mutation` and `no-object-mutation`.
  'no-method-signature': true,
  'no-loop-statement': true,
  'no-throw': true,
  'no-try': false // allow catching exceptions from 3rd party libraries.
};

/**
 * Microsoft-contrib rules.
 */
const microsoftContribRules: RuleConfig = {
  'export-name': false,
  'function-name': false, // using `naming-convention` instead.
  'import-name': false,
  'max-func-body-length': false, // using `no-big-function` instead.
  'no-backbone-get-set-outside-model': false, // should only be enabled when using backbone.
  'no-multiline-string': false,
  'no-relative-imports': false,
  'no-suspicious-comment': false,
  'prefer-array-literal': false,
  'prefer-type-cast': false
};

export default {
  defaultSeverity,
  rulesDirectory,
  extends: tslintExtends,
  rules: {
    ...myRules,
    ...builtInRules,
    ...cleanCodeRules,
    ...sonarTSRules,
    ...consistentCodestyleRules,
    ...immutableRules,
    ...microsoftContribRules
  }
};
