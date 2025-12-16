// Comprehensive NYC location database for search functionality
import zipCoordinates from './nyc-zip-coordinates.json';

export type LocationType = 'zip' | 'neighborhood' | 'district' | 'borough';

export interface Location {
  id: string;
  type: LocationType;
  label: string; // Display name
  zipCode: string; // Primary zip or representative zip
  alternateZips?: string[]; // For neighborhoods/boroughs spanning multiple zips
  borough?: string;
  searchTerms: string[]; // For fuzzy matching
}

// Major NYC Neighborhoods with their primary zip codes
const neighborhoods: Location[] = [
  // Manhattan
  { id: 'tribeca', type: 'neighborhood', label: 'Tribeca', zipCode: '10013', borough: 'Manhattan', searchTerms: ['tribeca', 'triangle below canal'] },
  { id: 'soho', type: 'neighborhood', label: 'SoHo', zipCode: '10012', borough: 'Manhattan', searchTerms: ['soho', 'south of houston'] },
  { id: 'greenwich-village', type: 'neighborhood', label: 'Greenwich Village', zipCode: '10014', borough: 'Manhattan', searchTerms: ['greenwich village', 'the village', 'west village'] },
  { id: 'east-village', type: 'neighborhood', label: 'East Village', zipCode: '10009', borough: 'Manhattan', searchTerms: ['east village', 'alphabet city'] },
  { id: 'lower-east-side', type: 'neighborhood', label: 'Lower East Side', zipCode: '10002', borough: 'Manhattan', searchTerms: ['lower east side', 'les'] },
  { id: 'chinatown', type: 'neighborhood', label: 'Chinatown', zipCode: '10013', borough: 'Manhattan', searchTerms: ['chinatown'] },
  { id: 'little-italy', type: 'neighborhood', label: 'Little Italy', zipCode: '10013', borough: 'Manhattan', searchTerms: ['little italy'] },
  { id: 'nolita', type: 'neighborhood', label: 'Nolita', zipCode: '10012', borough: 'Manhattan', searchTerms: ['nolita', 'north of little italy'] },
  { id: 'chelsea', type: 'neighborhood', label: 'Chelsea', zipCode: '10011', borough: 'Manhattan', searchTerms: ['chelsea'] },
  { id: 'gramercy', type: 'neighborhood', label: 'Gramercy', zipCode: '10010', borough: 'Manhattan', searchTerms: ['gramercy', 'gramercy park'] },
  { id: 'murray-hill', type: 'neighborhood', label: 'Murray Hill', zipCode: '10016', borough: 'Manhattan', searchTerms: ['murray hill'] },
  { id: 'midtown', type: 'neighborhood', label: 'Midtown', zipCode: '10018', borough: 'Manhattan', searchTerms: ['midtown', 'midtown manhattan', 'times square'] },
  { id: 'hells-kitchen', type: 'neighborhood', label: "Hell's Kitchen", zipCode: '10019', borough: 'Manhattan', searchTerms: ['hells kitchen', "hell's kitchen", 'clinton'] },
  { id: 'upper-east-side', type: 'neighborhood', label: 'Upper East Side', zipCode: '10021', borough: 'Manhattan', searchTerms: ['upper east side', 'ues'] },
  { id: 'upper-west-side', type: 'neighborhood', label: 'Upper West Side', zipCode: '10024', borough: 'Manhattan', searchTerms: ['upper west side', 'uws'] },
  { id: 'harlem', type: 'neighborhood', label: 'Harlem', zipCode: '10027', borough: 'Manhattan', searchTerms: ['harlem', 'central harlem'] },
  { id: 'east-harlem', type: 'neighborhood', label: 'East Harlem', zipCode: '10029', borough: 'Manhattan', searchTerms: ['east harlem', 'spanish harlem', 'el barrio'] },
  { id: 'washington-heights', type: 'neighborhood', label: 'Washington Heights', zipCode: '10032', borough: 'Manhattan', searchTerms: ['washington heights'] },
  { id: 'inwood', type: 'neighborhood', label: 'Inwood', zipCode: '10034', borough: 'Manhattan', searchTerms: ['inwood'] },
  { id: 'financial-district', type: 'neighborhood', label: 'Financial District', zipCode: '10004', borough: 'Manhattan', searchTerms: ['financial district', 'fidi', 'wall street'] },
  { id: 'battery-park', type: 'neighborhood', label: 'Battery Park City', zipCode: '10280', borough: 'Manhattan', searchTerms: ['battery park city', 'battery park'] },
  
  // Brooklyn
  { id: 'williamsburg', type: 'neighborhood', label: 'Williamsburg', zipCode: '11211', borough: 'Brooklyn', searchTerms: ['williamsburg'] },
  { id: 'greenpoint', type: 'neighborhood', label: 'Greenpoint', zipCode: '11222', borough: 'Brooklyn', searchTerms: ['greenpoint'] },
  { id: 'bushwick', type: 'neighborhood', label: 'Bushwick', zipCode: '11237', borough: 'Brooklyn', searchTerms: ['bushwick'] },
  { id: 'bedford-stuyvesant', type: 'neighborhood', label: 'Bedford-Stuyvesant', zipCode: '11216', borough: 'Brooklyn', searchTerms: ['bedford stuyvesant', 'bed stuy', 'bedstuy'] },
  { id: 'park-slope', type: 'neighborhood', label: 'Park Slope', zipCode: '11215', borough: 'Brooklyn', searchTerms: ['park slope'] },
  { id: 'brooklyn-heights', type: 'neighborhood', label: 'Brooklyn Heights', zipCode: '11201', borough: 'Brooklyn', searchTerms: ['brooklyn heights'] },
  { id: 'dumbo', type: 'neighborhood', label: 'DUMBO', zipCode: '11201', borough: 'Brooklyn', searchTerms: ['dumbo', 'down under manhattan bridge overpass'] },
  { id: 'carroll-gardens', type: 'neighborhood', label: 'Carroll Gardens', zipCode: '11231', borough: 'Brooklyn', searchTerms: ['carroll gardens'] },
  { id: 'cobble-hill', type: 'neighborhood', label: 'Cobble Hill', zipCode: '11201', borough: 'Brooklyn', searchTerms: ['cobble hill'] },
  { id: 'boerum-hill', type: 'neighborhood', label: 'Boerum Hill', zipCode: '11217', borough: 'Brooklyn', searchTerms: ['boerum hill'] },
  { id: 'downtown-brooklyn', type: 'neighborhood', label: 'Downtown Brooklyn', zipCode: '11201', borough: 'Brooklyn', searchTerms: ['downtown brooklyn'] },
  { id: 'fort-greene', type: 'neighborhood', label: 'Fort Greene', zipCode: '11217', borough: 'Brooklyn', searchTerms: ['fort greene'] },
  { id: 'clinton-hill', type: 'neighborhood', label: 'Clinton Hill', zipCode: '11205', borough: 'Brooklyn', searchTerms: ['clinton hill'] },
  { id: 'prospect-heights', type: 'neighborhood', label: 'Prospect Heights', zipCode: '11238', borough: 'Brooklyn', searchTerms: ['prospect heights'] },
  { id: 'crown-heights', type: 'neighborhood', label: 'Crown Heights', zipCode: '11213', borough: 'Brooklyn', searchTerms: ['crown heights'] },
  { id: 'sunset-park', type: 'neighborhood', label: 'Sunset Park', zipCode: '11220', borough: 'Brooklyn', searchTerms: ['sunset park'] },
  { id: 'bay-ridge', type: 'neighborhood', label: 'Bay Ridge', zipCode: '11209', borough: 'Brooklyn', searchTerms: ['bay ridge'] },
  { id: 'bensonhurst', type: 'neighborhood', label: 'Bensonhurst', zipCode: '11214', borough: 'Brooklyn', searchTerms: ['bensonhurst'] },
  { id: 'coney-island', type: 'neighborhood', label: 'Coney Island', zipCode: '11224', borough: 'Brooklyn', searchTerms: ['coney island'] },
  { id: 'brighton-beach', type: 'neighborhood', label: 'Brighton Beach', zipCode: '11235', borough: 'Brooklyn', searchTerms: ['brighton beach'] },
  { id: 'sheepshead-bay', type: 'neighborhood', label: 'Sheepshead Bay', zipCode: '11235', borough: 'Brooklyn', searchTerms: ['sheepshead bay'] },
  { id: 'flatbush', type: 'neighborhood', label: 'Flatbush', zipCode: '11226', borough: 'Brooklyn', searchTerms: ['flatbush'] },
  { id: 'canarsie', type: 'neighborhood', label: 'Canarsie', zipCode: '11236', borough: 'Brooklyn', searchTerms: ['canarsie'] },
  
  // Queens
  { id: 'astoria', type: 'neighborhood', label: 'Astoria', zipCode: '11102', borough: 'Queens', searchTerms: ['astoria'] },
  { id: 'long-island-city', type: 'neighborhood', label: 'Long Island City', zipCode: '11101', borough: 'Queens', searchTerms: ['long island city', 'lic'] },
  { id: 'sunnyside', type: 'neighborhood', label: 'Sunnyside', zipCode: '11104', borough: 'Queens', searchTerms: ['sunnyside'] },
  { id: 'woodside', type: 'neighborhood', label: 'Woodside', zipCode: '11377', borough: 'Queens', searchTerms: ['woodside'] },
  { id: 'jackson-heights', type: 'neighborhood', label: 'Jackson Heights', zipCode: '11372', borough: 'Queens', searchTerms: ['jackson heights'] },
  { id: 'elmhurst', type: 'neighborhood', label: 'Elmhurst', zipCode: '11373', borough: 'Queens', searchTerms: ['elmhurst'] },
  { id: 'corona', type: 'neighborhood', label: 'Corona', zipCode: '11368', borough: 'Queens', searchTerms: ['corona'] },
  { id: 'flushing', type: 'neighborhood', label: 'Flushing', zipCode: '11354', borough: 'Queens', searchTerms: ['flushing'] },
  { id: 'forest-hills', type: 'neighborhood', label: 'Forest Hills', zipCode: '11375', borough: 'Queens', searchTerms: ['forest hills'] },
  { id: 'rego-park', type: 'neighborhood', label: 'Rego Park', zipCode: '11374', borough: 'Queens', searchTerms: ['rego park'] },
  { id: 'kew-gardens', type: 'neighborhood', label: 'Kew Gardens', zipCode: '11415', borough: 'Queens', searchTerms: ['kew gardens'] },
  { id: 'jamaica', type: 'neighborhood', label: 'Jamaica', zipCode: '11432', borough: 'Queens', searchTerms: ['jamaica'] },
  { id: 'ridgewood', type: 'neighborhood', label: 'Ridgewood', zipCode: '11385', borough: 'Queens', searchTerms: ['ridgewood'] },
  { id: 'rockaway', type: 'neighborhood', label: 'Far Rockaway', zipCode: '11691', borough: 'Queens', searchTerms: ['far rockaway', 'rockaway', 'rockaway beach'] },
  
  // Bronx
  { id: 'mott-haven', type: 'neighborhood', label: 'Mott Haven', zipCode: '10454', borough: 'Bronx', searchTerms: ['mott haven'] },
  { id: 'hunts-point', type: 'neighborhood', label: 'Hunts Point', zipCode: '10474', borough: 'Bronx', searchTerms: ['hunts point'] },
  { id: 'south-bronx', type: 'neighborhood', label: 'South Bronx', zipCode: '10455', borough: 'Bronx', searchTerms: ['south bronx'] },
  { id: 'fordham', type: 'neighborhood', label: 'Fordham', zipCode: '10458', borough: 'Bronx', searchTerms: ['fordham'] },
  { id: 'morris-heights', type: 'neighborhood', label: 'Morris Heights', zipCode: '10453', borough: 'Bronx', searchTerms: ['morris heights'] },
  { id: 'riverdale', type: 'neighborhood', label: 'Riverdale', zipCode: '10463', borough: 'Bronx', searchTerms: ['riverdale'] },
  { id: 'pelham-bay', type: 'neighborhood', label: 'Pelham Bay', zipCode: '10461', borough: 'Bronx', searchTerms: ['pelham bay'] },
  { id: 'throggs-neck', type: 'neighborhood', label: 'Throggs Neck', zipCode: '10465', borough: 'Bronx', searchTerms: ['throggs neck'] },
  
  // Staten Island
  { id: 'st-george', type: 'neighborhood', label: 'St. George', zipCode: '10301', borough: 'Staten Island', searchTerms: ['st george', 'saint george'] },
  { id: 'stapleton', type: 'neighborhood', label: 'Stapleton', zipCode: '10304', borough: 'Staten Island', searchTerms: ['stapleton'] },
  { id: 'tottenville', type: 'neighborhood', label: 'Tottenville', zipCode: '10307', borough: 'Staten Island', searchTerms: ['tottenville'] },
  { id: 'great-kills', type: 'neighborhood', label: 'Great Kills', zipCode: '10308', borough: 'Staten Island', searchTerms: ['great kills'] },
];

