# `@plutojl/lang-julia` [![NPM version](https://img.shields.io/npm/v/@plutojl/lang-julia.svg)](https://www.npmjs.org/package/@plutojl/lang-julia)

> Demo site: https://juliapluto.github.io/lang-julia-demo/

This package implements [Julia](https://julialang.org) language support for the [CodeMirror 6](https://codemirror.net) code editor.

This is a wrapper around [`@plutojl/lezer-julia`](https://github.com/JuliaPluto/lezer-julia). Go there for issues, latest developments, releases and more.


## Usage

```
import { julia } from "lang-julia";

let state = EditorState.create({
  ...
  extensions: [
    julia(),
    ...
  ]
});
```
