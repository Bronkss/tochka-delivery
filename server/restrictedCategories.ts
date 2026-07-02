export const RESTRICTED_CATEGORY_NAMES = [
    'пиво',
    'алкоголь',
    'табачная продукция',
    'табачные продукты',
    'табачные изделия',
];

export function normalizeCategoryName(value: unknown): string {
    return String(value ?? '')
        .toLowerCase()
        .replaceAll('ё', 'е')
        .replace(/\s+/g, ' ')
        .trim();
}

export function isRestrictedCategory(value: unknown): boolean {
    return RESTRICTED_CATEGORY_NAMES.includes(
        normalizeCategoryName(value)
    );
}