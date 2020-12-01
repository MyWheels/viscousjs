import { parseAndRender } from "../index";

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
