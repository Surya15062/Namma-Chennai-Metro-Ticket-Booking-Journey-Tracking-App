export const METRO_DATA = {
  lines: {
    Green: {
      stations: [
        'St. Thomas Mount', 'Arignar Anna Alandur Metro', 'Ekkattuthangal', 'Ashok Nagar',
        'Vadapalani', 'Arumbakkam', 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro', 'Koyambedu', 'Thirumangalam',
        'Anna Nagar Tower', 'Anna Nagar East', 'Shenoy Nagar',
        "Pachaiyappa's College", 'Kilpauk Medical College', 'Nehru Park',
        'Egmore', 'MGR Central',
      ],
    },
    Blue: {
      stations: [
        'Washermenpet', 'Mannadi', 'High Court', 'MGR Central',
        'Government Estate', 'LIC', 'Thousand Lights', 'AG-DMS',
        'Teynampet', 'Nandanam', 'Saidapet', 'Little Mount',
        'Guindy', 'Arignar Anna Alandur Metro', 'Nanganallur Road', 'Meenambakkam',
        'Chennai International Airport',
      ],
    },
  },
  interchanges: ['Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro', 'Arignar Anna Alandur Metro'],
} as const;

export type LineName = 'Green' | 'Blue';

export const ALL_STATIONS = [
  ...METRO_DATA.lines.Green.stations,
  ...METRO_DATA.lines.Blue.stations.filter(
    s => !METRO_DATA.lines.Green.stations.includes(s as any)
  ),
].sort();

export const POPULAR_STATIONS = [
  'Guindy', 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro', 'Arignar Anna Alandur Metro', 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro', 'Egmore',
  'Anna Nagar Tower', 'Koyambedu', 'Chennai International Airport',
];

// Fare calculation
export const getFare = (stations: number): number => {
  if (stations <= 3)  return 10;
  if (stations <= 6)  return 20;
  if (stations <= 10) return 30;
  if (stations <= 15) return 40;
  return 60;
};

// Travel time estimation (~3 min per station)
export const getTravelTime = (stations: number): number => stations * 3;
