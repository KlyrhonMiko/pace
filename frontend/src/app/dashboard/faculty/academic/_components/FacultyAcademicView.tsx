"use client";

import { useDepartments } from "../../../_lib/hooks/useDepartments";
import { useCourses } from "../../../_lib/hooks/useCourses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Building2, 
    GraduationCap, 
    Search, 
    Users,
    Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getDepartments, CollegeDeptPublic } from "../../../_lib/academic";
import { AlumniListModal } from "./AlumniListModal";

export default function FacultyAcademicView() {
    const [selectedItem, setSelectedItem] = useState<{
        title: string;
        course_abbv?: string;
        college_dept_abbv?: string;
    } | null>(null);

    return (
        <div className="w-full">
            <Tabs defaultValue="departments" className="space-y-6">
                <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
                    <TabsList className="bg-transparent border-0 gap-1 h-11 p-0">
                        <TabsTrigger 
                            value="departments"
                            className="rounded-xl px-6 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-emerald-600/20 transition-all font-bold gap-2 text-gray-500"
                        >
                            <Building2 size={18} />
                            Departments
                        </TabsTrigger>
                        <TabsTrigger 
                            value="courses"
                            className="rounded-xl px-6 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg shadow-emerald-600/20 transition-all font-bold gap-2 text-gray-500"
                        >
                            <GraduationCap size={18} />
                            Courses
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="departments" className="mt-0 outline-none">
                    <FacultyDepartmentsTable onSelectDept={(title, abbv) => setSelectedItem({ title, college_dept_abbv: abbv })} />
                </TabsContent>

                <TabsContent value="courses" className="mt-0 outline-none">
                    <FacultyCoursesTable onSelectCourse={(title, abbv) => setSelectedItem({ title, course_abbv: abbv })} />
                </TabsContent>
            </Tabs>

            <AlumniListModal 
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem?.title || ""}
                course_abbv={selectedItem?.course_abbv}
                college_dept_abbv={selectedItem?.college_dept_abbv}
            />
        </div>
    );
}

function FacultyDepartmentsTable({ onSelectDept }: { onSelectDept: (title: string, abbv: string) => void }) {
    const {
        departments,
        total,
        isLoading,
        searchQuery,
        handleSearch,
        currentPage,
        setCurrentPage,
    } = useDepartments();

    // Custom pagination logic since hook returns partial data
    const totalP = Math.ceil(total / 10);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/30">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">University Departments</h3>
                        <p className="text-xs text-gray-500">View department overview and program reach.</p>
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search departments..." 
                        className="pl-10 h-10 bg-white border-gray-200 rounded-xl focus:border-emerald-600 focus:ring-emerald-600/10 transition-all"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 bg-gray-50/50 border-b border-gray-100 uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Abbr</th>
                            <th className="px-6 py-4">Department Name</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-center">Alumni Reach</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-8">
                                        <div className="h-4 bg-gray-100 rounded w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : departments.filter(d => !d.is_deleted).length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                                    <Building2 size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No departments found</p>
                                </td>
                            </tr>
                        ) : (
                            departments.filter(d => !d.is_deleted).map((dept) => (
                                <tr 
                                    key={dept.college_dept_id} 
                                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group/row"
                                    onClick={() => onSelectDept(dept.college_dept_name, dept.college_dept_abbv)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                            {dept.college_dept_abbv}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{dept.college_dept_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs italic">
                                        {dept.college_dept_desc || "No description provided."}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 group-hover/row:bg-blue-600 group-hover/row:text-white group-hover/row:border-blue-600 transition-all">
                                                <Users size={14} />
                                                {dept.alumni_count} alumni
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-xs text-gray-500 font-medium">
                    Showing {departments.length} departments
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 0 || isLoading}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="h-8 rounded-lg text-xs font-bold"
                    >
                        Previous
                    </Button>
                    <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                        {currentPage + 1} / {totalP || 1}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage >= totalP - 1 || isLoading}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="h-8 rounded-lg text-xs font-bold"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

function FacultyCoursesTable({ onSelectCourse }: { onSelectCourse: (title: string, abbv: string) => void }) {
    const {
        courses,
        total,
        isLoading,
        searchQuery,
        handleSearch,
        filterDept,
        setFilterDept,
        currentPage,
        setCurrentPage,
    } = useCourses();

    const [departments, setDepartments] = useState<CollegeDeptPublic[]>([]);

    useEffect(() => {
        getDepartments({ limit: 0 }).then(res => {
            if (res.success) setDepartments(res.data.college_depts.filter((d: CollegeDeptPublic) => !d.is_deleted));
        });
    }, []);

    const totalP = Math.ceil(total / 10);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Academic Programs</h3>
                        <p className="text-xs text-gray-500">Degree programs and alumni statistics.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <select 
                            className="w-full h-10 bg-white border border-gray-200 rounded-xl pl-9 pr-4 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all appearance-none"
                            value={filterDept}
                            onChange={(e) => {
                                setFilterDept(e.target.value);
                                setCurrentPage(0);
                            }}
                        >
                            <option value="all">All Depts</option>
                            {departments.map(d => (
                                <option key={d.college_dept_id} value={d.college_dept_abbv}>
                                    {d.college_dept_abbv}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search courses..." 
                            className="pl-10 h-10 bg-white border-gray-200 rounded-xl focus:border-blue-600 focus:ring-blue-600/10 transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[11px] text-gray-500 bg-gray-50/50 border-b border-gray-100 uppercase tracking-wider font-bold">
                        <tr>
                            <th className="px-6 py-4">Abbr</th>
                            <th className="px-6 py-4">Course Name</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4 text-center">Active Alumni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={4} className="px-6 py-8">
                                        <div className="h-4 bg-gray-100 rounded w-full" />
                                    </td>
                                </tr>
                            ))
                        ) : courses.filter(c => !c.is_deleted).length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                                    <GraduationCap size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium">No courses found</p>
                                </td>
                            </tr>
                        ) : (
                            courses.filter(c => !c.is_deleted).map((course) => (
                                <tr 
                                    key={course.course_id} 
                                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group/row"
                                    onClick={() => onSelectCourse(course.course_name, course.course_abbv)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                            {course.course_abbv}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{course.course_name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-gray-400" />
                                            <span className="text-xs font-bold text-gray-500">{course.college_dept_abbv}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 group-hover/row:bg-emerald-600 group-hover/row:text-white group-hover/row:border-emerald-600 transition-all">
                                                <Users size={14} />
                                                {course.alumni_count} graduates
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-xs text-gray-500 font-medium">
                    Showing {courses.length} courses
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 0 || isLoading}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="h-8 rounded-lg text-xs font-bold"
                    >
                        Previous
                    </Button>
                    <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                        {currentPage + 1} / {totalP || 1}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage >= totalP - 1 || isLoading}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="h-8 rounded-lg text-xs font-bold"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
