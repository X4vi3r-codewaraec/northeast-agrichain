/** Indigenous Technical Knowledge (ITK) shared for NER farming communities.
 *  Curated, attribution-light demo content — surfaced alongside scientific
 *  forecasts so users see both knowledge systems side by side. */

export type ItkNote = {
  region: string;
  pattern: string;
  meaning: string;
  season: string;
};

export const ITK_NOTES: ItkNote[] = [
  {
    region: "Barak valley, Assam",
    pattern: "White-ant swarmers take wing in the evening",
    meaning: "Rain within 24–48 hours; protect stored paddy and hayricks",
    season: "Pre-monsoon",
  },
  {
    region: "Meghalaya plateau",
    pattern: "Bright red winter sunrise with a pale halo",
    meaning: "Frost risk in the valleys — cover nightshade seedlings",
    season: "Winter",
  },
  {
    region: "Jaintia Hills",
    pattern: "Frogs call loudly before sunset",
    meaning: "The monsoon front is strengthening; complete transplanting fast",
    season: "Monsoon onset",
  },
  {
    region: "Arunachal foothills",
    pattern: "Bees fly low and settle near the hive entrance",
    meaning: "A wet spell is near — keep cardamom curing houses dry",
    season: "Pre-monsoon",
  },
  {
    region: "Sikkim",
    pattern: "Black clouds sit on Kanchenjunga before noon",
    meaning: "Afternoon thundershower for the lower slopes; avoid open-field lime",
    season: "Late spring",
  },
  {
    region: "Cachar lowlands",
    pattern: "Cicadas stop singing in the evening",
    meaning: "Persistent dry phase — shift irrigation scheduling",
    season: "Autumn",
  },
  {
    region: "Mizoram hill slopes",
    pattern: "Morning mist climbs the hillsides instead of lifting",
    meaning: "Overcast wet day ahead; delay jhum burn or spraying",
    season: "Retreating monsoon",
  },
  {
    region: "Nagaland, Kohima",
    pattern: "Ants carry eggs to high ground in a column",
    meaning: "Heavy rain / possible flash flood — move poultry and keep drains open",
    season: "Monsoon peak",
  },
];