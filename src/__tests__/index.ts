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
  ).toContain("don't show question");
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

test("mywheels end trip check question conditions", () => {
  const envA = {
    resource: {
      askDamage: true,
      parkingType: "zone",
      fuelType: "benzine",
      fuelLevel: null,
    },
    decisions: {
      parkedAtChargingStation: "yes",
    },
  };

  expect(
    parseAndEvaluate(
      `resource.askDamage and resource.parkingType == 'zone'`,
      envA
    )
  ).toEqual(true);

  expect(
    parseAndEvaluate(
      `resource.askDamage and resource.parkingType == 'parking_spot'`,
      envA
    )
  ).toEqual(false);

  expect(
    parseAndEvaluate(
      `resource.fuelType == 'elektrisch' and resource.parkingType == 'zone' and resource.fuelLevel >= 75 and resource.fuelLevel <= 85`,
      envA
    )
  ).toEqual(false);

  expect(
    parseAndEvaluate(
      `resource.fuelType == 'elektrisch' and (decisions.parkedAtChargingStation == 'yes' or resource.fuelLevel < 75 or resource.parkingType == 'parking_spot')`,
      envA
    )
  ).toEqual(false);

  expect(
    parseAndEvaluate(
      `resource.fuelType == 'elektrisch' and resource.fuelLevel > 85 and resource.parkingType == 'zone'`,
      envA
    )
  ).toEqual(false);

  expect(parseAndEvaluate(`resource.fuelLevel > 85`, envA)).toEqual(null);

  expect(parseAndEvaluate(`resource.fuelLevel < 85`, envA)).toEqual(null);

  const envB = {
    resource: {
      askDamage: true,
      parkingType: "zone",
      fuelType: "elektrisch",
      fuelLevel: null,
    },
    decisions: {
      parkedAtChargingStation: "yes",
    },
  };

  expect(
    parseAndEvaluate(
      `resource.fuelType == 'elektrisch' and (decisions.parkedAtChargingStation == 'yes' or resource.fuelLevel < 75 or resource.parkingType == 'parking_spot')`,
      envB
    )
  ).toEqual(true);

  // empty env

  expect(
    parseAndEvaluate(
      `resource.fuelType == 'elektrisch' and (decisions.parkedAtChargingStation == 'yes' or resource.fuelLevel < 75 or resource.parkingType == 'parking_spot')`,
      {}
    )
  ).toBeFalsy();
});
