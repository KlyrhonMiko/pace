/**
 * Shared skill-list constants and course resolver.
 * Used by both the alumni self-service SkillsManager and the
 * faculty-side alumni management hook. Both must reference the
 * exact same key names accepted by the ML predictor and the
 * backend VALID_PROGRAM_SKILL_KEYS set.
 */

export const IT_CS_SKILLS: string[] = [
    "Python Programming Skills",
    "Java Programming Skills",
    "Database Management Skills",
    "Web Development Skills",
    "Networking Skills",
    "Cloud Computing Skills",
    "Software Engineering Skills",
    "Data Structures & Algorithms",
    "Machine Learning Skills",
    "System Design Skills",
    "Cybersecurity Skills",
    "Artificial Intelligence Skills",
    "Programming Logic Skills",
];

export const BUSINESS_ACCOUNTING_SKILLS: string[] = [
    "Financial Accounting Skills",
    "Budgeting & Analysis Skills",
    "Marketing Skills",
    "Auditing Skills",
    "Financial Management Skills",
    "Taxation Skills",
    "Strategic Planning Skills",
    "Risk Management Skills",
    "Innovation & Business Planning Skills",
    "Consumer Behavior Analysis",
    "Sales Management Skills",
    "Leadership & Decision-Making Skills",
];

export const EDUCATION_SKILLS: string[] = [
    "Teaching Skills",
    "Classroom Management Skills",
    "Curriculum Development Skills",
    "Educational Technology Skills",
    "English Communication & Writing Skills",
    "Filipino Communication & Writing Skills",
];

export const ALL_PROGRAM_SKILLS: string[] = [
    ...IT_CS_SKILLS,
    ...BUSINESS_ACCOUNTING_SKILLS,
    ...EDUCATION_SKILLS,
];

/**
 * Resolve the relevant program skill list for a given course name.
 * Falls back to ALL_PROGRAM_SKILLS for unrecognised courses.
 */
export function resolveProgramSkillsForCourse(course: string): string[] {
    const normalized = course.trim().toLowerCase();

    if (!normalized) return [];

    if (
        normalized.includes("bsit") ||
        normalized.includes("bscs") ||
        normalized.includes("information technology") ||
        normalized.includes("computer science")
    ) {
        return IT_CS_SKILLS;
    }

    if (
        normalized.includes("bsa") ||
        normalized.includes("bsba") ||
        normalized.includes("account") ||
        normalized.includes("business") ||
        normalized.includes("marketing")
    ) {
        return BUSINESS_ACCOUNTING_SKILLS;
    }

    if (
        normalized.includes("bsed") ||
        normalized.includes("education") ||
        normalized.includes("filipino") ||
        normalized.includes("english")
    ) {
        return EDUCATION_SKILLS;
    }

    return ALL_PROGRAM_SKILLS;
}
