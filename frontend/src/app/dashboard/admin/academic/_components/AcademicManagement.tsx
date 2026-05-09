"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, GraduationCap } from "lucide-react";
import DepartmentsTab from "./DepartmentsTab";
import CoursesTab from "./CoursesTab";

export default function AcademicManagement() {
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
                    <DepartmentsTab />
                </TabsContent>

                <TabsContent value="courses" className="mt-0 outline-none">
                    <CoursesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
