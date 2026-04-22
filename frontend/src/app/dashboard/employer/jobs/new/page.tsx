import Link from "next/link";
import { ArrowLeft, Save, Send } from "lucide-react";

export default function PostJobPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Link
                    href="/dashboard/employer/jobs"
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Post a New Job</h2>
                    <p className="text-sm text-slate-500">
                        Create a new job posting for candidates to apply to.
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl">
                <form className="p-6 md:p-8 space-y-8">

                    <div className="space-y-6 border-b border-slate-200 pb-8">
                        <h3 className="text-lg font-semibold leading-6 text-slate-900 border-l-4 border-blue-600 pl-3">
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="title" className="block text-sm font-medium leading-6 text-slate-900">
                                    Job Title
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        placeholder="e.g. Senior Frontend Developer"
                                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="employment-type" className="block text-sm font-medium leading-6 text-slate-900">
                                    Employment Type
                                </label>
                                <div className="mt-2">
                                    <select
                                        id="employment-type"
                                        name="employment-type"
                                        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    >
                                        <option>Full-time</option>
                                        <option>Part-time</option>
                                        <option>Contract</option>
                                        <option>Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="location" className="block text-sm font-medium leading-6 text-slate-900">
                                    Location (or Remote)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="location"
                                        id="location"
                                        placeholder="e.g. New York, NY or Remote"
                                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 border-b border-slate-200 pb-8">
                        <h3 className="text-lg font-semibold leading-6 text-slate-900 border-l-4 border-blue-600 pl-3">
                            Job Details
                        </h3>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-slate-900">
                                Job Description
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="Describe the role, responsibilities, and expected impact..."
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="requirements" className="block text-sm font-medium leading-6 text-slate-900">
                                Requirements
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="requirements"
                                    name="requirements"
                                    rows={4}
                                    className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                    placeholder="List the necessary qualifications, skills, and experience..."
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="salary" className="block text-sm font-medium leading-6 text-slate-900">
                                Salary Range (Optional)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="salary"
                                    id="salary"
                                    placeholder="e.g. $80k - $120k / year"
                                    className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-x-4">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-slate-900 hover:text-blue-600 transition-colors"
                        >
                            <Save size={16} />
                            Save as Draft
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                        >
                            <Send size={16} />
                            Publish Job
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