// NYC Community Districts
const communityDistricts: Location[] = [
  // Manhattan
  { id: 'MN01', type: 'district', label: 'MN01 - Battery Park City, Tribeca', zipCode: '10013', borough: 'Manhattan', searchTerms: ['mn01', 'battery park', 'tribeca'] },
  { id: 'MN02', type: 'district', label: 'MN02 - Greenwich Village, SoHo', zipCode: '10012', borough: 'Manhattan', searchTerms: ['mn02', 'greenwich village', 'soho'] },
  { id: 'MN03', type: 'district', label: 'MN03 - Lower East Side, Chinatown', zipCode: '10002', borough: 'Manhattan', searchTerms: ['mn03', 'lower east side', 'chinatown'] },
  { id: 'MN04', type: 'district', label: 'MN04 - Chelsea, Clinton', zipCode: '10011', borough: 'Manhattan', searchTerms: ['mn04', 'chelsea', 'clinton'] },
  { id: 'MN05', type: 'district', label: 'MN05 - Midtown', zipCode: '10018', borough: 'Manhattan', searchTerms: ['mn05', 'midtown'] },
  { id: 'MN06', type: 'district', label: 'MN06 - Turtle Bay, Stuyvesant Town', zipCode: '10016', borough: 'Manhattan', searchTerms: ['mn06', 'turtle bay', 'stuyvesant town'] },
  { id: 'MN07', type: 'district', label: 'MN07 - Upper West Side', zipCode: '10023', borough: 'Manhattan', searchTerms: ['mn07', 'upper west side'] },
  { id: 'MN08', type: 'district', label: 'MN08 - Upper East Side', zipCode: '10021', borough: 'Manhattan', searchTerms: ['mn08', 'upper east side'] },
  { id: 'MN09', type: 'district', label: 'MN09 - Morningside Heights, Hamilton Heights', zipCode: '10027', borough: 'Manhattan', searchTerms: ['mn09', 'morningside heights', 'hamilton heights'] },
  { id: 'MN10', type: 'district', label: 'MN10 - Central Harlem', zipCode: '10027', borough: 'Manhattan', searchTerms: ['mn10', 'central harlem'] },
  { id: 'MN11', type: 'district', label: 'MN11 - East Harlem', zipCode: '10029', borough: 'Manhattan', searchTerms: ['mn11', 'east harlem'] },
  { id: 'MN12', type: 'district', label: 'MN12 - Washington Heights, Inwood', zipCode: '10032', borough: 'Manhattan', searchTerms: ['mn12', 'washington heights', 'inwood'] },
  
  // Brooklyn
  { id: 'BK01', type: 'district', label: 'BK01 - Williamsburg, Greenpoint', zipCode: '11211', borough: 'Brooklyn', searchTerms: ['bk01', 'williamsburg', 'greenpoint'] },
  { id: 'BK02', type: 'district', label: 'BK02 - Brooklyn Heights, Fort Greene', zipCode: '11201', borough: 'Brooklyn', searchTerms: ['bk02', 'brooklyn heights', 'fort greene'] },
  { id: 'BK03', type: 'district', label: 'BK03 - Bedford-Stuyvesant', zipCode: '11216', borough: 'Brooklyn', searchTerms: ['bk03', 'bedford stuyvesant'] },
  { id: 'BK04', type: 'district', label: 'BK04 - Bushwick', zipCode: '11237', borough: 'Brooklyn', searchTerms: ['bk04', 'bushwick'] },
  { id: 'BK05', type: 'district', label: 'BK05 - East New York', zipCode: '11207', borough: 'Brooklyn', searchTerms: ['bk05', 'east new york'] },
  { id: 'BK06', type: 'district', label: 'BK06 - Park Slope, Carroll Gardens', zipCode: '11215', borough: 'Brooklyn', searchTerms: ['bk06', 'park slope', 'carroll gardens'] },
  { id: 'BK07', type: 'district', label: 'BK07 - Sunset Park', zipCode: '11220', borough: 'Brooklyn', searchTerms: ['bk07', 'sunset park'] },
  { id: 'BK08', type: 'district', label: 'BK08 - Crown Heights, Prospect Heights', zipCode: '11213', borough: 'Brooklyn', searchTerms: ['bk08', 'crown heights', 'prospect heights'] },
  { id: 'BK09', type: 'district', label: 'BK09 - South Crown Heights, Prospect Lefferts', zipCode: '11225', borough: 'Brooklyn', searchTerms: ['bk09', 'south crown heights', 'prospect lefferts'] },
  { id: 'BK10', type: 'district', label: 'BK10 - Bay Ridge, Dyker Heights', zipCode: '11209', borough: 'Brooklyn', searchTerms: ['bk10', 'bay ridge', 'dyker heights'] },
  { id: 'BK11', type: 'district', label: 'BK11 - Bensonhurst, Bath Beach', zipCode: '11214', borough: 'Brooklyn', searchTerms: ['bk11', 'bensonhurst', 'bath beach'] },
  { id: 'BK12', type: 'district', label: 'BK12 - Borough Park', zipCode: '11219', borough: 'Brooklyn', searchTerms: ['bk12', 'borough park'] },
  { id: 'BK13', type: 'district', label: 'BK13 - Coney Island, Brighton Beach', zipCode: '11224', borough: 'Brooklyn', searchTerms: ['bk13', 'coney island', 'brighton beach'] },
  { id: 'BK14', type: 'district', label: 'BK14 - Flatbush, Midwood', zipCode: '11226', borough: 'Brooklyn', searchTerms: ['bk14', 'flatbush', 'midwood'] },
  { id: 'BK15', type: 'district', label: 'BK15 - Sheepshead Bay, Gravesend', zipCode: '11235', borough: 'Brooklyn', searchTerms: ['bk15', 'sheepshead bay', 'gravesend'] },
  { id: 'BK16', type: 'district', label: 'BK16 - Brownsville, Ocean Hill', zipCode: '11212', borough: 'Brooklyn', searchTerms: ['bk16', 'brownsville', 'ocean hill'] },
  { id: 'BK17', type: 'district', label: 'BK17 - East Flatbush, Rugby', zipCode: '11203', borough: 'Brooklyn', searchTerms: ['bk17', 'east flatbush', 'rugby'] },
  { id: 'BK18', type: 'district', label: 'BK18 - Canarsie, Flatlands', zipCode: '11236', borough: 'Brooklyn', searchTerms: ['bk18', 'canarsie', 'flatlands'] },
  
  // Queens
  { id: 'QN01', type: 'district', label: 'QN01 - Astoria, Long Island City', zipCode: '11102', borough: 'Queens', searchTerms: ['qn01', 'astoria', 'long island city'] },
  { id: 'QN02', type: 'district', label: 'QN02 - Sunnyside, Woodside', zipCode: '11104', borough: 'Queens', searchTerms: ['qn02', 'sunnyside', 'woodside'] },
  { id: 'QN03', type: 'district', label: 'QN03 - Jackson Heights, East Elmhurst', zipCode: '11372', borough: 'Queens', searchTerms: ['qn03', 'jackson heights', 'east elmhurst'] },
  { id: 'QN04', type: 'district', label: 'QN04 - Elmhurst, Corona', zipCode: '11373', borough: 'Queens', searchTerms: ['qn04', 'elmhurst', 'corona'] },
  { id: 'QN05', type: 'district', label: 'QN05 - Ridgewood, Maspeth', zipCode: '11385', borough: 'Queens', searchTerms: ['qn05', 'ridgewood', 'maspeth'] },
  { id: 'QN06', type: 'district', label: 'QN06 - Rego Park, Forest Hills', zipCode: '11374', borough: 'Queens', searchTerms: ['qn06', 'rego park', 'forest hills'] },
  { id: 'QN07', type: 'district', label: 'QN07 - Flushing, Whitestone', zipCode: '11354', borough: 'Queens', searchTerms: ['qn07', 'flushing', 'whitestone'] },
  { id: 'QN08', type: 'district', label: 'QN08 - Jamaica, Hollis', zipCode: '11432', borough: 'Queens', searchTerms: ['qn08', 'jamaica', 'hollis'] },
  { id: 'QN09', type: 'district', label: 'QN09 - Richmond Hill, Woodhaven', zipCode: '11418', borough: 'Queens', searchTerms: ['qn09', 'richmond hill', 'woodhaven'] },
  { id: 'QN10', type: 'district', label: 'QN10 - South Ozone Park, Howard Beach', zipCode: '11420', borough: 'Queens', searchTerms: ['qn10', 'south ozone park', 'howard beach'] },
  { id: 'QN11', type: 'district', label: 'QN11 - Bayside, Little Neck', zipCode: '11361', borough: 'Queens', searchTerms: ['qn11', 'bayside', 'little neck'] },
  { id: 'QN12', type: 'district', label: 'QN12 - Jamaica, St. Albans', zipCode: '11412', borough: 'Queens', searchTerms: ['qn12', 'jamaica', 'st albans'] },
  { id: 'QN13', type: 'district', label: 'QN13 - Queens Village, Bellerose', zipCode: '11427', borough: 'Queens', searchTerms: ['qn13', 'queens village', 'bellerose'] },
  { id: 'QN14', type: 'district', label: 'QN14 - Far Rockaway', zipCode: '11691', borough: 'Queens', searchTerms: ['qn14', 'far rockaway', 'rockaway'] },
  
  // Bronx
  { id: 'BX01', type: 'district', label: 'BX01 - Mott Haven, Port Morris', zipCode: '10454', borough: 'Bronx', searchTerms: ['bx01', 'mott haven', 'port morris'] },
  { id: 'BX02', type: 'district', label: 'BX02 - Hunts Point, Longwood', zipCode: '10474', borough: 'Bronx', searchTerms: ['bx02', 'hunts point', 'longwood'] },
  { id: 'BX03', type: 'district', label: 'BX03 - Morrisania, Crotona Park', zipCode: '10456', borough: 'Bronx', searchTerms: ['bx03', 'morrisania', 'crotona park'] },
  { id: 'BX04', type: 'district', label: 'BX04 - Highbridge, Concourse', zipCode: '10452', borough: 'Bronx', searchTerms: ['bx04', 'highbridge', 'concourse'] },
  { id: 'BX05', type: 'district', label: 'BX05 - Morris Heights, Fordham', zipCode: '10453', borough: 'Bronx', searchTerms: ['bx05', 'morris heights', 'fordham'] },
  { id: 'BX06', type: 'district', label: 'BX06 - Belmont, East Tremont', zipCode: '10457', borough: 'Bronx', searchTerms: ['bx06', 'belmont', 'east tremont'] },
  { id: 'BX07', type: 'district', label: 'BX07 - Kingsbridge, Bedford Park', zipCode: '10468', borough: 'Bronx', searchTerms: ['bx07', 'kingsbridge', 'bedford park'] },
  { id: 'BX08', type: 'district', label: 'BX08 - Riverdale, Fieldston', zipCode: '10463', borough: 'Bronx', searchTerms: ['bx08', 'riverdale', 'fieldston'] },
  { id: 'BX09', type: 'district', label: 'BX09 - Parkchester, Soundview', zipCode: '10462', borough: 'Bronx', searchTerms: ['bx09', 'parkchester', 'soundview'] },
  { id: 'BX10', type: 'district', label: 'BX10 - Throgs Neck, Co-op City', zipCode: '10465', borough: 'Bronx', searchTerms: ['bx10', 'throgs neck', 'co-op city'] },
  { id: 'BX11', type: 'district', label: 'BX11 - Pelham Bay, Morris Park', zipCode: '10461', borough: 'Bronx', searchTerms: ['bx11', 'pelham bay', 'morris park'] },
  { id: 'BX12', type: 'district', label: 'BX12 - Williamsbridge, Baychester', zipCode: '10469', borough: 'Bronx', searchTerms: ['bx12', 'williamsbridge', 'baychester'] },
  
  // Staten Island
  { id: 'SI01', type: 'district', label: 'SI01 - St. George, Stapleton', zipCode: '10301', borough: 'Staten Island', searchTerms: ['si01', 'st george', 'stapleton'] },
  { id: 'SI02', type: 'district', label: 'SI02 - New Brighton, Port Richmond', zipCode: '10302', borough: 'Staten Island', searchTerms: ['si02', 'new brighton', 'port richmond'] },
  { id: 'SI03', type: 'district', label: 'SI03 - Tottenville, Great Kills', zipCode: '10307', borough: 'Staten Island', searchTerms: ['si03', 'tottenville', 'great kills'] },
];

