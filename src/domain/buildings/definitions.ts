import type { BuildingDefinition, BuildingStage } from './types';
import type { ResourceKey } from '@/domain/rewards/constants';

/**
 * The canonical building catalog for V1 (Phase 7). Nineteen buildings, organized
 * by category, with costs balanced against typical household resource income
 * from Phase 5 (~35–45 resources/week per type with 2 active people).
 *
 * References: docs/building-system.md §10, building-definitions.md,
 * building-costs.md, building-balancing.md.
 */

export const BUILDING_DEFINITIONS_V1: readonly BuildingDefinition[] = [
  // ===== MOVEMENT (5 buildings)
  {
    id: 'training_room',
    title: 'Trainingsraum',
    description: 'Ein Platz für regelmäßiges Training und Kraftentwicklung.',
    longDescription:
      'Der Trainingsraum ist ein Ort der Konzentration und Kontinuität. Hier entstehen feste Bewegungsroutinen und regelmäßiges Training wird Teil der gemeinsamen Struktur. Der Raum schafft Raum für fokussierte Bewegung.',
    primaryCategory: 'movement',
    secondaryAreas: [],
    compatibleSizes: ['small', 'medium'],
    allowedRegions: ['movement_quarter'],
    unlockLevel: 2,
    prerequisiteBuilding: null,
    baseCosts: { energy: 12, food: 0, nature: 2, community: 3, building_material: 8 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'training_room_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'movement_focus' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Neue fokussierte Bewegungsmissionen verfügbar',
      },
    ],
    assetId: 'building_training_room',
    a11yDescription: 'Trainingsraum, kleines bis mittleres Gebäude im Sportviertel',
    sortOrder: 1,
    ruleVersion: 1,
  },
  {
    id: 'gym',
    title: 'Fitnessstudio',
    description: 'Moderne Ausrüstung für diverse Trainingsmethoden.',
    longDescription:
      'Das Fitnessstudio erweitert die Möglichkeiten für abwechslungsreiches Training. Mit verschiedenen Geräten und Flächen entstehen neue Trainingsmöglichkeiten für beide.',
    primaryCategory: 'movement',
    secondaryAreas: [],
    compatibleSizes: ['medium', 'large'],
    allowedRegions: ['movement_quarter'],
    unlockLevel: 3,
    prerequisiteBuilding: 'training_room',
    baseCosts: { energy: 18, food: 2, nature: 3, community: 5, building_material: 16 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'gym_goals',
        type: 'goal_template_unlock',
        parameters: { goal_template: 'gym_strength_goal' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Neue Trainingszielvorlagen freigeschaltet',
      },
    ],
    assetId: 'building_gym',
    a11yDescription: 'Fitnessstudio, mittleres bis großes Gebäude im Sportviertel',
    sortOrder: 2,
    ruleVersion: 1,
  },
  {
    id: 'running_track',
    title: 'Laufstrecke',
    description: 'Ein gepflegter Weg für Laufen und Joggen.',
    longDescription:
      'Die Laufstrecke ist ein offener, einladender Ort für Ausdauerbewegung. Ein schöner Weg mit klarer Länge schafft Struktur für das gemeinsame Joggen.',
    primaryCategory: 'movement',
    secondaryAreas: [],
    compatibleSizes: ['large'],
    allowedRegions: ['movement_quarter'],
    unlockLevel: 2,
    prerequisiteBuilding: null,
    baseCosts: { energy: 10, food: 0, nature: 4, community: 2, building_material: 9 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'running_track_bonus',
        type: 'resource_bonus',
        parameters: { resource_type: 'energy', value: 1, trigger: 'shared_outdoor_activity' },
        limit: 2,
        limitPeriod: 'week',
        label: 'Bis zu 2× pro Woche +1 Energie für gemeinsame Außenaktivitäten',
      },
    ],
    assetId: 'building_running_track',
    a11yDescription: 'Laufstrecke, großes Gebäude im Sportviertel',
    sortOrder: 3,
    ruleVersion: 1,
  },
  {
    id: 'yoga_studio',
    title: 'Yogastudio',
    description: 'Ein ruhiger Platz für Yoga und Dehnübungen.',
    longDescription:
      'Das Yogastudio ist ein Ort der Ruhe und Achtsamkeit. Hier entsteht Raum für sanfte, regenerative Bewegung und gemeinsame Rituale der Entschleunigung.',
    primaryCategory: 'movement',
    secondaryAreas: [],
    compatibleSizes: ['small'],
    allowedRegions: ['movement_quarter'],
    unlockLevel: 2,
    prerequisiteBuilding: null,
    baseCosts: { energy: 8, food: 1, nature: 3, community: 4, building_material: 7 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'yoga_ritual',
        type: 'ritual_template_unlock',
        parameters: { ritual_template: 'shared_yoga_morning' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Neues gemeinsames Morgen-Yoga-Ritual möglich',
      },
    ],
    assetId: 'building_yoga_studio',
    a11yDescription: 'Yogastudio, kleines Gebäude im Sportviertel',
    sortOrder: 4,
    ruleVersion: 1,
  },
  {
    id: 'bike_station',
    title: 'Fahrradstation',
    description: 'Werkstatt und Abstellplatz für Fahrräder.',
    longDescription:
      'Die Fahrradstation verbindet Bewegung mit Nachhaltigkeit. Hier werden Fahrräder gepflegt und Radausflüge geplant – eine Brücke zwischen Aktivität und Umweltschonung.',
    primaryCategory: 'movement',
    secondaryAreas: ['sustainability'],
    compatibleSizes: ['small', 'medium'],
    allowedRegions: ['movement_quarter', 'sustainability_infra'],
    unlockLevel: 2,
    prerequisiteBuilding: null,
    baseCosts: { energy: 9, food: 0, nature: 3, community: 3, building_material: 8 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'bike_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'bike_activity' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Fahrrad-Missionen verfügbar',
      },
    ],
    assetId: 'building_bike_station',
    a11yDescription: 'Fahrradstation, kleines bis mittleres Gebäude',
    sortOrder: 5,
    ruleVersion: 1,
  },

  // ===== NUTRITION (4 buildings)
  {
    id: 'veg_bed',
    title: 'Gemüsebeet',
    description: 'Ein kleines Beet für frisches Gemüse.',
    longDescription:
      'Das Gemüsebeet ist der Anfang der Eigenversorgung. Ein überschaubares Projekt, das schnell erste Früchte bringt und den Samen für größere Gartenprojekte legt.',
    primaryCategory: 'nutrition',
    secondaryAreas: [],
    compatibleSizes: ['small'],
    allowedRegions: ['nutrition_quarter', 'residential'],
    unlockLevel: 1,
    prerequisiteBuilding: null,
    baseCosts: { energy: 2, food: 8, nature: 5, community: 2, building_material: 6 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'veg_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'veg_gardening' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Garten-Missionen verfügbar',
      },
    ],
    assetId: 'building_veg_bed',
    a11yDescription: 'Gemüsebeet, kleines Gebäude',
    sortOrder: 1,
    ruleVersion: 1,
  },
  {
    id: 'community_garden',
    title: 'Gemeinschaftsgarten',
    description: 'Ein großer, gepflegter Garten für gemeinsame Ernte.',
    longDescription:
      'Der Gemeinschaftsgarten ist ein Zentrum der Eigenversorgung und des gemeinsamen Handelns. Hier wachsen Gemüse, Kräuter und Früchte – und mit ihnen eine tiefere Verbindung zur Natur und zueinander.',
    primaryCategory: 'nutrition',
    secondaryAreas: [],
    compatibleSizes: ['medium', 'large'],
    allowedRegions: ['nutrition_quarter'],
    unlockLevel: 3,
    prerequisiteBuilding: 'veg_bed',
    baseCosts: { energy: 5, food: 22, nature: 10, community: 8, building_material: 18 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'community_garden_goals',
        type: 'goal_template_unlock',
        parameters: { goal_template: 'shared_garden_goal' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Neue gemeinsame Gartenziele freigeschaltet',
      },
    ],
    assetId: 'building_community_garden',
    a11yDescription: 'Gemeinschaftsgarten, mittleres bis großes Gebäude',
    sortOrder: 2,
    ruleVersion: 1,
  },
  {
    id: 'orchard',
    title: 'Obstgarten',
    description: 'Obstbäume und Beerensträucher für langfristige Ernte.',
    longDescription:
      'Der Obstgarten ist ein Versprechen in die Zukunft. Mit Bäumen, die über Jahre hinweg wachsen, entsteht eine Kontinuität von Pflege und Ernte – wie auch die gemeinsame Stadt selbst.',
    primaryCategory: 'nutrition',
    secondaryAreas: ['sustainability'],
    compatibleSizes: ['large'],
    allowedRegions: ['nutrition_quarter'],
    unlockLevel: 3,
    prerequisiteBuilding: null,
    baseCosts: { energy: 3, food: 18, nature: 8, community: 4, building_material: 15 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'orchard_bonus',
        type: 'resource_bonus',
        parameters: { resource_type: 'food', value: 1, trigger: 'harvest' },
        limit: 3,
        limitPeriod: 'week',
        label: 'Bis zu 3× pro Woche +1 Nahrung bei Ernte-Aktivitäten',
      },
    ],
    assetId: 'building_orchard',
    a11yDescription: 'Obstgarten, großes Gebäude im Ernährungsviertel',
    sortOrder: 3,
    ruleVersion: 1,
  },
  {
    id: 'farmers_market',
    title: 'Wochenmarkt',
    description: 'Ein Marktplatz für Austausch regionaler, veganer Produkte.',
    longDescription:
      'Der Wochenmarkt ist ein Treffpunkt und Verteilzentrum für regionale, vegane Produkte. Hier tauschen sich Lutz und René mit anderen Gärtner*innen aus und entdecken neue Sorten.',
    primaryCategory: 'nutrition',
    secondaryAreas: ['community'],
    compatibleSizes: ['medium', 'large'],
    allowedRegions: ['nutrition_quarter'],
    unlockLevel: 4,
    prerequisiteBuilding: null,
    baseCosts: { energy: 2, food: 16, nature: 3, community: 10, building_material: 14 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'market_ritual',
        type: 'ritual_template_unlock',
        parameters: { ritual_template: 'market_visit_ritual' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Ritual „Wochenmarktbesuch" freigeschaltet',
      },
    ],
    assetId: 'building_farmers_market',
    a11yDescription: 'Wochenmarkt, mittleres bis großes Gebäude',
    sortOrder: 4,
    ruleVersion: 1,
  },

  // ===== SUSTAINABILITY (5 buildings)
  {
    id: 'solar_roofs',
    title: 'Solardächer',
    description: 'Solaranlagen auf Hausdächern für saubere Energie.',
    longDescription:
      'Die Solardächer nutzen die Kraft der Sonne für saubere Energie. Ein sichtbares Symbol der Stadttransformation – jeden Tag sichtbar, jeden Tag wirksam.',
    primaryCategory: 'sustainability',
    secondaryAreas: [],
    compatibleSizes: ['small', 'medium'],
    allowedRegions: ['sustainability_infra'],
    unlockLevel: 4,
    prerequisiteBuilding: null,
    baseCosts: { energy: 6, food: 1, nature: 10, community: 4, building_material: 12 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'solar_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'renewable_energy' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Missionen zu erneuerbarer Energie verfügbar',
      },
    ],
    assetId: 'building_solar_roofs',
    a11yDescription: 'Solardächer, kleines bis mittleres Gebäude',
    sortOrder: 1,
    ruleVersion: 1,
  },
  {
    id: 'rainwater_store',
    title: 'Regenwasserspeicher',
    description: 'Sammlung und Speicherung von Regenwasser.',
    longDescription:
      'Der Regenwasserspeicher nutzt das kostbare Regenwasser und reduziert Abhängigkeit von externen Ressourcen. Ein kluges System, das den Wasserkreislauf respektiert.',
    primaryCategory: 'sustainability',
    secondaryAreas: [],
    compatibleSizes: ['small'],
    allowedRegions: ['sustainability_infra', 'nutrition_quarter'],
    unlockLevel: 4,
    prerequisiteBuilding: null,
    baseCosts: { energy: 3, food: 2, nature: 12, community: 2, building_material: 10 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'rainwater_bonus',
        type: 'resource_bonus',
        parameters: { resource_type: 'nature', value: 1, trigger: 'rainy_activity' },
        limit: 2,
        limitPeriod: 'week',
        label: '+1 Natur bis zu 2× wöchentlich für Regenwasser-Nutzung',
      },
    ],
    assetId: 'building_rainwater_store',
    a11yDescription: 'Regenwasserspeicher, kleines Gebäude',
    sortOrder: 2,
    ruleVersion: 1,
  },
  {
    id: 'recycling_center',
    title: 'Recyclingzentrum',
    description: 'Anlaufstelle für Recycling und Abfalltrennung.',
    longDescription:
      'Das Recyclingzentrum ist ein Treffpunkt für bewusstes Wirtschaften. Hier wird Müll zu Rohstoffen, und Achtsamkeit wird zur alltäglichen Praxis.',
    primaryCategory: 'sustainability',
    secondaryAreas: [],
    compatibleSizes: ['medium'],
    allowedRegions: ['sustainability_infra'],
    unlockLevel: 4,
    prerequisiteBuilding: null,
    baseCosts: { energy: 2, food: 1, nature: 14, community: 5, building_material: 13 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'recycling_goals',
        type: 'goal_template_unlock',
        parameters: { goal_template: 'zero_waste_goal' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Ziele zur Abfallvermeidung freigeschaltet',
      },
    ],
    assetId: 'building_recycling_center',
    a11yDescription: 'Recyclingzentrum, mittleres Gebäude',
    sortOrder: 3,
    ruleVersion: 1,
  },
  {
    id: 'repair_workshop',
    title: 'Reparaturwerkstatt',
    description: 'Werkstatt zur Reparatur und Instandhaltung von Gegenständen.',
    longDescription:
      'Die Reparaturwerkstatt ist ein Zeichen von Geduld und Nachhaltigkeit. Statt Wegwerfkultur: Pflege, Reparatur, Wertschätzung für das, was schon vorhanden ist.',
    primaryCategory: 'sustainability',
    secondaryAreas: ['community'],
    compatibleSizes: ['small', 'medium'],
    allowedRegions: ['sustainability_infra', 'culture_quarter'],
    unlockLevel: 4,
    prerequisiteBuilding: null,
    baseCosts: { energy: 5, food: 0, nature: 8, community: 6, building_material: 11 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'repair_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'repair_sustainability' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Reparatur- und Wartungsmissionen verfügbar',
      },
    ],
    assetId: 'building_repair_workshop',
    a11yDescription: 'Reparaturwerkstatt, kleines bis mittleres Gebäude',
    sortOrder: 4,
    ruleVersion: 1,
  },
  {
    id: 'green_roof',
    title: 'Begrüntes Dach',
    description: 'Ein begrünter Dachgarten für Natur in der Stadt.',
    longDescription:
      'Das begrünte Dach schafft Grünraum dort, wo Platz knapp ist. Ein kleines Biotop inmitten der Stadt – für Insekten, Pflanzen und menschliche Regeneration.',
    primaryCategory: 'sustainability',
    secondaryAreas: ['animal_welfare'],
    compatibleSizes: ['small'],
    allowedRegions: ['city_center', 'culture_quarter'],
    unlockLevel: 4,
    prerequisiteBuilding: null,
    baseCosts: { energy: 1, food: 3, nature: 11, community: 3, building_material: 9 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'green_roof_nature_bonus',
        type: 'resource_bonus',
        parameters: { resource_type: 'nature', value: 1, trigger: 'nature_observation' },
        limit: 2,
        limitPeriod: 'week',
        label: '+1 Natur bis zu 2× wöchentlich für Naturbeobachtung',
      },
    ],
    assetId: 'building_green_roof',
    a11yDescription: 'Begrüntes Dach, kleines Gebäude',
    sortOrder: 5,
    ruleVersion: 1,
  },

  // ===== ANIMAL WELFARE (4 buildings)
  {
    id: 'wildflower_meadow',
    title: 'Wildblumenwiese',
    description: 'Eine Blütenwiese für Bienen, Schmetterlinge und andere Insekten.',
    longDescription:
      'Die Wildblumenwiese ist ein Fest der Farben und Leben. Blüten locken Bestäuber an, die Wiese wird zum Refugium für Artenvielfalt – unmittelbar sichtbar und täglich erlebbar.',
    primaryCategory: 'animal_welfare',
    secondaryAreas: [],
    compatibleSizes: ['small', 'medium'],
    allowedRegions: ['nature_reserve'],
    unlockLevel: 5,
    prerequisiteBuilding: null,
    baseCosts: { energy: 1, food: 2, nature: 14, community: 2, building_material: 10 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'wildflower_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'pollinator_garden' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Missionen zur Bestäuterförderung verfügbar',
      },
    ],
    assetId: 'building_wildflower_meadow',
    a11yDescription: 'Wildblumenwiese, kleines bis mittleres Gebäude',
    sortOrder: 1,
    ruleVersion: 1,
  },
  {
    id: 'butterfly_garden',
    title: 'Schmetterlingsgarten',
    description: 'Ein Garten gezielt für Schmetterlinge und ihre Raupen.',
    longDescription:
      'Der Schmetterlingsgarten ist ein bewusstes Projekt für eine charismatische Tiergruppe. Mit Nektarpflanzen und Raupenfutter wird die ganze Lebensbahn der Schmetterlinge unterstützt.',
    primaryCategory: 'animal_welfare',
    secondaryAreas: [],
    compatibleSizes: ['small', 'medium'],
    allowedRegions: ['nature_reserve'],
    unlockLevel: 5,
    prerequisiteBuilding: null,
    baseCosts: { energy: 2, food: 3, nature: 16, community: 3, building_material: 11 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'butterfly_goals',
        type: 'goal_template_unlock',
        parameters: { goal_template: 'butterfly_observation_goal' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Schmetterlingsbeobachtungsziele freigeschaltet',
      },
    ],
    assetId: 'building_butterfly_garden',
    a11yDescription: 'Schmetterlingsgarten, kleines bis mittleres Gebäude',
    sortOrder: 2,
    ruleVersion: 1,
  },
  {
    id: 'bird_reserve',
    title: 'Vogelreservat',
    description: 'Ein geschützter Lebensraum für einheimische Vogelarten.',
    longDescription:
      'Das Vogelreservat ist ein Rückzugsort für Vögel in einer oft lauten Stadt. Mit natürlicher Vegetation, Wasser und Brutplätzen wird die Vogelvielfalt gefördert und die morgendliche Stille bereichert.',
    primaryCategory: 'animal_welfare',
    secondaryAreas: [],
    compatibleSizes: ['large'],
    allowedRegions: ['nature_reserve', 'water_forest'],
    unlockLevel: 5,
    prerequisiteBuilding: null,
    baseCosts: { energy: 2, food: 2, nature: 18, community: 4, building_material: 14 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'bird_bonus',
        type: 'community_bonus',
        parameters: { value: 2 },
        limit: 1,
        limitPeriod: 'week',
        label: '+2 Gemeinschaft einmal pro Woche für gemeinsame Vogelbeobachtung',
      },
    ],
    assetId: 'building_bird_reserve',
    a11yDescription: 'Vogelreservat, großes Gebäude',
    sortOrder: 3,
    ruleVersion: 1,
  },
  {
    id: 'hedgehog_garden',
    title: 'Igelgarten',
    description: 'Ein Garten gezielt für Igel und kleine Säugetiere.',
    longDescription:
      'Der Igelgarten ist Heimat für die kleinen nächtlichen Bewohner. Mit Unterschlupfmöglichkeiten, natürlichen Futterquellen und ungiftigen Pflanzen wird ein Paradies für Igel geschaffen.',
    primaryCategory: 'animal_welfare',
    secondaryAreas: [],
    compatibleSizes: ['small'],
    allowedRegions: ['nature_reserve', 'residential'],
    unlockLevel: 5,
    prerequisiteBuilding: null,
    baseCosts: { energy: 1, food: 2, nature: 13, community: 2, building_material: 9 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'hedgehog_missions',
        type: 'mission_pool_add',
        parameters: { mission_type: 'small_mammal_care' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Missionen zur Kleintierpflege verfügbar',
      },
    ],
    assetId: 'building_hedgehog_garden',
    a11yDescription: 'Igelgarten, kleines Gebäude',
    sortOrder: 4,
    ruleVersion: 1,
  },

  // ===== COMMUNITY (3 buildings)
  {
    id: 'library',
    title: 'Bibliothek',
    description: 'Ein Treffpunkt für Literatur, Wissen und Austausch.',
    longDescription:
      'Die Bibliothek ist ein Herz der Gemeinde – Bücher, aber auch ein Ort der Stille, des Nachdenkens und des Gesprächs. Ein Anker für gemeinsame Bildung und gegenseitige Bereicherung.',
    primaryCategory: 'community',
    secondaryAreas: [],
    compatibleSizes: ['medium'],
    allowedRegions: ['city_center', 'culture_quarter'],
    unlockLevel: 3,
    prerequisiteBuilding: null,
    baseCosts: { energy: 2, food: 1, nature: 3, community: 18, building_material: 14 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'library_goals',
        type: 'goal_template_unlock',
        parameters: { goal_template: 'reading_goal' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Gemeinsame Leseziele freigeschaltet',
      },
    ],
    assetId: 'building_library',
    a11yDescription: 'Bibliothek, mittleres Gebäude im Stadtzentrum oder Kulturviertel',
    sortOrder: 1,
    ruleVersion: 1,
  },
  {
    id: 'community_house',
    title: 'Gemeinschaftshaus',
    description: 'Ein zentraler Ort für gemeinsame Aktivitäten und Rituale.',
    longDescription:
      'Das Gemeinschaftshaus ist das Herz der gemeinsamen Stadt. Hier entstehen Treffen, Feste, regelmäßige Rituale – ein Ort, an dem beide ihre Zeit miteinander vertiefen können.',
    primaryCategory: 'community',
    secondaryAreas: [],
    compatibleSizes: ['medium', 'large'],
    allowedRegions: ['culture_quarter', 'city_center'],
    unlockLevel: 6,
    prerequisiteBuilding: null,
    baseCosts: { energy: 3, food: 2, nature: 4, community: 24, building_material: 18 },
    upgradeCosts: {} as Readonly<Record<BuildingStage, Record<ResourceKey, number>>>,
    effects: [
      {
        id: 'community_house_ritual',
        type: 'ritual_template_unlock',
        parameters: { ritual_template: 'shared_gathering_ritual' },
        limit: 0,
        limitPeriod: 'none',
        label: 'Neues gemeinsames Zusammenkunfts-Ritual möglich',
      },
    ],
    assetId: 'building_community_house',
    a11yDescription: 'Gemeinschaftshaus, mittleres bis großes Gebäude',
    sortOrder: 2,
    ruleVersion: 1,
  },
];

/** Total buildings in V1 catalog. */
export const BUILDING_COUNT_V1 = BUILDING_DEFINITIONS_V1.length;

/** Quick lookup by id. */
export const BUILDING_BY_ID = new Map<string, BuildingDefinition>(
  BUILDING_DEFINITIONS_V1.map((b) => [b.id, b]),
);

/** Lookup by category. */
export const BUILDINGS_BY_CATEGORY = new Map<string, BuildingDefinition[]>();
for (const building of BUILDING_DEFINITIONS_V1) {
  const list = BUILDINGS_BY_CATEGORY.get(building.primaryCategory) ?? [];
  list.push(building);
  BUILDINGS_BY_CATEGORY.set(building.primaryCategory, list);
}

export function getBuildingDefinition(id: string): BuildingDefinition | undefined {
  return BUILDING_BY_ID.get(id);
}

export function getBuildingsByCategory(category: string): readonly BuildingDefinition[] {
  return (BUILDINGS_BY_CATEGORY.get(category) ?? []).slice();
}
