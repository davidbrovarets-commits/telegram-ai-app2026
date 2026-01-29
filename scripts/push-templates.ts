/**
 * Ukrainian Push Notification Templates for CITY-Level HIGH Priority
 * 
 * These templates are used for action-oriented CITY-level notifications.
 * All text is Ukrainian (UA) with German terms only when legally required.
 * 
 * Push Format Rules:
 * - Title: max 60 characters, starts with action/warning emoji
 * - Body: max 140 characters, contains what happened + action + deadline
 */

// =============================================
// TEMPLATE TYPES
// =============================================

export type CityPushTemplateType =
    | 'JOBCENTER'
    | 'IMMIGRATION'
    | 'APPOINTMENTS'
    | 'GENERAL_CITY';

export interface PushTemplateContext {
    city: string;
    actionShort?: string;
    deadline?: string;
    customText?: string;
}

export interface PushNotificationContent {
    title: string;
    body: string;
    priority: 'HIGH';
    language: 'ua';
}

// =============================================
// TEMPLATE DEFINITIONS
// =============================================

/**
 * TEMPLATE 1 — JOBCENTER (CITY)
 * 
 * Triggers: document request, deadline, payment change, appointment requirement
 */
export function jobcenterTemplate(ctx: PushTemplateContext): PushNotificationContent {
    const title = `⚠️ Потрібна дія: Jobcenter ${ctx.city}`;

    let body = 'Jobcenter вимагає дію.\n';
    if (ctx.actionShort) {
        body += `${ctx.actionShort}\n`;
    }
    if (ctx.deadline) {
        body += `Термін: ${ctx.deadline}`;
    } else {
        body += 'Перевірте деталі в додатку.';
    }

    return {
        title: title.slice(0, 60),
        body: body.slice(0, 140),
        priority: 'HIGH',
        language: 'ua'
    };
}

/**
 * TEMPLATE 2 — AUSLÄNDERBEHÖRDE (CITY)
 * 
 * Triggers: residence permit issue, §24 status change, appointment required, missing documents
 */
export function immigrationTemplate(ctx: PushTemplateContext): PushNotificationContent {
    const title = `⚠️ Статус перебування: ${ctx.city}`;

    let body = 'Ausländerbehörde повідомляє:\n';
    if (ctx.actionShort) {
        body += `${ctx.actionShort}\n`;
    }
    body += 'Перевірте деталі в додатку.';

    return {
        title: title.slice(0, 60),
        body: body.slice(0, 140),
        priority: 'HIGH',
        language: 'ua'
    };
}

/**
 * TEMPLATE 3 — APPOINTMENT / TERMIN (CITY)
 * 
 * Triggers: new slots available, booking rules changed, mandatory booking opened
 */
export function appointmentsTemplate(ctx: PushTemplateContext): PushNotificationContent {
    const title = `📅 Зʼявилися терміни: ${ctx.city}`;

    let body = 'Відкрито нові терміни.\n';
    if (ctx.actionShort) {
        body += `${ctx.actionShort}\n`;
    } else {
        body += 'Рекомендуємо записатись якомога швидше.';
    }

    return {
        title: title.slice(0, 60),
        body: body.slice(0, 140),
        priority: 'HIGH',
        language: 'ua'
    };
}

/**
 * TEMPLATE 4 — GENERAL CITY ACTION
 * 
 * Triggers: official city Ukraine portal update, mandatory local procedure
 */
export function generalCityTemplate(ctx: PushTemplateContext): PushNotificationContent {
    const title = `ℹ️ Важливо для ${ctx.city}`;

    let body = 'Зміни для українців у вашому місті.\n';
    if (ctx.actionShort) {
        body += ctx.actionShort;
    } else {
        body += 'Може знадобитись дія.';
    }

    return {
        title: title.slice(0, 60),
        body: body.slice(0, 140),
        priority: 'HIGH',
        language: 'ua'
    };
}

// =============================================
// SOURCE TO TEMPLATE MAPPING
// =============================================

/**
 * Maps source_id patterns to template functions
 */
export function getTemplateForSource(sourceId: string): CityPushTemplateType | null {
    if (sourceId.includes('_jobcenter')) {
        return 'JOBCENTER';
    }
    if (sourceId.includes('_immigration')) {
        return 'IMMIGRATION';
    }
    if (sourceId.includes('_appointments')) {
        return 'APPOINTMENTS';
    }
    if (sourceId.includes('_ukraine_help')) {
        return 'GENERAL_CITY';
    }
    return null;
}

/**
 * Resolves the appropriate template function for a given template type
 */
export function resolveTemplate(
    templateType: CityPushTemplateType,
    ctx: PushTemplateContext
): PushNotificationContent {
    switch (templateType) {
        case 'JOBCENTER':
            return jobcenterTemplate(ctx);
        case 'IMMIGRATION':
            return immigrationTemplate(ctx);
        case 'APPOINTMENTS':
            return appointmentsTemplate(ctx);
        case 'GENERAL_CITY':
            return generalCityTemplate(ctx);
    }
}

/**
 * Generates push notification content for a CITY-level source
 */
export function generateCityPush(
    sourceId: string,
    ctx: PushTemplateContext
): PushNotificationContent | null {
    const templateType = getTemplateForSource(sourceId);
    if (!templateType) {
        return null;
    }
    return resolveTemplate(templateType, ctx);
}

// =============================================
// ANTI-NOISE RULES
// =============================================

export interface DedupeRecord {
    dedupeGroup: string;
    lastPushHash: string;
    lastPushTime: Date;
}

/**
 * Checks if a push should be sent based on anti-noise rules
 */
export function shouldSendPush(
    dedupeGroup: string,
    contentHash: string,
    deadline: Date | null,
    existingRecords: DedupeRecord[]
): { send: boolean; reason?: string } {
    const existing = existingRecords.find(r => r.dedupeGroup === dedupeGroup);

    // Rule: Do NOT resend identical message
    if (existing && existing.lastPushHash === contentHash) {
        return { send: false, reason: 'Identical message already sent' };
    }

    // Rule: Do NOT send after deadline passed
    if (deadline && deadline < new Date()) {
        return { send: false, reason: 'Deadline has passed' };
    }

    // Rule: One push per dedupe_group (rate limit check would go here)

    return { send: true };
}

// =============================================
// EXAMPLE USAGE
// =============================================

/*
// Generate a Jobcenter push for Leipzig
const push = generateCityPush('city_LEJ_jobcenter', {
    city: 'Leipzig',
    actionShort: 'Подайте документ Meldebescheinigung.',
    deadline: 'до 14.03'
});

// Result:
// {
//   title: "⚠️ Потрібна дія: Jobcenter Leipzig",
//   body: "Jobcenter вимагає дію.\nПодайте документ Meldebescheinigung.\nТермін: до 14.03",
//   priority: "HIGH",
//   language: "ua"
// }
*/
