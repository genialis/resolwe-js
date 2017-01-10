/**
 * Generates a random UUID string.
 */
export function randomUuid(): string {
    // TODO: Support cases where crypto.getRandomValues is not supported.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0;
        let v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
