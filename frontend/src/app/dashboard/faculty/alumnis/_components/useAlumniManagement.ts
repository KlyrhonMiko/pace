"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentDetails {
    student_id: string;
    course: string;
    year_graduated: number;
    gwa: number;
    avg_prof_grade: number | null;
    avg_elec_grade: number | null;
    ojt_grade: number | null;
}

export interface Alumni {
    alumni_id: string;
    last_name: string;
    first_name: string;
    middle_name: string;
    birthdate: string;
    age: number;
    gender: string;
    employment_status: string | null;
    employment_sector: string | null;
    salary_package: number | null;
    offers_received: number | null;
    student: StudentDetails | null;
}

export interface AlumniFormData {
    last_name: string;
    first_name: string;
    middle_name: string;
    birthdate: string;
    gender: string;
    // Employment Fields
    employment_status: string;
    employment_sector: string;
    salary_package: string;
    offers_received: string;
    // Academic Fields
    student_id: string;
    course: string;
    year_graduated: string;
    gwa: string;
    avg_prof_grade: string;
    avg_elec_grade: string;
    ojt_grade: string;
    // Alumni Skills Fields
    soft_skills_ave: number | null;
    hard_skills_ave: number | null;
    program_skill_values: Record<string, number>;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Mock data removed.

// ─── Default Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: AlumniFormData = {
    last_name: "",
    first_name: "",
    middle_name: "",
    birthdate: "",
    gender: "",
    employment_status: "Searching",
    employment_sector: "",
    salary_package: "",
    offers_received: "",
    student_id: "",
    course: "",
    year_graduated: "",
    gwa: "",
    avg_prof_grade: "",
    avg_elec_grade: "",
    ojt_grade: "",
    soft_skills_ave: null,
    hard_skills_ave: null,
    program_skill_values: {},
};

