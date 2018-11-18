# tslint-rebeccastevens

[![npm version][version-badge]][version-link]
[![travis build][travis-badge]][travis-link]
[![Coverage Status][coverage-badge]][coverage-link]
[![greenkeeper][greenkeeper-badge]][greenkeeper-link]
[![dependencies status][david-badge]][david-link]
[![dev dependencies status][david-dev-badge]][david-dev-link]
[![BSD 3 Clause license][license-badge]][license-link]

A [TSLint](https://palantir.github.io/tslint/) sharable config with custom rules I made for myself.

## Install

With yarn:

```sh
yarn add --dev @rebeccastevens/tslint-rebeccastevens
```

With npm:

```sh
npm install --save-dev @rebeccastevens/tslint-rebeccastevens
```

## Usage

Choose one of the rule sets below and add it to your `tslint.json` file to use it.

<details>
<summary>Standard (default)</summary>

The standard rule set contains all the custom rules defined by this project with a default configuration set for each.

`tslint.json` config:

```json
{
  "extends": [
    "@rebeccastevens/tslint-rebeccastevens"
  ]
}
```
</details>

<details>
<summary>Recommended</summary>

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
</details>

## Custom Rules

Rules | Description
----- | -----------
[no-return-readonly-array](./docs/no-return-readonly-array.md) | Prevents the type `ReadonlyArray<T>` from being returned from a function.

<!-- Badge urls -->

[version-badge]: https://img.shields.io/npm/v/@rebeccastevens/tslint-rebeccastevens.svg?logo=npm&style=flat-square
[travis-badge]: https://img.shields.io/travis/com/RebeccaStevens/tslint-rebeccastevens/master.svg?logo=travis&style=flat-square
[greenkeeper-badge]: https://badges.greenkeeper.io/RebeccaStevens/tslint-rebeccastevens.svg?style=flat-square
[david-badge]: https://img.shields.io/david/RebeccaStevens/tslint-rebeccastevens.svg?logo=david&style=flat-square
[david-dev-badge]: https://img.shields.io/david/dev/RebeccaStevens/tslint-rebeccastevens.svg?logo=david&style=flat-square
[coverage-badge]:
https://img.shields.io/coveralls/github/RebeccaStevens/tslint-rebeccastevens/master.svg?style=flat-square
[license-badge]: https://img.shields.io/github/license/RebeccaStevens/tslint-rebeccastevens.svg?style=flat-square

<!-- Badge Link urls -->

[version-link]: https://www.npmjs.com/package/@rebeccastevens/tslint-rebeccastevens
[travis-link]: https://travis-ci.com/RebeccaStevens/tslint-rebeccastevens
[greenkeeper-link]: https://greenkeeper.io/
[david-link]: https://david-dm.org/RebeccaStevens/tslint-rebeccastevens
[david-dev-link]: https://david-dm.org/RebeccaStevens/tslint-rebeccastevens?type=dev
[coverage-link]: https://coveralls.io/github/RebeccaStevens/tslint-rebeccastevens?branch=master
[license-link]: https://opensource.org/licenses/BSD-3-Clause
