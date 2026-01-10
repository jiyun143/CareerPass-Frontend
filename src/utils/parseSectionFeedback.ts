export type IntroductionSectionFeedback = {
  originalResume?: string;
  feedback?: string;
  regenResume?: string;
  regenTossResume?: string;
};

export type InterviewQuestionFeedback = string;

export type InterviewSectionFeedback = {
  questions?: InterviewQuestionFeedback[];
  summary?: {
    totalScore?: number | null;
    totalTimeMs?: number | null;
    overallFeedback?: string | null;
  };
};

export type ParsedSectionFeedback =
  | (IntroductionSectionFeedback & InterviewSectionFeedback)
  | null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function isInterviewSection(x: unknown): x is InterviewSectionFeedback {
  return (
    isObject(x) &&
    Array.isArray((x as InterviewSectionFeedback).questions) &&
    isObject((x as InterviewSectionFeedback).summary)
  );
}

export function isIntroductionSection(x: unknown): x is IntroductionSectionFeedback {
  return (
    isObject(x) &&
    typeof (x as IntroductionSectionFeedback).regenTossResume === "string"
  );
}

export function parseSectionFeedback(sectionFeedback: string): ParsedSectionFeedback {
  try {
    return JSON.parse(sectionFeedback);
  } catch {
    return null;
  }
}
