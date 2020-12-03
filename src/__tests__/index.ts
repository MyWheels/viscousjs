import { parseAndRender, parseAndEvaluate } from "../index";

test("evaluation", () => {
  expect(parseAndRender(`{{ 5 }}`)).toEqual("5");

  expect(parseAndRender(` {{ hello }}  `, { hello: "world" })).toEqual(
    " world  "
  );

  expect(
    parseAndRender(
      `{% unless resource.fuelType == 'elektrisch' and (decisions.parkedAtChargingStation == 'yes' or resource.fuelLevel < 75 or resource.parkingType == 'parking_spot') -%}
    show question
{%- else -%}
    don't show question
{%- endif %}`,
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
  ).toEqual("don't show question");
});

test("progress", () => {
  expect(
    parseAndEvaluate("if(resource.fuelType == 'elektrisch', 25, 50)", {
      resource: {
        fuelType: "elektrisch",
      },
    })
  ).toEqual(25);

  expect(
    parseAndEvaluate("if(resource.fuelType == 'elektrisch', 25, 50)", {
      resource: {
        fuelType: "benzine",
      },
    })
  ).toEqual(50);

  expect(
    parseAndEvaluate("if(resource.fuelType == 'elektrisch', 25, 50)", {
      resource: 42,
    })
  ).toEqual(50);

  expect(
    parseAndEvaluate("if(resource.fuelType == 'elektrisch', 25, 50)")
  ).toEqual(50);

  expect(parseAndEvaluate("37.5")).toEqual(37.5);

  expect(parseAndEvaluate("50")).toEqual(50);

  expect(parseAndEvaluate("75")).toEqual(75);
});
