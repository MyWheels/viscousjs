import { parseAndRender } from "../index";
import { Tmpl } from "../template";
import { render } from "../render";

test("nested conditional blocks", () => {
  expect(
    parseAndRender(
      `
      {%- if true -%}
        {%- if true -%}
          A
        {%- else -%}
          B
        {%- endif -%}
      {%- else -%}
        C
      {%- endif -%}
    `
    ).trim()
  ).toBe("A");

  expect(
    parseAndRender(
      `
        {%- if true -%}
          {%- if false -%}
            A
          {%- else -%}
            B
          {%- endif -%}
        {%- else -%}
          C
        {%- endif -%}
      `
    ).trim()
  ).toBe("B");

  expect(
    parseAndRender(
      `
        {%- if false -%}
          {%- if false -%}
            A
          {%- else -%}
            B
          {%- endif -%}
        {%- else -%}
          C
        {%- endif -%}
      `
    ).trim()
  ).toBe("C");

  expect(
    parseAndRender(
      `
        {%- if true -%}
          A
        {%- elseif true -%}
          B
        {%- endif -%}
      `
    ).trim()
  ).toBe("A");

  expect(
    parseAndRender(
      `
        {%- if false -%}
          A
        {%- elseif false -%}
          B
        {%- elseif true -%}
          C
        {%- else -%}
          D
        {%- endif -%}
      `
    ).trim()
  ).toBe("C");

  expect(
    parseAndRender(
      `
        {%- if false -%}
          A
        {%- elseif false -%}
          B
        {%- elseif false -%}
          C
        {%- else -%}
          D
        {%- endif -%}
      `
    ).trim()
  ).toBe("D");
});

test("new recursive render", () => {
  expect(
    render(
      Tmpl.tryParse(
        `{%- if true -%}{%- if true -%}A{%- else -%}B{%- endif -%}{%- else -%}C{%- endif -%}`
      )
    )
  ).toBe("A");

  expect(
    render(
      Tmpl.tryParse(
        `{%- if true -%}{%- if false -%}A{%- else -%}B{%- endif -%}{%- else -%}C{%- endif -%}`
      )
    )
  ).toBe("B");

  expect(
    render(
      Tmpl.tryParse(
        `{%- if false -%}{%- if false -%}A{%- else -%}B{%- endif -%}{%- else -%}C{%- endif -%}`
      )
    )
  ).toBe("C");

  expect(
    render(Tmpl.tryParse(`{% for item in items %}{{ item }}{% end %}`), {
      items: ["A", "B", "C"],
    })
  ).toBe("ABC");

  expect(
    render(Tmpl.tryParse(`{% for item of items %}{{ item }}{% end %}`), {
      items: ["A", "B", "C"],
    })
  ).toBe("ABC");

  expect(
    render(
      Tmpl.tryParse(
        `{% for item in items %}{% if item %}X{% else %}-{% end %}{% end %}`
      ),
      {
        items: [true, true, false, true, false, true],
      }
    )
  ).toBe("XX-X-X");
});

test("filters", () => {
  expect(parseAndRender(`{{ "hello" | upper }}`)).toEqual("HELLO");

  expect(parseAndRender(`{{ 4 | at_least: 5 }}`)).toEqual("5");

  expect(parseAndRender(`{{ 4 | at_most: 3 }}`)).toEqual("3");

  expect(parseAndRender(`{{ 0 | default: 42 }}`)).toEqual("0");

  expect(parseAndRender(`{{ false | default: 42 }}`)).toEqual("42");

  expect(
    parseAndRender(
      `{{ fuelLevel | clamp: config.minLevel, config.maxLevel }}`,
      {
        fuelLevel: 5,
        config: {
          minLevel: 10,
          maxLevel: 20,
        },
      }
    )
  ).toEqual("10");
});

test("rendering truthy/falsey values", () => {
  expect(parseAndRender(`{{ world }}`)).toEqual("");

  expect(parseAndRender(`{{ arr }}`, { arr: [] })).toEqual("");

  expect(parseAndRender(`{{ item }}`, { item: null })).toEqual("");

  expect(parseAndRender(`{{ item }}`, { item: false })).toEqual("false");

  expect(parseAndRender(`{{ item }}`, { item: true })).toEqual("true");
});

test("assignment", () => {
  expect(
    parseAndRender(`{{ world }}{% assign world = "world" %}hello {{ world }}`)
  ).toEqual("hello world");

  expect(
    parseAndRender(
      `{% for item in items %}{% assign num = 1 %}{{ num }}{% end %}{{ num + 5 }}`,
      { items: [1, 2, 3] }
    )
  ).toEqual("111");
});

test("assignment does not escape blocks", () => {
  expect(
    parseAndRender(
      `{% for item in items %}{% assign num = 1 %}{{ num }}{% end %}{{ num + 5 }}`
    )
  ).toEqual("");

  expect(
    parseAndRender(
      `{% for item in items %}{% assign num = 1 %}{{ num }}{% end %}{{ num + 5 }}`,
      { items: [] }
    )
  ).toEqual("");

  expect(
    parseAndRender(
      `{% for item in items %}{% assign num = 1 %}{{ num }}{% end %}{{ num + 5 }}`,
      { items: [] }
    )
  ).toEqual("");

  expect(
    parseAndRender(`{% if true %}{% assign num = 1 %}{% end %}{{ num + 5 }}`)
  ).toEqual("");

  expect(
    parseAndRender(
      `{% if true %}{% assign num = 1 %}{{ num }}{% else %}{{ num + 2 }}{% end %}{{ num + 5 }}`
    )
  ).toEqual("1");

  expect(
    parseAndRender(
      `{% assign num = 1 %}{% if false %}{{ num }}{% else %}{{ num + 2 }}{% end %}{{ num + 5 }}`
    )
  ).toEqual("36");

  expect(
    parseAndRender(
      `{% if false %}{{ num }}{% else %}{% assign num = 1 %}{{ num + 2 }}{% end %}{{ num + 5 }}`
    )
  ).toEqual("3");
});
