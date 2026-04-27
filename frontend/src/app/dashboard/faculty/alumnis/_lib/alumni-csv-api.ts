import { apiFetch } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CsvAlumniRow {
  email: string;
  student_id: string;
  year_graduated: number;
  gwa: number;
  avg_prof_grade: number;
  avg_elec_grade: number;
  ojt_grade: number;
  leadership_pos: boolean;
  act_member_pos: boolean;
  course_abbv: string;
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  age: number;
  gender: string;
  birthdate: string; // YYYY-MM-DD
}

export interface CsvRowResult {
  row: number;
  success: boolean;
  code: string;
  message: string;
  email?: string | null;
  alumni_id?: string | null;
  username?: string | null;
}

export interface CsvImportResponse {
  total: number;
  successful: number;
  failed: number;
  results: CsvRowResult[];
}

// ─── CSV Template ─────────────────────────────────────────────────────────────

export const CSV_HEADERS = [
  "email",
  "student_id",
  "year_graduated",
  "gwa",
  "avg_prof_grade",
  "avg_elec_grade",
  "ojt_grade",
  "leadership_pos",
  "act_member_pos",
  "course_abbv",
  "last_name",
  "first_name",
  "middle_name",
  "age",
  "gender",
  "birthdate",
] as const;

export function downloadCsvTemplate(): void {
  const sampleRow = [
    "juan.delacruz@email.com",
    "2020-00112",
    "2024",
    "1.50",
    "1.45",
    "1.55",
    "95.0",
    "true",
    "false",
    "BSIT",
    "Dela Cruz",
    "Juan",
    "Santos",
    "22",
    "MALE",
    "2002-04-15",
  ].join(",");

  const csvContent = [CSV_HEADERS.join(","), sampleRow].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "alumni_import_template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Parsing ──────────────────────────────────────────────────────────────

export interface ParsedRow {
  rowNum: number;
  data: CsvAlumniRow | null;
  errors: string[];
}

function parseBool(val: string): { value: boolean | null; error?: string } {
  const v = val.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return { value: true };
  if (v === "false" || v === "0" || v === "no") return { value: false };
  return { value: null, error: `Expected true/false, got '${val}'` };
}

function parseFloat2(val: string, field: string): { value: number | null; error?: string } {
  const n = parseFloat(val.trim());
  if (isNaN(n)) return { value: null, error: `'${field}' must be a number, got '${val}'` };
  return { value: n };
}

function parseInt2(val: string, field: string): { value: number | null; error?: string } {
  const n = parseInt(val.trim(), 10);
  if (isNaN(n)) return { value: null, error: `'${field}' must be an integer, got '${val}'` };
  return { value: n };
}

export function parseCsvText(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const getIdx = (name: string) => header.indexOf(name);

  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i; // 1-indexed relative to data rows
    const raw = lines[i];
    if (!raw.trim()) continue;

    // Naive split — does not handle quoted commas; acceptable for this use case
    const cols = raw.split(",");
    const get = (field: string) => {
      const idx = getIdx(field);
      return idx >= 0 ? (cols[idx] ?? "").trim() : "";
    };

    const errors: string[] = [];

    // Required string fields
    const email = get("email");
    const student_id = get("student_id");
    const course_abbv = get("course_abbv");
    const last_name = get("last_name");
    const first_name = get("first_name");
    const gender = get("gender").toUpperCase();
    const birthdate = get("birthdate");

    if (!email) errors.push("email is required");
    if (!student_id) errors.push("student_id is required");
    if (!course_abbv) errors.push("course_abbv is required");
    if (!last_name) errors.push("last_name is required");
    if (!first_name) errors.push("first_name is required");
    if (!gender) errors.push("gender is required");
    if (!birthdate) errors.push("birthdate is required");

    const yearRes = parseInt2(get("year_graduated"), "year_graduated");
    if (yearRes.error) errors.push(yearRes.error);

    const gwaRes = parseFloat2(get("gwa"), "gwa");
    if (gwaRes.error) errors.push(gwaRes.error);

    const profRes = parseFloat2(get("avg_prof_grade"), "avg_prof_grade");
    if (profRes.error) errors.push(profRes.error);

    const elecRes = parseFloat2(get("avg_elec_grade"), "avg_elec_grade");
    if (elecRes.error) errors.push(elecRes.error);

    const ojtRes = parseFloat2(get("ojt_grade"), "ojt_grade");
    if (ojtRes.error) errors.push(ojtRes.error);

    const leaderRes = parseBool(get("leadership_pos"));
    if (leaderRes.error || leaderRes.value === null)
      errors.push(leaderRes.error ?? "leadership_pos is required");

    const memberRes = parseBool(get("act_member_pos"));
    if (memberRes.error || memberRes.value === null)
      errors.push(memberRes.error ?? "act_member_pos is required");

    const ageRes = parseInt2(get("age"), "age");
    if (ageRes.error) errors.push(ageRes.error);

    const middle_name = get("middle_name") || null;

    if (errors.length > 0) {
      results.push({ rowNum, data: null, errors });
    } else {
      results.push({
        rowNum,
        errors: [],
        data: {
          email,
          student_id,
          year_graduated: yearRes.value!,
          gwa: gwaRes.value!,
          avg_prof_grade: profRes.value!,
          avg_elec_grade: elecRes.value!,
          ojt_grade: ojtRes.value!,
          leadership_pos: leaderRes.value!,
          act_member_pos: memberRes.value!,
          course_abbv,
          last_name,
          first_name,
          middle_name,
          age: ageRes.value!,
          gender,
          birthdate,
        },
      });
    }
  }

  return results;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function importAlumniCsv(rows: CsvAlumniRow[]): Promise<CsvImportResponse> {
  const result = await apiFetch<{ data: CsvImportResponse }>("/alumni/csv-import", {
    method: "POST",
    body: { rows },
  });
  return (result as unknown as { data: CsvImportResponse }).data;
}
