export interface FeedbackSummary {
  id: number;
  title: string;
  totalScore: number | null;
  createdAt: string;
}

export interface FeedbackDetail {
  id: number;
  title: string;
  totalScore: number | null;
  feedbackText?: string | null;
  sectionFeedback: string;
  createdAt: string;
}

export interface InterviewSessionSummary {
  interviewId: number;
  title?: string | null;
  createdAt: string;
  jobApplied?: string | null;
  totalDurationSec?: number | null;
  questionCount?: number | null;
  averageScore?: number | null;
}

export interface InterviewAnswerDetail {
  questionText?: string | null;
  transcript?: string | null;
  sttStatus?: string | null;
  timeMs?: number | null;
  score?: number | null;
  fluency?: number | null;
  contentDepth?: number | null;
  structure?: number | null;
  fillerCount?: number | null;
  improvements?: string[] | null;
  strengths?: string[] | null;
  risks?: string[] | null;
}

export interface InterviewSessionDetail {
  summary?: InterviewSessionSummary | null;
  answers?: InterviewAnswerDetail[] | null;
}

export interface IntroSectionFeedback {
  originalResume?: string;
  feedback?: string;
  regenResume?: string;
  regenTossResume?: string;
}

export interface IntroFeedbackResponse {
  feedbackText?: string;
  sectionFeedback?: IntroSectionFeedback | null;
}
