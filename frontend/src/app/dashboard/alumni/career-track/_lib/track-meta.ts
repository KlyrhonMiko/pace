/**
 * Shared metadata for each career track. Feeds visuals and insights
 * across the career-track page (hero, distribution, insights, history).
 */

import type { LucideIcon } from "lucide-react";
import {
    Code2,
    BarChart3,
    Smartphone,
    Palette,
    Briefcase,
    TrendingUp,
    Users,
    Target,
    Shield,
    Cloud,
    Server,
    LayoutDashboard,
    Globe,
    Brain,
    CheckCircle,
    Database,
    Gamepad2,
    Headphones,
    Activity
} from "lucide-react";

export type TrackOutlook = "High Demand" | "Rapidly Growing" | "Stable" | "Growing";

export interface TrackMeta {
    icon: LucideIcon;
    gradient: { from: string; to: string };
    accent: string;
    softBg: string;
    softText: string;
    softBorder: string;
    description: string;
    roles: string[];
    keySkills: string[];
    salaryHint: string;
    outlook: TrackOutlook;
    outlookIcon: LucideIcon;
}

export const DEFAULT_TRACK_META: TrackMeta = {
    icon: Briefcase,
    gradient: { from: "#64748b", to: "#94a3b8" },
    accent: "#64748b",
    softBg: "bg-slate-50 dark:bg-slate-900/40",
    softText: "text-slate-700 dark:text-slate-300",
    softBorder: "border-slate-200/60 dark:border-slate-800/60",
    description:
        "A career path tailored to your unique profile of skills, experience, and academic strengths.",
    roles: ["Specialist", "Analyst", "Associate", "Coordinator"],
    keySkills: ["Communication", "Problem Solving", "Critical Thinking", "Collaboration"],
    salaryHint: "Varies by role and experience",
    outlook: "Stable",
    outlookIcon: Target,
};

