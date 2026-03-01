import { Question, Survey } from "./types";

export const QUESTION_TYPES = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice (Single Answer)' },
    { value: 'MULTI_SELECT', label: 'Checkboxes (Multiple Answers)' },
    { value: 'TEXT', label: 'Short/Long Answer' },
    { value: 'SCALE', label: 'Linear Scale (e.g. 1 to 5)' },
    { value: 'YES_NO', label: 'Yes or No' },
    { value: 'DATE', label: 'Date Selection' },
    { value: 'NUMBER', label: 'Number Input' },
];

export const SURVEY_STATUSES = ['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED'];

// --- Mock Data ---

export const mockQuestionLibrary: Question[] = [
    {
        id: 1,
        text: "How satisfied were you with the recent Career Fair?",
        type: 'SCALE',
        required: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabelMin: "Very Dissatisfied",
        scaleLabelMax: "Very Satisfied"
    },
    {
        id: 2,
        text: "Which of the following topics are you most interested in learning about next semester?",
        type: 'MULTI_SELECT',
        required: false,
        options: ["Web Development", "Data Science", "Cybersecurity", "Project Management", "UI/UX Design"]
    },
    {
        id: 3,
        text: "Do you plan to attend the upcoming seminar?",
        type: 'YES_NO',
        required: true,
        options: ["Yes", "No"]
    },
    {
        id: 4,
        text: "Please provide any additional feedback or suggestions.",
        type: 'TEXT',
        required: false,
        placeholder: "Type your answer here..."
    }
];

export const mockSurveys: Survey[] = [
    {
        id: 1,
        title: "End of Semester IT Program Feedback",
        description: "We want to know your thoughts on the courses you took this semester.",
        isAnonymous: true,
        allowMultipleResponses: false,
        opensAt: "2024-12-01",
        closesAt: "2024-12-20",
        status: 'ACTIVE',
        questions: [mockQuestionLibrary[0], mockQuestionLibrary[1], mockQuestionLibrary[3]],
        responsesCount: 145
    },
    {
        id: 2,
        title: "Alumni Homecoming Availability Check",
        description: "Trying to find the best weekend for the 2025 Alumni gathering.",
        isAnonymous: false,
        allowMultipleResponses: false,
        opensAt: "2024-10-15",
        closesAt: "2024-11-01",
        status: 'CLOSED',
        questions: [{
            id: 99,
            text: "Which weekend works best for you?",
            type: 'MULTIPLE_CHOICE',
            required: true,
            options: ["First week of Jan", "Second week of Jan", "First week of Feb"]
        }],
        responsesCount: 302
    }
];
