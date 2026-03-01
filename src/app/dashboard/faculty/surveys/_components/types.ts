export type QuestionType = 
    | 'MULTIPLE_CHOICE' 
    | 'MULTI_SELECT' 
    | 'TEXT' 
    | 'SCALE' 
    | 'YES_NO' 
    | 'DATE' 
    | 'NUMBER';

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export interface Question {
    id: number;
    text: string;
    type: QuestionType;
    required: boolean;
    // For Choice and Multi-Select
    options?: string[];
    // For Scale
    scaleMin?: number;
    scaleMax?: number;
    scaleLabelMin?: string;
    scaleLabelMax?: string;
    // For Text/Date/Number
    placeholder?: string;
}

export interface Survey {
    id: number;
    title: string;
    description: string;
    isAnonymous: boolean;
    allowMultipleResponses: boolean;
    opensAt: string; // ISO String or "15 Oct"
    closesAt: string;
    status: SurveyStatus;
    questions: Question[];
    responsesCount: number;
}
