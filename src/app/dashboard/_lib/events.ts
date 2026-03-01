"use client";

export interface Event {
    id: number;
    title: string;
    description: string;
    type: string;
    date: string;
    start: string;
    end: string;
    location: string;
    capacity: number;
    attendees: number;
    image?: string;
    isRegistered?: boolean;
}

export const INITIAL_EVENTS: Event[] = [
    {
        id: 1,
        title: "PLP Career Fair 2024 - Connect with Top Employers",
        description: "Connect with 50+ top employers from technology, finance, healthcare, and engineering sectors. Meet hiring managers, learn about career opportunities, and submit your resume on-site.",
        date: "2026-02-15",
        start: "09:00",
        end: "17:00",
        location: "PLP Main Campus, Auditorium ",
        type: "Career Fair",
        attendees: 234,
        capacity: 500,
        isRegistered: false,
    },
    {
        id: 2,
        title: "Resume Writing Workshop - Stand Out Your Application",
        description: "Learn professional resume writing techniques from HR experts. Covers formatting, ATS optimization, bullet points, and tailoring your resume for specific industries.",
        date: "2026-02-20",
        start: "14:00",
        end: "16:00",
        location: "Virtual Event - Zoom Link",
        type: "Workshop",
        attendees: 89,
        capacity: 150,
        isRegistered: true,
    },
    {
        id: 3,
        title: "Tech Industry Seminar - Latest Trends & Innovations",
        date: "2026-02-25",
        start: "10:00",
        end: "12:00",
        location: "PLP Auditorium",
        type: "Seminar",
        description: "Hear from industry leaders at Accenture, Google, and Microsoft about emerging technologies, AI/ML trends, and career pathways in tech. Q&A session included.",
        attendees: 156,
        capacity: 300,
        isRegistered: false,
    },
    {
        id: 4,
        title: "Networking Lunch - Connect with Alumni & Professionals",
        date: "2026-02-28",
        start: "12:00",
        end: "13:30",
        location: "PLP Banquet Hall",
        type: "Networking",
        description: "Casual networking over lunch with alumni from various industries. Great opportunity to build professional relationships and learn about diverse career paths.",
        attendees: 72,
        capacity: 100,
        isRegistered: false,
    },
    {
        id: 5,
        title: "Interview Preparation & Mock Interview Session",
        date: "2026-02-22",
        start: "15:00",
        end: "17:00",
        location: "PLP Main Campus - Auditorium",
        type: "Workshop",
        description: "Practice your interview skills with experienced professionals. Covers common questions, behavioral interviews (STAR method), and industry-specific scenarios.",
        attendees: 45,
        capacity: 80,
        isRegistered: false,
    },
    {
        id: 6,
        title: "Finance & Investment Career Seminar",
        date: "2026-02-18",
        start: "10:00",
        end: "12:00",
        location: "PLP Auditorium - Main Hall",
        type: "Seminar",
        description: "Executives from leading financial institutions discuss career opportunities in banking, investment, risk management, and fintech.",
        attendees: 123,
        capacity: 200,
        isRegistered: false,
    },
    {
        id: 7,
        title: "LinkedIn Profile Optimization Workshop",
        date: "2026-02-17",
        start: "16:00",
        end: "17:30",
        location: "Virtual Event - Google Meet",
        type: "Workshop",
        description: "Optimize your LinkedIn profile to attract recruiters. Learn about professional photography, headline optimization, and networking strategies.",
        attendees: 156,
        capacity: 200,
        isRegistered: true,
    },
    {
        id: 8,
        title: "Entrepreneurship Talk - From Startup to Success",
        date: "2026-02-26",
        start: "14:00",
        end: "15:30",
        location: "PLP Main Campus - Banquet Hall",
        type: "Networking",
        description: "Young entrepreneurs share their journey, challenges, and success stories. Ideal for those interested in starting their own venture.",
        attendees: 98,
        capacity: 120,
        isRegistered: false,
    },
    {
        id: 9,
        title: "HRM & Employee Relations Career Path Seminar",
        date: "2026-02-21",
        start: "13:00",
        end: "15:00",
        location: "PLP Main Campus - Banquet Hall",
        type: "Seminar",
        description: "HR professionals from multinational companies discuss recruitment, employee development, compensation, and organizational development.",
        attendees: 87,
        capacity: 150,
        isRegistered: false,
    },
    {
        id: 10,
        title: "Salary Negotiation Workshop - Know Your Worth",
        date: "2026-02-23",
        start: "15:00",
        end: "16:00",
        location: "Virtual Event - Teams",
        type: "Workshop",
        description: "Learn negotiation strategies, market research for salaries, and how to confidently advocate for fair compensation.",
        attendees: 112,
        capacity: 180,
        isRegistered: false,
    },
];

const STORAGE_KEY = "pace_events_data";

export const getStoredEvents = (): Event[] => {
    if (typeof window === "undefined") return INITIAL_EVENTS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
        return INITIAL_EVENTS;
    }
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to parse stored events:", e);
        return INITIAL_EVENTS;
    }
};

export const saveStoredEvents = (events: Event[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    // Dispatch a custom event to notify other components/tabs if needed
    window.dispatchEvent(new CustomEvent("eventsUpdated"));
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatEventDate = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        const monthIndex = parseInt(month) - 1;
        return `${MONTHS[monthIndex]} ${parseInt(day)} ${year}`;
    }
    return dateStr;
};

export const getMonthAbbreviation = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const month = dateStr.split('-')[1];
        return MONTHS[parseInt(month) - 1];
    }
    return "Event";
};

export const getDayNumber = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr.split('-')[2];
    }
    return "00";
};