const IT_CS_SKILLS = [
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

const BUSINESS_ACCOUNTING_SKILLS = [
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

const EDUCATION_SKILLS = [
    "Teaching Skills",
    "Classroom Management Skills",
    "Curriculum Development Skills",
    "Educational Technology Skills",
    "English Communication & Writing Skills",
    "Filipino Communication & Writing Skills",
];

const ALL_PROGRAM_SKILLS = [
    ...IT_CS_SKILLS,
    ...BUSINESS_ACCOUNTING_SKILLS,
    ...EDUCATION_SKILLS,
];

function resolveProgramSkillsForCourse(course: string): string[] {
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function computeAge(birthdate: string): number {
    if (!birthdate) return 0;
    const today = new Date();
    const dob = new Date(birthdate);
    if (isNaN(dob.getTime())) return 0;
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return Math.max(age, 0);
}

function normalizeSkillScore(value: number): number {
    const safe = Number.isFinite(value) ? Math.trunc(value) : 0;
    if (safe < 0) return 0;
    if (safe > 100) return 100;
    return safe;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlumniManagement() {
    // --- Data State ---
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableCourses, setAvailableCourses] = useState<string[]>([]);

    // --- UI State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alumniToDelete, setAlumniToDelete] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [filterGender, setFilterGender] = useState<string>("all");
    const [filterCourse, setFilterCourse] = useState<string>("all");
    const [hasSkillsRecord, setHasSkillsRecord] = useState(false);
    const [isSkillsLoading, setIsSkillsLoading] = useState(false);

    // --- Form State ---
    const [formData, setFormData] = useState<AlumniFormData>(EMPTY_FORM);
    const activeProgramSkills = resolveProgramSkillsForCourse(formData.course);

    // --- Fetch Data ---
    const fetchCourses = useCallback(async () => {
        try {
            const response = await apiFetch<any>("/courses?limit=0");
            if (response.success && response.data?.courses) {
                const courseNames = response.data.courses.map((c: any) => c.course_name);
                setAvailableCourses(courseNames);
            }
        } catch (err: any) {
            console.error("Failed to fetch courses:", err);
        }
    }, []);

    const fetchAlumni = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiFetch<any>("/alumni?limit=100");
            if (response.success && response.data?.alumni) {
                const transformed = response.data.alumni.map((a: any) => ({
                    alumni_id: a.alumni_id,
                    last_name: a.last_name,
                    first_name: a.first_name,
                    middle_name: a.middle_name || "",
                    birthdate: a.birthdate,
                    age: a.age,
                    gender: a.gender,
                    employment_status: a.employment_status || null,
                    employment_sector: a.employment_sector || null,
                    salary_package: a.salary_package ?? null,
                    offers_received: a.offers_received ?? null,
                    student: a.student_id ? {
                        student_id: a.student_id,
                        course: a.course_name || a.course_id || "",
                        year_graduated: a.year_graduated,
                        gwa: a.gwa,
                        avg_prof_grade: a.avg_prof_grade,
                        avg_elec_grade: a.avg_elec_grade,
                        ojt_grade: a.ojt_grade,
                    } : null
                }));
                setAlumni(transformed);
            }
        } catch (err: any) {
            const errorMsg = typeof err === "string" ? err : (err?.message || "Failed to fetch alumni data.");
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
        fetchAlumni();
    }, [fetchAlumni, fetchCourses]);

    // --- Row Expand ---
    const toggleExpand = useCallback((alumniId: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(alumniId)) {
                next.delete(alumniId);
            } else {
                next.add(alumniId);
            }
            return next;
        });
    }, []);

    // --- Handlers ---
    const handleSearch = (query: string) => setSearchQuery(query);

    const openEditModal = async (targetAlumni: Alumni) => {
        setEditingAlumni(targetAlumni);
        setHasSkillsRecord(false);
        setFormData({
            last_name: targetAlumni.last_name,
            first_name: targetAlumni.first_name,
            middle_name: targetAlumni.middle_name,
            birthdate: targetAlumni.birthdate,
            gender: targetAlumni.gender,
            employment_status: targetAlumni.employment_status || "Searching",
            employment_sector: targetAlumni.employment_sector || "",
            salary_package: targetAlumni.salary_package?.toString() || "",
            offers_received: targetAlumni.offers_received?.toString() || "",
            student_id: targetAlumni.student?.student_id || "",
            course: targetAlumni.student?.course || "",
            year_graduated: targetAlumni.student?.year_graduated?.toString() || "",
            gwa: targetAlumni.student?.gwa?.toString() || "",
            avg_prof_grade: targetAlumni.student?.avg_prof_grade?.toString() || "",
            avg_elec_grade: targetAlumni.student?.avg_elec_grade?.toString() || "",
            ojt_grade: targetAlumni.student?.ojt_grade?.toString() || "",
            soft_skills_ave: null,
            hard_skills_ave: null,
            program_skill_values: {},
        });
        setIsModalOpen(true);

        setIsSkillsLoading(true);
        try {
            const response = await apiFetch<any>(`/alumni-skills/${targetAlumni.alumni_id}`);
            const skills = response?.data;
            if (response?.success && skills) {
                setHasSkillsRecord(true);
                setFormData((prev) => ({
                    ...prev,
                    soft_skills_ave: typeof skills.soft_skills_ave === "number" ? skills.soft_skills_ave : null,
                    hard_skills_ave: typeof skills.hard_skills_ave === "number" ? skills.hard_skills_ave : null,
                    program_skill_values:
                        skills.program_skills && typeof skills.program_skills === "object"
                            ? Object.fromEntries(
                                Object.entries(skills.program_skills as Record<string, unknown>)
                                    .filter(([, value]) => Number.isFinite(Number(value)))
                                    .map(([key, value]) => [key, normalizeSkillScore(Number(value))])
                            )
                            : {},
                }));
            }
        } catch (err: any) {
            const message = typeof err === "string" ? err : (err?.message || "");
            if (!message.toLowerCase().includes("skills record not found")) {
                toast.error("Failed to load alumni skills.");
            }
        } finally {
            setIsSkillsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingAlumni) return;
        if (!formData.first_name.trim()) { toast.error("First name is required."); return; }
        if (!formData.last_name.trim()) { toast.error("Last name is required."); return; }
        if (!formData.birthdate) { toast.error("Birthdate is required."); return; }
        if (!formData.gender) { toast.error("Gender is required."); return; }

        setIsSaving(true);
        try {
            const age = computeAge(formData.birthdate);

            const softSkillsValue = formData.soft_skills_ave;
            const hardSkillsValue = formData.hard_skills_ave;

            // Update Alumni
            await apiFetch(`/alumni/${editingAlumni.alumni_id}`, {
                method: "PATCH",
                body: {
                    last_name: formData.last_name,
                    first_name: formData.first_name,
                    middle_name: formData.middle_name,
                    birthdate: formData.birthdate,
                    gender: formData.gender,
                    age,
                    employment_status: formData.employment_status || null,
                    employment_sector: formData.employment_sector || null,
                    salary_package: formData.salary_package ? parseFloat(formData.salary_package) : null,
                    offers_received: formData.offers_received ? parseInt(formData.offers_received, 10) : null,
                }
            });

            // Update Student Record if exists
            if (formData.student_id.trim()) {
                try {
                    await apiFetch(`/student-records/${editingAlumni.alumni_id}`, {
                        method: "PATCH",
                        body: {
                            student_id: formData.student_id,
                            year_graduated: parseInt(formData.year_graduated, 10) || 0,
                            gwa: parseFloat(formData.gwa) || 0,
                            avg_prof_grade: formData.avg_prof_grade ? parseFloat(formData.avg_prof_grade) : null,
                            avg_elec_grade: formData.avg_elec_grade ? parseFloat(formData.avg_elec_grade) : null,
                            ojt_grade: formData.ojt_grade ? parseFloat(formData.ojt_grade) : null,
                        }
                    });
                } catch {
                    // If it doesn't exist, try creating it
                    await apiFetch("/student-records", {
                        method: "POST",
                        body: {
                            student_id: formData.student_id,
                            alumni_id: editingAlumni.alumni_id,
                            course_abbv: formData.course,
                            year_graduated: parseInt(formData.year_graduated, 10) || 0,
                            gwa: parseFloat(formData.gwa) || 0,
                            avg_prof_grade: formData.avg_prof_grade ? parseFloat(formData.avg_prof_grade) : null,
                            avg_elec_grade: formData.avg_elec_grade ? parseFloat(formData.avg_elec_grade) : null,
                            ojt_grade: formData.ojt_grade ? parseFloat(formData.ojt_grade) : null,
                        }
                    });
                }
            }

            const skillsPayload: Record<string, unknown> = {};
            if (softSkillsValue !== null) {
                skillsPayload.soft_skills_ave = softSkillsValue;
            }
            if (hardSkillsValue !== null) {
                skillsPayload.hard_skills_ave = hardSkillsValue;
            }
            const mergedProgramSkills: Record<string, number> = {
                ...formData.program_skill_values,
            };
            for (const skillName of activeProgramSkills) {
                if (!(skillName in mergedProgramSkills)) {
                    mergedProgramSkills[skillName] = 0;
                }
            }
            if (Object.keys(mergedProgramSkills).length > 0) {
                skillsPayload.program_skills = mergedProgramSkills;
            }

            if (hasSkillsRecord) {
                if (Object.keys(skillsPayload).length > 0) {
                    await apiFetch(`/alumni-skills/${editingAlumni.alumni_id}`, {
                        method: "PATCH",
                        body: skillsPayload,
                    });
                }
            } else if (Object.keys(skillsPayload).length > 0) {
                await apiFetch("/alumni-skills", {
                    method: "POST",
                    body: {
                        alumni_id: editingAlumni.alumni_id,
                        ...skillsPayload,
                    },
                });
                setHasSkillsRecord(true);
            }

            let employabilityError: string | null = null;
            let regressionError: string | null = null;

            // 1. Refresh Employability Prediction
            try {
                await apiFetch(`/predict/employability/${editingAlumni.alumni_id}`, {
                    method: "POST",
                });
            } catch (err: unknown) {
                const error = err as any;
                employabilityError = typeof error === "string" ? error : (error?.message || "Employability prediction failed");
            }

            // 2. Refresh Regression Prediction
            try {
                await apiFetch(`/predict/regression/${editingAlumni.alumni_id}`, {
                    method: "POST",
                });
            } catch (err: unknown) {
                const error = err as any;
                regressionError = typeof error === "string" ? error : (error?.message || "Regression prediction failed");
            }

            if (employabilityError || regressionError) {
                const errors = [
                    employabilityError && `Employability: ${employabilityError}`,
                    regressionError && `Regression: ${regressionError}`,
                ].filter(Boolean);
                toast.warning(`Alumni record updated, but some predictions failed: ${errors.join(", ")}`);
            } else {
                toast.success("Alumni record updated and all predictions refreshed.");
            }
            fetchAlumni();
            setIsModalOpen(false);
        } catch (err: unknown) {
            const error = err as any;
            const errorMsg = typeof error === "string" ? error : (error?.message || "Failed to save alumni record.");
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (alumniId: string) => {
        setAlumniToDelete(alumniId);
    };

    const setSkillScore = useCallback((skillName: string, value: number | null) => {
        setFormData((prev) => ({
            ...prev,
            program_skill_values: {
                ...prev.program_skill_values,
                [skillName]: value === null ? 0 : normalizeSkillScore(value),
            },
        }));
    }, []);

    const confirmDelete = async () => {
        if (!alumniToDelete) return;
        setIsDeleting(true);
        await new Promise((resolve) => setTimeout(resolve, 600));

        setAlumni((prev) => prev.filter((a) => a.alumni_id !== alumniToDelete));
        toast.success("Alumni record deleted successfully.");

        setIsDeleting(false);
        setAlumniToDelete(null);
    };

    // --- Filtering ---
    const filteredAlumni = alumni.filter((a) => {
        const fullName = `${a.last_name} ${a.first_name} ${a.middle_name}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            a.alumni_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.student?.student_id?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (a.student?.course?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesGender = filterGender === "all" || a.gender === filterGender;
        const matchesCourse = filterCourse === "all" || a.student?.course === filterCourse;
        return matchesSearch && matchesGender && matchesCourse;
    });

    const totalAlumni = alumni.length;

    return {
        // State
        alumni: filteredAlumni,
        totalAlumni,
        availableCourses,
        isModalOpen,
        editingAlumni,
        searchQuery,
        filterGender,
        filterCourse,
        hasSkillsRecord,
        isSkillsLoading,
        activeProgramSkills,
        isSaving,
        isDeleting,
        alumniToDelete,
        expandedRows,
        formData,
        isLoading,
        error,

        // Handlers
        setIsModalOpen,
        setFormData,
        setFilterGender,
        setFilterCourse,
        setAlumniToDelete,
        handleSearch,
        openEditModal,
        handleSave,
        handleDeleteClick,
        confirmDelete,
        toggleExpand,
        setSkillScore,
        fetchAlumni,
    };
}
