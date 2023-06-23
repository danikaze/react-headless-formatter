# ts-lib-boilerplate

A boilerplate to to create npm/libraries based on TypeScript

[![Build Status](https://travis-ci.org/danikaze/ts-lib-boilerplate.svg?branch=master)](https://travis-ci.org/danikaze/ts-lib-boilerplate)

## Features

### Ready

- TypeScript support with path aliases
- [Linting](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Git hooks](https://github.com/typicode/husky)
- Unit testing with [mocha](https://mochajs.org/) and [chai](https://www.chaijs.com/)
- [travis-ci](https://travis-ci.com/) support

### Planned

- Migrate to [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)

## Configuration

Just edit [.nvmrc](./.nvmrc) with the version of node you want to run your tests and it will also work for travis-ci.

## Development

Creating libraries with this boilerplate should be easy.

```
npm run dev
```

Executes a `webpack --watch` command, outputting the files into the `dist` folder

```
npm run build
```

Runs the linter and the tests if any. If these checks pass, builds the library into the `dist` folder and asks if the package should be published or not.

`npm run build -- --only` (or `./scripts/build.sh --only`) executes the building process without any checks, and also doesn't ask for publishing. Might be useful to quickly test the production output.

```
npm run clean
```

Will remove the `dist` repository. It's executed automatically before building to avoid leaving any unwanted file.
