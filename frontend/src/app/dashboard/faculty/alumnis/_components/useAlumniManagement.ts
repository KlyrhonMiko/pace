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
}

/** Read-only snapshot of an alumni's skill record (for staff view). */
export interface AlumniSkillsSnapshot {
    soft_skills_ave: number | null;
    hard_skills_ave: number | null;
    program_skills: Record<string, number> | null;
    updated_at: string | null;
}

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
};


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
    // Read-only skills snapshot loaded when staff opens the edit modal
    const [alumniSkillsForView, setAlumniSkillsForView] = useState<AlumniSkillsSnapshot | null>(null);
    const [isSkillsLoading, setIsSkillsLoading] = useState(false);

    // --- Form State ---
    const [formData, setFormData] = useState<AlumniFormData>(EMPTY_FORM);

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
        setAlumniSkillsForView(null);
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
        });
        setIsModalOpen(true);

        // Load skills read-only for display
        setIsSkillsLoading(true);
        try {
            const response = await apiFetch<{ success: boolean; data?: {
                soft_skills_ave?: unknown;
                hard_skills_ave?: unknown;
                program_skills?: unknown;
                updated_at?: unknown;
            } }>(`/alumni-skills/${targetAlumni.alumni_id}`);
            const skills = response?.data;
            if (response?.success && skills) {
                setAlumniSkillsForView({
                    soft_skills_ave: typeof skills.soft_skills_ave === "number" ? skills.soft_skills_ave : null,
                    hard_skills_ave: typeof skills.hard_skills_ave === "number" ? skills.hard_skills_ave : null,
                    program_skills:
                        skills.program_skills && typeof skills.program_skills === "object"
                            ? (skills.program_skills as Record<string, number>)
                            : null,
                    updated_at: typeof skills.updated_at === "string" ? skills.updated_at : null,
                });
            }
        } catch {
            // No skills record yet — silently leave alumniSkillsForView as null
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

            // Skills are now alumni-owned. Staff-side save only updates alumni + student records.
            // Attempt prediction re-run using whatever skills the alumni has stored.
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
                // Skills not linked is expected if alumni hasn't set theirs yet
                const isSkillsNotLinked = errors.some(
                    (e) => typeof e === "string" && e.toLowerCase().includes("skills")
                );
                if (isSkillsNotLinked) {
                    toast.warning("Alumni record updated. Prediction skipped — alumni hasn't set their skill scores yet.");
                } else {
                    toast.warning(`Alumni record updated, but some predictions failed: ${errors.join(", ")}`);
                }
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
        alumniSkillsForView,
        isSkillsLoading,
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
        fetchAlumni,
    };
}
