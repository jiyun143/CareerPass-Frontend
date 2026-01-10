import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input"; // Input은 다른 곳에서 사용되므로 유지
import { Mic, Brain, Play, Check, Clock, Star, TrendingUp, MessageCircle, BarChart3, Target, FileText, Loader, ArrowLeft } from "lucide-react"; 
import { MAJOR_OPTIONS, getJobOptionsByMajor } from "../data/departmentJobData";
import fetchApi, {
  submitInterviewAnswer,
  getInterviewDetail,
  startInterview as startInterviewSession,
  finalizeInterview,
  updateInterviewTitle
} from "../api";

type InterviewStep = 'main' | 'preparation' | 'interview' | 'analysis' | 'result';

// AnswerResult 타입 정의
type AnswerResult = {
  transcript?: string | null;
  sttStatus?: string | null;
  score?: number | null;
  timeMs?: number | null;
  fluency?: number | null;
  contentDepth?: number | null;
  structure?: number | null;
  fillerCount?: number | null;
  improvements?: string[] | null;
  strengths?: string[] | null;
  risks?: string[] | null;
};

interface InterviewAIProps {
  onNavigateProfile?: () => void;
  initialInterviewId?: number | null;
  onClearInterviewResultId?: () => void;
}

export function InterviewAI({
  onNavigateProfile,
  initialInterviewId,
  onClearInterviewResultId
}: InterviewAIProps = {}) {
  const [currentStep, setCurrentStep] = useState<InterviewStep>('main');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerResults, setAnswerResults] = useState<AnswerResult[]>([]); // AI 분석 결과 배열
  const [analysisProgress, setAnalysisProgress] = useState(0);
    
  // --- 상태 변수 ---
  const [majorInput, setMajorInput] = useState("");
  const [jobInput, setJobInput] = useState("");
  const [resumeText, setResumeText] = useState(""); 
  const [fetchedQuestions, setFetchedQuestions] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [isLoadingInterviewDetail, setIsLoadingInterviewDetail] = useState(false);
  // -------------------------

  // 학과 선택에 따른 직무 옵션 동적 업데이트
  const jobOptions = majorInput ? getJobOptionsByMajor(majorInput) : [];

  // 학과 변경 시 직무 초기화
  const handleMajorChange = (value: string) => {
    setMajorInput(value);
    setJobInput("");
  };

  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // 녹음 관련 refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastRecordedBlobRef = useRef<Blob | null>(null);
  const interviewStartAtRef = useRef<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [interviewId, setInterviewId] = useState<number | null>(null);
  const interviewIdRef = useRef<number | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null); // 마이크 권한 상태
  const [analysisResult, setAnalysisResult] = useState<any>(null); // AI 분석 결과
  const [interviewSummary, setInterviewSummary] = useState<any>(null);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [micConnected, setMicConnected] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const setInterviewIdSafe = (value: number | null) => {
    setInterviewId(value);
    interviewIdRef.current = value;
  };

  useEffect(() => {
    const nextTitle =
      typeof interviewSummary?.title === "string" && interviewSummary.title.trim()
        ? interviewSummary.title.trim()
        : "면접";
    setTitleDraft(nextTitle);
    setIsEditingTitle(false);
    setTitleError(null);
  }, [interviewSummary?.title]);

  const getUserId = () => {
    const userIdStr = localStorage.getItem('userId');
    const parsedId = userIdStr ? parseInt(userIdStr, 10) : 1;
    return Number.isFinite(parsedId) ? parsedId : 1;
  };

  const computePerQuestionTimes = (
    rawTimes: Array<number | null>,
    summaryTotalMs: number | null
  ) => {
    const validTimes = rawTimes.filter((time): time is number => Number.isFinite(time));
    if (validTimes.length < 2) {
      return { perTimes: rawTimes, isCumulative: false };
    }
    const sumTimes = validTimes.reduce((sum, value) => sum + value, 0);
    const lastTime = validTimes[validTimes.length - 1];
    const isNonDecreasing = validTimes.every((value, index) =>
      index === 0 ? true : value >= validTimes[index - 1]
    );
    const looksLikeCumulative =
      isNonDecreasing &&
      lastTime > 0 &&
      (sumTimes > lastTime * 1.2 ||
        (summaryTotalMs !== null && Math.abs(lastTime - summaryTotalMs) <= summaryTotalMs * 0.2));

    if (!looksLikeCumulative) {
      return { perTimes: rawTimes, isCumulative: false };
    }

    const perTimes = rawTimes.map((value, index) => {
      if (!Number.isFinite(value)) return null;
      if (index === 0) return value as number;
      const prev = rawTimes[index - 1];
      if (!Number.isFinite(prev)) return value as number;
      return Math.max(0, (value as number) - (prev as number));
    });
    return { perTimes, isCumulative: true };
  };

  const applyInterviewDetail = useCallback((data: any) => {
    const summary = data?.summary ?? null;
    const rawAnswers = Array.isArray(data?.answers) ? data.answers : [];
    setInterviewSummary(summary);
    setFetchedQuestions(rawAnswers.map((answer: any) => answer?.questionText || ""));
    const rawTimes = rawAnswers.map((answer: any) =>
      Number.isFinite(answer?.timeMs) ? answer.timeMs : null
    );
    const summaryTotalMs =
      Number.isFinite(summary?.totalDurationSec) ? summary.totalDurationSec * 1000 : null;
    const { perTimes, isCumulative } = computePerQuestionTimes(rawTimes, summaryTotalMs);
    if (import.meta.env.DEV) {
      console.log("[InterviewAI] timeMs check", {
        rawTimes,
        perTimes,
        summaryTotalMs,
        isCumulative
      });
    }
    const mappedResults: AnswerResult[] = rawAnswers.map((answer: any, index: number) => {
      const rawScore = answer?.score;
      if (!Number.isFinite(rawScore)) {
        console.warn("[InterviewAI] score missing", { index, answer });
      }
      const transcriptText =
        typeof answer?.transcript === "string" && answer.transcript.trim()
          ? answer.transcript
          : null;
      return {
        transcript: transcriptText,
        sttStatus: typeof answer?.sttStatus === "string" ? answer.sttStatus : null,
        score: Number.isFinite(rawScore) ? rawScore : null,
        timeMs: Number.isFinite(perTimes[index]) ? perTimes[index] : null,
        fluency: Number.isFinite(answer?.fluency) ? answer.fluency : null,
        contentDepth: Number.isFinite(answer?.contentDepth) ? answer.contentDepth : null,
        structure: Number.isFinite(answer?.structure) ? answer.structure : null,
        fillerCount: Number.isFinite(answer?.fillerCount) ? answer.fillerCount : null,
        improvements: Array.isArray(answer?.improvements) ? answer.improvements : [],
        strengths: Array.isArray(answer?.strengths) ? answer.strengths : [],
        risks: Array.isArray(answer?.risks) ? answer.risks : []
      };
    });
    setAnswerResults(mappedResults);
    setAnswers(mappedResults.map((result) => result.transcript || ""));
  }, []);

  const questions = fetchedQuestions;
  const canStartInterview = resumeText.trim().length > 0;
  const handleGoToProfile = () => {
    if (!onNavigateProfile) return;
    onNavigateProfile();
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  const handleEditTitle = () => {
    setTitleError(null);
    setIsEditingTitle(true);
  };

  const handleCancelTitleEdit = () => {
    const fallbackTitle =
      typeof interviewSummary?.title === "string" && interviewSummary.title.trim()
        ? interviewSummary.title.trim()
        : "면접";
    setTitleDraft(fallbackTitle);
    setTitleError(null);
    setIsEditingTitle(false);
  };

  const handleSaveTitle = async () => {
    const trimmedTitle = titleDraft.trim();
    if (!trimmedTitle) {
      setTitleError("제목을 입력해주세요.");
      return;
    }
    const activeInterviewId = interviewIdRef.current ?? interviewId;
    if (!activeInterviewId) {
      setTitleError("면접 정보를 찾을 수 없습니다.");
      return;
    }
    setIsSavingTitle(true);
    setTitleError(null);
    try {
      await updateInterviewTitle(activeInterviewId, trimmedTitle);
      setInterviewSummary((prev: any) => ({
        ...(prev || {}),
        title: trimmedTitle
      }));
      window.dispatchEvent(new CustomEvent("feedback:interview:title-updated", {
        detail: { interviewId: activeInterviewId, title: trimmedTitle }
      }));
      setIsEditingTitle(false);
    } catch (error: any) {
      console.error("면접 제목 수정 실패:", error);
      setTitleError("제목을 저장하지 못했습니다.");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const loadInterviewDetail = useCallback(
    async (interviewId: number) => {
      setIsLoadingInterviewDetail(true);
      setError(null);
      try {
        const data = await getInterviewDetail(interviewId);
        setInterviewIdSafe(interviewId);
        applyInterviewDetail(data);
        setAnalysisResult(null);
        setCurrentStep("result");
      } catch (err: any) {
        console.error("면접 결과 조회 실패:", err);
        setError(err?.message || "면접 결과를 불러오지 못했습니다.");
      } finally {
        setIsLoadingInterviewDetail(false);
        if (onClearInterviewResultId) {
          onClearInterviewResultId();
        }
      }
    },
    [applyInterviewDetail, onClearInterviewResultId]
  );

  useEffect(() => {
    if (!initialInterviewId) return;
    loadInterviewDetail(initialInterviewId);
  }, [initialInterviewId, loadInterviewDetail]);
    
  // --- API 호출 함수 (핵심 연결 부분) ---
  const fetchQuestions = useCallback(async () => {
    // Input 대신 Select로 변경되었으므로, 초기 placeholder 값 ""이 아닌지 확인
    if (!majorInput.trim() || !jobInput.trim()) {
      setError("학과와 직무 정보를 모두 선택해야 합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchApi("/api/interview/question-gen", {
        method: "POST",
        body: {
          userId: 1, // 시연용 하드코딩
          coverLetter:
            resumeText && resumeText.trim().length > 0
              ? resumeText
              : `${majorInput} ${jobInput} 자기소개 기반 질문입니다.`,
        },
      });

      // QuestionItemDto[] -> string[] 변환
      const questionTexts = Array.isArray(data.questions)
        ? data.questions.map((q: any) =>
            typeof q === "string" ? q : q.text
          )
        : [];

      if (questionTexts.length > 0) {
        setFetchedQuestions(questionTexts);
        setCurrentStep("preparation");
        console.log("[InterviewAI] question-gen success:", {
          count: questionTexts.length,
          nextStep: "preparation"
        });
      } else {
        setError("AI가 질문을 생성하지 못했습니다. 입력 정보를 확인해주세요.");
        setFetchedQuestions([]);
      }

    } catch (err: any) {
      setError(err?.message || "서버 연결에 실패했습니다. 백엔드를 확인해주세요.");
      setFetchedQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [majorInput, jobInput, resumeText]);
  // ----------------------------------------
    
  const requestQuestions = fetchQuestions;
  const handleStartInterview = () => {
    if (!canStartInterview) return;
    requestQuestions();
  };

  // 녹음 시작 함수
  const startRecording = async () => {
    try {
      // 기존 스트림이 있고 활성 상태면 재사용
      if (audioStreamRef.current && audioStreamRef.current.active) {
        const existingTracks = audioStreamRef.current.getAudioTracks();
        if (existingTracks.length > 0 && existingTracks[0].readyState === 'live') {
          // 기존 스트림 재사용
          const mediaRecorder = new MediaRecorder(audioStreamRef.current, {
            mimeType: 'audio/webm'
          });
          
          audioChunksRef.current = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };
          
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.start();
          setIsRecording(true);
          setHasMicPermission(true);
          console.log('기존 스트림으로 녹음 재시작됨');
          return;
        }
      }

      // 새 스트림 요청
      console.log('🔄 getUserMedia 호출 시작...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log('✅ getUserMedia 성공 - 스트림 획득됨');
          return stream;
        })
        .catch(err => {
          console.error('❌ getUserMedia 실패:', {
            name: err.name,
            message: err.message,
            error: err
          });
          
          // 에러 타입별 명확한 분리 처리
          let errorMessage = '';
          let isPermissionError = false;
          
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            // 실제 권한 거부 에러인 경우만
            isPermissionError = true;
            setHasMicPermission(false);
            errorMessage = '마이크 권한이 허용되지 않았습니다.\n\n브라우저 주소창 왼쪽 자물쇠(🔒) 아이콘 → 사이트 설정 → 마이크 권한을 "허용"으로 변경한 뒤 페이지를 새로고침해 주세요.';
            console.log('🔒 권한 거부 에러 감지:', err.name);
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            // 마이크 장치를 찾을 수 없는 경우
            setHasMicPermission(null); // 권한 문제가 아니라 장치 문제
            errorMessage = '마이크 장치를 찾을 수 없습니다. 입력 장치를 확인해 주세요.';
            console.log('🔍 장치 없음 에러 감지:', err.name);
          } else {
            // 기타 에러 (권한 문제가 아닐 수 있음)
            setHasMicPermission(null); // 권한 상태 불명확
            errorMessage = `마이크를 사용할 수 없는 오류가 발생했습니다. (${err.name}: ${err.message})`;
            console.log('⚠️ 기타 에러 감지:', err.name, err.message);
          }
          
          // 권한 거부 에러가 아닌 경우에는 권한 관련 메시지를 표시하지 않음
          if (isPermissionError) {
            alert(errorMessage);
            setError(errorMessage);
          } else {
            setError(errorMessage);
            // alert는 권한 에러일 때만 표시
          }
          
          throw err; // 에러를 다시 throw하여 호출부에서 처리할 수 있도록
        });
      
      // getUserMedia가 성공한 경우 - 권한이 확실히 허용된 상태
      console.log('✅ getUserMedia 성공 - 권한 허용 확인됨');
      setHasMicPermission(true);
      setError(null); // 이전 에러 메시지 제거 (성공했으므로)
      audioStreamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      console.log('✅ 녹음 시작됨 - MediaRecorder 상태:', mediaRecorder.state);
    } catch (err: any) {
      console.error('❌ 녹음 시작 실패 (catch 블록):', {
        name: err?.name,
        message: err?.message,
        error: err
      });
      
      // catch 블록에 도달했다는 것은 getUserMedia가 실패했다는 의미
      // 하지만 이미 .catch()에서 권한 상태와 에러 메시지를 설정했으므로
      // 여기서는 추가로 권한 없음으로 설정하지 않음 (이미 처리됨)
      setIsRecording(false);
      
      // 에러 메시지는 .catch()에서 이미 설정됨
      // getUserMedia가 성공했다면 이 catch 블록에 도달하지 않음
    }
  };

  // 녹음 종료 함수
  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !audioStreamRef.current) {
        resolve(new Blob());
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log("[audio] blob size/type", audioBlob?.size, audioBlob?.type);
        console.log("[audio] chunks len", audioChunksRef.current.length);
        audioChunksRef.current = [];
        
        // 스트림은 유지 (권한을 계속 유지하기 위해 트랙을 중지하지 않음)
        // 다음 질문에서 같은 스트림을 재사용할 수 있도록
        setIsRecording(false);
        console.log('녹음 종료됨, Blob 크기:', audioBlob.size);
        resolve(audioBlob);
      };
      
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      } else {
        resolve(new Blob());
      }
    });
  };

  const beginInterview = async () => {
    if (questions.length === 0) {
        setError("질문 목록이 없습니다. 메인 화면으로 돌아가 다시 시작해주세요.");
        setCurrentStep('main');
        return;
    }

    setError(null);
    setIsUploading(true);
    setInterviewIdSafe(null);
    try {
      const finalUserId = getUserId();
      const jobApplied = jobInput || '면접';
      const resumeContent = resumeText || '';
      const startResponse = await startInterviewSession({
        userId: finalUserId,
        jobApplied,
        resumeContent
      });
      const startedInterviewId = startResponse?.interviewId ?? startResponse?.id ?? null;
      if (!startedInterviewId) {
        setError("면접 세션을 시작하지 못했습니다. 서버 응답에 interviewId가 없습니다.");
        console.warn("[InterviewAI] startInterview missing interviewId:", startResponse);
        return;
      }
      setInterviewIdSafe(startedInterviewId);
    } catch (err: any) {
      console.error("면접 세션 시작 실패:", err);
      setError(err?.message || "면접 세션을 시작하지 못했습니다.");
      return;
    } finally {
      setIsUploading(false);
    }

    setCurrentStep('interview');
    setCurrentQuestion(0);
    setTimeLeft(60);
    setAnswers([]);
    setAnswerResults([]);
    setInterviewSummary(null);
    setAnalysisResult(null);
    setHasMicPermission(null); // 권한 상태 초기화
    interviewStartAtRef.current = Date.now();
    lastRecordedBlobRef.current = null;
    
    // 녹음 시작
    await startRecording();
    startTimer();
  };

  const startTimer = () => {
    setIsRecording(true);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // 타이머 종료 시 자동으로 다음 질문으로 이동 (답변은 nextQuestion에서 업로드 후 저장됨)
          nextQuestion();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextQuestion = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    let shouldAdvance = true;
    
    // 마이크 권한이 있는 경우에만 녹음 종료 및 업로드
    if (hasMicPermission === true && mediaRecorderRef.current && audioStreamRef.current) {
      setIsUploading(true);
      setError(null);
      try {
        // 녹음 종료
        let audioBlob = lastRecordedBlobRef.current;
        if (!audioBlob) {
          audioBlob = await stopRecording();
          lastRecordedBlobRef.current = audioBlob;
        }
        
        if (audioBlob.size > 0) {
          console.log("[audio] blob size/type", audioBlob?.size, audioBlob?.type);
          const activeInterviewId = interviewIdRef.current ?? interviewId;
          if (!activeInterviewId) {
            setError("면접 세션이 시작되지 않았습니다. 다시 시작해주세요.");
            console.warn("[InterviewAI] meta.interviewId missing. Block submitInterviewAnswer.");
            shouldAdvance = false;
            return;
          }

          // userId 가져오기
          const finalUserId = getUserId();
          
          // jobApplied 가져오기 (jobInput 사용)
          const jobApplied = jobInput || '면접';
          
          // 현재 질문 정보
          const currentQuestionText = questions[currentQuestion] || '';
          const currentQuestionId = currentQuestion + 1; // 질문 ID는 1부터 시작
          
          // resumeContent 가져오기
          const resumeContent = resumeText || '';
          
          // meta 객체 구성 (백엔드 스펙에 맞게)
          const meta = {
            interviewId: activeInterviewId,
            userId: finalUserId,
            questionId: currentQuestionId,
            questionText: currentQuestionText,
            resumeContent: resumeContent,
            jobApplied: jobApplied,
          };

          if (!interviewStartAtRef.current) {
            interviewStartAtRef.current = Date.now();
          }
          const durationSec = Math.max(
            1,
            Math.floor((Date.now() - interviewStartAtRef.current) / 1000)
          );
          const safeDurationSec = Number.isFinite(durationSec) ? durationSec : 1;
          console.log("[SEND] interviewDuration:", safeDurationSec);

          // 디버깅: 요청 전 로그
          console.log('[SEND] nextQuestion - 면접 답변 제출:', {
            meta: meta,
            fileSize: audioBlob.size,
            fileType: audioBlob.type || 'audio/webm',
            questionIndex: currentQuestion
          });

          const formData = new FormData();
          formData.set("file", audioBlob, "answer.webm");
          formData.set("meta", JSON.stringify(meta));
          formData.set("interviewDuration", String(safeDurationSec));
          for (const [key, value] of formData.entries()) {
            console.log("[FORMDATA]", key, value);
          }
          
          // 백엔드로 답변 제출 (meta + file 동시 전송)
          const response = await submitInterviewAnswer(formData);
          lastRecordedBlobRef.current = null;
          
          // 응답에서 result 추출: fullResponse가 있으면 그것을, 없으면 response 자체를 사용
          const result = response?.fullResponse || response;
          
          // 디버깅: 응답 후 로그
          console.log('[RECV] nextQuestion - 면접 답변 제출 성공:', {
            transcript: result?.transcript || '(없음)',
            score: result?.score,
            timeMs: result?.timeMs,
            fluency: result?.fluency,
            contentDepth: result?.contentDepth,
            structure: result?.structure,
            fillerCount: result?.fillerCount,
            improvements: result?.improvements?.length || 0,
            strengths: result?.strengths?.length || 0,
            risks: result?.risks?.length || 0,
            fullResponse: response?.fullResponse,
            rawResponse: response
          });
          
          // 답변 저장 (STT 변환된 텍스트)
          const currentAnswerIndex = currentQuestion;
          const answerText = result?.transcript || '';
          
          console.log('추출된 답변 텍스트:', answerText || '(없음)', '인덱스:', currentAnswerIndex, '길이:', answerText?.length || 0);
          if (!answerText) {
            console.warn('⚠️ STT 텍스트를 찾을 수 없습니다. 응답 구조:', JSON.stringify(response, null, 2));
          }
          
          // AnswerResult 객체 생성
          const transcriptText =
            typeof result?.transcript === "string" && result.transcript.trim()
              ? result.transcript
              : null;
          const answerResult: AnswerResult = {
            transcript: transcriptText,
            sttStatus: typeof result?.sttStatus === "string" ? result.sttStatus : null,
            score: Number.isFinite(result?.score) ? result.score : null,
            timeMs: Number.isFinite(result?.timeMs) ? result.timeMs : null,
            fluency: Number.isFinite(result?.fluency) ? result.fluency : null,
            contentDepth: Number.isFinite(result?.contentDepth) ? result.contentDepth : null,
            structure: Number.isFinite(result?.structure) ? result.structure : null,
            fillerCount: Number.isFinite(result?.fillerCount) ? result.fillerCount : null,
            improvements: Array.isArray(result?.improvements) ? result.improvements : [],
            strengths: Array.isArray(result?.strengths) ? result.strengths : [],
            risks: Array.isArray(result?.risks) ? result.risks : []
          };
          
          // answers와 answerResults 배열 동시 업데이트
          setAnswers(prevAnswers => {
            const newAnswers = [...prevAnswers];
            // 배열이 부족하면 빈 문자열로 채움
            while (newAnswers.length < currentAnswerIndex) {
              newAnswers.push('');
            }
            // 현재 질문 인덱스에 답변 저장 (기존 값이 있어도 덮어쓰기)
            if (newAnswers.length === currentAnswerIndex) {
              newAnswers.push(answerText.trim());
            } else {
              newAnswers[currentAnswerIndex] = answerText.trim();
            }
            console.log('업데이트된 answers 배열:', newAnswers, '현재 인덱스:', currentAnswerIndex);
            return newAnswers;
          });
          
          setAnswerResults(prevResults => {
            const newResults = [...prevResults];
            // 배열이 부족하면 빈 객체로 채움
            while (newResults.length < currentAnswerIndex) {
              newResults.push({
                transcript: null,
                sttStatus: null,
                score: null,
                timeMs: null,
                fluency: null,
                contentDepth: null,
                structure: null,
                fillerCount: null,
                improvements: [],
                strengths: [],
                risks: []
              });
            }
            // 현재 질문 인덱스에 분석 결과 저장
            if (newResults.length === currentAnswerIndex) {
              newResults.push(answerResult);
            } else {
              newResults[currentAnswerIndex] = answerResult;
            }
            console.log('업데이트된 answerResults 배열:', newResults, '현재 인덱스:', currentAnswerIndex);
            return newResults;
          });
        } else {
          lastRecordedBlobRef.current = null;
        }
      } catch (err: any) {
        console.error('면접 답변 제출 실패:', err);
        setError("음성 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
        shouldAdvance = false;
      } finally {
        setIsUploading(false);
      }
    } else {
      // 권한이 없거나 녹음이 시작되지 않은 경우
      if (hasMicPermission === false) {
        // 실제 권한 거부인 경우만 경고
        console.warn('⚠️ 마이크 권한이 거부되어 녹음 데이터를 업로드할 수 없습니다.');
      } else {
        // 권한 상태가 불명확하거나 녹음이 시작되지 않은 경우
        console.warn('⚠️ 녹음 데이터가 없어 업로드할 수 없습니다. (권한 상태:', hasMicPermission, ')');
      }
      // 빈 답변 저장 (분석 결과에서 구분하기 위해)
      if (currentQuestion < questions.length && answers.length === currentQuestion) {
        setAnswers(prevAnswers => [...prevAnswers, '']);
      }
    }

    if (!shouldAdvance) {
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(60);
      // 다음 질문까지 2초 대기 후 녹음 시작 (권한이 있으면)
      setTimeout(async () => {
        if (hasMicPermission !== false) {
          await startRecording();
        }
        startTimer();
      }, 2000); 
    } else {
      await finishInterview();
    }
  };

  const finishInterview = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const activeInterviewId = interviewIdRef.current ?? interviewId;
    if (!activeInterviewId) {
      setError("면접 세션이 시작되지 않았습니다. 다시 시작해주세요.");
      console.warn("[InterviewAI] finishInterview blocked: missing interviewId.");
      return;
    }
    let shouldProceed = true;
    // 마이크 권한이 있고 녹음이 진행된 경우에만 업로드
    if (hasMicPermission === true && mediaRecorderRef.current && audioStreamRef.current) {
      setIsUploading(true);
      setError(null);
      try {
        // 녹음 종료
        let audioBlob = lastRecordedBlobRef.current;
        if (!audioBlob) {
          audioBlob = await stopRecording();
          lastRecordedBlobRef.current = audioBlob;
        }
        
        if (audioBlob.size > 0) {
          console.log("[audio] blob size/type", audioBlob?.size, audioBlob?.type);
          // userId 가져오기
          const finalUserId = getUserId();
          
          // jobApplied 가져오기
          const jobApplied = jobInput || '면접';
          
          // 마지막 질문 정보
          const lastQuestionIndex = questions.length - 1;
          const lastQuestionText = questions[lastQuestionIndex] || '';
          const lastQuestionId = lastQuestionIndex + 1;
          
          // resumeContent 가져오기
          const resumeContent = resumeText || '';
          
          // meta 객체 구성 (백엔드 스펙에 맞게)
          const meta = {
            interviewId: activeInterviewId,
            userId: finalUserId,
            questionId: lastQuestionId,
            questionText: lastQuestionText,
            resumeContent: resumeContent,
            jobApplied: jobApplied,
          };

          if (!interviewStartAtRef.current) {
            interviewStartAtRef.current = Date.now();
          }
          const durationSec = Math.max(
            1,
            Math.floor((Date.now() - interviewStartAtRef.current) / 1000)
          );
          const safeDurationSec = Number.isFinite(durationSec) ? durationSec : 1;
          console.log("[SEND] interviewDuration:", safeDurationSec);

          // 디버깅: 요청 전 로그
          console.log('[SEND] finishInterview - 마지막 질문 답변 제출:', {
            meta: meta,
            fileSize: audioBlob.size,
            fileType: audioBlob.type || 'audio/webm',
            questionIndex: lastQuestionIndex
          });

          const formData = new FormData();
          formData.set("file", audioBlob, "answer.webm");
          formData.set("meta", JSON.stringify(meta));
          formData.set("interviewDuration", String(safeDurationSec));
          for (const [key, value] of formData.entries()) {
            console.log("[FORMDATA]", key, value);
          }
          
          // 마지막 질문 답변 제출 (meta + file 동시 전송)
          const response = await submitInterviewAnswer(formData);
          lastRecordedBlobRef.current = null;
          
          // 응답에서 result 추출: fullResponse가 있으면 그것을, 없으면 response 자체를 사용
          const result = response?.fullResponse || response;
          
          // 디버깅: 응답 후 로그
          console.log('[RECV] finishInterview - 마지막 질문 답변 제출 성공:', {
            transcript: result?.transcript || '(없음)',
            score: result?.score,
            timeMs: result?.timeMs,
            fluency: result?.fluency,
            contentDepth: result?.contentDepth,
            structure: result?.structure,
            fillerCount: result?.fillerCount,
            improvements: result?.improvements?.length || 0,
            strengths: result?.strengths?.length || 0,
            risks: result?.risks?.length || 0,
            fullResponse: response?.fullResponse,
            rawResponse: response
          });

          // 마지막 답변 저장 (STT 변환된 텍스트)
          const answerText = result?.transcript || '';
          
          console.log('마지막 질문 답변 텍스트:', answerText || '(없음)', '인덱스:', lastQuestionIndex, '길이:', answerText?.length || 0);
          
          // AnswerResult 객체 생성
          const transcriptText =
            typeof result?.transcript === "string" && result.transcript.trim()
              ? result.transcript
              : null;
          const answerResult: AnswerResult = {
            transcript: transcriptText,
            sttStatus: typeof result?.sttStatus === "string" ? result.sttStatus : null,
            score: Number.isFinite(result?.score) ? result.score : null,
            timeMs: Number.isFinite(result?.timeMs) ? result.timeMs : null,
            fluency: Number.isFinite(result?.fluency) ? result.fluency : null,
            contentDepth: Number.isFinite(result?.contentDepth) ? result.contentDepth : null,
            structure: Number.isFinite(result?.structure) ? result.structure : null,
            fillerCount: Number.isFinite(result?.fillerCount) ? result.fillerCount : null,
            improvements: Array.isArray(result?.improvements) ? result.improvements : [],
            strengths: Array.isArray(result?.strengths) ? result.strengths : [],
            risks: Array.isArray(result?.risks) ? result.risks : []
          };
          
          // answers와 answerResults 배열 동시 업데이트
          setAnswers(prevAnswers => {
            const newAnswers = [...prevAnswers];
            // 배열이 부족하면 빈 문자열로 채움
            while (newAnswers.length < lastQuestionIndex) {
              newAnswers.push('');
            }
            // 마지막 답변 추가 또는 업데이트
            if (newAnswers.length === lastQuestionIndex) {
              newAnswers.push(answerText.trim());
            } else {
              newAnswers[lastQuestionIndex] = answerText.trim();
            }
            console.log('마지막 업데이트된 answers 배열:', newAnswers);
            return newAnswers;
          });
          
          setAnswerResults(prevResults => {
            const newResults = [...prevResults];
            // 배열이 부족하면 빈 객체로 채움
            while (newResults.length < lastQuestionIndex) {
              newResults.push({
                transcript: null,
                sttStatus: null,
                score: null,
                timeMs: null,
                fluency: null,
                contentDepth: null,
                structure: null,
                fillerCount: null,
                improvements: [],
                strengths: [],
                risks: []
              });
            }
            // 마지막 답변 분석 결과 저장
            if (newResults.length === lastQuestionIndex) {
              newResults.push(answerResult);
            } else {
              newResults[lastQuestionIndex] = answerResult;
            }
            console.log('마지막 업데이트된 answerResults 배열:', newResults);
            return newResults;
          });
          
          // 마지막 답변의 분석 결과를 전체 분석 결과로도 저장 (기존 호환성 유지)
          setAnalysisResult(answerResult);
          console.log('[SAVE] 마지막 답변 분석 결과 저장:', answerResult);
        } else {
          lastRecordedBlobRef.current = null;
        }
      } catch (err: any) {
        console.error('마지막 면접 답변 제출 실패:', err);
        setError("음성 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
        shouldProceed = false;
      } finally {
        setIsUploading(false);
      }
    } else {
      // 권한이 없거나 녹음이 시작되지 않은 경우
      if (hasMicPermission === false) {
        // 실제 권한 거부인 경우만 경고
        console.warn('⚠️ 마이크 권한이 거부되어 마지막 녹음 데이터를 업로드할 수 없습니다.');
        alert('녹음 데이터가 없어 분석을 제공할 수 없습니다.\n\n마이크 권한을 허용한 후 다시 시도해주세요.');
      } else {
        // 권한 상태가 불명확하거나 녹음이 시작되지 않은 경우
        console.warn('⚠️ 녹음 데이터가 없어 마지막 업로드를 할 수 없습니다. (권한 상태:', hasMicPermission, ')');
        alert('녹음 데이터가 없어 분석을 제공할 수 없습니다.');
      }
      // 빈 답변 저장
      if (currentQuestion === questions.length - 1 && answers.length < questions.length) {
        setAnswers(prevAnswers => [...prevAnswers, '']);
      }
    }

    if (!shouldProceed) {
      return;
    }

    setIsUploading(true);
    try {
      if (!interviewStartAtRef.current) {
        setError("총 진행 시간 계산에 실패했습니다. 면접을 다시 시작해주세요.");
        console.warn("[InterviewAI] interviewStartAtRef missing, cannot finalize.");
        return;
      }
      const totalDurationSec = Math.max(
        1,
        Math.floor((Date.now() - interviewStartAtRef.current) / 1000)
      );
      const finalizeData = await finalizeInterview({
        interviewId: activeInterviewId,
        totalDurationSec
      });
      if (finalizeData?.summary || finalizeData?.answers) {
        applyInterviewDetail(finalizeData);
      } else {
        const detail = await getInterviewDetail(activeInterviewId);
        applyInterviewDetail(detail);
      }
      setAnalysisResult(null);
      window.dispatchEvent(new CustomEvent("feedback:interview:created", {
        detail: { id: activeInterviewId }
      }));
    } catch (err: any) {
      console.error("면접 finalize 실패:", err);
      setError(err?.message || "면접 결과를 확정하지 못했습니다.");
      return;
    } finally {
      setIsUploading(false);
    }

    // 면접 종료 시에만 스트림 정리 (권한은 유지)
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // 분석 화면으로 전환
    setCurrentStep('analysis');
    setAnalysisProgress(0);
    
    // getInterviewAIFeedback 같은 API는 더 이상 호출하지 않음
    // answerResults 배열에 이미 모든 분석 결과가 저장되어 있음
    console.log('[FINISH] 면접 종료 - answerResults 배열:', answerResults);
    
    // 분석 진행 시뮬레이션
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setCurrentStep('result');
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const resetInterview = async () => {
    // 녹음 중이면 종료
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await stopRecording();
    }
    
    // 스트림 정리
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    setCurrentStep('main');
    setCurrentQuestion(0);
    setIsRecording(false);
    setTimeLeft(60);
    setAnswers([]);
    setAnswerResults([]);
    setFetchedQuestions([]); 
    setAnalysisProgress(0);
    setError(null);
    setIsUploading(false);
    setInterviewIdSafe(null);
    setInterviewSummary(null);
    setAnalysisResult(null);
    setHasMicPermission(null); // 권한 상태 초기화
    interviewStartAtRef.current = null;
    lastRecordedBlobRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (currentStep !== 'preparation') return;
    let isActive = true;

    const checkMicReady = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some((device) => device.kind === 'audioinput');
        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        setMicPermission('granted');
        setMicConnected(hasAudioInput);
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        if (!isActive) return;
        const isDenied =
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        setMicPermission(isDenied ? 'denied' : 'prompt');
        setMicConnected(false);
      }
    };

    checkMicReady();
    return () => {
      isActive = false;
    };
  }, [currentStep]);
    
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // 녹음 정리
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
    
  // --- 렌더링 함수 ---
    
  if (currentStep === 'preparation') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Mic className="w-8 h-8" />
            면접 준비
          </h1>
          <p className="text-muted-foreground">면접을 시작하기 전에 마이크를 체크해주세요</p>
          <div className="bg-primary/10 text-primary p-3 rounded-lg border border-primary/30">
            <h4 className="font-medium">면접 질문 ({questions.length}개)</h4>
            <ul className="list-none ml-0 text-sm space-y-1 mt-1">
              {questions.map((q, i) => {
                const cleaned = q.replace(/^[\s•\-–—]+/, "");
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-[2px]">•</span>
                    <span>{cleaned}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <Card className="border-2 rounded-xl p-8">
          <CardContent className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
                <Mic className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-2">마이크 확인</h3>
                <p className="text-muted-foreground">원활한 면접을 위해 마이크가 정상 작동하는지 확인해주세요</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-primary" />
                  <span>마이크</span>
                </div>
                {micConnected ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">연결됨</span>
                  </div>
                ) : (
                  <div
                    className={`flex items-center gap-2 ${
                      micPermission === 'denied' ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="text-sm">❌</span>
                    <span className="text-sm">
                      {micPermission === 'denied' ? '권한 필요' : '연결 안됨'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 면접 팁</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• 조용한 환경에서 진행해주세요</li>
                <li>• 마이크에 가까이서 명확하게 답변해주세요</li>
                <li>• 마이크 아이콘이 빨간색(REC)으로 바뀌면 답변을 시작하세요.</li>
                <li>• 각 질문당 1분의 답변 시간이 주어집니다</li>
              </ul>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={resetInterview}>
                취소
              </Button>
              <Button size="lg" className="px-8" onClick={beginInterview}>
                면접 시작하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

    
  if (currentStep === 'interview') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Mic className="w-8 h-8" />
            AI 모의면접 진행중
          </h1>
          <p className="text-muted-foreground">질문 {currentQuestion + 1} / {questions.length}</p>
        </div>

        <Card className="border-2 rounded-xl p-8">
          <CardContent className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-red-600">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            {hasMicPermission === false && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 mb-1">마이크 권한이 허용되지 않아 답변 녹음이 진행되지 않습니다.</p>
                  <p className="text-yellow-800 text-sm">
                    브라우저 주소창 왼쪽 자물쇠(🔒) 아이콘 → 사이트 설정 → 마이크 권한을 "허용"으로 변경한 뒤 페이지를 새로고침해 주세요.
                  </p>
                </div>
              </div>
            )}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center 
                ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                  <Mic className={`w-16 h-16 ${isRecording ? 'text-red-600' : 'text-gray-500'}`} />
                </div>
                {isRecording && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      REC
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                  <h3 className="font-medium mb-3">질문 {currentQuestion + 1}</h3>
                  <p className="text-lg">{questions[currentQuestion]}</p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="font-medium">남은 시간: {timeLeft}초</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((60 - timeLeft) / 60) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                onClick={nextQuestion}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  '다음 질문'
                )}
              </Button>
              <Button 
                variant="destructive" 
                onClick={finishInterview}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  '면접 종료'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

    
  if (currentStep === 'analysis') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Brain className="w-8 h-8" />
            AI 분석 중
          </h1>
          <p className="text-muted-foreground">면접 답변을 분석하고 있습니다...</p>
        </div>

        <Card className="border-2 rounded-xl p-8">
          <CardContent className="text-center space-y-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">AI가 면접 답변을 분석하고 있습니다</h3>
              <p className="text-muted-foreground">음성, 내용, 태도를 종합적으로 분석하여 맞춤형 피드백을 준비중입니다</p>
                
              <div className="space-y-2">
                <Progress value={analysisProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">{analysisProgress}% 완료</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <BarChart3 className="w-8 h-8 mx-auto text-blue-600" />
                <p className="font-medium">음성 분석</p>
              </div>
              <div className="space-y-2">
                <MessageCircle className="w-8 h-8 mx-auto text-green-600" />
                <p className="font-medium">내용 분석</p>
              </div>
              <div className="space-y-2">
                <Target className="w-8 h-8 mx-auto text-purple-600" />
                <p className="font-medium">태도 분석</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

    
  if (currentStep === 'result') {
    const resultAnswers = Array.isArray(answerResults) ? answerResults : [];
    const totalMsFromAnswers = resultAnswers.reduce((sum, result) => {
      const value = result?.timeMs;
      return Number.isFinite(value) ? sum + (value as number) : sum;
    }, 0);
    const summaryDurationSec = interviewSummary?.totalDurationSec;
    const totalMsFromSummary =
      Number.isFinite(summaryDurationSec) && summaryDurationSec > 0
        ? summaryDurationSec * 1000
        : null;
    const totalMs = totalMsFromSummary ?? totalMsFromAnswers;
    const formatDuration = (ms: number | null) => {
      if (!ms || ms <= 0) return "데이터 없음";
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}분 ${seconds}초`;
    };
    const scoredResults = resultAnswers.filter((result) =>
      Number.isFinite(result?.score)
    );
    const averageScoreFromAnswers =
      scoredResults.length > 0
        ? scoredResults.reduce((sum, result) => sum + (result.score as number), 0) /
          scoredResults.length
        : null;
    const averageScore =
      Number.isFinite(interviewSummary?.averageScore)
        ? interviewSummary.averageScore
        : averageScoreFromAnswers;
    const questionCount =
      Number.isFinite(interviewSummary?.questionCount) && interviewSummary.questionCount > 0
        ? interviewSummary.questionCount
        : resultAnswers.length > 0
          ? resultAnswers.length
          : questions.length;
    const interviewTitle =
      typeof interviewSummary?.title === "string" && interviewSummary.title.trim()
        ? interviewSummary.title.trim()
        : "면접";
    const interviewCreatedAt = interviewSummary?.createdAt || "";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoToProfile}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
        </div>
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Star className="w-8 h-8" />
            면접 결과
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            {isEditingTitle ? (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="h-8 w-64"
                  maxLength={50}
                />
                <Button size="sm" onClick={handleSaveTitle} disabled={isSavingTitle}>
                  {isSavingTitle ? "저장 중..." : "저장"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelTitleEdit} disabled={isSavingTitle}>
                  취소
                </Button>
              </div>
            ) : (
              <>
                <span>{interviewTitle}</span>
                {interviewCreatedAt ? <span>· {interviewCreatedAt}</span> : null}
                <Button size="sm" variant="ghost" onClick={handleEditTitle}>
                  수정
                </Button>
              </>
            )}
          </div>
          {titleError && (
            <p className="text-sm text-red-600">{titleError}</p>
          )}
          <p className="text-muted-foreground">AI 분석 결과를 확인해보세요</p>
        </div>

        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-2 rounded-xl">
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">
                  {formatDuration(totalMs)}
                </p>
                <p className="text-muted-foreground">총 진행 시간</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-xl">
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">{questionCount}개</p> 
                <p className="text-muted-foreground">총 질문 개수</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-xl">
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">
                  {averageScore !== null ? `${averageScore.toFixed(1)}점` : "데이터 없음"}
                </p>
                <p className="text-muted-foreground">평균 점수</p>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600">✅</span>
              <div>
                <p className="font-medium text-green-900">기술적 깊이</p>
                <p className="text-green-800">지원한 분야와 관련된 기술 스택에 대한 이해를 보여주세요.</p>
              </div>
            </div>
              
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="font-medium text-yellow-900">문제 해결 능력</p>
                <p className="text-yellow-800">구체적인 경험을 들어 해결 과정을 설명하면 더 좋습니다.</p>
              </div>
            </div>
        
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-600">🤝</span>
              <div>
                <p className="font-medium text-blue-900">협업 능력</p>
                <p className="text-blue-800">팀 프로젝트 경험과 소통 방식을 강조하세요.</p>
              </div>
            </div>
              
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-purple-600">🚀</span>
              <div>
                <p className="font-medium text-purple-900">성장 의지</p>
                <p className="text-purple-800">부족한 점을 인정하고 보완 계획을 제시하세요.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle>질문별 상세 결과</CardTitle>
            <CardDescription>각 질문에 대한 답변 분석 결과입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const result = answerResults[index];
              const transcriptValue = result?.transcript ?? null;
              const isSttFailed =
                transcriptValue === null || result?.sttStatus === "FAILED";
              const timeMs = result?.timeMs;
              const timeText = Number.isFinite(timeMs)
                ? `${Math.floor((timeMs as number) / 1000)}초`
                : "데이터 없음";
              const scoreText = Number.isFinite(result?.score)
                ? `${result?.score}점`
                : "데이터 없음";
              const fluencyScore = Number.isFinite(result?.fluency) ? result?.fluency : null;
              const contentDepthScore = Number.isFinite(result?.contentDepth) ? result?.contentDepth : null;
              const structureScore = Number.isFinite(result?.structure) ? result?.structure : null;
              const fillerCount = Number.isFinite(result?.fillerCount) ? result?.fillerCount : null;
              const hasScoreMetrics =
                Number.isFinite(result?.score) ||
                fluencyScore !== null ||
                contentDepthScore !== null ||
                structureScore !== null ||
                fillerCount !== null;
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">질문 {index + 1}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>답변 시간: {timeText}</span>
                      <span className="font-medium text-primary">{scoreText}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{question}</p>
                  
                  {/* 답변 내용 (transcript) */}
                  <div className="bg-muted/50 p-3 rounded border-l-4 border-muted-foreground/20">
                    <p className="text-muted-foreground">
                      {isSttFailed ? (
                        <span className="text-muted-foreground/70">음성 인식에 실패했습니다. 다시 답변해 주세요.</span>
                      ) : (
                        <span className="italic">답변 내용: {transcriptValue}</span>
                      )}
                    </p>
                  </div>
                  
                  {/* 점수 정보 */}
                  {result && hasScoreMetrics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {fluencyScore !== null && (
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-green-700 font-medium">유창성: {fluencyScore}점</p>
                        </div>
                      )}
                      {contentDepthScore !== null && (
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-blue-700 font-medium">내용 깊이: {contentDepthScore}점</p>
                        </div>
                      )}
                      {structureScore !== null && (
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-purple-700 font-medium">구조: {structureScore}점</p>
                        </div>
                      )}
                      {fillerCount !== null && (
                        <div className="bg-yellow-50 p-2 rounded">
                          <p className="text-yellow-700 font-medium">끼어들기: {fillerCount}회</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 주요 강점 */}
                  {result?.strengths && result.strengths.length > 0 && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-green-700 font-medium mb-2">💪 주요 강점</p>
                      <ul className="text-gray-700 space-y-1">
                        {result.strengths.map((strength: string, idx: number) => (
                          <li key={idx}>• {String(strength)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 개선 사항 */}
                  {result?.improvements && result.improvements.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-blue-700 font-medium mb-2">🎯 개선 포인트</p>
                      <ul className="text-gray-700 space-y-1">
                        {result.improvements.map((improvement: string, idx: number) => (
                          <li key={idx}>• {String(improvement)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* 위험 요소 */}
                  {result?.risks && result.risks.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-yellow-700 font-medium mb-2">⚠️ 주의 사항</p>
                      <ul className="text-gray-700 space-y-1">
                        {result.risks.map((risk: string, idx: number) => (
                          <li key={idx}>• {String(risk)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        
        <Card className="border-2 rounded-xl bg-gradient-to-r from-primary/5 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI 종합 피드백
            </CardTitle>
            <CardDescription>
              전체 면접을 종합적으로 분석한 AI의 조언입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 전체 점수 및 통계 - answerResults의 평균 또는 마지막 결과 사용 */}
            {(() => {
              // answerResults에서 평균 점수 계산 또는 마지막 결과 사용
              const lastResult = answerResults.length > 0 ? answerResults[answerResults.length - 1] : null;
              const averageOf = (items: AnswerResult[], key: keyof AnswerResult) => {
                const values = items
                  .map((item) => item?.[key])
                  .filter((value) => Number.isFinite(value)) as number[];
                if (values.length === 0) return null;
                return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
              };
              const avgResult = answerResults.length > 0 ? {
                score: averageOf(answerResults, "score"),
                fluency: averageOf(answerResults, "fluency"),
                contentDepth: averageOf(answerResults, "contentDepth"),
                structure: averageOf(answerResults, "structure"),
              } : null;
              
              const displayResult = lastResult || analysisResult || avgResult;
              const hasDisplayMetrics =
                Number.isFinite(displayResult?.score) ||
                Number.isFinite(displayResult?.fluency) ||
                Number.isFinite(displayResult?.contentDepth) ||
                Number.isFinite(displayResult?.structure);

              return displayResult && hasDisplayMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/70 p-4 rounded-lg border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">종합 점수</p>
                    <p className="text-2xl font-bold text-primary">
                      {Number.isFinite(displayResult?.score) ? `${displayResult.score}점` : "데이터 없음"}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">유창성</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Number.isFinite(displayResult?.fluency) ? `${displayResult.fluency}점` : "데이터 없음"}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">내용 깊이</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Number.isFinite(displayResult?.contentDepth) ? `${displayResult.contentDepth}점` : "데이터 없음"}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">구조</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Number.isFinite(displayResult?.structure) ? `${displayResult.structure}점` : "데이터 없음"}
                    </p>
                  </div>
                </div>
              ) : null;
            })()}

            {/* 전체 전사본 (transcript) - answerResults의 모든 transcript 합치기 */}
            {(() => {
              const allTranscripts = answerResults
                .filter(r => r?.sttStatus !== "FAILED")
                .map(r => r?.transcript)
                .filter(t => t && t.trim())
                .join('\n\n');
              
              return (
                <div className="bg-white/70 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full mt-1">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-primary font-medium">📝 전체 답변 전사본</p>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {allTranscripts || "음성 인식에 실패했습니다. 다시 답변해 주세요."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 주요 강점 - answerResults의 모든 strengths 합치기 */}
            {(() => {
              const allStrengths = answerResults
                .flatMap(r => r?.strengths || [])
                .filter((s, idx, arr) => arr.indexOf(s) === idx); // 중복 제거
              
              return allStrengths.length > 0 || (analysisResult?.strengths && analysisResult.strengths.length > 0) ? (
                <div className="bg-white/70 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-full mt-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-green-700 font-medium">💪 주요 강점</p>
                      <ul className="text-gray-700 leading-relaxed space-y-1">
                        {(allStrengths.length > 0 ? allStrengths : analysisResult?.strengths || []).map((strength: string, idx: number) => (
                          <li key={idx}>• {String(strength)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* 개선 사항 - answerResults의 모든 improvements 합치기 */}
            {(() => {
              const allImprovements = answerResults
                .flatMap(r => r?.improvements || [])
                .filter((s, idx, arr) => arr.indexOf(s) === idx); // 중복 제거
              
              return allImprovements.length > 0 || (analysisResult?.improvements && analysisResult.improvements.length > 0) ? (
                <div className="bg-white/70 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full mt-1">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-blue-700 font-medium">🎯 개선 포인트</p>
                      <ul className="text-gray-700 leading-relaxed space-y-1">
                        {(allImprovements.length > 0 ? allImprovements : analysisResult?.improvements || []).map((improvement: string, idx: number) => (
                          <li key={idx}>• {String(improvement)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* 위험 요소 - answerResults의 모든 risks 합치기 */}
            {(() => {
              const allRisks = answerResults
                .flatMap(r => r?.risks || [])
                .filter((s, idx, arr) => arr.indexOf(s) === idx); // 중복 제거
              
              return allRisks.length > 0 || (analysisResult?.risks && analysisResult.risks.length > 0) ? (
                <div className="bg-white/70 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 rounded-full mt-1">
                      <MessageCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-yellow-700 font-medium">⚠️ 주의 사항</p>
                      <ul className="text-gray-700 leading-relaxed space-y-1">
                        {(allRisks.length > 0 ? allRisks : analysisResult?.risks || []).map((risk: string, idx: number) => (
                          <li key={idx}>• {String(risk)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* 분석 결과가 없을 때 */}
            {answerResults.length === 0 && !analysisResult && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                <p className="text-yellow-800">
                  AI 분석 결과를 불러오는 중입니다...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="px-8" onClick={resetInterview}>
            새 면접 시작
          </Button>
          <Button variant="ghost" className="text-primary" onClick={handleGoToProfile}>
            학습 프로필로 이동
          </Button>
        </div>
      </div>
    );
  }

    
  // --- Main 화면 렌더링 (Select 태그 적용) ---
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI 모의면접</h1>
        <p className="text-muted-foreground">실전 같은 모의면접, AI가 함께합니다</p>
      </div>

      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mic className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">음성인식 분석</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              실시간 음성인식으로 답변을 분석하고 즉시 피드백을 제공합니다.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">AI 피드백</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              발음, 속도, 어투까지 세밀하게 분석하여 개선점을 알려드립니다.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">실전 환경</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              언제 어디서든 실제 면접과 같은 환경에서 연습할 수 있습니다.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      
      <Card className="p-8">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Mic className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">면접 정보를 입력하고 시작해보세요</CardTitle>
          <CardDescription className="text-lg">
            학과, 직무 정보를 바탕으로 맞춤형 면접 질문이 생성됩니다.
          </CardDescription>
            
          {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg border border-red-300 text-sm font-medium">
                ⚠️ {error}
              </div>
          )}

        </CardHeader>
        <CardContent className="space-y-6">
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 🚨 학과 Input을 Select로 수정 */}
            <div className="space-y-2">
              <Label htmlFor="major">학과 정보</Label>
              <select
                id="major"
                value={majorInput}
                onChange={(e) => handleMajorChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>학과를 선택하세요</option>
                {MAJOR_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            {/* 🚨 직무 Input을 Select로 수정 */}
            <div className="space-y-2">
              <Label htmlFor="job">지원 직무</Label>
              <select
                id="job"
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                disabled={!majorInput || jobOptions.length === 0}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>직무를 선택하세요</option>
                {jobOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
            

          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Mic className="h-12 w-12 text-gray-500" />
            </div>
            <div className="flex justify-center space-x-4">
              <Button 
                size="lg" 
                className="px-8" 
                onClick={handleStartInterview}
                disabled={isLoading || !majorInput.trim() || !jobInput.trim() || !canStartInterview} 
              >
                {isLoading ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> 질문 생성 중...</>
                ) : (
                    <><Play className="mr-2 h-4 w-4" /> 면접 시작</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card className="border-2 rounded-xl">
        <CardHeader className="min-h-[220px] flex flex-col justify-center">
          <div className="flex items-center justify-between h-full">
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>자기소개서 기반 면접</CardTitle>
              </div>
              <CardDescription className="mt-0">
                자기소개서를 업로드하면 내용을 바탕으로 맞춤형 질문을 받을 수 있습니다
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 py-8">
          <div className="space-y-4">
            <Label htmlFor="resume">자기소개서 내용</Label>
            <Textarea
              id="resume"
              placeholder="자기소개서 내용을 입력해주세요..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={22}
              className="resize-none"
            />
            {!canStartInterview && (
              <p className="text-sm text-muted-foreground">
                자기소개서를 입력하면 면접을 시작할 수 있어요.
              </p>
            )}
          </div>
          {resumeText.trim() && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">자기소개서가 등록되었습니다</p>
                  <p className="text-sm text-green-800">면접 시작 시 자기소개서 기반 질문이 포함됩니다.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
