import { Tmpl } from "../template";

test("basics", () => {
  expect(Tmpl.tryParse("hello")).toMatchObject({
    type: "root",
    children: [{ type: "raw", content: "hello" }],
  });

  expect(Tmpl.tryParse("{{ hello }} world")).toMatchObject({
    type: "root",
    children: [
      { type: "interpolation", expression: ["id", "hello"] },
      { type: "raw", content: " world" },
    ],
  });

  expect(Tmpl.tryParse("{% if true %}A{% end %}")).toMatchObject({
    type: "root",
    children: [
      {
        type: "cond",
        condition: ["bool", true],
        children: [{ type: "raw", content: "A" }],
      },
    ],
  });

  expect(Tmpl.tryParse("{% if true %}A{% else %}B{% end %}")).toMatchObject({
    type: "root",
    children: [
      {
        type: "cond",
        condition: ["bool", true],
        children: [{ type: "raw", content: "A" }],
        else: {
          type: "else",
          children: [{ type: "raw", content: "B" }],
        },
      },
    ],
  });

  const nestedIfs = [
    { type: "raw" },
    {
      type: "cond",
      condition: ["bool", true],
      children: [
        { type: "raw" },
        {
          type: "cond",
          condition: ["bool", false],
          children: [
            {
              type: "raw",
              content: expect.stringContaining("A"),
            },
          ],
          else: {
            type: "else",
            children: [{ type: "raw", content: expect.stringContaining("B") }],
          },
        },
        { type: "raw" },
      ],
      else: {
        type: "else",
        children: [{ type: "raw", content: expect.stringContaining("C") }],
      },
    },
    { type: "raw" },
  ];

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
  ).toMatchObject({
    type: "root",
    children: nestedIfs,
  });

  expect(
    Tmpl.tryParse(`
      {% for thing in things %}
        {%- if true -%}
          {%- if false -%}
            A
          {%- else -%}
            B
          {%- endif -%}
        {%- else -%}
          C
        {%- endif -%}
      {% end %}
    `)
  ).toMatchObject({
    type: "root",
    children: [
      { type: "raw" },
      {
        type: "for",
        item: "thing",
        collection: ["id", "things"],
        children: nestedIfs,
      },
      { type: "raw" },
    ],
  });

  expect(
    Tmpl.tryParse(`{% if
       a.b == c
          -%} hello   {{- world }}  {%endif%}`)
  ).toMatchObject({
    type: "root",
    children: [
      {
        type: "cond",
        condition: ["==", ["member", ["id", "a"], "b"], ["id", "c"]],
        children: [
          { type: "raw", content: "hello" },
          {
            type: "interpolation",
            expression: ["id", "world"],
          },
          { type: "raw", content: "  " },
        ],
      },
    ],
  });
});

test("question", () => {
  expect(
    Tmpl.tryParse(`{% unless resource.fuelType == 'elektrisch' and (decisions.parkedAtChargingStation == 'yes' or resource.fuelLevel < 75 or resource.parkingType == 'parking_spot') -%}
      show question
  {%- else -%}
      don't show question
  {%- endif %}`)
  ).toMatchObject({
    type: "root",
    children: [
      {
        type: "cond",
        condition: [
          "not",
          [
            "and",
            [
              "==",
              ["member", ["id", "resource"], "fuelType"],
              ["str", "elektrisch"],
            ],
            [
              "or",
              [
                "or",
                [
                  "==",
                  ["member", ["id", "decisions"], "parkedAtChargingStation"],
                  ["str", "yes"],
                ],
                ["<", ["member", ["id", "resource"], "fuelLevel"], ["num", 75]],
              ],
              [
                "==",
                ["member", ["id", "resource"], "parkingType"],
                ["str", "parking_spot"],
              ],
            ],
          ],
        ],
        children: [
          {
            type: "raw",
            content: "show question",
          },
        ],
        else: {
          type: "else",
          children: [
            {
              type: "raw",
              content: "don't show question",
            },
          ],
        },
      },
    ],
  });
});

test("filters", () => {
  expect(Tmpl.tryParse(`{{ hello }}`)).toMatchObject({
    type: "root",
    children: [
      { type: "interpolation", expression: ["id", "hello"], filters: [] },
    ],
  });

  expect(Tmpl.tryParse(`{{ hello | round }}`)).toMatchObject({
    type: "root",
    children: [
      {
        type: "interpolation",
        expression: ["id", "hello"],
        filters: [{ filter: "round" }],
      },
    ],
  });

  expect(
    Tmpl.tryParse(`{{ hello | round | concat: "something" }}`)
  ).toMatchObject({
    type: "root",
    children: [
      {
        type: "interpolation",
        expression: ["id", "hello"],
        filters: [
          { filter: "round" },
          { filter: "concat", args: [["str", "something"]] },
        ],
      },
    ],
  });

  expect(
    Tmpl.tryParse(
      `{{ hello | round | concat: "something" | where: 4, 5, 'and 6' }}`
    )
  ).toMatchObject({
    type: "root",
    children: [
      {
        type: "interpolation",
        expression: ["id", "hello"],
        filters: [
          { filter: "round" },
          { filter: "concat", args: [["str", "something"]] },
          {
            filter: "where",
            args: [
              ["num", 4],
              ["num", 5],
              ["str", "and 6"],
            ],
          },
        ],
      },
    ],
  });
});
