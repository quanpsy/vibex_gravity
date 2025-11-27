// ================================================================
// Profanity Filter for vibeX
// Checks user-generated content for inappropriate language
// ================================================================

/**
 * Comprehensive list of banned words
 * This list should be expanded based on moderation needs
 */
const BANNED_WORDS = [
    'fuck',
    'fucking',
    'shit',
    'bitch',
    'ass',
    'asshole',
    'bastard',
    'damn',
    'sex',
    'sexy',
    'hot',
    'porn',
    'nude',
    'naked',
    'dick',
    'cock',
    'pussy',
    'cunt',
    'slut',
    'whore',
    'rape',
    'kill',
    'murder',
    'suicide',
    'drug',
    'drugs',
    'weed',
    'cocaine',
    'heroin',
    // Add more as needed
];

/**
 * Check if text contains any banned words
 * Case-insensitive matching
 */
export function containsProfanity(text: string): boolean {
    if (!text) return false;

    const lowerText = text.toLowerCase();

    return BANNED_WORDS.some(word => {
        // Check for exact word match (with word boundaries)
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(lowerText);
    });
}

/**
 * Validate text and return error message if profanity found
 */
export function validateText(text: string, fieldName: string = 'Text'): string | null {
    if (!text) return null;

    if (containsProfanity(text)) {
        return `${fieldName} contains inappropriate language. Please revise.`;
    }

    return null;
}

/**
 * Validate multiple fields at once
 * Returns first error found or null
 */
export function validateFields(fields: { value: string; name: string }[]): string | null {
    for (const field of fields) {
        const error = validateText(field.value, field.name);
        if (error) return error;
    }
    return null;
}

/**
 * Clean text by replacing profanity with asterisks (alternative approach)
 * Not currently used, but available if needed
 */
export function cleanText(text: string): string {
    if (!text) return text;

    let cleanedText = text;

    BANNED_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const replacement = '*'.repeat(word.length);
        cleanedText = cleanedText.replace(regex, replacement);
    });

    return cleanedText;
}

/**
 * Get list of banned words found in text (for debugging/reporting)
 */
export function findProfanity(text: string): string[] {
    if (!text) return [];

    const lowerText = text.toLowerCase();
    const found: string[] = [];

    BANNED_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lowerText)) {
            found.push(word);
        }
    });

    return found;
}
