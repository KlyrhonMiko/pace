"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

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
    student: StudentDetails | null;
}

export interface AlumniFormData {
    last_name: string;
    first_name: string;
    middle_name: string;
    birthdate: string;
    gender: string;
    student_id: string;
    course: string;
    year_graduated: string;
    gwa: string;
    avg_prof_grade: string;
    avg_elec_grade: string;
    ojt_grade: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ALUMNI: Alumni[] = [
    {
        alumni_id: "ALM-001",
        last_name: "Dela Cruz",
        first_name: "Juan",
        middle_name: "Mendoza",
        birthdate: "2000-05-15",
        age: 25,
        gender: "Male",
        student: {
            student_id: "2020-00112",
            course: "BSIT",
            year_graduated: 2024,
            gwa: 1.45,
            avg_prof_grade: 1.38,
            avg_elec_grade: 1.55,
            ojt_grade: 95,
        },
    },
    {
        alumni_id: "ALM-002",
        last_name: "Santos",
        first_name: "Maria",
        middle_name: "Reyes",
        birthdate: "2001-08-22",
        age: 24,
        gender: "Female",
        student: {
            student_id: "2020-00245",
            course: "BSCS",
            year_graduated: 2024,
            gwa: 1.25,
            avg_prof_grade: 1.20,
            avg_elec_grade: 1.30,
            ojt_grade: 98,
        },
    },
    {
        alumni_id: "ALM-003",
        last_name: "Villanueva",
        first_name: "Carlos",
        middle_name: "",
        birthdate: "1999-11-03",
        age: 26,
        gender: "Male",
        student: {
            student_id: "2019-00089",
            course: "BSIT",
            year_graduated: 2023,
            gwa: 1.75,
            avg_prof_grade: 1.60,
            avg_elec_grade: 1.85,
            ojt_grade: 90,
        },
    },
    {
        alumni_id: "ALM-004",
        last_name: "Bautista",
        first_name: "Sofia",
        middle_name: "Tan",
        birthdate: "2001-02-14",
        age: 25,
        gender: "Female",
        student: {
            student_id: "2020-00301",
            course: "BSA",
            year_graduated: 2024,
            gwa: 1.35,
            avg_prof_grade: 1.30,
            avg_elec_grade: 1.40,
            ojt_grade: 96,
        },
    },
    {
        alumni_id: "ALM-005",
        last_name: "Ramos",
        first_name: "Miguel",
        middle_name: "Cruz",
        birthdate: "2000-07-29",
        age: 25,
        gender: "Male",
        student: {
            student_id: "2020-00178",
            course: "BSCE",
            year_graduated: 2024,
            gwa: 1.90,
            avg_prof_grade: 1.85,
            avg_elec_grade: 2.00,
            ojt_grade: 88,
        },
    },
    {
        alumni_id: "ALM-006",
        last_name: "Torres",
        first_name: "Isabella",
        middle_name: "Navarro",
        birthdate: "2000-12-01",
        age: 25,
        gender: "Female",
        student: {
            student_id: "2020-00355",
            course: "BSA",
            year_graduated: 2024,
            gwa: 1.50,
            avg_prof_grade: 1.45,
            avg_elec_grade: 1.60,
            ojt_grade: 93,
        },
    },
    {
        alumni_id: "ALM-007",
        last_name: "Garcia",
        first_name: "Andre",
        middle_name: "Lim",
        birthdate: "1999-03-18",
        age: 27,
        gender: "Male",
        student: {
            student_id: "2019-00210",
            course: "BSIT",
            year_graduated: 2023,
            gwa: 1.55,
            avg_prof_grade: 1.50,
            avg_elec_grade: 1.65,
            ojt_grade: 92,
        },
    },
    {
        alumni_id: "ALM-008",
        last_name: "Fernandez",
        first_name: "Angela",
        middle_name: "Pascual",
        birthdate: "2001-09-07",
        age: 24,
        gender: "Female",
        student: {
            student_id: "2020-00399",
            course: "BSCS",
            year_graduated: 2024,
            gwa: 1.15,
            avg_prof_grade: 1.10,
            avg_elec_grade: 1.20,
            ojt_grade: 99,
        },
    },
];

// ─── Default Form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: AlumniFormData = {
    last_name: "",
    first_name: "",
    middle_name: "",
    birthdate: "",
    gender: "",
    student_id: "",
    course: "",
    year_graduated: "",
    gwa: "",
    avg_prof_grade: "",
    avg_elec_grade: "",
    ojt_grade: "",
};

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlumniManagement() {
    // --- Data State ---
    const [alumni, setAlumni] = useState<Alumni[]>(MOCK_ALUMNI);

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

    // --- Form State ---
    const [formData, setFormData] = useState<AlumniFormData>(EMPTY_FORM);

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

    const openCreateModal = useCallback(() => {
        setEditingAlumni(null);
        setFormData(EMPTY_FORM);
        setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback((record: Alumni) => {
        setEditingAlumni(record);
        setFormData({
            last_name: record.last_name,
            first_name: record.first_name,
            middle_name: record.middle_name,
            birthdate: record.birthdate,
            gender: record.gender,
            student_id: record.student?.student_id ?? "",
            course: record.student?.course ?? "",
            year_graduated: record.student?.year_graduated?.toString() ?? "",
            gwa: record.student?.gwa?.toString() ?? "",
            avg_prof_grade: record.student?.avg_prof_grade?.toString() ?? "",
            avg_elec_grade: record.student?.avg_elec_grade?.toString() ?? "",
            ojt_grade: record.student?.ojt_grade?.toString() ?? "",
        });
        setIsModalOpen(true);
    }, []);

    const handleSave = async () => {
        if (!formData.first_name.trim()) { toast.error("First name is required."); return; }
        if (!formData.last_name.trim()) { toast.error("Last name is required."); return; }
        if (!formData.birthdate) { toast.error("Birthdate is required."); return; }
        if (!formData.gender) { toast.error("Gender is required."); return; }

        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 600));

        const age = computeAge(formData.birthdate);
        const studentData: StudentDetails | null =
            formData.student_id.trim()
                ? {
                      student_id: formData.student_id,
                      course: formData.course,
                      year_graduated: parseInt(formData.year_graduated, 10) || 0,
                      gwa: parseFloat(formData.gwa) || 0,
                      avg_prof_grade: formData.avg_prof_grade ? parseFloat(formData.avg_prof_grade) : null,
                      avg_elec_grade: formData.avg_elec_grade ? parseFloat(formData.avg_elec_grade) : null,
                      ojt_grade: formData.ojt_grade ? parseFloat(formData.ojt_grade) : null,
                  }
                : null;

        if (editingAlumni) {
            setAlumni((prev) =>
                prev.map((a) =>
                    a.alumni_id === editingAlumni.alumni_id
                        ? {
                              ...a,
                              last_name: formData.last_name,
                              first_name: formData.first_name,
                              middle_name: formData.middle_name,
                              birthdate: formData.birthdate,
                              age,
                              gender: formData.gender,
                              student: studentData,
                          }
                        : a
                )
            );
            toast.success("Alumni record updated successfully.");
        } else {
            const newAlumni: Alumni = {
                alumni_id: `ALM-${String(alumni.length + 1).padStart(3, "0")}`,
                last_name: formData.last_name,
                first_name: formData.first_name,
                middle_name: formData.middle_name,
                birthdate: formData.birthdate,
                age,
                gender: formData.gender,
                student: studentData,
            };
            setAlumni((prev) => [newAlumni, ...prev]);
            toast.success("Alumni record created successfully.");
        }

        setIsSaving(false);
        setIsModalOpen(false);
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
    // --- Computed: unique courses ---
    const availableCourses = Array.from(new Set(alumni.map((a) => a.student?.course).filter(Boolean) as string[]));

    const filteredAlumni = alumni.filter((a) => {
        const fullName = `${a.last_name} ${a.first_name} ${a.middle_name}`.toLowerCase();
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            a.alumni_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        isSaving,
        isDeleting,
        alumniToDelete,
        expandedRows,
        formData,

        // Handlers
        setIsModalOpen,
        setFormData,
        setFilterGender,
        setFilterCourse,
        setAlumniToDelete,
        handleSearch,
        openCreateModal,
        openEditModal,
        handleSave,
        handleDeleteClick,
        confirmDelete,
        toggleExpand,
    };
}
