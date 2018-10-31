# tslint-rebeccastevens

[![npm version][version-badge]][version-url]
[![travis build][travis-badge]][travis-url]
[![greenkeeper][greenkeeper-badge]][greenkeeper-url]
[![dependencies status][david-badge]][david-url]
[![dev dependencies status][david-dev-badge]][david-dev-url]
[![MIT license][license-badge]][license-url]

[TSLint](https://palantir.github.io/tslint/) rules I made for myself.

## TSLint Rules

### no-return-readonly-array

[![type-info-badge]][type-info-url]

This rule prevents the type `ReadonlyArray<T>` from being returned from a function. Functions should not rely on their return type being of type `ReadonlyArray<T>` to prevent mutation as 3rd parties can still modify it (by casting it to a standard array). If a function needs to ensure the array it returns is immutable, it should use [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

Also note that values of type `ReadonlyArray<T>` cannot be provided to something wanting the type `Array<T>`.

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

#### Example config

```json
"no-return-readonly-array": true
```

```json
"no-return-readonly-array": [true, "include-type-arguments"]
```

```json
"no-return-readonly-array": [true, "deep"]
```

[version-badge]: https://img.shields.io/npm/v/@rebeccastevens/tslint-rebeccastevens.svg?logo=npm&style=flat-square
[version-url]: https://www.npmjs.com/package/@rebeccastevens/tslint-rebeccastevens
[travis-badge]: https://img.shields.io/travis/com/RebeccaStevens/tslint-rebeccastevens/master.svg?logo=travis&style=flat-square
[travis-url]: https://travis-ci.com/RebeccaStevens/tslint-rebeccastevens
[greenkeeper-badge]: https://badges.greenkeeper.io/greenkeeperio/greenkeeper.svg?style=flat-square
[greenkeeper-url]: https://greenkeeper.io/
[david-badge]: https://img.shields.io/david/RebeccaStevens/tslint-rebeccastevens.svg?logo=david&style=flat-square
[david-url]: https://david-dm.org/RebeccaStevens/tslint-rebeccastevens
[david-dev-badge]: https://img.shields.io/david/dev/RebeccaStevens/tslint-rebeccastevens.svg?logo=david&style=flat-square
[david-dev-url]: https://david-dm.org/RebeccaStevens/tslint-rebeccastevens?type=dev
[license-badge]: https://img.shields.io/github/license/RebeccaStevens/tslint-rebeccastevens.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT

[has-fixer-badge]: https://img.shields.io/badge/has_fixer-yes-388e3c.svg?style=flat-square
[type-info-badge]: https://img.shields.io/badge/type_info-requried-d51313.svg?style=flat-square
[type-info-url]: https://palantir.github.io/tslint/usage/type-checking
