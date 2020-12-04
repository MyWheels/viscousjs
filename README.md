<div align="center">
  <img alt="Viscous.js" width="500" src="./viscousjs.svg" />
</div>

[![npm version](https://badgen.net/npm/v/@mywheels/viscousjs)](https://www.npmjs.com/package/@mywheels/viscousjs) [![types included](https://badgen.net/npm/types/@mywheels/viscousjs)](https://github.com/mywheels/viscousjs) [![minified size](https://badgen.net/bundlephobia/min/@mywheels/viscousjs)](https://bundlephobia.com/result?p=@mywheels/viscousjs)

Viscous.js is a simple and straightforward templating engine, similar to Liquid(.js), but with some modifications so that it's nicer to use:

- Operator precedence is taken into account.
- Nested parenthesized expressions are allowed.
- Helper function calls can be used.
- Less strict on certain control flow block names: `{% else if %}` and `{% elseif %}` are acceptable variations of `{% elsif %}`, and `{% end %}` can be used instead of `{% endXYZ %}`.

It doesn't yet have feature parity, because these things (amongst others) are still missing:

- Helper loop variables like `forloop` and `index0` etc.
- Other kinds of iteration
- Filters
- The comment, cycle, increment, decrement, raw, and capture tags

And then there are certain features that I'm not planning to add (unless someone wishes to contribute):

- The assignment, include, case/when, layout, render, and tablerow tags

## Usage

```ts
import { parseAndEvaluate, parseAndRender } from "@mywheels/viscousjs";

console.log(
  parseAndEvaluate(`hello.world + 2`, {
    hello: {
      world: 40,
    },
  }) // 42
);

console.log(
  parseAndEvaluate(`hello.world + 2 == 42`, {
    hello: {
      world: 40,
    },
  }) // true
);

console.log(
  parseAndRender(
    `{% if happy -%}
        clap your hands
      {%- end %}`,
    {
      happy: true,
    }
  ) // "clap your hands"
);
```
