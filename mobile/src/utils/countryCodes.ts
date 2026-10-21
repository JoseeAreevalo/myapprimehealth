export interface CountryDialCode {
    code: string; // ISO country code
    name: string;
    dialCode: string;
}

// A curated list of common countries and their phone dial codes (not exhaustive of all 195 countries).
export const COUNTRY_CODES: CountryDialCode[] = [
    { code: 'CL', name: 'Chile', dialCode: '+56' },
    { code: 'AR', name: 'Argentina', dialCode: '+54' },
    { code: 'BO', name: 'Bolivia', dialCode: '+591' },
    { code: 'BR', name: 'Brasil', dialCode: '+55' },
    { code: 'CA', name: 'Canadá', dialCode: '+1' },
    { code: 'CO', name: 'Colombia', dialCode: '+57' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506' },
    { code: 'CU', name: 'Cuba', dialCode: '+53' },
    { code: 'DO', name: 'República Dominicana', dialCode: '+1' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593' },
    { code: 'SV', name: 'El Salvador', dialCode: '+503' },
    { code: 'ES', name: 'España', dialCode: '+34' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
    { code: 'FR', name: 'Francia', dialCode: '+33' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502' },
    { code: 'HN', name: 'Honduras', dialCode: '+504' },
    { code: 'IT', name: 'Italia', dialCode: '+39' },
    { code: 'MX', name: 'México', dialCode: '+52' },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505' },
    { code: 'PA', name: 'Panamá', dialCode: '+507' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595' },
    { code: 'PE', name: 'Perú', dialCode: '+51' },
    { code: 'PT', name: 'Portugal', dialCode: '+351' },
    { code: 'PR', name: 'Puerto Rico', dialCode: '+1' },
    { code: 'GB', name: 'Reino Unido', dialCode: '+44' },
    { code: 'DE', name: 'Alemania', dialCode: '+49' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58' },
];

export const DEFAULT_DIAL_CODE = '+56';

// Splits a stored phone string like "+56 9 1234 5678" into { dialCode, number }.
// Falls back to the default dial code if none of the known codes match.
export function splitPhone(phone: string | null | undefined): { dialCode: string; number: string } {
    const trimmed = (phone ?? '').trim();
    if (!trimmed) return { dialCode: DEFAULT_DIAL_CODE, number: '' };

    const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    const match = sorted.find((country) => trimmed.startsWith(country.dialCode));
    if (match) {
        return { dialCode: match.dialCode, number: trimmed.slice(match.dialCode.length).trim() };
    }
    return { dialCode: DEFAULT_DIAL_CODE, number: trimmed };
}

export function joinPhone(dialCode: string, number: string): string | null {
    const trimmedNumber = number.trim();
    if (!trimmedNumber) return null;
    return `${dialCode} ${trimmedNumber}`;
}
