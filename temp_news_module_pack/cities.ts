
export interface CityConfig {
    name: string;
    land: string;
    neighbors: string[]; // Fallback cities/lands
}

export const CITY_REGISTRY: Record<string, CityConfig> = {
    // --- SACHSEN ---
    'leipzig': { name: 'Leipzig', land: 'Sachsen', neighbors: ['Berlin', 'Dresden', 'Halle'] },
    'dresden': { name: 'Dresden', land: 'Sachsen', neighbors: ['Berlin', 'Leipzig', 'Chemnitz'] },
    'chemnitz': { name: 'Chemnitz', land: 'Sachsen', neighbors: ['Leipzig', 'Dresden', 'Zwickau'] },

    // --- SACHSEN-ANHALT ---
    'halle': { name: 'Halle (Saale)', land: 'Sachsen-Anhalt', neighbors: ['Leipzig', 'Magdeburg', 'Dessau'] },
    'magdeburg': { name: 'Magdeburg', land: 'Sachsen-Anhalt', neighbors: ['Berlin', 'Halle', 'Leipzig'] },

    // --- THÜRINGEN ---
    'erfurt': { name: 'Erfurt', land: 'Thüringen', neighbors: ['Weimar', 'Jena', 'Leipzig'] },

    // --- BRANDENBURG & BERLIN ---
    'berlin': { name: 'Berlin', land: 'Berlin', neighbors: ['Brandenburg', 'Potsdam'] }, // Often handles self, but nice to map
    'potsdam': { name: 'Potsdam', land: 'Brandenburg', neighbors: ['Berlin', 'Brandenburg'] },
    'cottbus': { name: 'Cottbus', land: 'Brandenburg', neighbors: ['Berlin', 'Dresden', 'Potsdam'] },
    'frankfurt_oder': { name: 'Frankfurt (Oder)', land: 'Brandenburg', neighbors: ['Berlin', 'Cottbus', 'Potsdam'] },

    // --- MECKLENBURG-VORPOMMERN ---
    'rostock': { name: 'Rostock', land: 'Mecklenburg-Vorpommern', neighbors: ['Schwerin', 'Kiel', 'Hamburg'] },
    'schwerin': { name: 'Schwerin', land: 'Mecklenburg-Vorpommern', neighbors: ['Hamburg', 'Rostock', 'Mecklenburg-Vorpommern'] },

    // --- HAMBURG & SCHLESWIG-HOLSTEIN ---
    'hamburg': { name: 'Hamburg', land: 'Hamburg', neighbors: ['Schleswig-Holstein', 'Niedersachsen', 'Lübeck'] },
    'kiel': { name: 'Kiel', land: 'Schleswig-Holstein', neighbors: ['Hamburg', 'Lübeck', 'Schleswig-Holstein'] },
    'luebeck': { name: 'Lübeck', land: 'Schleswig-Holstein', neighbors: ['Hamburg', 'Kiel', 'Rostock'] },

    // --- BREMEN ---
    'bremen': { name: 'Bremen', land: 'Bremen', neighbors: ['Hamburg', 'Niedersachsen'] },
    'bremerhaven': { name: 'Bremerhaven', land: 'Bremen', neighbors: ['Bremen', 'Hamburg', 'Cuxhaven'] },

    // --- NIEDERSACHSEN ---
    'hannover': { name: 'Hannover', land: 'Niedersachsen', neighbors: ['Braunschweig', 'Hildesheim', 'Wolfsburg'] },
    'wolfsburg': { name: 'Wolfsburg', land: 'Niedersachsen', neighbors: ['Braunschweig', 'Hannover', 'Magdeburg'] },
    'braunschweig': { name: 'Braunschweig', land: 'Niedersachsen', neighbors: ['Wolfsburg', 'Hannover', 'Hildesheim'] },

    // --- NRW (Ruhrgebiet & Rhine) ---
    'koeln': { name: 'Köln', land: 'Nordrhein-Westfalen', neighbors: ['Düsseldorf', 'Bonn', 'Leverkusen'] },
    'duesseldorf': { name: 'Düsseldorf', land: 'Nordrhein-Westfalen', neighbors: ['Köln', 'Duisburg', 'Essen'] },
    'dortmund': { name: 'Dortmund', land: 'Nordrhein-Westfalen', neighbors: ['Bochum', 'Essen', 'Hagen'] },
    'essen': { name: 'Essen', land: 'Nordrhein-Westfalen', neighbors: ['Bochum', 'Duisburg', 'Gelsenkirchen'] },
    'duisburg': { name: 'Duisburg', land: 'Nordrhein-Westfalen', neighbors: ['Essen', 'Düsseldorf', 'Oberhausen'] },
    'bochum': { name: 'Bochum', land: 'Nordrhein-Westfalen', neighbors: ['Essen', 'Dortmund', 'Gelsenkirchen'] },
    'bonn': { name: 'Bonn', land: 'Nordrhein-Westfalen', neighbors: ['Köln', 'Koblenz', 'Aachen'] },
    'muenster': { name: 'Münster', land: 'Nordrhein-Westfalen', neighbors: ['Dortmund', 'Osnabrück', 'Bielefeld'] },
    'wuppertal': { name: 'Wuppertal', land: 'Nordrhein-Westfalen', neighbors: ['Düsseldorf', 'Essen', 'Köln'] },
    'bielefeld': { name: 'Bielefeld', land: 'Nordrhein-Westfalen', neighbors: ['Münster', 'Osnabrück', 'Hannover'] },
    'aachen': { name: 'Aachen', land: 'Nordrhein-Westfalen', neighbors: ['Köln', 'Düsseldorf', 'Bonn'] },
    'gelsenkirchen': { name: 'Gelsenkirchen', land: 'Nordrhein-Westfalen', neighbors: ['Essen', 'Bochum', 'Dortmund'] },
    'oberhausen': { name: 'Oberhausen', land: 'Nordrhein-Westfalen', neighbors: ['Duisburg', 'Essen', 'Bottrop'] },
    'moenchengladbach': { name: 'Mönchengladbach', land: 'Nordrhein-Westfalen', neighbors: ['Düsseldorf', 'Köln', 'Krefeld'] },
    'recklinghausen': { name: 'Recklinghausen', land: 'Nordrhein-Westfalen', neighbors: ['Dortmund', 'Essen', 'Bochum'] },
    'krefeld': { name: 'Krefeld', land: 'Nordrhein-Westfalen', neighbors: ['Düsseldorf', 'Duisburg', 'Mönchengladbach'] },

    // --- HESSEN ---
    'frankfurt': { name: 'Frankfurt am Main', land: 'Hessen', neighbors: ['Wiesbaden', 'Mainz', 'Darmstadt'] },
    'wiesbaden': { name: 'Wiesbaden', land: 'Hessen', neighbors: ['Mainz', 'Frankfurt', 'Hessen'] },

    // --- RHEINLAND-PFALZ ---
    'mainz': { name: 'Mainz', land: 'Rheinland-Pfalz', neighbors: ['Wiesbaden', 'Frankfurt', 'Rheinland-Pfalz'] },
    'kaiserslautern': { name: 'Kaiserslautern', land: 'Rheinland-Pfalz', neighbors: ['Mainz', 'Saarbrücken', 'Mannheim'] },
    'trier': { name: 'Trier', land: 'Rheinland-Pfalz', neighbors: ['Saarbrücken', 'Koblenz', 'Luxemburg'] },

    // --- SAARLAND ---
    'saarbruecken': { name: 'Saarbrücken', land: 'Saarland', neighbors: ['Trier', 'Rheinland-Pfalz', 'Saarland'] },

    // --- BADEN-WÜRTTEMBERG ---
    'stuttgart': { name: 'Stuttgart', land: 'Baden-Württemberg', neighbors: ['Karlsruhe', 'Ulm', 'Heilbronn'] },
    'karlsruhe': { name: 'Karlsruhe', land: 'Baden-Württemberg', neighbors: ['Stuttgart', 'Mannheim', 'Heidelberg'] },
    'mannheim': { name: 'Mannheim', land: 'Baden-Württemberg', neighbors: ['Heidelberg', 'Ludwigshafen', 'Frankfurt'] },
    'heidelberg': { name: 'Heidelberg', land: 'Baden-Württemberg', neighbors: ['Mannheim', 'Karlsruhe', 'Stuttgart'] },
    'ulm': { name: 'Ulm', land: 'Baden-Württemberg', neighbors: ['Stuttgart', 'Augsburg', 'München'] },

    // --- BAYERN ---
    'muenchen': { name: 'München', land: 'Bayern', neighbors: ['Augsburg', 'Nürnberg', 'Rosenheim'] },
    'nuernberg': { name: 'Nürnberg', land: 'Bayern', neighbors: ['Fürth', 'Erlangen', 'München'] },
    'augsburg': { name: 'Augsburg', land: 'Bayern', neighbors: ['München', 'Ulm', 'Stuttgart'] },
    'regensburg': { name: 'Regensburg', land: 'Bayern', neighbors: ['München', 'Nürnberg', 'Ingolstadt'] }
};

