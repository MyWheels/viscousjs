import { Tmpl, intoAST } from "../template";

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

test("ast", () => {
  function raw(content: string) {
    return {
      type: "raw",
      piece: {
        name: "raw",
        value: { content },
      },
    };
  }

  function basicIfElse(ca: any, cb: any) {
    return [
      {
        type: "if",
        piece: {
          name: "if",
          value: { content: ["bool", true] },
        },
        children: ca,
      },
      {
        type: "else",
        piece: {
          name: "if",
          value: { content: ["bool", true] },
        },
        children: cb,
      },
    ];
  }

  expect(Tmpl.map(intoAST).tryParse("A")).toMatchObject({
    type: "root",
    children: [raw("A")],
  });

  expect(
    Tmpl.map(intoAST).tryParse("{% if true %}A{% else %}B{% end %}")
  ).toMatchObject({
    type: "root",
    children: [...basicIfElse([raw("A")], [raw("B")])],
  });

  expect(
    Tmpl.map(intoAST).tryParse(
      "{% if true %}{% if true %}A{% else %}B{% end %}{% else %}C{% end %}"
    )
  ).toMatchObject({
    type: "root",
    children: [
      ...basicIfElse([...basicIfElse([raw("A")], [raw("B")])], [raw("C")]),
    ],
  });

  expect(
    Tmpl.map(intoAST).tryParse(
      "{% for item in items %}{% if true %}{% if true %}A{% else %}B{% end %}{% else %}C{% end %}{% end %}"
    )
  ).toMatchObject({
    type: "root",
    children: [
      {
        type: "for",
        piece: {
          name: "for",
          value: {
            content: {
              id: "item",
              collection: ["id", "items"],
            },
          },
        },
        children: [
          ...basicIfElse([...basicIfElse([raw("A")], [raw("B")])], [raw("C")]),
        ],
      },
    ],
  });
});
