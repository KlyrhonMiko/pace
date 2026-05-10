import { apiFetch } from "@/lib/api-client";

// --- Types ---

export interface PaginationMetadata {
    total: number;
    limit: number;
    offset: number;
    returned: number;
    has_next: boolean;
}

export interface StandardResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T[];
    pagination: PaginationMetadata;
}

export interface CollegeDeptPublic {
    college_dept_id: string;
    college_dept_abbv: string;
    college_dept_name: string;
    college_dept_desc: string | null;
    alumni_count: number;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface CollegeDeptCreate {
    college_dept_abbv: string;
    college_dept_name: string;
    college_dept_desc?: string | null;
}

export interface CollegeDeptUpdate {
    college_dept_abbv?: string;
    college_dept_name?: string;
    college_dept_desc?: string | null;
}

export interface CoursePublic {
    course_id: string;
    course_abbv: string;
    course_name: string;
    course_desc: string | null;
    college_dept_id: string;
    college_dept_abbv: string;
    college_dept_name: string;
    alumni_count: number;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface CourseCreate {
    course_abbv: string;
    course_name: string;
    course_desc?: string | null;
    college_dept_abbv: string;
}

export interface CourseUpdate {
    course_abbv?: string;
    course_name?: string;
    course_desc?: string | null;
    college_dept_abbv?: string;
}

export interface AlumniFullProfile {
    id: string;
    alumni_id: string;
    last_name: string;
    first_name: string;
    middle_name: string | null;
    gender: string;
    age: number;
    birthdate: string | null;
    email: string;
    year_graduated: number | null;
    course_name: string | null;
    profile_completeness: number;
}

// --- API Functions ---

// Departments
export async function getDepartments(params: {
    limit?: number;
    offset?: number;
    search?: string;
    include_deleted?: boolean;
    sort_by?: string;
    sort_order?: string;
} = {}): Promise<StandardResponse<{ college_depts: CollegeDeptPublic[]; pagination: PaginationMetadata }>> {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.include_deleted) searchParams.set("include_deleted", "true");
    if (params.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params.sort_order) searchParams.set("sort_order", params.sort_order);

    return apiFetch<StandardResponse<{ college_depts: CollegeDeptPublic[]; pagination: PaginationMetadata }>>(`/college-depts?${searchParams.toString()}`);
}

export async function createDepartment(data: CollegeDeptCreate): Promise<StandardResponse<CollegeDeptPublic>> {
    return apiFetch<StandardResponse<CollegeDeptPublic>>("/college-depts", {
        method: "POST",
        body: data,
    });
}

export async function updateDepartment(id: string, data: CollegeDeptUpdate): Promise<StandardResponse<CollegeDeptPublic>> {
    return apiFetch<StandardResponse<CollegeDeptPublic>>(`/college-depts/${id}`, {
        method: "PATCH",
        body: data,
    });
}

export async function deleteDepartment(id: string): Promise<StandardResponse<void>> {
    return apiFetch<StandardResponse<void>>(`/college-depts/${id}`, {
        method: "DELETE",
    });
}

export async function restoreDepartment(id: string): Promise<StandardResponse<void>> {
    return apiFetch<StandardResponse<void>>(`/college-depts/${id}/restore`, {
        method: "POST",
    });
}

export async function batchCreateDepartments(items: CollegeDeptCreate[]): Promise<StandardResponse<any>> {
    return apiFetch<StandardResponse<any>>("/college-depts/batch", {
        method: "POST",
        body: { items },
    });
}

export async function batchDeleteDepartments(ids: string[]): Promise<StandardResponse<any>> {
    return apiFetch<StandardResponse<any>>("/college-depts/batch", {
        method: "DELETE",
        body: { ids },
    });
}

export async function batchRestoreDepartments(ids: string[]): Promise<StandardResponse<any>> {
    return apiFetch<StandardResponse<any>>("/college-depts/batch/restore", {
        method: "POST",
        body: { ids },
    });
}

// Courses
export async function getCourses(params: {
    limit?: number;
    offset?: number;
    search?: string;
    college_dept_abbv?: string;
    include_deleted?: boolean;
    sort_by?: string;
    sort_order?: string;
} = {}): Promise<StandardResponse<{ courses: CoursePublic[]; pagination: PaginationMetadata }>> {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
    if (params.search) searchParams.set("search", params.search);
    if (params.college_dept_abbv) searchParams.set("college_dept_abbv", params.college_dept_abbv);
    if (params.include_deleted) searchParams.set("include_deleted", "true");
    if (params.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params.sort_order) searchParams.set("sort_order", params.sort_order);

    return apiFetch<StandardResponse<{ courses: CoursePublic[]; pagination: PaginationMetadata }>>(`/courses?${searchParams.toString()}`);
}

export async function createCourse(data: CourseCreate): Promise<StandardResponse<CoursePublic>> {
    return apiFetch<StandardResponse<CoursePublic>>("/courses", {
        method: "POST",
        body: data,
    });
}

export async function updateCourse(id: string, data: CourseUpdate): Promise<StandardResponse<CoursePublic>> {
    return apiFetch<StandardResponse<CoursePublic>>(`/courses/${id}`, {
        method: "PATCH",
        body: data,
    });
}

export async function deleteCourse(id: string): Promise<StandardResponse<void>> {
    return apiFetch<StandardResponse<void>>(`/courses/${id}`, {
        method: "DELETE",
    });
}

export async function restoreCourse(id: string): Promise<StandardResponse<void>> {
    return apiFetch<StandardResponse<void>>(`/courses/${id}/restore`, {
        method: "POST",
    });
}

export async function batchCreateCourses(items: CourseCreate[]): Promise<StandardResponse<any>> {
    return apiFetch<StandardResponse<any>>("/courses/batch", {
        method: "POST",
        body: { items },
    });
}

export async function batchDeleteCourses(ids: string[]): Promise<StandardResponse<any>> {
    return apiFetch<StandardResponse<any>>("/courses/batch", {
        method: "DELETE",
        body: { ids },
    });
}

export async function batchRestoreCourses(ids: string[]): Promise<StandardResponse<any>> {
    return apiFetch<StandardResponse<any>>("/courses/batch/restore", {
        method: "POST",
        body: { ids },
    });
}

// Alumni List by Academic Structure
export async function getAlumniByAcademic(params: {
    course_abbv?: string;
    college_dept_abbv?: string;
    limit?: number;
    offset?: number;
}): Promise<StandardResponse<{ alumni: AlumniFullProfile[]; pagination: PaginationMetadata }>> {
    const searchParams = new URLSearchParams();
    if (params.course_abbv) searchParams.set("course_abbv", params.course_abbv);
    if (params.college_dept_abbv) searchParams.set("college_dept_abbv", params.college_dept_abbv);
    if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());

    return apiFetch<StandardResponse<{ alumni: AlumniFullProfile[]; pagination: PaginationMetadata }>>(`/alumni?${searchParams.toString()}`);
}
