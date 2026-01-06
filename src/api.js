import { getAccessToken } from "./authToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
let loggedAuthHeader = false;

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, value.toString());
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const parseBody = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 204) return null;

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text().catch(() => "");
  return text || null;
};

const fetchApi = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  const { body, headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders || {});
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    if (isDev && !loggedAuthHeader) {
      console.log("[fetchApi] attaching Bearer token");
      loggedAuthHeader = true;
    }
  }

  const isFormData = body instanceof FormData;
  const normalizedBody =
    body === undefined || body === null
      ? undefined
      : !isFormData && typeof body !== "string" && !(body instanceof Blob)
        ? JSON.stringify(body)
        : body;

  if (!isFormData && normalizedBody !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: normalizedBody,
  });

  const data = await parseBody(response);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.error || data.message || data.detail)) ||
      (typeof data === "string" ? data : null) ||
      `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const getRoadmapMajor = async (major) =>
  fetchApi(`/api/roadmap/major${buildQueryString({ major })}`, {
    method: "GET",
  });

export const getRoadmapCert = async (major, job) =>
  fetchApi(`/api/roadmap/cert${buildQueryString({ major, job })}`, {
    method: "GET",
  });

export const getIntroductions = async (userId) =>
  fetchApi(`/api/introductions${buildQueryString({ userId })}`, {
    method: "GET",
  });

export const createIntroduction = async (requestBody) =>
  fetchApi("/api/introductions", {
    method: "POST",
    body: requestBody,
  });

export const getIntroductionById = async (id) =>
  fetchApi(`/api/introductions/${id}`, { method: "GET" });

export const createIntroductionLearning = async (requestBody) =>
  fetchApi("/api/introduction-learning", {
    method: "POST",
    body: requestBody,
  });

export const loginOrCreateUser = async (email) =>
  fetchApi("/api/users/login", {
    method: "POST",
    body: { email },
  });

export const createUserWithEmail = async (email) =>
  fetchApi("/api/users", {
    method: "POST",
    body: {
      email,
      nickname: null,
      major: null,
      targetJob: null,
    },
  });

export const getMe = async () => fetchApi("/me", { method: "GET" });

export const updateUserProfile = async (id, { nickname, major, targetJob }) =>
  fetchApi(`/api/users/${id}/profile`, {
    method: "PATCH",
    body: { nickname, major, targetJob },
  });

export const getUserById = async (id) =>
  fetchApi(`/api/users/${id}`, { method: "GET" });

export const getUsers = async () => fetchApi("/api/users", { method: "GET" });

export const createUser = async ({ nickname, major, targetJob }) =>
  fetchApi("/api/users", {
    method: "POST",
    body: { nickname, major, targetJob },
  });

export const getHealth = async () => fetchApi("/api/health", { method: "GET" });

export const analyzeInterviewVoice = async () =>
  fetchApi("/api/interview/voice/analyze", { method: "POST" });

export const getInterviewVoiceHealth = async () =>
  fetchApi("/api/interview/voice/health", { method: "GET" });

export const generateInterviewQuestions = async ({ userId, coverLetter }) =>
  fetchApi("/api/interview/question-gen", {
    method: "POST",
    body: { userId, coverLetter },
  });

export async function submitInterviewAnswer(meta, file) {
  if (!file) {
    throw new Error("면접 음성 파일(file)이 없습니다.");
  }
  if (!meta || typeof meta !== "object") {
    throw new Error("meta 객체가 필요합니다.");
  }

  const formData = new FormData();
  const metaJson = JSON.stringify(meta);
  const metaBlob = new Blob([metaJson], { type: "application/json" });
  formData.append("meta", metaBlob);
  formData.append("file", file, file.name ?? `answer-${Date.now()}.webm`);

  return fetchApi("/api/feedback/interview/ai", {
    method: "POST",
    body: formData,
  });
}

export const uploadInterviewAudio = async () => {
  console.warn("⚠️ uploadInterviewAudio는 더 이상 사용하지 않습니다. submitInterviewAnswer를 사용하세요.");
  return {};
};

export const getInterviewById = async (interviewId) =>
  fetchApi(`/api/interview/${interviewId}`, { method: "GET" });

export const createInterviewLearning = async ({
  userId,
  questionId,
  audioUrl,
  answerText,
  analysisResult,
  durationMs,
}) =>
  fetchApi("/api/interview-learning", {
    method: "POST",
    body: { userId, questionId, audioUrl, answerText, analysisResult, durationMs },
  });

export const createFeedback = async ({ userId, jobApplied, introText, submissionTime }) =>
  fetchApi("/api/feedback", {
    method: "POST",
    body: { userId, jobApplied, introText, submissionTime },
  });

export const getFeedbackById = async (id) =>
  fetchApi(`/api/feedback/${id}`, { method: "GET" });

export const getFeedbackByIntroductionId = async (introductionId) =>
  fetchApi(`/api/feedback/introduction/${introductionId}`, { method: "GET" });

export const getInterviewAIFeedback = async () => {
  console.warn("⚠️ getInterviewAIFeedback는 더 이상 사용하지 않습니다. submitInterviewAnswer를 사용하세요.");
  return {};
};

export const getFeedbackByInterviewId = async (interviewId) =>
  fetchApi(`/api/feedback/interview/${interviewId}`, { method: "GET" });

export const getLogoutSuccess = async () =>
  fetchApi("/api/logout-success", { method: "GET" });

export const createIntroductionAIFeedback = async (userId, resumeContent) =>
  fetchApi("/api/feedback/introduction/ai", {
    method: "POST",
    body: { userId, resumeContent },
  });

export async function fetchUserLearningProfile(userId = 1) {
  return fetchApi(`/api/users/${userId}`, { method: "GET" });
}

export async function requestResumeFeedback(userId, resumeContent) {
  return fetchApi("/resume/resume/feedback", {
    method: "POST",
    body: {
      userId: Number(userId),
      resumeContent: String(resumeContent),
    },
  });
}

export default fetchApi;
