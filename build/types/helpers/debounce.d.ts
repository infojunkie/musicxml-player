/**
 * Debounce function call using timer to avoid excess UI churn.
 * @see https://tech.reverse.hr/articles/debounce-function-in-typescript
 */
export declare const debounce: <T extends unknown[]>(callback: (...args: T) => void, delay: number) => (...args: T) => void;
//# sourceMappingURL=debounce.d.ts.map