export const TRACK_META: Record<string, TrackMeta> = {
    "Full Stack Developer": {
        icon: Code2,
        gradient: { from: "#10b981", to: "#059669" },
        accent: "#10b981",
        softBg: "bg-emerald-50 dark:bg-emerald-950/30",
        softText: "text-emerald-700 dark:text-emerald-300",
        softBorder: "border-emerald-200/60 dark:border-emerald-800/60",
        description:
            "Build complete web applications across both client and server, working with modern frameworks, databases, and APIs to ship end-to-end features.",
        roles: [
            "Software Engineer",
            "Web Developer",
            "Application Developer",
            "Backend Engineer",
        ],
        keySkills: [
            "JavaScript",
            "TypeScript",
            "React",
            "Node.js",
            "Python",
            "SQL",
            "REST APIs",
            "Git",
        ],
        salaryHint: "₱25k – ₱45k typical entry-level monthly",
        outlook: "High Demand",
        outlookIcon: TrendingUp,
    },
    "Data Scientist": {
        icon: BarChart3,
        gradient: { from: "#0ea5e9", to: "#06b6d4" },
        accent: "#0ea5e9",
        softBg: "bg-sky-50 dark:bg-sky-950/30",
        softText: "text-sky-700 dark:text-sky-300",
        softBorder: "border-sky-200/60 dark:border-sky-800/60",
        description:
            "Turn raw data into insight using statistics, machine learning, and visualization to drive smarter decisions and unlock product value.",
        roles: [
            "Data Analyst",
            "ML Engineer",
            "Data Engineer",
            "Research Analyst",
        ],
        keySkills: [
            "Python",
            "SQL",
            "Pandas",
            "TensorFlow",
            "Statistics",
            "Visualization",
            "Excel",
            "Machine Learning",
        ],
        salaryHint: "₱30k – ₱55k typical entry-level monthly",
        outlook: "Rapidly Growing",
        outlookIcon: TrendingUp,
    },
    "Mobile App Developer": {
        icon: Smartphone,
        gradient: { from: "#f59e0b", to: "#f97316" },
        accent: "#f59e0b",
        softBg: "bg-amber-50 dark:bg-amber-950/30",
        softText: "text-amber-700 dark:text-amber-300",
        softBorder: "border-amber-200/60 dark:border-amber-800/60",
        description:
            "Design and ship mobile experiences for iOS and Android, balancing performance, design, and offline-friendly architectures.",
        roles: [
            "iOS Developer",
            "Android Developer",
            "React Native Engineer",
            "Mobile Engineer",
        ],
        keySkills: [
            "Swift",
            "Kotlin",
            "React Native",
            "Flutter",
            "Java",
            "Mobile UI",
            "REST APIs",
            "Firebase",
        ],
        salaryHint: "₱25k – ₱45k typical entry-level monthly",
        outlook: "Stable",
        outlookIcon: Target,
    },
    "UI/UX Designer": {
        icon: Palette,
        gradient: { from: "#ec4899", to: "#d946ef" },
        accent: "#ec4899",
        softBg: "bg-pink-50 dark:bg-pink-950/30",
        softText: "text-pink-700 dark:text-pink-300",
        softBorder: "border-pink-200/60 dark:border-pink-800/60",
        description:
            "Craft intuitive, accessible user experiences through research, wireframes, prototyping, and close collaboration with product and engineering.",
        roles: [
            "UX Designer",
            "UI Designer",
            "Product Designer",
            "Design Researcher",
        ],
        keySkills: [
            "Figma",
            "Adobe XD",
            "Prototyping",
            "User Research",
            "Design Systems",
            "Wireframing",
            "HTML/CSS",
            "Accessibility",
        ],
        salaryHint: "₱22k – ₱40k typical entry-level monthly",
        outlook: "Growing",
        outlookIcon: Users,
    },
    "Cybersecurity Analyst": {
        icon: Shield,
        gradient: { from: "#ef4444", to: "#b91c1c" },
        accent: "#ef4444",
        softBg: "bg-red-50 dark:bg-red-950/30",
        softText: "text-red-700 dark:text-red-300",
        softBorder: "border-red-200/60 dark:border-red-800/60",
        description:
            "Protect networks, systems, and data from cyber threats through monitoring, ethical hacking, and implementing robust security measures.",
        roles: [
            "Security Analyst",
            "Penetration Tester",
            "Information Security Specialist",
            "Security Engineer",
        ],
        keySkills: [
            "Networking",
            "Ethical Hacking",
            "Cryptography",
            "Risk Assessment",
            "Firewalls",
            "Linux",
            "Python",
            "Security Protocols",
        ],
        salaryHint: "₱30k – ₱50k typical entry-level monthly",
        outlook: "Rapidly Growing",
        outlookIcon: Activity,
    },
    "Cloud Architect": {
        icon: Cloud,
        gradient: { from: "#3b82f6", to: "#1d4ed8" },
        accent: "#3b82f6",
        softBg: "bg-blue-50 dark:bg-blue-950/30",
        softText: "text-blue-700 dark:text-blue-300",
        softBorder: "border-blue-200/60 dark:border-blue-800/60",
        description:
            "Design and oversee comprehensive cloud computing strategies, ensuring scalable, secure, and highly available architectures.",
        roles: [
            "Cloud Solutions Architect",
            "Cloud Engineer",
            "Infrastructure Engineer",
        ],
        keySkills: [
            "AWS",
            "Azure",
            "Google Cloud",
            "System Design",
            "Microservices",
            "Networking",
            "Security",
            "Linux",
        ],
        salaryHint: "₱40k – ₱70k typical entry-level monthly",
        outlook: "High Demand",
        outlookIcon: TrendingUp,
    },
    "DevOps Engineer": {
        icon: Server,
        gradient: { from: "#8b5cf6", to: "#6d28d9" },
        accent: "#8b5cf6",
        softBg: "bg-violet-50 dark:bg-violet-950/30",
        softText: "text-violet-700 dark:text-violet-300",
        softBorder: "border-violet-200/60 dark:border-violet-800/60",
        description:
            "Bridge the gap between development and IT operations by automating CI/CD pipelines and infrastructure deployments.",
        roles: [
            "Site Reliability Engineer",
            "Release Manager",
            "Platform Engineer",
        ],
        keySkills: [
            "Docker",
            "Kubernetes",
            "Jenkins",
            "CI/CD",
            "Linux",
            "Bash",
            "Git",
            "Terraform",
        ],
        salaryHint: "₱35k – ₱60k typical entry-level monthly",
        outlook: "High Demand",
        outlookIcon: TrendingUp,
    },
    "Product Manager": {
        icon: LayoutDashboard,
        gradient: { from: "#f43f5e", to: "#be123c" },
        accent: "#f43f5e",
        softBg: "bg-rose-50 dark:bg-rose-950/30",
        softText: "text-rose-700 dark:text-rose-300",
        softBorder: "border-rose-200/60 dark:border-rose-800/60",
        description:
            "Lead cross-functional teams to ideate, develop, and launch impactful products by balancing user needs and business goals.",
        roles: [
            "Associate Product Manager",
            "Product Owner",
            "Scrum Master",
        ],
        keySkills: [
            "Agile",
            "Jira",
            "User Research",
            "Roadmapping",
            "Data Analysis",
            "Communication",
            "Leadership",
        ],
        salaryHint: "₱30k – ₱55k typical entry-level monthly",
        outlook: "Growing",
        outlookIcon: Users,
    },
    "Network Engineer": {
        icon: Globe,
        gradient: { from: "#64748b", to: "#475569" },
        accent: "#64748b",
        softBg: "bg-slate-50 dark:bg-slate-900/40",
        softText: "text-slate-700 dark:text-slate-300",
        softBorder: "border-slate-200/60 dark:border-slate-800/60",
        description:
            "Design, implement, and manage secure and reliable computer networks crucial for organizational communications.",
        roles: [
            "Network Administrator",
            "Systems Engineer",
            "Network Technician",
        ],
        keySkills: [
            "Cisco",
            "TCP/IP",
            "Routing",
            "Switches",
            "Firewalls",
            "Troubleshooting",
            "Linux",
            "VPN",
        ],
        salaryHint: "₱25k – ₱45k typical entry-level monthly",
        outlook: "Stable",
        outlookIcon: Target,
    },
    "AI/ML Engineer": {
        icon: Brain,
        gradient: { from: "#a855f7", to: "#7e22ce" },
        accent: "#a855f7",
        softBg: "bg-purple-50 dark:bg-purple-950/30",
        softText: "text-purple-700 dark:text-purple-300",
        softBorder: "border-purple-200/60 dark:border-purple-800/60",
        description:
            "Develop intelligent algorithms and predictive models using massive datasets, deep learning frameworks, and AI research.",
        roles: [
            "Machine Learning Engineer",
            "AI Researcher",
            "Deep Learning Engineer",
        ],
        keySkills: [
            "Python",
            "PyTorch",
            "TensorFlow",
            "Deep Learning",
            "NLP",
            "Mathematics",
            "Algorithms",
            "Data Science",
        ],
        salaryHint: "₱40k – ₱75k typical entry-level monthly",
        outlook: "Rapidly Growing",
        outlookIcon: TrendingUp,
    },
    "Quality Assurance Engineer": {
        icon: CheckCircle,
        gradient: { from: "#14b8a6", to: "#0f766e" },
        accent: "#14b8a6",
        softBg: "bg-teal-50 dark:bg-teal-950/30",
        softText: "text-teal-700 dark:text-teal-300",
        softBorder: "border-teal-200/60 dark:border-teal-800/60",
        description:
            "Ensure software reliability and quality by writing automated tests, conducting manual testing, and identifying bugs early.",
        roles: [
            "QA Analyst",
            "Test Automation Engineer",
            "Software Tester",
        ],
        keySkills: [
            "Selenium",
            "Cypress",
            "Jest",
            "Test Automation",
            "Manual Testing",
            "Agile",
            "Bug Tracking",
            "Java/Python",
        ],
        salaryHint: "₱25k – ₱40k typical entry-level monthly",
        outlook: "Stable",
        outlookIcon: Target,
    },
    "Database Administrator": {
        icon: Database,
        gradient: { from: "#eab308", to: "#a16207" },
        accent: "#eab308",
        softBg: "bg-yellow-50 dark:bg-yellow-950/30",
        softText: "text-yellow-700 dark:text-yellow-300",
        softBorder: "border-yellow-200/60 dark:border-yellow-800/60",
        description:
            "Manage and maintain data storage systems, focusing on performance optimization, backups, and data security.",
        roles: [
            "DBA",
            "Database Developer",
            "Data Architect",
        ],
        keySkills: [
            "SQL",
            "PostgreSQL",
            "MySQL",
            "MongoDB",
            "Performance Tuning",
            "Backups",
            "Linux",
            "Data Security",
        ],
        salaryHint: "₱28k – ₱50k typical entry-level monthly",
        outlook: "Stable",
        outlookIcon: Target,
    },
    "Game Developer": {
        icon: Gamepad2,
        gradient: { from: "#ff5722", to: "#e64a19" },
        accent: "#ff5722",
        softBg: "bg-orange-50 dark:bg-orange-950/30",
        softText: "text-orange-700 dark:text-orange-300",
        softBorder: "border-orange-200/60 dark:border-orange-800/60",
        description:
            "Create interactive gaming experiences for PC, console, or mobile, utilizing powerful game engines and complex logic.",
        roles: [
            "Gameplay Programmer",
            "Unity Developer",
            "Technical Artist",
        ],
        keySkills: [
            "C#",
            "C++",
            "Unity",
            "Unreal Engine",
            "3D Math",
            "Physics",
            "Game Design",
            "Optimization",
        ],
        salaryHint: "₱25k – ₱45k typical entry-level monthly",
        outlook: "Growing",
        outlookIcon: Users,
    },
    "IT Support Specialist": {
        icon: Headphones,
        gradient: { from: "#94a3b8", to: "#475569" },
        accent: "#64748b",
        softBg: "bg-slate-50 dark:bg-slate-900/40",
        softText: "text-slate-700 dark:text-slate-300",
        softBorder: "border-slate-200/60 dark:border-slate-800/60",
        description:
            "Provide technical assistance, resolve hardware and software issues, and manage IT infrastructure to keep operations smooth.",
        roles: [
            "Helpdesk Technician",
            "IT Technician",
            "Technical Support Engineer",
        ],
        keySkills: [
            "Troubleshooting",
            "Active Directory",
            "Windows OS",
            "Customer Service",
            "Hardware",
            "Networking Basics",
            "Ticketing Systems",
            "Office 365",
        ],
        salaryHint: "₱20k – ₱35k typical entry-level monthly",
        outlook: "Stable",
        outlookIcon: Target,
    },
};

export function getTrackMeta(track: string): TrackMeta {
    return TRACK_META[track] ?? DEFAULT_TRACK_META;
}
