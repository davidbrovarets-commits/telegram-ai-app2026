import type { AIContext, UserData } from '../../types';

export class ContextBuilder {

    /**
     * Aggregates diverse app data into a single context object for the AI.
     */
    static build(
        userData: UserData,
        activeTasks: any[], // Type from Task interface
        currentView: string = 'home'
    ): AIContext {
        return {
            userProfile: {
                name: userData.username,
                city: userData.city || 'Unknown',
                status: userData.residence_permit || 'Unknown',
                credits: userData.credits || 0
            },
            activeTasks: activeTasks,
            unreadNewsCount: 0, // Placeholder
            currentView
        };
    }

    /**
     * Generates the System Prompt sent to the LLM.
     */
    static generateSystemPrompt(context: AIContext): string {
        return `
ROLE: Personal Immigration Assistant (Germany)
USER: ${context.userProfile.name}
LOC: ${context.userProfile.city}
STATUS: ${context.userProfile.status}

CONTEXT:
User has ${context.activeTasks.length} active tasks: ${context.activeTasks.join(', ')}.

INSTRUCTION:
Answer short, precise, and helpful. Use emojis. 
Focus on helping the user complete their immigration tasks.
        `.trim();
    }
}
