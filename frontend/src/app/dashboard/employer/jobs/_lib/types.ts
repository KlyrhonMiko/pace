// Unified job type
export interface UnifiedJob {
    id: number | string;
    title: string;
    company: string;
    location: string;
    salary: number;
    salaryDisplay: string;
    type: string;
    postedDate: Date;
    logo: string;
    experienceLevel: string;
    workType: string;
    link?: string;
    snippet?: string;
    description?: string;
    requirements?: string;
    isActive: boolean;
    dbId?: number | string;
    salary_min?: number;
    salary_max?: number;
}
