import { parseAndRender } from "../index";

test("trip help questions", () => {
  expect(computeTripHelpQuestions({}).map((q) => q.title)).toEqual([
    "Waar haal ik de auto op?",
    "Hoe open en sluit ik de auto?",
    "Hoe start ik de auto?",
    "Waar breng ik de auto terug?",
  ]);

  expect(
    computeTripHelpQuestions({
      resource: {
        fuelType: "elektrisch",
      },
    }).map((q) => q.title)
  ).toEqual([
    "Waar haal ik de auto op?",
    "Hoe open en sluit ik de auto?",
    "Hoe ontkoppel ik de auto van de laadpaal?",
    "Hoe start ik de auto?",
    "Hoe laad ik de auto?",
    "Hoe kan ik snelladen bij Fastned of Allego?",
    "Waar breng ik de auto terug?",
  ]);

  expect(
    computeTripHelpQuestions({
      resource: {
        fuelType: "benzine",
      },
    }).map((q) => q.title)
  ).toEqual([
    "Waar haal ik de auto op?",
    "Hoe open en sluit ik de auto?",
    "Hoe start ik de auto?",
    "Hoe tank ik de auto?",
    "Waar breng ik de auto terug?",
  ]);

  expect(
    computeTripHelpQuestions({
      resource: {
        fuelType: "benzine",
      },
      booking: {},
    }).map((q) => q.title)
  ).toEqual([
    "Waar haal ik de auto op?",
    "Hoe open en sluit ik de auto?",
    "Hoe start ik de auto?",
    "Hoe tank ik de auto?",
    "Waar breng ik de auto terug?",
    "Wat moet ik doen bij schade of pech?",
  ]);

  expect(
    computeTripHelpQuestions({
      resource: {
        fuelType: "benzine",
        model: "C1",
        fuelCardCode: "ABCD",
      },
      booking: {},
    }).find((q) => q.title === "Hoe tank ik de auto?")
  ).toMatchObject({
    content: expect.stringContaining(`De pincode van de tankpas is: **ABCD**`),
  });

  expect(
    computeTripHelpQuestions({
      resource: {
        fuelType: "benzine",
        model: "C1",
        fuelCardCode: null,
      },
      booking: {},
    }).find((q) => q.title === "Hoe tank ik de auto?")
  ).toMatchObject({
    content: expect.stringContaining(
      `De **pincode van de tankpas** vind je hier zodra je rit begint.`
    ),
  });
});

