import { parseAndRender } from "../index";
import { Tmpl, intoAST } from "../template";
import { renderAst } from "../render";

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
    )
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
    )
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
    )
  ).toBe("C");
});

test("new recursive render", () => {
  expect(
    renderAst(
      Tmpl.map(intoAST).tryParse(
        `{%- if true -%}{%- if true -%}A{%- else -%}B{%- endif -%}{%- else -%}C{%- endif -%}`
      )
    )
  ).toBe("A");

  expect(
    renderAst(
      Tmpl.map(intoAST).tryParse(
        `{%- if true -%}{%- if false -%}A{%- else -%}B{%- endif -%}{%- else -%}C{%- endif -%}`
      )
    )
  ).toBe("B");

  expect(
    renderAst(
      Tmpl.map(intoAST).tryParse(
        `{%- if false -%}{%- if false -%}A{%- else -%}B{%- endif -%}{%- else -%}C{%- endif -%}`
      )
    )
  ).toBe("C");

  expect(
    renderAst(
      Tmpl.map(intoAST).tryParse(`{% for item in items %}{{ item }}{% end %}`),
      {
        items: ["A", "B", "C"],
      }
    )
  ).toBe("ABC");

  expect(
    renderAst(
      Tmpl.map(intoAST).tryParse(
        `{% for item in items %}{% if item %}X{% else %}-{% end %}{% end %}`
      ),
      {
        items: [true, true, false, true, false, true],
      }
    )
  ).toBe("XX-X-X");
});
