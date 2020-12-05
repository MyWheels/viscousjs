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
- The comment, cycle, increment, decrement, raw, and capture tags
- Async data / rendering

And then there are certain features that I'm probably won'y be adding (unless someone wishes to contribute):

- The include, case/when, layout, render, and tablerow tags

## Usage

```ts
import { parseAndEvaluate, parseAndRender } from "@mywheels/viscousjs";

const data = {
  happy: true,
  hello: {
    world: 40,
  },
};

// 42
const result = parseAndEvaluate(`hello.world + 2`, data);

// "clap your hands"
const output = parseAndRender(`
  {%- if happy -%}
    clap your hands
  {%- end -%}
`);
```

## Overview

### Control flow

- **if**
  - `{% if <cond> %}`
  - `{% elsif <cond> %}`
    - or `{% elseif <cond> %}`
    - or `{% else if <cond> %}`
  - `{% else %}`
  - `{% endif %}`
    - or just `{% end %}`
- **unless**
  - `{% unless <cond> %}`
  - `{% endunless %}`
    - or just `{% end %}`
- **for**
  - `{% for <name> in <arr> %}`
    - or `{% for <name> of <arr> %}`
  - `{% endfor %}`
    - or just `{% end %}`
- **assignment**
  - `{% assign <name> = <expression> %}`

### Interpolation

- `{{ <expression> }}`
- `{{ <expression> | <filter> }}`
- `{{ <expression> | <filter>: <args> }}`
- `{{ <expression> | ... | ... | ... }}`

### Whitespace control

Both interpolation and control flow blocks accept whitespace trimmers at either end, for example `{% if true -%}` or `{{- expr -}}`. These trim whitespace off of the preceding and/or succeeding raw template pieces.

### Expressions

You can form expressions with all the ordinary mathematical operators and comparators, double and triple (in)equality, and `contains` (which works for strings as well as arrays).

Also, you can use helper functions in expressions like `max(a, b)` or `cond(d, a, b)`.

### Filters

Interpolation blocks accept filters, which transform the evaluated expression before interpolating it into the output.

- `{{ name | upper }}` might become "ROSE"
- `{{ 8 | max: 4 }}` becomes "4"

You can use multiple filters:

- `{{ 3.14 | min: 0 | ceil }}` becomes "4"

You can pass multiple arguments:

- `{{ 8 | clamp: 4, 6 }}` becomes "6"

You can use expressions in filters:

- `{{ fuelLevel | clamp: config.minLevel, config.maxLevel }}`

### Providing your own helpers and filters

Filters are just helpers which are passed the interpolated value as first argument. For example, `{{ 8 | max: 4 }}` evaluates as `max(8, 4)`.

You can register additional helper functions in the `helpers` config key:

```ts
parseAndRender(`
    {{ hello | world }}
    {{ dino | raise: food, love }}
  `,
  data,
  {
    helpers: {
      world(hello) { ... },
      raise(dino, food, love) { ... },
    },
  }
);
```

### Truthiness

Like Liquid, an expression is considered truthy whenever it's a `true`, a number, a string or an object. So, also `""` and `0` and `[]` are considered truthy.

You can also provide your own truthiness check with the `isTruthy` config key.

### Failure

If the template fails to parse or render, `parseAndEvaluate` will return `undefined`, and `parseAndRender` will return an empty string. If you want parse or runtime errors to be thrown instead, you pass the config key `throwOnError: true`.

### Configuration

```ts
type ViscousConfig = {
  helpers?: Record<string, Function>;
  isTruthy?: (data: any) => boolean;
  throwOnError?: boolean;
  evaluate?: (expr: ExprNode, env?: any) => any;
};
```

### Known helpers and filters

More will be added soon. (And just make a PR if you want to contribute yours :))

- **general purpose**

  - `default` (_fallback_)
  - `stringify` (_data_)

- **numeric**

  - `abs` (_num_)
  - `ceil` (_num_)
  - `floor` (_num_)
  - `at_least` (_min_)
  - `at_most` (_max_)
  - `clamp` (_min, max_)

- **strings**

  - `append` (_str_)
  - `upcase` (_str_)
    - `upper` (_str_)
  - `downcase` (_str_)
    - `lower` (_str_)

- **control**
  - `if` (_cond, a, b_)
    - `cond` (_cond, a, b_)

## Alternatives

- [Liquid.js](https://liquidjs.com/) &mdash; the origin of Viscous.js
- [Handlebars](https://handlebarsjs.com/) &mdash; all-time simplicity's favorite
- [Twig.js](https://github.com/twigjs/twig.js) &mdash; quite similar to Liquid.js; a port of PHP's twig engine
- [EJS](https://ejs.co/) &mdash; "JavaScript but then in a templating language", way more powerful but not ideal as a content format
- ...and more...