// Five Boroughs
const boroughs: Location[] = [
  { 
    id: 'manhattan', 
    type: 'borough', 
    label: 'Manhattan', 
    zipCode: '10001',
    searchTerms: ['manhattan', 'new york county'] 
  },
  { 
    id: 'brooklyn', 
    type: 'borough', 
    label: 'Brooklyn', 
    zipCode: '11201',
    searchTerms: ['brooklyn', 'kings county'] 
  },
  { 
    id: 'queens', 
    type: 'borough', 
    label: 'Queens', 
    zipCode: '11101',
    searchTerms: ['queens', 'queens county'] 
  },
  { 
    id: 'bronx', 
    type: 'borough', 
    label: 'Bronx', 
    zipCode: '10451',
    searchTerms: ['bronx', 'bronx county'] 
  },
  { 
    id: 'staten-island', 
    type: 'borough', 
    label: 'Staten Island', 
    zipCode: '10301',
    searchTerms: ['staten island', 'richmond county'] 
  },
];

// All ZIP codes from existing data
const zipCodes: Location[] = Object.keys(zipCoordinates).map((zip) => ({
  id: `zip-${zip}`,
  type: 'zip' as LocationType,
  label: zip,
  zipCode: zip,
  searchTerms: [zip],
}));

// Combine all locations
export const allLocations: Location[] = [
  ...neighborhoods,
  ...communityDistricts,
  ...boroughs,
  ...zipCodes,
];

