<div align="center">
  <img alt="Viscous.js" width="500" src="./viscousjs.svg" />
</div>

[![npm version](https://badgen.net/npm/v/@mywheels/viscousjs)](https://www.npmjs.com/package/@mywheels/viscousjs) [![types included](https://badgen.net/npm/types/@mywheels/viscousjs)](https://github.com/mywheels/viscousjs) [![minified size](https://badgen.net/bundlephobia/min/@mywheels/viscousjs)](https://bundlephobia.com/result?p=@mywheels/viscousjs)

_⚠️ work in progress ⚠️_

Viscous.js is a simple and straightforward templating engine, similar to Liquid(.js). It's different though, in that:

- operator precedence is taken into account, andnested parenthesized expressions are allowed
- helper function calls can be used
- less strict on certain control flow block names, e.g. `else if` and `elseif` are acceptable variations of `elsif`, and `end` can be used instead of `endif` etc.

It doesn't yet have feature parity, because these things are still missing:

- additional loop variables
- other kinds of iteration
- filters
- etc.
