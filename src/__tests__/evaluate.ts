import { Expr } from "../expression";
import { evaluate } from "../evaluate";

test("evaluation", () => {
  expect(evaluate(Expr.tryParse(`5  `))).toEqual(5);

  expect(evaluate(Expr.tryParse(` true`))).toEqual(true);

  expect(evaluate(Expr.tryParse(`false   `))).toEqual(false);

  expect(evaluate(Expr.tryParse(` ( ( false))  `))).toEqual(false);

  expect(evaluate(Expr.tryParse(`"hello"`))).toEqual("hello");

  expect(evaluate(Expr.tryParse(` ""`))).toEqual("");

  expect(evaluate(Expr.tryParse(`'hello'`))).toEqual("hello");

  expect(evaluate(Expr.tryParse(`''`))).toEqual("");

  expect(evaluate(Expr.tryParse(`hello`))).toEqual(undefined);

  expect(evaluate(Expr.tryParse(`hello`), { hello: [] })).toEqual([]);

  expect(evaluate(Expr.tryParse(`a.b.c`))).toEqual(undefined);

  expect(evaluate(Expr.tryParse(`a.b.c`), { a: 4 })).toEqual(undefined);

  expect(evaluate(Expr.tryParse(`a.b.c`), { a: { b: { c: 4 } } })).toEqual(4);

  expect(evaluate(Expr.tryParse(`a.b.c == 4`), { a: { b: { c: 4 } } })).toEqual(
    true
  );

  expect(
    evaluate(Expr.tryParse(`arr contains a.b.c`), {
      arr: [2, 3, 4, 5],
      a: { b: { c: 4 } },
    })
  ).toEqual(true);

  expect(
    evaluate(Expr.tryParse(`ar contains a.b.c`), {
      arr: [2, 3, 4, 5],
      a: { b: { c: 4 } },
    })
  ).toEqual(undefined);

  expect(
    evaluate(Expr.tryParse(`arr contains a.b.c`), {
      arr: [2, 3, 5],
      a: { b: { c: 4 } },
    })
  ).toEqual(false);

  expect(
    evaluate(
      Expr.tryParse(
        `resource.fuelType == 'elektrisch' and (decisions.parkedAtChargingStation == 'yes' or resource.fuelLevel < 75 or resource.parkingType == 'parking_spot')`
      ),
      {
        resource: {
          fuelType: "elektrisch",
          fuelLevel: 70,
          parkingType: "zone",
        },
        decisions: {
          parkedAtChargingStation: "no",
        },
      }
    )
  ).toEqual(true);

  expect(
    evaluate(Expr.tryParse(`if(resource.fuelType == 'elektrisch', 25, 50)`), {
      resource: {
        fuelType: "elektrisch",
      },
    })
  ).toEqual(25);

  expect(
    evaluate(Expr.tryParse(`if(resource.fuelType == 'elektrisch', 25, 50)`), {
      resource: {
        fuelType: "benzine",
      },
    })
  ).toEqual(50);

  expect(
    evaluate(Expr.tryParse(`if(resource.fuelType == 'elektrisch', 25, 50)`))
  ).toEqual(50);
});
