import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

// Borradores solo en memoria (no localStorage): sobreviven a la navegación entre
// pantallas, pero se pierden al cerrar y volver a abrir la app.
const drafts = new Map<string, unknown>();

export function clearDraft(prefix: string) {
    for (const key of Array.from(drafts.keys())) {
        if (key === prefix || key.startsWith(`${prefix}:`)) drafts.delete(key);
    }
}

export function clearAllDrafts() {
    drafts.clear();
}

export function useDraftState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        if (drafts.has(key)) return drafts.get(key) as T;
        return typeof initial === 'function' ? (initial as () => T)() : initial;
    });
    const keyRef = useRef(key);
    keyRef.current = key;

    useEffect(() => {
        drafts.set(keyRef.current, value);
    }, [value]);

    const set = useCallback<Dispatch<SetStateAction<T>>>((next) => setValue(next), []);
    return [value, set];
}
