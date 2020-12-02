import { Expr } from "../expression";

test("atoms", () => {
  expect(Expr.parse(`5  `)).toEqual({
    status: true,
    value: ["num", 5],
  });

  expect(Expr.parse(` true`)).toEqual({
    status: true,
    value: ["bool", true],
  });

  expect(Expr.parse(`false   `)).toEqual({
    status: true,
    value: ["bool", false],
  });

  expect(Expr.parse(` ( ( false))  `)).toEqual({
    status: true,
    value: ["bool", false],
  });

  expect(Expr.parse(`"hello"`)).toEqual({
    status: true,
    value: ["str", "hello"],
  });

  expect(Expr.parse(` ""`)).toEqual({
    status: true,
    value: ["str", ""],
  });

  expect(Expr.parse(`'hello'`)).toEqual({
    status: true,
    value: ["str", "hello"],
  });

  expect(Expr.parse(`''`)).toEqual({
    status: true,
    value: ["str", ""],
  });

  expect(Expr.parse(`hello`)).toEqual({
    status: true,
    value: ["id", "hello"],
  });

  expect(Expr.parse(`World`)).toEqual({
    status: true,
    value: ["id", "World"],
  });

  expect(Expr.parse(` _World_  `)).toEqual({
    status: true,
    value: ["id", "_World_"],
  });

  expect(Expr.parse(` if`)).toEqual({
    status: true,
    value: ["id", "if"],
  });
});

test("arithmetic", () => {
  expect(Expr.parse(`-42`)).toEqual({
    status: true,
    value: ["-", ["num", 42]],
  });

  expect(Expr.parse(`2 + 5`)).toEqual({
    status: true,
    value: ["+", ["num", 2], ["num", 5]],
  });

  expect(Expr.parse(`2 <= 5`)).toEqual({
    status: true,
    value: ["<=", ["num", 2], ["num", 5]],
  });

  expect(Expr.parse(`2 >= 5`)).toEqual({
    status: true,
    value: [">=", ["num", 2], ["num", 5]],
  });

  expect(Expr.parse(`2 === 5`)).toEqual({
    status: true,
    value: ["===", ["num", 2], ["num", 5]],
  });

  expect(Expr.parse(`(2 + 5) ^ -15`)).toEqual({
    status: true,
    value: ["^", ["+", ["num", 2], ["num", 5]], ["-", ["num", 15]]],
  });

  expect(Expr.parse(`2 + (5 ^ -15)`)).toEqual({
    status: true,
    value: ["+", ["num", 2], ["^", ["num", 5], ["-", ["num", 15]]]],
  });
});

test("member expression", () => {
  expect(Expr.parse(`a.b`)).toEqual({
    status: true,
    value: ["member", ["id", "a"], "b"],
  });

  expect(Expr.parse(`4 contains a.b.__c__`)).toEqual({
    status: true,
    value: [
      "contains",
      ["num", 4],
      ["member", ["member", ["id", "a"], "b"], "__c__"],
    ],
  });
});

test("logical expressions", () => {
  expect(Expr.parse(`-42 or false`)).toEqual({
    status: true,
    value: ["or", ["-", ["num", 42]], ["bool", false]],
  });

  expect(Expr.parse(`-(42 or false)`)).toEqual({
    status: true,
    value: ["-", ["or", ["num", 42], ["bool", false]]],
  });

  expect(
    Expr.parse(
      `resource.fuelType == "elektrisch" and resource.parkingType != 'zone' or whatever`
    )
  ).toEqual({
    status: true,
    value: [
      "or",
      [
        "and",
        [
          "==",
          ["member", ["id", "resource"], "fuelType"],
          ["str", "elektrisch"],
        ],
        ["!=", ["member", ["id", "resource"], "parkingType"], ["str", "zone"]],
      ],
      ["id", "whatever"],
    ],
  });

  expect(
    Expr.parse(
      `resource.fuelType == "elektrisch" and (resource.parkingType != 'zone' or whatever)`
    )
  ).toEqual({
    status: true,
    value: [
      "and",
      ["==", ["member", ["id", "resource"], "fuelType"], ["str", "elektrisch"]],
      [
        "or",
        ["!=", ["member", ["id", "resource"], "parkingType"], ["str", "zone"]],
        ["id", "whatever"],
      ],
    ],
  });
});

test("helper fn calls", () => {
  expect(
    Expr.parse(
      `f ( a.b ,
        resource.fuelType == "elektrisch"
        
        and (resource.parkingType
            != 'zone' or
          whatever
    )
    )
  `
    )
  ).toEqual({
    status: true,
    value: [
      "helper",
      "f",
      [
        ["member", ["id", "a"], "b"],
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
              "!=",
              ["member", ["id", "resource"], "parkingType"],
              ["str", "zone"],
            ],
            ["id", "whatever"],
          ],
        ],
      ],
    ],
  });
});
