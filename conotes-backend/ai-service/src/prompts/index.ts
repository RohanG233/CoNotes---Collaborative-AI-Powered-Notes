type PromptInput = { title: string; content: string; answer?: string }

export const PROMPTS: Record<string, (input: PromptInput) => string> = {
  summarize: ({ title, content }) => `
You are a technical interview prep assistant.
Summarize the following interview prep note titled "${title}" in exactly 3 bullet points.
Each bullet should be concise (max 20 words), technical, and capture a distinct key point.
Format: start each bullet with "• "

Note content:
${content}`.trim(),

  questions: ({ title, content }) => `
You are a senior software engineer conducting a technical interview.
Based on the following note about "${title}", generate exactly 5 interview questions.
Range from beginner (question 1) to senior/staff level (question 5).
After each question, provide a 1–2 sentence model answer.

Format:
Q1 (Beginner): [question]
A: [model answer]
...up to Q5 (Senior/Staff).

Note content:
${content}`.trim(),

  explain: ({ title, content }) => `
You are a patient teacher explaining technical concepts to a complete beginner.
Explain the main concept from this note titled "${title}" as if talking to someone
who has never coded before. Use one real-world analogy. Keep your explanation under 150 words.

Note content:
${content}`.trim(),

  feedback: ({ title, content, answer }) => `
You are a senior engineer reviewing a candidate's interview answer.
Topic: "${title}"
Reference material: ${content}

Candidate's answer:
${answer}

Provide structured feedback:
1. Strengths (what they got right)
2. Gaps (what's missing or incorrect)
3. Improved answer (how a strong candidate would answer this)

Be specific and technical. Keep total response under 300 words.`.trim(),
}

export type ActionKey = keyof typeof PROMPTS
