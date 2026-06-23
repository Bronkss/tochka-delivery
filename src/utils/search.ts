export function normalizeSearchValue(value: unknown) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function matchesSearch<T extends Record<string, unknown>>(
    item: T,
    query: string,
    fields: Array<keyof T>,
) {
    const normalizedQuery = normalizeSearchValue(query);

    if (!normalizedQuery) {
        return true;
    }

    const words = normalizedQuery.split(' ');
    const searchableText = normalizeSearchValue(
        fields.map((field) => item[field]).join(' '),
    );

    return words.every((word) => searchableText.includes(word));
}
