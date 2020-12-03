import { Tmpl } from "../template";

test("nested conditional blocks", () => {
  expect(
    Tmpl.tryParse(`
      {%- if true -%}
        {%- if false -%}
          A
        {%- else -%}
          B
        {%- endif -%}
      {%- else -%}
        C
      {%- endif -%}
    `)
  ).toMatchObject([
    {
      name: "raw", // opening
    },
    {
      name: "if", // if true
    },
    {
      name: "raw",
    },
    {
      name: "if", // if false
    },
    {
      name: "raw", // A
    },
    {
      name: "else", // else
    },
    {
      name: "raw", // B
    },
    {
      name: "end", // endif
    },
    {
      name: "raw",
    },
    {
      name: "else", // else
    },
    {
      name: "raw", // C
    },
    {
      name: "end",
    },
    {
      name: "raw",
    },
  ]);
});

test("atoms", () => {
  expect(Tmpl.tryParse(`hello`)).toMatchObject([
    {
      name: "raw",
      value: { content: "hello" },
    },
  ]);

  expect(Tmpl.tryParse(`hello {{- world }}`)).toMatchObject([
    {
      name: "raw",
      value: { content: "hello " },
    },
    {
      name: "interpolation",
      value: {
        stripLeft: true,
        stripRight: false,
        content: ["id", "world"],
      },
    },
  ]);

  expect(
    Tmpl.tryParse(`{% if
      a.b == c
         -%} hello   {{- world }}  {%endif%}`)
  ).toMatchObject([
    {
      name: "if",
      value: {
        stripLeft: false,
        stripRight: true,
        content: ["==", ["member", ["id", "a"], "b"], ["id", "c"]],
      },
    },
    {
      name: "raw",
      value: { content: " hello   " },
    },
    {
      name: "interpolation",
      value: {
        stripLeft: true,
        stripRight: false,
        content: ["id", "world"],
      },
    },
    {
      name: "raw",
      value: { content: "  " },
    },
    {
      name: "end",
      value: {
        stripLeft: false,
        stripRight: false,
      },
    },
  ]);
});

test("for loops", () => {
  expect(Tmpl.tryParse(`{% for item in certain.items %}`)).toMatchObject([
    {
      name: "for",
      value: {
        content: {
          id: "item",
          collection: ["member", ["id", "certain"], "items"],
        },
      },
    },
  ]);
});
