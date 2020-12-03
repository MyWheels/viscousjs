import { parseAndRender } from "../index";

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