// Helper function to search locations
export function searchLocations(query: string, limit: number = 20): Location[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  // Exact matches first
  const exactMatches = allLocations.filter((location) =>
    location.searchTerms.some((term) => term === normalizedQuery) ||
    location.label.toLowerCase() === normalizedQuery
  );

  // Starts with matches
  const startsWithMatches = allLocations.filter((location) =>
    !exactMatches.includes(location) &&
    (location.searchTerms.some((term) => term.startsWith(normalizedQuery)) ||
      location.label.toLowerCase().startsWith(normalizedQuery))
  );

  // Contains matches
  const containsMatches = allLocations.filter((location) =>
    !exactMatches.includes(location) &&
    !startsWithMatches.includes(location) &&
    (location.searchTerms.some((term) => term.includes(normalizedQuery)) ||
      location.label.toLowerCase().includes(normalizedQuery))
  );

  return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, limit);
}

// Helper function to get location by zip code
export function getLocationByZip(zipCode: string): Location | undefined {
  return allLocations.find((loc) => loc.zipCode === zipCode && loc.type === 'zip');
}

// Helper function to get display name for a zip code
export function getDisplayNameForZip(zipCode: string): string {
  // Try to find a neighborhood or district for this zip
  const neighborhood = neighborhoods.find((n) => n.zipCode === zipCode);
  if (neighborhood) return neighborhood.label;

  const district = communityDistricts.find((d) => d.zipCode === zipCode);
  if (district) return district.label;

  return zipCode;
}