export const LAND_NEIGHBORS: Record<string, string[]> = {
    'Sachsen': ['Berlin', 'Brandenburg', 'Sachsen-Anhalt'],
    'Sachsen-Anhalt': ['Sachsen', 'Niedersachsen', 'Berlin'],
    'Thüringen': ['Sachsen', 'Hessen', 'Bayern'],
    'Brandenburg': ['Berlin', 'Sachsen', 'Mecklenburg-Vorpommern'],
    'Schleswig-Holstein': ['Hamburg', 'Niedersachsen'],
    'Mecklenburg-Vorpommern': ['Brandenburg', 'Hamburg', 'Berlin'],
    'Hessen': ['Rheinland-Pfalz', 'Bayern', 'Thüringen'],
    'Rheinland-Pfalz': ['Hessen', 'Saarland', 'Baden-Württemberg'],
    'Saarland': ['Rheinland-Pfalz'],
    'Bayern': ['Baden-Württemberg', 'Thüringen', 'Hessen'],
    'Baden-Württemberg': ['Bayern', 'Hessen', 'Rheinland-Pfalz'],
    'Nordrhein-Westfalen': ['Niedersachsen', 'Hessen', 'Rheinland-Pfalz'],
    'Niedersachsen': ['Hamburg', 'Bremen', 'Nordrhein-Westfalen', 'Schleswig-Holstein'],
    'Berlin': ['Brandenburg', 'Potsdam'],
    'Bremen': ['Niedersachsen'],
    'Hamburg': ['Schleswig-Holstein', 'Niedersachsen']
};
