# tslint-rebeccastevens

[![npm version][version-badge]][version-link]
[![travis build][travis-badge]][travis-link]
[![Coverage Status][coverage-badge]][coverage-link]
[![greenkeeper][greenkeeper-badge]][greenkeeper-link]
[![dependencies status][david-badge]][david-link]
[![dev dependencies status][david-dev-badge]][david-dev-link]
[![BSD 3 Clause license][license-badge]][license-link]

[TSLint](https://palantir.github.io/tslint/) rules I made for myself.

## Rule Sets

### Standard (default)

The standard rule set contains all the custom rules defined by this project with a default configuration set for each.

`tslint.json` config:

```json
{
  "extends": [
    "@rebeccastevens/tslint-rebeccastevens"
  ]
}
```

### Recommended

The recommended rule set not only contains custom rules from this project but also from many other projects as well as the default rule set.

This rule set is a useful starting point for a new project.

`tslint.json` config:

```json
{
  "extends": [
    "@rebeccastevens/tslint-rebeccastevens/ruleset-recommended"
  ]
}
```

## TSLint Rules

### no-return-readonly-array

[![type-info-badge]][type-info-link]
[![has-fixer-badge]][has-fixer-link]

This rule prevents the type `ReadonlyArray<T>` from being returned from a function.

Note: Values of type `ReadonlyArray<T>` cannot be provided to functions expecting a value of type `Array<T>`.

*Example:*

```ts
function(): ReadonlyArray<number> {
  //        ^ Do not return a ReadonlyArray; return an Array instead.
}
```

#### Options

##### `include-type-arguments`

If set, type arguments will also be checked when evaluating this rule.

*Example:*

```ts
function(): Promise<ReadonlyArray<number>> {
  //                ^ Do not return a type containing a ReadonlyArray; use an Array instead.
}
```

##### `deep`

If set, the return type will be deeply checked.

*Example:*

```ts
function test(): { foo: ReadonlyArray<number>; } {
  //                    ^ Do not return a ReadonlyArray within the result; use an Array instead.
}
```

#### Default config

```json
"no-return-readonly-array": [true, "include-type-arguments", "deep"]
```

<!-- Badge urls -->

[version-badge]: https://img.shields.io/npm/v/@rebeccastevens/tslint-rebeccastevens.svg?logo=npm&style=flat-square
[travis-badge]: https://img.shields.io/travis/com/RebeccaStevens/tslint-rebeccastevens/master.svg?logo=travis&style=flat-square
[greenkeeper-badge]: https://badges.greenkeeper.io/RebeccaStevens/tslint-rebeccastevens.svg?style=flat-square
[david-badge]: https://img.shields.io/david/RebeccaStevens/tslint-rebeccastevens.svg?logo=david&style=flat-square
[david-dev-badge]: https://img.shields.io/david/dev/RebeccaStevens/tslint-rebeccastevens.svg?logo=david&style=flat-square
[coverage-badge]:
https://img.shields.io/coveralls/github/RebeccaStevens/tslint-rebeccastevens/master.svg?style=flat-square
[license-badge]: https://img.shields.io/github/license/RebeccaStevens/tslint-rebeccastevens.svg?style=flat-square
[has-fixer-badge]: https://img.shields.io/badge/has_fixer-yes-388e3c.svg?style=flat-square
[type-info-badge]: https://img.shields.io/badge/type_info-requried-d51313.svg?style=flat-square

<!-- Link urls -->

[version-link]: https://www.npmjs.com/package/@rebeccastevens/tslint-rebeccastevens
[travis-link]: https://travis-ci.com/RebeccaStevens/tslint-rebeccastevens
[greenkeeper-link]: https://greenkeeper.io/
[david-link]: https://david-dm.org/RebeccaStevens/tslint-rebeccastevens
[david-dev-link]: https://david-dm.org/RebeccaStevens/tslint-rebeccastevens?type=dev
[coverage-link]: https://coveralls.io/github/RebeccaStevens/tslint-rebeccastevens?branch=master
[license-link]: https://opensource.org/licenses/BSD-3-Clause
[type-info-link]: https://palantir.github.io/tslint/usage/type-checking
[has-fixer-link]: #
[object.freeze-link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
