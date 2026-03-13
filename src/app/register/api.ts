import { apiFetch } from "@/lib/api-client";

export interface CourseOption {
  course_abbv: string;
  course_name: string;
}

export async function fetchCourses() {
  const result = await apiFetch<any>("/courses/?limit=0");
  if (result.success && result.data?.courses) {
    return result.data.courses.map((c: CourseOption) => ({
      course_abbv: c.course_abbv,
      course_name: c.course_name,
    }));
  }
  return [];
}

export async function sendOtp(email: string) {
  return apiFetch<any>("/otp/send", {
    method: "POST",
    body: { email },
  });
}

export async function resendOtp(email: string) {
  return apiFetch<any>("/otp/resend", {
    method: "POST",
    body: { email },
  });
}

export async function verifyOtp(email: string, code: string) {
  return apiFetch<any>("/otp/verify", {
    method: "POST",
    body: { email, otp_code: code },
  });
}

export async function registerAlumni(data: any) {
  return apiFetch<any>("/alumni/register", {
    method: "POST",
    body: data,
  });
}

export async function createStudentRecord(data: any) {
  return apiFetch<any>("/student-records", {
    method: "POST",
    body: data,
  });
}

export async function initializeAlumniSkills(alumniId: string) {
  try {
    return await apiFetch<any>("/alumni-skills", {
      method: "POST",
      body: {
        alumni_id: alumniId,
        soft_skills_ave: null,
        hard_skills_ave: null,
        program_skills: null,
      },
    });
  } catch (error) {
    console.warn("Alumni skills initialization skipped", error);
    throw error;
  }
}
