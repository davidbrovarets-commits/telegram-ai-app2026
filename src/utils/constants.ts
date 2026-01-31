import type { Task, News } from '../types';

// Varu-andmed kui andmebaas pole kättesaadav
export const BACKUP_TASKS: Task[] = [
    // ETAPP 1
    {
        id: 'sim_1',
        title: '1. SIM-Karte (Сім-карта)',
        description: 'Німецький номер (+49)',
        content: `Спочатку купіть сім-карту (Aldi Talk, Vodafone, Telekom). Вона потрібна для відкриття рахунку в банку та реєстрації.\n\n💡 Порада: Можна купити в супермаркеті (Aldi, Lidl) з паспортом.`,
        link: '',
        linkText: '',
        price: 0,
        category: 'general',
        step: 1
    },
    {
        id: 'reg_1',
        title: '2. Anmeldung (Прописка)',
        description: 'Реєстрація адреси (Bürgeramt)',
        content: `Це фундамент всього. Без прописки (Anmeldung) ви "не існуєте" для системи.\n\n📄 **Треба:** Паспорт + Wohnungsgeberbestätigung (від власника житла).`,
        link: 'https://service.berlin.de/dienstleistung/120686/',
        linkText: 'Термін (Berlin)',
        price: 0,
        category: 'general',
        step: 1
    },
    // ETAPP 2
    {
        id: 'bank_1',
        title: '3. Bankkonto (Банк)',
        description: 'Рахунок (IBAN)',
        content: `Для виплат Jobcenter та сплати оренди. \n\nВимога: Паспорт + Anmeldung + Німецький номер.`,
        link: 'https://n26.com/en-de',
        linkText: 'N26 (Швидко)',
        price: 0,
        category: 'general',
        step: 2
    },
    {
        id: 'insurance_1',
        title: '4. Krankenkasse (Страховка)',
        description: 'Медичне страхування',
        content: `Обов'язково в Німеччині (AOK, TK, Barmer). Покривається Джобцентром.`,
        link: 'https://www.tk.de/en',
        linkText: 'TK (Англ/Укр)',
        price: 0,
        category: 'general',
        step: 2
    },
    // ETAPP 3
    {
        id: 'job_center_1',
        title: '5. Jobcenter / Sozialamt',
        description: 'Фінансова допомога',
        content: `Подача заяви на Bürgergeld (допомога). Потрібен IBAN та Anmeldung.`,
        link: 'https://www.arbeitsagentur.de/',
        linkText: 'Jobcenter Online',
        price: 0,
        category: 'general',
        step: 3
    },
    // PREMIUM
    {
        id: 'tax_1',
        title: 'Steuernummer 💎',
        description: 'Податковий номер (Freelance).',
        price: 2,
        category: 'premium',
        step: 0,
        content: `Потрібен для роботи на себе. Не плутати з Steuer-ID.`
    },
    {
        id: 'kita_1',
        title: 'Kita-Gutschein 💎',
        description: 'Ваучер на садок.',
        price: 3,
        category: 'premium',
        step: 0,
        content: `Садок платний без ваучера.`
    },
    {
        id: 'wbs_1',
        title: 'WBS Schein 💎',
        description: 'Соціальне житло.',
        price: 5,
        category: 'premium',
        step: 0,
        content: `Право на дешевшу державну квартиру.`
    }
];

export const BACKUP_NEWS: News[] = [
    {
        id: 1,
        source: 'Tagesschau',
        title: 'Зміни в Jobcenter з 2026 року',
        published_at: '2026-01-15T12:00:00Z',
        region: 'all',
        image_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
        content: 'Уряд Німеччини оголосив про нові ставки виплат.',
        status: 'ACTIVE'
    },
    {
        id: 2,
        source: 'BVG Berlin',
        title: 'Berlin Pass - нові правила',
        published_at: '2026-01-14T12:00:00Z',
        region: 'Berlin',
        image_url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e',
        content: 'Сенат Берліна обговорює цифрові квитки.',
        status: 'ACTIVE'
    }
];

// Saksamaa liidumad
export const GERMAN_STATES = [
    'Baden-Württemberg',
    'Bayern',
    'Berlin',
    'Brandenburg',
    'Bremen',
    'Hamburg',
    'Hessen',
    'Mecklenburg-Vorpommern',
    'Niedersachsen',
    'Nordrhein-Westfalen',
    'Rheinland-Pfalz',
    'Saarland',
    'Sachsen',
    'Sachsen-Anhalt',
    'Schleswig-Holstein',
    'Thüringen'
];

// Elamisloa tüübid
export const RESIDENCE_PERMITS = {
    protection: [
        { value: '§24', label: '§ 24 (Massenzustrom)' },
        { value: '§25', label: '§ 25 Asyl' },
        { value: 'Duldung', label: 'Duldung' }
    ],
    work: [
        { value: 'Blue Card', label: 'Blue Card' },
        { value: '§18', label: '§ 18 (Fachkraft)' },
        { value: '§16b', label: '§ 16b Studium' }
    ],
    other: [
        { value: 'Visa D', label: 'Visa D' },
        { value: 'Visa C', label: 'Visa C' },
        { value: 'EU-Citizen', label: 'EU-Citizen' }
    ]
};
