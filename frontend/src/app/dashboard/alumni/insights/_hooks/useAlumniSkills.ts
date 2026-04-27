"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { resolveProgramSkillsForCourse } from "@/lib/program-skills";
import {
    AlumniSkillsRecord,
    getMySkills,
    createMySkills,
    updateMySkills,
} from "../../_lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DraftSkills {
    soft_skills_ave: number;
    hard_skills_ave: number;
    program_skill_values: Record<string, number>;
}

function buildDefaultDraft(
    course: string,
    existing: AlumniSkillsRecord | null
): DraftSkills {
    const skillKeys = resolveProgramSkillsForCourse(course);
    const baseValues: Record<string, number> = {};
    for (const key of skillKeys) {
        baseValues[key] = existing?.program_skills?.[key] ?? 70;
    }
    return {
        soft_skills_ave: existing?.soft_skills_ave ?? 70,
        hard_skills_ave: existing?.hard_skills_ave ?? 70,
        program_skill_values: baseValues,
    };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAlumniSkills(alumniId: string, course: string) {
    const [skills, setSkills] = useState<AlumniSkillsRecord | null>(null);
    const [hasRecord, setHasRecord] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draft, setDraft] = useState<DraftSkills>(() =>
        buildDefaultDraft(course, null)
    );

    const programSkills = resolveProgramSkillsForCourse(course);

    // ── Fetch on mount ──────────────────────────────────────────────────────────
    const loadSkills = useCallback(async () => {
        if (!alumniId) return;
        setIsLoading(true);
        const record = await getMySkills(alumniId);
        setSkills(record);
        setHasRecord(record !== null);
        if (record) {
            setDraft(buildDefaultDraft(course, record));
        }
        setIsLoading(false);
    }, [alumniId, course]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadSkills();
    }, [loadSkills]);

    // ── Editing helpers ────────────────────────────────────────────────────────
    const startEditing = useCallback(() => {
        setDraft(buildDefaultDraft(course, skills));
        setIsEditing(true);
    }, [course, skills]);

    const cancelEditing = useCallback(() => {
        setDraft(buildDefaultDraft(course, skills));
        setIsEditing(false);
    }, [course, skills]);

    const setSoftSkillsAve = useCallback((value: number) => {
        setDraft((prev) => ({ ...prev, soft_skills_ave: value }));
    }, []);

    const setHardSkillsAve = useCallback((value: number) => {
        setDraft((prev) => ({ ...prev, hard_skills_ave: value }));
    }, []);

    const setSkillScore = useCallback((skillName: string, value: number) => {
        const clamped = Math.max(0, Math.min(100, Math.trunc(value)));
        setDraft((prev) => ({
            ...prev,
            program_skill_values: {
                ...prev.program_skill_values,
                [skillName]: clamped,
            },
        }));
    }, []);

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!alumniId) return;
        setIsSaving(true);

        const payload = {
            soft_skills_ave: draft.soft_skills_ave,
            hard_skills_ave: draft.hard_skills_ave,
            program_skills: draft.program_skill_values,
        };

        let savedOk = false;
        if (hasRecord) {
            savedOk = await updateMySkills(alumniId, payload);
        } else {
            savedOk = await createMySkills(alumniId, payload);
        }

        if (!savedOk) {
            toast.error("Failed to save skills. Please try again.");
            setIsSaving(false);
            return;
        }

        // Reload the persisted record to pick up computed fields (program_skills_average etc.)
        const updated = await getMySkills(alumniId);
        setSkills(updated);
        setHasRecord(true);
        setIsEditing(false);

        // Auto-run both predictions immediately after saving skills
        try {
            // Run in parallel
            await Promise.all([
                apiFetch(`/predict/employability/${alumniId}`, { method: "POST" }),
                apiFetch(`/predict/regression/${alumniId}`, { method: "POST" }),
            ]);
            toast.success("Skills saved and all predictions updated!");
        } catch {
            // Prediction failure is non-fatal — skills are still persisted
            toast.success("Skills saved! Some predictions could not be refreshed right now.");
        }

        setIsSaving(false);
    }, [alumniId, draft, hasRecord]);

    return {
        // Data
        skills,
        hasRecord,
        isLoading,
        programSkills,

        // Edit state
        isEditing,
        isSaving,
        draft,

        // Handlers
        startEditing,
        cancelEditing,
        setSoftSkillsAve,
        setHardSkillsAve,
        setSkillScore,
        handleSave,
    };
}
