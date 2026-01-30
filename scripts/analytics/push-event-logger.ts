/**
 * Push Analytics - Event Logger
 * 
 * Instrumentation for push notification events.
 * Privacy rules enforced: user_hash instead of telegram_user_id, no message text.
 */

import * as crypto from 'crypto';
import {
    PushEvent,
    PushEventType,
    ActionType,
    TemplateId,
    CreatePushEventInput,
    createDedupeKey
} from './push-event-schema';
import { Scope, Priority } from '../config';

// =============================================
// CONFIGURATION
// =============================================

// Server salt - in production, load from environment
const SERVER_SALT = process.env.PUSH_ANALYTICS_SALT || 'dev-salt-change-in-production';

// In-memory storage for development - replace with database in production
const eventStore: PushEvent[] = [];
const dedupeSet = new Set<string>();

// =============================================
// PRIVACY: USER HASH
// =============================================

/**
 * Creates a non-reversible hash of the telegram user ID.
 * NEVER store the raw telegram_user_id.
 */
export function createUserHash(telegramUserId: string): string {
    return crypto
        .createHash('sha256')
        .update(`${telegramUserId}:${SERVER_SALT}`)
        .digest('hex')
        .slice(0, 32); // Truncate to 32 chars
}

// =============================================
// EVENT ID & PUSH ID GENERATION
// =============================================

export function generateEventId(): string {
    return crypto.randomUUID();
}

export function generatePushId(): string {
    return `push_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// =============================================
// EVENT LOGGING
// =============================================

/**
 * Logs a push event with deduplication.
 * Returns the event if logged, null if duplicate.
 */
export function logPushEvent(input: CreatePushEventInput): PushEvent | null {
    const userHash = createUserHash(input.telegramUserId);

    // Create dedupe key
    const dedupeKey = createDedupeKey({
        push_id: input.push_id,
        user_hash: userHash,
        event_type: input.event_type
    });

    // Check for duplicate
    if (dedupeSet.has(dedupeKey)) {
        console.log(`[Analytics] Duplicate event ignored: ${dedupeKey}`);
        return null;
    }

    // Check for orphan open (opened without delivered)
    let meta = input.meta || {};
    if (input.event_type === 'opened') {
        const deliveredKey = createDedupeKey({
            push_id: input.push_id,
            user_hash: userHash,
            event_type: 'delivered'
        });
        if (!dedupeSet.has(deliveredKey)) {
            meta = { ...meta, orphan_open: true };
        }
    }

    const event: PushEvent = {
        event_id: generateEventId(),
        ts: new Date().toISOString(),
        user_hash: userHash,
        country: input.country,
        land: input.land || null,
        city: input.city || null,
        scope: input.scope,
        priority: input.priority,
        push_id: input.push_id,
        source_id: input.source_id,
        dedupe_group: input.dedupe_group,
        template_id: input.template_id,
        event_type: input.event_type,
        action_type: input.action_type || null,
        meta: Object.keys(meta).length > 0 ? meta : null
    };

    // Store event
    eventStore.push(event);
    dedupeSet.add(dedupeKey);

    console.log(`[Analytics] Event logged: ${input.event_type} for push_id=${input.push_id}`);

    return event;
}

// =============================================
// CONVENIENCE FUNCTIONS FOR EACH EVENT TYPE
// =============================================

export interface PushContext {
    telegramUserId: string;
    country: 'DE';
    land?: string;
    city?: string;
    scope: Scope;
    priority: Priority;
    source_id: string;
    dedupe_group: string;
    template_id: TemplateId;
}

/**
 * Log when push is sent successfully to provider
 */
export function logDelivered(ctx: PushContext): { push_id: string; event: PushEvent | null } {
    const push_id = generatePushId();
    const event = logPushEvent({
        ...ctx,
        push_id,
        event_type: 'delivered'
    });
    return { push_id, event };
}

/**
 * Log when app is opened from push notification
 */
export function logOpened(ctx: PushContext, push_id: string): PushEvent | null {
    return logPushEvent({
        ...ctx,
        push_id,
        event_type: 'opened'
    });
}

/**
 * Log when user clicks CTA in push-related screen
 */
export function logClicked(ctx: PushContext, push_id: string, meta?: Record<string, unknown>): PushEvent | null {
    return logPushEvent({
        ...ctx,
        push_id,
        event_type: 'clicked',
        meta
    });
}

/**
 * Log when user completes an action initiated from push
 */
export function logActionCompleted(
    ctx: PushContext,
    push_id: string,
    action_type: ActionType,
    meta?: Record<string, unknown>
): PushEvent | null {
    return logPushEvent({
        ...ctx,
        push_id,
        event_type: 'action_completed',
        action_type,
        meta
    });
}

// =============================================
// STORAGE ACCESS (for aggregation and tests)
// =============================================

export function getEvents(): PushEvent[] {
    return [...eventStore];
}

export function getEventsByPushId(push_id: string): PushEvent[] {
    return eventStore.filter(e => e.push_id === push_id);
}

export function getEventsByDateRange(startDate: Date, endDate: Date): PushEvent[] {
    return eventStore.filter(e => {
        const eventDate = new Date(e.ts);
        return eventDate >= startDate && eventDate <= endDate;
    });
}

export function clearEvents(): void {
    eventStore.length = 0;
    dedupeSet.clear();
}
