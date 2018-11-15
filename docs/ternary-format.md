# ternary-format

[![has-fixer-badge]][has-fixer-link]

This rule ensure ternary operators are formated a certain way.

*Example:*

```ts
// TODO: Add ternary-format rule example to ReadMe.
```

## Options

### `allow-single-line`

If set, single line ternary operators will be allowed.

*Example:*

```ts
// Allow this.
const foo = condition ? getX() : getY();
```

## Default config

```json
"no-return-readonly-array": [true, "allow-single-line"]
```


[has-fixer-badge]: https://img.shields.io/badge/has_fixer-yes-388e3c.svg?style=flat-square
[type-info-badge]: https://img.shields.io/badge/type_info-requried-d51313.svg?style=flat-square

[type-info-link]: https://palantir.github.io/tslint/usage/type-checking
[has-fixer-link]: #
