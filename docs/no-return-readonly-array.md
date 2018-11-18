# no-return-readonly-array

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

## Options

### `include-type-arguments`

If set, type arguments will also be checked when evaluating this rule.

*Example:*

```ts
function(): Promise<ReadonlyArray<number>> {
  //                ^ Do not return a type containing a ReadonlyArray; use an Array instead.
}
```

### `deep`

If set, the return type will be deeply checked.

*Example:*

```ts
function test(): { foo: ReadonlyArray<number>; } {
  //                    ^ Do not return a ReadonlyArray within the result; use an Array instead.
}
```

## Default config

```json
"no-return-readonly-array": [true, "include-type-arguments", "deep"]
```


[has-fixer-badge]: https://img.shields.io/badge/has_fixer-yes-388e3c.svg?style=flat-square
[type-info-badge]: https://img.shields.io/badge/type_info-requried-d51313.svg?style=flat-square

[type-info-link]: https://palantir.github.io/tslint/usage/type-checking
[has-fixer-link]: #
