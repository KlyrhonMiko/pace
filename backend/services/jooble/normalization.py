import re

def _parse_salary_numbers(salary_str: str) -> list[float]:
    """Extracts all numbers from salary string, handling 'k' suffixes."""
    matches = re.finditer(r'(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kK])?', salary_str)
    values = []
    for m in matches:
        num_str = m.group(1).replace(',', '')
        try:
            val = float(num_str)
            if m.group(2): # has 'k' suffix
                val *= 1000
            values.append(val)
        except ValueError:
            pass
    return values


def _normalize_job_dict(job: dict) -> dict:
    """Cleans and sets defaults for raw Jooble API job data."""
    # 1. Clean HTML from Snippet
    snippet = job.get("snippet", "")
    location = job.get("location", "Philippines")
    
    # Remove partial HTML entities and tags
    clean_snippet = re.sub(r'<[^>]+>', '', snippet) # Remove tags
    clean_snippet = clean_snippet.replace("&nbsp;", " ").replace("\r\n", " ").strip()
    
    # 2. Normalize Job Type
    j_type = job.get("type", "").strip() or "Full-time"
    
    # Try to infer more specific types from title and snippet if type is generic
    title_lower = job.get("title", "").lower()
    snippet_lower = clean_snippet.lower()
    combined_text = f"{title_lower} {snippet_lower}"
    
    # Prioritize: Internship > Contract > Part-time > Temporary > Full-time
    if re.search(r'\bintern(ship|s)?\b', combined_text):
         j_type = "Internship"
    elif re.search(r'\bcontract(ual)?\b', combined_text) or re.search(r'\bfreelance\b', combined_text):
         j_type = "Contract"
    elif re.search(r'\bpart[\s-]?time\b', combined_text):
         j_type = "Part-time"
    elif re.search(r'\btemporary\b', combined_text) or re.search(r'\btemp\b', combined_text):
         j_type = "Temporary"
         j_type = "Temporary"
    
    
    # 3. Default Salary
    salary = job.get("salary", "").strip()

    if not salary:
        salary = "Negotiable"
    else:
        title_lower = job.get("title", "").lower()
        check_text = (salary + " " + job.get("title", "") + " " + clean_snippet).lower()
        is_usd = "usd" in check_text or "us$" in check_text or "dollar" in check_text
        
        # Check for Remote/Work from home indicators
        is_remote = "remote" in title_lower or "wfh" in title_lower or "work from home" in title_lower or "virtual" in title_lower
        
        should_convert_to_peso = False
        
        # Only convert if in Philippines, NOT explicit USD, and NOT Remote (Remote usually implies USD/Foreign client)
        if "Philippines" in location and not is_usd and not is_remote and "$" in salary:
             # Heuristic Analysis
            values = _parse_salary_numbers(salary)
            if values:
                avg_val = sum(values) / len(values)
                
                # Period Detection
                salary_lower = salary.lower()
                is_hourly = "hour" in salary_lower or "hr" in salary_lower
                is_daily = "day" in salary_lower or "daily" in salary_lower
                is_yearly = "year" in salary_lower or "annum" in salary_lower
                
                if is_hourly:
                    if avg_val < 50: 
                        should_convert_to_peso = False 
                    else:
                        should_convert_to_peso = True # e.g. 150/hr -> Peso
                
                elif is_daily:
                    if avg_val > 200:
                        should_convert_to_peso = True
                    else:
                        should_convert_to_peso = False # $50/day -> Likely USD
                
                elif is_yearly:
                    should_convert_to_peso = False
                    
                else: # Monthly (Default)
                    if avg_val < 10000:
                         should_convert_to_peso = False # Likely USD
                    else:
                         should_convert_to_peso = True # Likely PHP
            else:
                 should_convert_to_peso = True

        if should_convert_to_peso:
            salary = salary.replace("$", "₱")

    # 4. Infer Work Type
    work_type = "On-site" # Default
    if "remote" in title_lower or "remote" in location.lower() or "wfh" in title_lower or "work from home" in title_lower or "home based" in title_lower or "virtual" in title_lower:
        work_type = "Remote"
    elif "hybrid" in title_lower or "hybrid" in location.lower():
        work_type = "Hybrid"
    
    # 5. Infer Experience Level
    experience_level = "Mid-Level" # Default
    
    if "intern" in title_lower or "ojt" in title_lower or "trainee" in title_lower:
        experience_level = "Internship"
    elif "senior" in title_lower or "sr." in title_lower or "principal" in title_lower or "manager" in title_lower or "head" in title_lower:
         experience_level = "Senior"
    elif "lead" in title_lower or "chief" in title_lower or "director" in title_lower: # Lead specific if we want to distinguish
         experience_level = "Lead" # Or map to Senior if strictly following enum? The Enum has LEAD.
    elif "junior" in title_lower or "jr." in title_lower or "entry" in title_lower or "fresh" in title_lower or "associate" in title_lower:
        experience_level = "Entry Level"
        
    return {
        "id": str(job.get("id", "")),
        "title": job.get("title", "").strip(),
        "company": job.get("company", "Unknown Company").strip(),
        "location": job.get("location", "Philippines").strip(),
        "salary": salary,
        "type": j_type,
        "work_type": work_type,
        "experience_level": experience_level,
        "snippet": clean_snippet,
        "link": job.get("link", ""),
        "source": job.get("source", ""),
        "updated": job.get("updated", ""),
    }