function computeTripHelpQuestions(env: any) {
  return parseAndRender(TRIPHELPQUESTIONS, env, { throwOnError: false })
    .split(/(^|\n)(?=# )/)
    .map((q) => q.trim())
    .filter((q) => q.startsWith("# "))
    .map((q) => {
      const lines = q.split("\n");
      const title = lines[0].slice(2).trim();
      const content = lines.slice(1).join("\n").trim();
      return {
        title,
        content,
      };
    });
}

const TRIPHELPQUESTIONS = `# Waar haal ik de auto op?

{% if resource.fuelType == "elektrisch" and resource.parkingType == "zone" %}
De auto heeft geen vaste parkeerplek, maar haal je op in het **zonegebied {{ resource.location }}** in {{ resource.city }}.

De actuele locatie van de auto vind je een uur van tevoren in de MyWheels app.

Zet de auto aan het einde van je rit weer terug in de zone.

{% elsif resource.fuelType == "elektrisch" and resource.parkingType == "parking_spot" %}
De auto heeft een **vaste parkeerplek** bij een laadpaal, aan de {{ resource.location }} ter hoogte van huisnummer {{ resource.streetNumber }} in {{ resource.city }}.

Zet de auto aan het einde van je rit weer terug op dezelfde plek en koppel de auto aan de laadpaal.

{% elsif resource.fuelType == "benzine" and resource.parkingType == "zone" %}
De auto heeft geen vaste parkeerplek, maar haal je op in het **zonegebied {{ resource.location }}** in {{ resource.city }}.

De actuele locatie van de auto vind je een uur van tevoren in de MyWheels app.

Zet de auto aan het einde van je rit weer terug in de zone.

{% else %}
De auto heeft een **vaste parkeerplek** aan de {{ resource.location }} ter hoogte van huisnummer {{ resource.streetNumber }} in {{ resource.city }}.

Zet de auto aan het einde van je rit weer terug op dezelfde plek.
{% endif %}

# Hoe open en sluit ik de auto?

{% if resource.locktype contains "chipcard" %}

## Openen

Je opent de auto aan het begin van je rit met je smartphone of OV-chipkaart.

#### Smartphone

Ga in de MyWheels app of op de mobiele website naar je rit. Daar zie je een groene knop om de auto te openen, de auto opent binnen 15 seconden.

#### OV-chipkaart

Nieuwe OV-chipkaart toevoegen? Houd deze aan het begin van je rit voor de lezer bij de voorruit. Je ontvangt automatisch een sms. Beantwoord deze sms met ‘Ja’ om de OV-chipkaart aan je account te koppelen. De auto opent binnen 15 seconden.

## Tijdens je rit

Open en sluit de auto tijdens je rit met de autosleutel.

## Sluiten

Einde van je rit? Sluit de auto **ALLEEN** af met de MyWheels app of OV-chipkaart en **NIET** met de autosleutel.

{% else %}

## Openen

Ga in de MyWheels app of op de mobiele website naar je rit. Daar zie je een groene knop om de auto te openen, de auto opent binnen 15 seconden.

## Tijdens je rit

Open en sluit de auto tijdens je rit met de autosleutel.

## Sluiten

Einde van je rit? Sluit de auto **ALLEEN** af met de MyWheels app en **NIET** met de autosleutel.

{% endif %}

{% if resource.fuelType == "elektrisch" %}

# Hoe ontkoppel ik de auto van de laadpaal?

{% endif %}

{% if resource.model contains "Leaf" %}

1. Druk in de auto op de laadknop (links van het stuur) om de laadkabel los te koppelen van de auto.

![Ontkoppelen van de laadkabel](https://mywheels.nl/images/content/leaf_laad_knop.jpg)

2. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van de laadpaal. De autosleutel ligt in het dashboardkastje of de middenconsole (tussen de stoelen).
3. Komt de kabel niet los van de laadpaal? Bel dan het storingsnummer op de laadpaal.
4. Neem de laadkabel altijd met je mee, berg hem op in de kofferbak.

Bekijk onze instructievideo van de Nissan Leaf hieronder:

[![Instructievideo Nissan Leaf](https://mywheels.nl/images/content/leaf_video_button.jpg)](http://www.youtube.com/watch?v=8o7zu_yZ3uw)

{% endif %}

{% if resource.model contains "ZOE" %}

1. Druk in de auto op de laadknop (links van het stuur) om de laadkabel los te koppelen van de auto.

![Ontkoppelen van de laadkabel](https://mywheels.nl/images/content/zoe_laadknop.jpg)

2. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van de laadpaal. De autosleutel ligt in het dashboardkastje.
3. Komt de kabel niet los van de laadpaal? Bel dan het storingsnummer op de laadpaal.
4. Neem de laadkabel altijd met je mee, berg hem op in de kofferbak.

{% endif %}

{% if resource.model contains "CITIGOe" %}

1. Druk op de ‘open auto’ knop op de autosleutel om de laadkabel los te koppelen van de auto.

![Starten van de CITIGOe](https://mywheels.nl/images/content/citigoe_laadsleutel.jpg)

2. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van de laadpaal. De autosleutel ligt in het dashboardkastje.
3. Komt de kabel niet los van de laadpaal? Bel dan het storingsnummer op de laadpaal.
4. Neem de laadkabel altijd met je mee, berg hem op in de kofferbak.

{% endif %}

# Hoe start ik de auto?

{% if resource.model contains "Leaf" %}

1. Trap de normale voetrem in.
2. Haal de handrem eraf (het kleine voetpedaal naast het rempedaal). Als de rem is ingetrapt, zit deze tegen de bodem aan. Trap deze kort in en laat hem omhoog komen.
3. Druk op de ronde startknop (rechts van het stuur). Het display van de auto gaat aan en het groene auto symbool brandt, je hoort een melodietje.

![Started van de Leaf](https://mywheels.nl/images/content/leaf_starten.jpg)

4. Na het starten zet je de versnellingshendel in stand D of R.
5. Zodra je de rem loslaat, begint de auto te rijden.

### Standen

- D = vooruit (naar links + naar achter)
- R = achteruit (naar links + naar voren)
- N = neutraal / vrij (naar links)
- P = parkeerstand (knopje bovenop)
- B = rijden met regeneratief remmen, de auto remt af als je het gaspedaal loslaat (schuin naar links)

Bekijk onze instructievideo van de Nissan Leaf hieronder:

[![Instructievideo Nissan Leaf](https://mywheels.nl/images/content/leaf_video_button.jpg)](http://www.youtube.com/watch?v=8o7zu_yZ3uw)

{% endif %}

{% if resource.model contains "ZOE" %}

1. Trap de voetrem in.
2. De handrem wordt automatisch uitgeschakeld als je gaat rijden.
3. Druk op de ronde startknop (rechts van het stuur). Het display van de auto gaat aan en je ziet de melding Ready op het display staan.

![Started van de ZOE](https://mywheels.nl/images/content/zoe_starten.jpg)

4. Na het starten zet je de versnellingshendel in stand D of R.
5. Zodra je de rem loslaat, begint de auto te rijden.

### Standen

- R = achteruit
- N = neutraal / vrij
- D = normaal rijden
- B = rijden met regeneratief remmen, de auto remt af als je het gaspedaal loslaat

{% endif %}

{% if resource.model contains "CITIGOe" %}

1. Trap de voetrem in.
2. Haal de auto van de handrem af (de grote hendel tussen de stoelen).
3. Start de auto met de sleutel in het contactslot rechts van het stuur. De autosleutel ligt in het dashboardkastje.
4. De auto is gestart als het display van de auto aangaat en je de melding READY ziet. Je hoort nu ook een geluid dat de auto klaar is om te rijden. Is de auto niet READY? Probeer het opnieuw. Zorg ervoor dat je de voetrem intrapt.

![Started van de CITIGOe](https://mywheels.nl/images/content/citigoe_display.jpg)

5. Na het starten zet je de versnellingshendel in stand D of R.
6. Zodra je de rem loslaat, begint de auto te rijden.

### Standen

- R = achteruit
- N = neutraal / vrij
- D = normaal rijden
- B = rijden met regeneratief remmen, de auto remt af als je het gaspedaal loslaat

{% endif %}

{% if resource.model contains "C1" %}

1. Trap de koppeling in en zet je voet op de rem.
2. Start de auto met de sleutel in het contactslot rechts van het stuur. De autosleutel ligt in het dashboardkastje.
3. Haal de handrem er af (grote hendel tussen de stoelen).
4. Je bent nu klaar om weg te rijden.

Problemen met starten? Let op de volgende zaken:

- Trap de koppeling en voetrem in, voordat je de auto start. Trap de koppeling helemaal tot de bodem in.
- Het stuur staat op stuurslot. Draait het stuur 1 centimeter van links naar rechts en probeer tegelijkertijd de sleutel om te draaien.
- De startblokkering is nog ingeschakeld. Zet de auto uit en open de auto nogmaals met je smartphone of OV-chipkaart.
- Open de auto met de knop op de sleutel, die in het dashboardkastje ligt.

{% endif %}

{% if resource.model contains "C3" %}

1. Trap de koppeling in en zet je voet op de rem.
2. Start de auto met de sleutel in het contactslot rechts van het stuur. De autosleutel ligt in het dashboardkastje.
3. Haal de handrem er af (grote hendel tussen de stoelen).
4. Je bent nu klaar om weg te rijden.

Problemen met starten? Let op de volgende zaken:

- Trap de koppeling en voetrem in, voordat je de auto start. Trap de koppeling helemaal tot de bodem in.
- Het stuur staat op stuurslot. Draait het stuur 1 centimeter van links naar rechts en probeer tegelijkertijd de sleutel om te draaien.
- De startblokkering is nog ingeschakeld. Zet de auto uit en open de auto nogmaals met je smartphone of OV-chipkaart.
- Open de auto met de knop op de sleutel, die in het dashboardkastje ligt.

{% endif %}

{% if resource.model contains "Aygo" %}

1. Trap de koppeling in en zet je voet op de rem.
2. Start de auto met de start/stop-knop (rechts van het stuur).

![Started van de Aygo](https://mywheels.nl/images/content/aygo_start_stop.jpg)

3. Haal de handrem er af (grote hendel tussen de stoelen).
4. Je bent nu klaar om weg te rijden.

Problemen met starten? Let op de volgende zaken:

- Trap de koppeling en voetrem in, voordat je de auto start. Trap de koppeling helemaal tot de bodem in.
- De startblokkering is nog ingeschakeld. Zet de auto uit en open de auto nogmaals met je smartphone of OV-chipkaart.
- Open de auto met de knop op de sleutel, die in het dashboardkastje ligt.

{% endif %}

{% if resource.fuelType == "elektrisch" %}

# Hoe laad ik de auto?

{% endif %}

{% if resource.model contains "Leaf" %}
Opladen tijdens de rit kan bij elke openbare laadpaal. De auto laadt bij een normale laadpaal met circa 20 kilometer per uur bij. Zoek een beschikbare laadpaal via www.oplaadpalen.nl.

1. Zorg dat de auto uit staat.
2. Druk in de auto op de ontgrendelknop (links onder het stuur) om de laadklep van de auto te openen.
3. Steek de laadkabel in de auto in de rechter aansluiting (aan de voorkant van de auto).
4. Steek de andere kant van de kabel in de laadpaal.
5. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van de laadpaal.
6. De blauwe lampjes aan de binnenkant van de auto, op het dashboard, beginnen te knipperen als de kabel juist is aangesloten.

![Controlelichten laden Leaf](https://mywheels.nl/images/content/leaf_opladen.jpg)

Parkeer je de auto bij een laadpaal? Koppel de auto dan **ALTIJD** aan de paal. Anders wordt de auto weggesleept.

Bekijk onze instructievideo van de Nissan Leaf hieronder:

[![Instructievideo Nissan Leaf](https://mywheels.nl/images/content/leaf_video_button.jpg)](http://www.youtube.com/watch?v=8o7zu_yZ3uw)

{% endif %}

{% if resource.model contains "ZOE" %}
Opladen tijdens de rit kan bij elke openbare laadpaal. De auto laadt bij een normale laadpaal met circa 60 kilometer per uur bij. Zoek een beschikbare laadpaal via www.oplaadpalen.nl.

1. Zorg dat de auto uit staat.
2. Druk in de auto op de ontgrendelknop (links onder het stuur) om de laadklep van de auto te openen.

![Laadkabel ZOE ontkoppelen](https://mywheels.nl/images/content/zoe_laadknop.jpg)

3. Open binnen de laadklep het bovenste klepje.
4. Steek de laadkabel aan de voorkant in de auto en in de laadpaal.
5. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van de laadpaal.
6. Wacht tot de verlichting van de laadpaal verandert van kleur. Controleer of de letters ZE boven de laadkabel in de auto blauw branden. Alleen dan laadt de auto.

{% endif %}

{% if resource.model contains "CITIGOe" %}
Opladen tijdens de rit kan bij elke openbare laadpaal. De auto laadt bij een normale laadpaal met circa 37 kilometer per uur bij. Zoek een beschikbare laadpaal via www.oplaadpalen.nl.

1. Zorg dat de auto uit staat.
2. Haal de afdekkap weg achter de laadklep van de auto. Als deze vast blijft zitten, open je de auto nogmaals met de autosleutel.

![Laadkabel CITIGOe ontkoppelen](https://mywheels.nl/images/content/citigoe_laaddop.jpg)

3. Steek de laadkabel in de auto en in de laadpaal.
4. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van de laadpaal.
5. Wacht tot de verlichting van de laadpaal verandert van kleur. De auto laadt op als het lampje op de laadpaal blauw brandt. Let ook op de indicator op de auto, het ledje naast de stekker pulseert groen als de auto aan het opladen is.

{% endif %}

{% if resource.fuelType == "elektrisch" %}

# Hoe kan ik snelladen bij Fastned of Allego?

{% endif %}

{% if resource.model contains "Leaf" %}
Bij een snellaadpaal laad je 110 km bij in 30 minuten. Zoek een beschikbaar snellaadpunt via www.oplaadpalen.nl.

1. Zorg dat de auto uit staat.
2. Druk in de auto op de ontgrendelknop (links onder het stuur) om de laadklep van de auto te openen.
3. Steek de (bij het snellaadpunt) beschikbare **CHAdeMO-snellaadkabel** in de voorkant van de auto (linker zwarte klep).

![CHAdeMO-snellaadkabel bij Fastned](https://mywheels.nl/images/content/fastned_chademo.jpg)

4. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van het laadstation.
5. Controleer of de blauwe lampjes bovenop het dashboard knipperen. Alleen dan laadt de auto.

Wil je weer verder? Houd dan de laadsleutel voor het leesvak van het laadstation. Je kunt nu de kabel loskoppelen.

{% endif %}

{% if resource.model contains "ZOE" %}
Bij een snellaadpaal laad je 100 km bij in 25 minuten. Zoek een beschikbaar snellaadpunt via www.oplaadpalen.nl.

1. Zorg dat de auto uit staat.
2. Druk in de auto op de ontgrendelknop (links onder het stuur) om de laadklep van de auto te openen.
3. Open binnen de laadklep het bovenste en het onderste klepje.
4. Steek de (bij het snellaadpunt) beschikbare **CCS-snellaadkabel** in de voorkant van auto.

![CSS-snellaadkabel bij Fastned](https://mywheels.nl/images/content/fastned_ccs.jpg)

5. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van het laadstation.
6. Controleer of de letters ZE boven de laadkabel in de auto blauw branden. Alleen dan laadt de auto.

Wil je weer verder? Het laden stop je door de auto los te koppelen en de laadsleutel aan te bieden.

{% endif %}

{% if resource.model contains "CITIGOe" %}
Bij een snellaadpaal laad je 100 km bij in 25 minuten. Je laadt 80% bij in ruim een uur. Zoek een beschikbaar snellaadpunt via www.oplaadpalen.nl.

1. Zorg dat de auto uit staat.
2. Haal beide afdekdoppen weg achter de laadklep van de auto. Als deze vast blijven zitten, open je de auto nogmaals met de autosleutel.
3. Steek de (bij het snellaadpunt) beschikbare **CCS-snellaadkabel** in de auto.

![CSS-snellaadkabel bij Fastned](https://mywheels.nl/images/content/fastned_ccs.jpg)

4. Houd de groen/grijze laadsleutel (aan de autosleutel) tegen het leesvlak van het laadstation.
5. Controleer of de auto laadt. Er branden blauwe lampjes op het snellaadstation én het ledje naast de stekker in de auto pulseert groen.

Wil je weer verder? Houd dan de laadsleutel voor het leesvak van het laadstation. Je kunt nu de kabel loskoppelen.

{% endif %}

{% if resource.fuelType == "benzine" %}

# Hoe tank ik de auto?

{% endif %}

{% if resource.model == "C1" %}

- Breng de auto terug met minimaal ¼ tank aan brandstof (minimaal 2 streepjes).
- Open het tankklepje via de hendel links van het stuur.

![Tankklep bij de Citroën C1](https://mywheels.nl/images/content/c1_tankdop.jpg)

- De auto rijdt op E10 benzine (voormalig Euro95).
- Betaal met de tankpas, deze ligt in het dashboardkastje.
  {% if resource.fuelCardCode %}
- De pincode van de tankpas is: **{{ resource.fuelCardCode }}**
  {% else %}
- De **pincode van de tankpas** vind je hier zodra je rit begint.
  {% endif %}
{% endif %}

- De betaalautomaat vraagt of het een vervangende auto is (nee) en wat de kilometerstand is (vul een schatting in).

Kun je de tankpas niet vinden? Schiet het dan voor, en stuur de tankbon naar support@mywheels.nl.

{% if resource.model == "C3" %}

- Breng de auto terug met minimaal ¼ tank aan brandstof (minimaal 2 streepjes).
- Open het tankklepje, de tankdop open je met de autosleutel.

![Tankklep bij de Citroën C3](https://mywheels.nl/images/content/c3_tankklep.jpg)

- De auto rijdt op E10 benzine (voormalig Euro95).
- Betaal met de tankpas, deze ligt in het dashboardkastje.
  {% if resource.fuelCardCode %}
- De pincode van de tankpas is: **{{ resource.fuelCardCode }}**
  {% else %}
- De **pincode van de tankpas** vind je hier zodra je rit begint.
  {% endif %}
- De betaalautomaat vraagt of het een vervangende auto is (nee) en wat de kilometerstand is (vul een schatting in).

Kun je de tankpas niet vinden? Schiet het dan voor, en stuur de tankbon naar support@mywheels.nl.

{% endif %}

{% if resource.model == "Aygo" %}

- Breng de auto terug met minimaal ¼ tank aan brandstof (minimaal 2 streepjes).
- Open het tankklepje via de hendel links van het stuur.

![Tankklep bij de Toyota Aygo](https://mywheels.nl/images/content/c1_tankdop.jpg)

- De auto rijdt op E10 benzine (voormalig Euro95).
- Betaal met de tankpas, deze ligt in het dashboardkastje.
  {% if resource.fuelCardCode %}
- De pincode van de tankpas is: **{{ resource.fuelCardCode }}**
  {% else %}
- De **pincode van de tankpas** vind je hier zodra je rit begint.
  {% endif %}
- De betaalautomaat vraagt of het een vervangende auto is (nee) en wat de kilometerstand is (vul een schatting in).

Kun je de tankpas niet vinden? Schiet het dan voor, en stuur de tankbon naar support@mywheels.nl.

{% endif %}

# Waar breng ik de auto terug?

{% if resource.fuelType == "elektrisch" and resource.parkingType == "zone" %}
De auto breng je aan het einde van je rit terug in het **zonegebied {{ resource.location }}** in {{ resource.city }}.
Je vindt de zone in de MyWheels app.

Koppel de auto **altijd** aan de laadpaal als je hem bij een laadpaal parkeert.

### Ben je terug en is de accu minder dan 80%?

Koppel de auto dan aan een laadpaal binnen de zone. De beschikbare laadpalen staan in de MyWheels app. Controleer of de auto aan het laden is.

### Ben je terug en is de accu 80% of meer?

Parkeer de auto dan in de zone op een plek zonder laadpaal.

{% if resource.model contains "CITIGOe" %}
Einde van je rit? Sluit de auto **ALLEEN** af met de MyWheels app of OV-chipkaart en **NIET** met de autosleutel.

{% endif %}

{% elsif resource.fuelType == "elektrisch" and resource.parkingType == "parking_spot" %}
De auto heeft een **vaste parkeerplek** bij een laadpaal, aan de {{ resource.location }} ter hoogte van huisnummer {{ resource.streetNumber }} in {{ resource.city }}.

Zet de auto aan het einde van je rit weer terug op deze plek en koppel de auto aan de laadpaal.

Is bij terugkomst de parkeerplek bezet? Neem dan contact op met ons supportteam op telefoonnummer {{ phoneNo }}.
Zet de auto nooit op een invalidenparkeerplaats.

{% elsif resource.fuelType == "benzine" and resource.parkingType == "zone" %}
De auto breng je aan het einde van je rit terug in het **zonegebied {{ resource.location }}** in {{ resource.city }}.
Je vindt de zone in de MyWheels app.

{% else %}
De auto heeft een **vaste parkeerplek** aan de {{ resource.location }} ter hoogte van huisnummer {{ resource.streetNumber }} in {{ resource.city }}.

Zet de auto aan het einde van je rit weer terug op dezelfde plek.

Is bij terugkomst de parkeerplek bezet? Neem dan contact op met ons supportteam op telefoonnummer {{ phoneNo }}.
Zet de auto nooit op een invalidenparkeerplaats.

{% endif %}

{% if booking %}

# Wat moet ik doen bij schade of pech?

## Schade

Rijd je nieuwe schade en kun je niet verder rijden? Neem dan telefonisch contact met ons op via {{ phoneNo }}. Kun je wel verder rijden? Meld dan binnen 24 uur de schade via support@mywheels.nl.

## Pech

Neem bij pech met de auto telefonisch contact met ons op via {{ phoneNo }}.

{% endif %}
`;
