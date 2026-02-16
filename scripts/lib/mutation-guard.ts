export function isDryRun(): boolean {
    return process.env.DRY_RUN !== 'false';
}

export function assertMutationAllowed(actionLabel: string): void {
    if (isDryRun()) {
        throw new Error(`Mutation blocked: ${actionLabel} (DRY_RUN=${process.env.DRY_RUN || 'undefined/true'})`);
    }
}
