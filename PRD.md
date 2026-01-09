### **Product Requirements Document (PRD)**

**Project Name:** CV-Optima (ATS Resume Analyzer & Adaptor)

**Version:** 1.0

**Status:** Draft

**Date:** January 9, 2026

---

## **1. Executive Summary**

**CV-Optima** is a web application designed to help job seekers optimize their resumes for Applicant Tracking Systems (ATS). By leveraging **Next.js** for a reactive frontend and **Supabase** for a robust backend, the app allows users to upload their CVs and compare them against specific job descriptions (JDs). The core value proposition is the "Analysis & Adaptation" engine, which uses AI to simulate ATS scoring and generate tailored content to increase interview chances.

---

## **2. Target Audience & Personas**

* **Primary:** Active Job Seekers (Junior to Mid-level) who apply to many listings online and get few responses.
* **Secondary:** Career Switchers needing to rephrase their transferable skills to match new industry keywords.
* **Persona "Alex":** A marketing manager applying to 10+ jobs a week. He is frustrated by "ghosting" and suspects his resume isn't passing the automated filters. He needs a quick way to tweak his resume for every single application.

---

## **3. Functional Requirements**

### **3.1 Authentication & User Management**

* **Sign Up/Login:** Users must be able to create accounts using Email/Password or Social Login (Google/GitHub).
* **Profile Management:** Users can update their basic details and subscription status (Free vs. Pro).
* **Session Management:** Secure session handling via Supabase Auth.

### **3.2 Resume Management (The "Vault")**

* **Upload:** Support for PDF and DOCX formats.
* **Parsing:** Extract text from the uploaded document (utilizing OCR or PDF text extraction).
* **Versioning:** Users can store multiple versions of their resume (e.g., "Alex_Marketing_v1", "Alex_Product_v2").

### **3.3 Job Analysis Engine**

* **Job Description Input:** A text area or URL scraper to input the target Job Description.
* **ATS Simulation:**
* **Keyword Matching:** Identify missing hard/soft skills found in the JD but missing in the CV.
* **Formatting Check:** Flag tables, columns, or images that might break older ATS parsers.
* **Scoring:** Generate a "Match Score" (0-100%) based on relevance.



### **3.4 CV Adaptation (The "Writer")**

* **Gap Filling:** AI suggestions to rewrite bullet points to include missing keywords naturally.
* **Summary Generator:** Auto-generate a Professional Summary tailored specifically to the inserted JD.
* **Export:** Ability to export the optimized text or generate a new PDF (MVP can be text export).

---

## **4. Technical Architecture**

### **4.1 Tech Stack**

| Component | Technology | Reasoning |
| --- | --- | --- |
| **Frontend** | **Next.js 14+ (App Router)** | SEO optimized, server components for performance. |
| **Styling** | **Tailwind CSS + shadcn/ui** | Rapid UI development with accessible components. |
| **Backend / DB** | **Supabase** | Managed PostgreSQL, Auth, and Realtime capabilities. |
| **Storage** | **Supabase Storage** | Secure hosting for user PDF uploads. |
| **AI / Logic** | **OpenAI API (GPT-4o)** | To parse resumes, compare with JDs, and generate rewritten content. |
| **PDF Parsing** | **pdf-parse** (Node) | Lightweight library to extract raw text from PDFs server-side. |

### **4.2 Database Schema (Supabase PostgreSQL)**

* **`users`** (Managed by Supabase Auth)
* `id` (UUID), `email`, `created_at`


* **`profiles`**
* `id` (FK to users), `full_name`, `credits` (for monetization limits)


* **`resumes`**
* `id`, `user_id` (FK), `file_url`, `raw_text` (extracted text), `title`, `created_at`


* **`analyses`**
* `id`, `resume_id` (FK), `job_description_text`, `match_score`, `missing_keywords` (JSONB), `suggestions` (JSONB)



---

## **5. User Flow**

1. **Onboarding:** User lands on homepage  Authenticates via Supabase Auth.
2. **Upload:** User navigates to Dashboard  Uploads PDF Resume  App parses text and saves to DB.
3. **Targeting:** User clicks "New Scan"  Selects an uploaded Resume  Pastes a Job Description.
4. **Analysis:** App sends both texts to LLM  Returns Score, Missing Keywords, and Formatting Issues.
5. **Adaptation:** User clicks "Fix This" on a low-scoring section  App generates optimized bullet points  User saves/exports.

---

## **6. API Logic (Next.js Server Actions)**

To ensure security and keep API keys hidden, all AI interaction will happen server-side.

**Endpoint:** `POST /api/analyze`

* **Input:** `resume_text`, `job_description`
* **Process:**
1. Construct prompt: *"Act as an ATS. Compare Resume A against Job Description B. Return JSON with match_score, list of missing_keywords, and 3 actionable improvements."*
2. Call OpenAI API.
3. Store result in `analyses` table.


* **Output:** JSON object with analysis results.

---

## **7. Non-Functional Requirements**

* **Performance:** Resume parsing and analysis should take < 10 seconds.
* **Privacy:** User data (Resumes) must be protected by Row Level Security (RLS) policies in Supabase. No one can access a resume except the owner.
* **Scalability:** Usage of Supabase Edge Functions for the analysis logic to prevent timeouts on Vercel's standard serverless limit (10s) if parsing heavy PDFs.

---

## **8. Roadmap**

### **Phase 1: MVP (Weeks 1-3)**

* User Auth & DB setup.
* Text extraction from PDF.
* Basic OpenAI integration for "Match Score" and "Keyword Gap".
* Simple UI to display results.

### **Phase 2: The "Adaptor" (Weeks 4-6)**

* "One-click" rewrite for bullet points.
* History of past scans.
* Credit system (e.g., 5 free scans, then pay).

### **Phase 3: Advanced Features (Weeks 7+)**

* Chrome Extension to grab JDs directly from LinkedIn/Indeed.
* PDF Regeneration (re-creating the PDF file with the new text).

---

### **9. Wireframe / Diagram**

### **Next Step**

Would you like me to generate the **SQL code for your Supabase tables** (with RLS policies) or the **Next.js API route code** to handle the OpenAI interaction first?

[Build an AI Resume Parser using Next.js and OpenAI](https://www.google.com/search?q=https://www.youtube.com/watch%3Fv%3DAKeXp611K4M)

*I chose this video because it provides a practical implementation of the core feature—using OpenAI to parse and analyze resumes within a Next.js environment, which is the most complex part of your requested stack.*