const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// const interviewReportSchema = z.object({
//   matchScore: z
//     .number()
//     .describe(
//       "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
//     ),
//   technicalQuestions: z
//     .array(
//       z.object({
//         question: z
//           .string()
//           .describe("The technical question can be asked in the interview"),
//         intention: z
//           .string()
//           .describe("The intention of interviewer behind asking this question"),
//         answer: z
//           .string()
//           .describe(
//             "How to answer this question, what points to cover, what approach to take etc.",
//           ),
//       }),
//     )
//     .describe(
//       "Technical questions that can be asked in the interview along with their intention and how to answer them",
//     ),
//   behavioralQuestions: z
//     .array(
//       z.object({
//         question: z
//           .string()
//           .describe(
//             "The behavioral question that can be asked in the interview",
//           ),
//         intention: z
//           .string()
//           .describe("The intention of interviewer behind asking this question"),
//         answer: z
//           .string()
//           .describe(
//             "How to answer this question, what points to cover, what approach to take etc.",
//           ),
//       }),
//     )
//     .describe(
//       "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
//     ),
//   skillGaps: z
//     .array(
//       z.object({
//         skill: z.string().describe("The skill which the candidate is lacking"),
//         severity: z
//           .enum(["low", "medium", "high"])
//           .describe(
//             "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
//           ),
//       }),
//     )
//     .describe(
//       "List of skill gaps in the candidate's profile along with their severity",
//     ),
//   preparationPlan: z
//     .array(
//       z.object({
//         day: z
//           .number()
//           .describe("The day number in the preparation plan, starting from 1"),
//         focus: z
//           .string()
//           .describe(
//             "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
//           ),
//         tasks: z
//           .array(z.string())
//           .describe(
//             "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
//           ),
//       }),
//     )
//     .describe(
//       "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
//     ),
// });

const geminiResponseSchema = {
  type: "object",
  properties: {
    matchScore: { type: "number" },
    technicalQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "number" },
          focus: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
        },
        required: ["day", "focus", "tasks"],
      },
    },
    title: {
      type: "string",
      description:
        "The title of the job for which the interview report is generated",
    },
  },
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
    "title",
  ],
};

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate an interview report for a candidate with the following details:
  Resume: ${resume}
  Self Description: ${selfDescription}
  Job Description: ${jobDescription}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema,
    },
  });
  return JSON.parse(response.text);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = {
    type: "object",
    properties: {
      html: {
        type: "string",
        description:
          "A complete HTML document for a professional ATS-friendly resume that can be rendered directly by Puppeteer.",
      },
    },
    required: ["html"],
  };

  const prompt = `Generate a professional, ATS-friendly resume tailored specifically to the provided job description.

Candidate Information

Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Requirements:

- Tailor the resume specifically for the given job description.
- Highlight the candidate's most relevant skills, technical expertise, projects, work experience, achievements, and education.
- Write naturally as if the resume was written by an experienced professional resume writer.
- The content must not sound AI-generated or contain generic filler.
- Keep the resume concise and impactful. The final PDF should ideally be 1–2 pages long.
- Focus on quality rather than quantity.
- Include only information that improves the candidate's chances of getting shortlisted.
- Make the resume ATS-friendly and easily parsable by Applicant Tracking Systems.
- Use clear section headings such as Summary, Technical Skills, Work Experience, Projects, Education, Certifications, and Achievements whenever appropriate.
- Quantify achievements wherever possible.
- Use action verbs and professional resume language.

HTML Requirements:

- Return a COMPLETE HTML document beginning with <!DOCTYPE html>.
- Include all CSS inside a single <style> tag.
- Do NOT use external CSS, JavaScript, images, fonts, CDN links, Bootstrap, Tailwind, or any external resources.
- The HTML must render correctly in Puppeteer without any modification.
- Use semantic HTML elements.
- Use a clean, modern, single-column professional layout.
- Use professional typography and subtle colors.
- Keep the design simple and ATS-friendly.
- Use consistent spacing and margins throughout the document.

PDF Layout Requirements:

- The HTML must be optimized for PDF generation using Puppeteer.
- Avoid any CSS that creates large blank spaces between sections.
- Do NOT use fixed heights or min-heights.
- Do NOT use page-break-inside: avoid.
- Do NOT use break-inside: avoid.
- Allow sections to split naturally across pages.
- Avoid excessive top or bottom margins.
- Use compact, professional spacing.
- Prevent unnecessary page breaks.
- Ensure no content is pushed to the next page leaving empty white space.
- The generated PDF should look like a professionally designed resume.

IMPORTANT:

Return ONLY a JSON object matching the provided response schema.

The JSON must contain exactly one field:

{
  "html": "<!DOCTYPE html>...</html>"
}

Do not return markdown.
Do not wrap the HTML inside html blocks.
Do not include explanations, comments, or additional text.
Return only the JSON object.
  `;
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: generateResumePdf,
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
