# tslint-rebeccastevens

[![npm version][version-badge]][version-url]
[![travis build][travis-badge]][travis-url]
[![MIT license][license-badge]][license-url]

[TSLint](https://palantir.github.io/tslint/) rules I made for myself.

## TSLint Rules

### no-return-readonly-array

This rule prevents the type `ReadonlyArray<T>` from being returned from a function. Functions should not rely on their return type being of type `ReadonlyArray<T>` to prevent mutation as 3rd parties can still modify it (by casting it to a standard array). If a function needs to ensure the array it returns is immutable, it should use [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

Also note that values of type `ReadonlyArray<T>` cannot be provided to something wanting the type `Array<T>`.

#### Example config

```json
"no-return-readonly-array": true
```

[version-badge]: https://img.shields.io/npm/v/@rebeccastevens/tslint-rebeccastevens.svg?style=flat-square
[version-url]: https://www.npmjs.com/package/@rebeccastevens/tslint-rebeccastevens
[travis-badge]: https://travis-ci.com/RebeccaStevens/tslint-rebeccastevens.svg?branch=master
[travis-url]: https://travis-ci.com/RebeccaStevens/tslint-rebeccastevens
[license-badge]: https://img.shields.io/github/license/RebeccaStevens/tslint-rebeccastevens.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT

[has-fixer-badge]: https://img.shields.io/badge/has_fixer-yes-388e3c.svg?style=flat-square
[type-info-badge]: https://img.shields.io/badge/type_info-requried-d51313.svg?style=flat-square
[type-info-url]: https://palantir.github.io/tslint/usage/type-checking
