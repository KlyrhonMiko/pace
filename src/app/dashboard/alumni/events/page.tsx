"use client";

import { useState, useMemo } from "react";
import EventFilters from "./_components/EventFilters";
import EventList from "./_components/EventList";
import { eventTypes } from "./_components/constants";

interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    description: string;
    attendees: number;
    capacity: number;
    image?: string;
    isRegistered?: boolean;
}

// Mock data - replace with API call
const mockEvents: Event[] = [
    {
        id: 1,
        title: "PLP Career Fair 2024 - Connect with Top Employers",
        date: "15 Feb",
        time: "9:00 AM - 5:00 PM",
        location: "PLP Main Campus, Auditorium ",
        type: "Career Fair",
        description: "Connect with 50+ top employers from technology, finance, healthcare, and engineering sectors. Meet hiring managers, learn about career opportunities, and submit your resume on-site.",
        attendees: 234,
        capacity: 500,
        isRegistered: false,
    },
    {
        id: 2,
        title: "Resume Writing Workshop - Stand Out Your Application",
        date: "20 Feb",
        time: "2:00 PM - 4:00 PM",
        location: "Virtual Event - Zoom Link",
        type: "Workshop",
        description: "Learn professional resume writing techniques from HR experts. Covers formatting, ATS optimization, bullet points, and tailoring your resume for specific industries.",
        attendees: 89,
        capacity: 150,
        isRegistered: true,
    },
    {
        id: 3,
        title: "Tech Industry Seminar - Latest Trends & Innovations",
        date: "25 Feb",
        time: "1:00 PM - 3:00 PM",
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
        date: "28 Feb",
        time: "12:00 PM - 1:30 PM",
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
        date: "22 Feb",
        time: "3:00 PM - 5:00 PM",
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
        date: "18 Feb",
        time: "10:00 AM - 12:00 PM",
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
        date: "17 Feb",
        time: "4:00 PM - 5:30 PM",
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
        date: "26 Feb",
        time: "2:00 PM - 3:30 PM",
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
        date: "21 Feb",
        time: "1:00 PM - 3:00 PM",
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
        date: "23 Feb",
        time: "3:00 PM - 4:00 PM",
        location: "Virtual Event - Teams",
        type: "Workshop",
        description: "Learn negotiation strategies, market research for salaries, and how to confidently advocate for fair compensation.",
        attendees: 112,
        capacity: 180,
        isRegistered: false,
    },
];

export default function EventsPage() {
    // const [filteredEvents, setFilteredEvents] = useState<Event[]>(mockEvents); // Derived state instead
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const EVENTS_PER_PAGE = 10;

    // Filter and search logic
    const filteredEvents = useMemo(() => {
        let result = mockEvents;

        // Search filter
        if (searchQuery) {
            result = result.filter(
                (event) =>
                    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    event.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Type filter
        if (selectedType) {
            result = result.filter((event) => event.type === selectedType);
        }

        // Registered only filter
        if (showRegisteredOnly) {
            result = result.filter((event) => event.isRegistered);
        }

        return result;
    }, [searchQuery, selectedType, showRegisteredOnly]);



    const totalEvents = filteredEvents.length;
    const totalPages = Math.ceil(totalEvents / EVENTS_PER_PAGE);
    const paginatedEvents = filteredEvents.slice(
        (currentPage - 1) * EVENTS_PER_PAGE,
        currentPage * EVENTS_PER_PAGE
    );

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedType(null);
        setShowRegisteredOnly(false);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            {/* Page Header with Background */}
            <div className="relative mb-8 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-transparent border border-emerald-100/50 p-8 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-100 opacity-20 blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-100 opacity-20 blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Events & Networking</h1>
                            <p className="text-slate-600 max-w-2xl">
                                Discover and register for professional development events, seminars, workshops, and networking opportunities. Connect with industry leaders and expand your career network.
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-emerald-200">
                            <div className="h-2 w-2 rounded-full bg-emerald-700 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-700">{totalEvents} Events</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2-Column Layout */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Event List */}
                <div className="lg:col-span-3">
                    <EventList
                        filteredEvents={paginatedEvents}
                        totalEvents={totalEvents}
                        totalPages={totalPages}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        EVENTS_PER_PAGE={EVENTS_PER_PAGE}
                        clearFilters={clearFilters}
                        searchQuery={searchQuery}
                        onSearchChange={(query) => {
                            setSearchQuery(query);
                            setCurrentPage(1);
                        }}
                    />
                </div>

                {/* Right Column: Filters */}
                <div className="lg:col-span-1">
                    <EventFilters
                        eventTypes={eventTypes}
                        selectedType={selectedType}
                        setSelectedType={(type) => {
                            setSelectedType(type);
                            setCurrentPage(1);
                        }}
                        showRegisteredOnly={showRegisteredOnly}
                        setShowRegisteredOnly={(show) => {
                            setShowRegisteredOnly(show);
                            setCurrentPage(1);
                        }}
                        onClearFilters={clearFilters}
                    />
                </div>
            </div>
        </div>
    );
}
