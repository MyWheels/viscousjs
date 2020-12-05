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
