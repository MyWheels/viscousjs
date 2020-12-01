import { Tmpl } from "../template";

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
