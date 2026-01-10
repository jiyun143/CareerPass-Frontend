import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  User, 
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  Trash2,
  Star,
  Settings,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import {
  getFeedbackById,
  getMe,
  getMyIntroductionFeedbacks,
  getInterviewHistory,
  updateMyProfile,
  updateFeedbackTitle,
  deleteFeedback,
  deleteInterviewFeedback
} from "../api";
import {
  parseSectionFeedback,
  isInterviewSection,
  isIntroductionSection
} from "../utils/parseSectionFeedback";
import type { ParsedSectionFeedback } from "../utils/parseSectionFeedback";
import type { FeedbackDetail, FeedbackSummary, InterviewSessionSummary } from "../types/feedback";

interface LearningProfileProps {
  userId?: number;
  email?: string;
  onProfileComplete?: () => void;
  onProfileInfoChange?: (userInfo: { name: string; major: string; targetJob: string }) => void;
  onNavigateInterviewResult?: (interviewId: number) => void;
}

export function LearningProfile({
  userId,
  email,
  onProfileComplete,
  onProfileInfoChange,
  onNavigateInterviewResult
}: LearningProfileProps = {}) {
  const emailFromMe = email || "";
  const [userInfo, setUserInfo] = useState({
    id: null as number | null,
    name: "",
    email: emailFromMe,
    major: "",
    targetJob: ""
  });
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isProfileStatusLoaded, setIsProfileStatusLoaded] = useState(false);
  const [meProfile, setMeProfile] = useState<any>(null);

  const [isProfileSetupMode, setIsProfileSetupMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: emailFromMe,
    major: "",
    targetJob: ""
  });
  const [showInterviewDetail, setShowInterviewDetail] = useState(false);
  const [showResumeDetail, setShowResumeDetail] = useState(false);
  const [selectedFeedbackDetail, setSelectedFeedbackDetail] = useState<FeedbackDetail | null>(null);
  const [selectedSectionFeedback, setSelectedSectionFeedback] = useState<ParsedSectionFeedback>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [introDeleteError, setIntroDeleteError] = useState<string | null>(null);
  const [interviewDeleteError, setInterviewDeleteError] = useState<string | null>(null);
  const [deletingIntroIds, setDeletingIntroIds] = useState<number[]>([]);
  const [deletingInterviewIds, setDeletingInterviewIds] = useState<number[]>([]);

  const updateProfileCompletionFromMe = async () => {
    try {
      const me = await getMe();
      setMeProfile(me);
      setUserInfo({
        id: me?.id ?? null,
        name: me?.nickname || "",
        email: me?.email || emailFromMe,
        major: me?.major || "",
        targetJob: me?.targetJob || ""
      });
      const isComplete =
        me?.profileCompleted === true
          ? true
          : me?.profileCompleted === false
            ? false
            : !!(me?.major && me?.targetJob);
      setIsProfileComplete(isComplete);
    } catch (error) {
      console.error("프로필 상태 조회 실패:", error);
      setIsProfileComplete(false);
    } finally {
      setIsProfileStatusLoaded(true);
    }
  };

  useEffect(() => {
    updateProfileCompletionFromMe();
  }, []);

  useEffect(() => {
    if (!selectedFeedbackDetail) return;
    setTitleDraft(selectedFeedbackDetail.title || "");
    setTitleError(null);
    setIsEditingTitle(false);
  }, [selectedFeedbackDetail?.id]);

  useEffect(() => {
    if (!emailFromMe) return;
    setUserInfo((prev) => {
      if (prev.email === emailFromMe) return prev;
      const next = { ...prev, email: emailFromMe };
      if (import.meta.env.DEV) {
        console.log("[LearningProfile] email prefilled from /me", emailFromMe);
      }
      return next;
    });
    setEditForm((prev) => ({ ...prev, email: emailFromMe }));
  }, [emailFromMe]);

  const normalizeListResponse = (res: any): FeedbackSummary[] => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  const sortByCreatedAtDesc = (items: FeedbackSummary[]) => {
    return [...items].sort((a, b) => {
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  };

  const coerceNumber = (value: unknown): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const formatDurationFromSec = (totalDurationSec?: number | null) => {
    const safeSeconds = coerceNumber(totalDurationSec);
    if (!safeSeconds || safeSeconds <= 0) return "-";
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = Math.floor(safeSeconds % 60);
    return `${minutes}분 ${seconds}초`;
  };

  const trimmedMajor = editForm.major.trim();
  const trimmedTargetJob = editForm.targetJob.trim();
  const isProfileFormValid = !!(trimmedMajor && trimmedTargetJob);
  const profileValidationMessage = isProfileFormValid
    ? null
    : "전공과 목표 직무를 입력해주세요.";
  const profileSetupMessage = isProfileComplete
    ? "프로필 정보를 수정할 수 있습니다."
    : "학습 프로필 정보를 입력해주세요.";
  const isProfileSetupActive = isProfileSetupMode || (isProfileStatusLoaded && !isProfileComplete);

  useEffect(() => {
    if (isProfileStatusLoaded && !isProfileComplete) {
      handleStartProfileSetup();
    }
  }, [isProfileStatusLoaded, isProfileComplete]);

  const handleEditTitle = () => {
    setTitleDraft(selectedFeedbackDetail?.title || "");
    setTitleError(null);
    setIsEditingTitle(true);
  };

  const handleCancelTitleEdit = () => {
    setTitleDraft(selectedFeedbackDetail?.title || "");
    setTitleError(null);
    setIsEditingTitle(false);
  };

  const handleSaveTitle = async () => {
    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      setTitleError("제목을 입력해주세요.");
      return;
    }
    if (nextTitle.length > 50) {
      setTitleError("제목은 50자 이내로 입력해주세요.");
      return;
    }
    if (!selectedFeedbackDetail?.id) {
      setTitleError("피드백 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setIsSavingTitle(true);
      setTitleError(null);
      await updateFeedbackTitle(selectedFeedbackDetail.id, nextTitle);
      setSelectedFeedbackDetail((prev) => {
        if (!prev) return prev;
        return { ...prev, title: nextTitle };
      });
      if (selectedSectionFeedback && isInterviewSection(selectedSectionFeedback)) {
        setInterviewFeedbacks((prev) =>
          prev.map((item) =>
            item.id === selectedFeedbackDetail.id ? { ...item, title: nextTitle } : item
          )
        );
      } else if (selectedSectionFeedback && isIntroductionSection(selectedSectionFeedback)) {
        setRecentIntroductions((prev) =>
          prev.map((item) =>
            item.id === selectedFeedbackDetail.id ? { ...item, title: nextTitle } : item
          )
        );
      }
      setIsEditingTitle(false);
    } catch (error) {
      console.error("피드백 제목 수정 실패:", error);
      setTitleError("제목을 저장하지 못했습니다.");
    } finally {
      setIsSavingTitle(false);
    }
  };

  // 자기소개서 리스트 로드
  const loadIntroductions = async () => {
    try {
      setIsLoadingIntroductions(true);
      setIntroLoadError(null);
      const response = await getMyIntroductionFeedbacks();
      const intros = sortByCreatedAtDesc(normalizeListResponse(response));
      setRecentIntroductions(intros);
    } catch (e) {
      console.error('자기소개서 피드백 리스트 로드 실패:', e);
      setIntroLoadError("자기소개서 피드백을 불러오지 못했습니다.");
      // 에러 발생 시 빈 배열로 설정
      setRecentIntroductions([]);
    } finally {
      setIsLoadingIntroductions(false);
    }
  };

  const loadInterviewFeedbacks = async () => {
    try {
      setIsLoadingInterviews(true);
      setInterviewLoadError(null);
      const response = await getInterviewHistory();
      const interviews = sortByCreatedAtDesc(
        normalizeListResponse(response) as InterviewSessionSummary[]
      );
      setInterviewFeedbacks(interviews);
    } catch (e) {
      console.error('면접 피드백 리스트 로드 실패:', e);
      setInterviewLoadError("면접 피드백을 불러오지 못했습니다.");
      setInterviewFeedbacks([]);
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  useEffect(() => {
    loadIntroductions();
    loadInterviewFeedbacks();

    // 자기소개서 저장 이벤트 리스너 등록
    const handleIntroductionSaved = () => {
      console.log('자기소개서 저장 이벤트 감지, 리스트 갱신 중...');
      // 짧은 딜레이 후 리스트 다시 로드 (서버 반영 시간 고려)
      setTimeout(() => {
        loadIntroductions();
      }, 500);
    };

    const handleFeedbackIntroductionCreated = () => {
      loadIntroductions();
    };

    const handleFeedbackInterviewCreated = () => {
      loadInterviewFeedbacks();
    };

    const handleFeedbackInterviewTitleUpdated = () => {
      loadInterviewFeedbacks();
    };

    window.addEventListener('introductionSaved', handleIntroductionSaved);
    window.addEventListener('feedback:introduction:created', handleFeedbackIntroductionCreated);
    window.addEventListener('feedback:interview:created', handleFeedbackInterviewCreated);
    window.addEventListener('feedback:interview:title-updated', handleFeedbackInterviewTitleUpdated);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('introductionSaved', handleIntroductionSaved);
      window.removeEventListener('feedback:introduction:created', handleFeedbackIntroductionCreated);
      window.removeEventListener('feedback:interview:created', handleFeedbackInterviewCreated);
      window.removeEventListener('feedback:interview:title-updated', handleFeedbackInterviewTitleUpdated);
    };
  }, []);

  const [interviewFeedbacks, setInterviewFeedbacks] = useState<InterviewSessionSummary[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
  const [interviewLoadError, setInterviewLoadError] = useState<string | null>(null);

  // 자기소개서 리스트 상태
  const [recentIntroductions, setRecentIntroductions] = useState<FeedbackSummary[]>([]);
  const [isLoadingIntroductions, setIsLoadingIntroductions] = useState(false);
  const [introLoadError, setIntroLoadError] = useState<string | null>(null);

  const handleStartProfileSetup = () => {
    setEditForm({
      name: userInfo.name || "",
      email: userInfo.email || emailFromMe,
      major: userInfo.major || "",
      targetJob: userInfo.targetJob || ""
    });
    setSaveError(null);
    setIsProfileSetupMode(true);
  };

  const handleExitProfileSetup = () => {
    if (!isProfileComplete) return;
    setSaveError(null);
    setIsProfileSetupMode(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editForm.name.trim();
    const trimmedMajor = editForm.major.trim();
    const trimmedTargetJob = editForm.targetJob.trim();
    if (!trimmedMajor || !trimmedTargetJob) {
      setSaveError("전공과 목표 직무를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateMyProfile({
        nickname: trimmedName || undefined,
        major: trimmedMajor,
        targetJob: trimmedTargetJob
      });

      const nextUserInfo = {
        id: userInfo.id,
        name: trimmedName,
        email: userInfo.email || emailFromMe,
        major: trimmedMajor,
        targetJob: trimmedTargetJob
      };
      setUserInfo(nextUserInfo);

      if (onProfileInfoChange) {
        onProfileInfoChange({
          name: nextUserInfo.name,
          major: nextUserInfo.major,
          targetJob: nextUserInfo.targetJob
        });
      }

      if (onProfileComplete) {
        onProfileComplete();
      }
      await updateProfileCompletionFromMe();
      setIsProfileSetupMode(false);
    } catch (err: any) {
      console.error('프로필 저장 실패:', err);
      const status = err?.status;
      if (status === 400) {
        setSaveError("전공과 목표 직무를 입력해주세요.");
      } else if (status === 403) {
        setSaveError("프로필을 저장할 권한이 없습니다.");
      } else {
        setSaveError(err?.message || '프로필 저장 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedbackClick = async (feedbackId: number) => {
    setDetailError(null);
    setIsLoadingDetail(true);
    setShowInterviewDetail(false);
    setShowResumeDetail(false);
    setSelectedFeedbackDetail(null);
    setSelectedSectionFeedback(null);

    try {
      const detail = await getFeedbackById(feedbackId);
      setSelectedFeedbackDetail(detail);

      const rawSectionFeedback = detail?.sectionFeedback || "";
      const parsed = parseSectionFeedback(rawSectionFeedback);
      if (!parsed) {
        console.error("sectionFeedback 파싱 실패:", rawSectionFeedback);
        setDetailError("피드백 데이터를 불러오지 못했어요");
        return;
      }

      setSelectedSectionFeedback(parsed);

      if (isInterviewSection(parsed)) {
        setShowInterviewDetail(true);
        return;
      }

      if (isIntroductionSection(parsed)) {
        setShowResumeDetail(true);
        return;
      }

      console.error("피드백 유형 판별 실패:", rawSectionFeedback);
      setDetailError("피드백 데이터를 불러오지 못했어요");
    } catch (err) {
      console.error("피드백 상세 로드 실패:", err);
      setDetailError("피드백 상세를 불러오지 못했습니다.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetailIfMatching = (feedbackId: number) => {
    if (selectedFeedbackDetail?.id !== feedbackId) return;
    setShowInterviewDetail(false);
    setShowResumeDetail(false);
    setSelectedFeedbackDetail(null);
    setSelectedSectionFeedback(null);
    setDetailError(null);
  };

  const handleDeleteFeedback = async (feedbackId: number, type: "intro" | "interview") => {
    const confirmed = window.confirm("정말 삭제할까요? 삭제 후 복구할 수 없습니다.");
    if (!confirmed) return;

    if (type === "intro") {
      setIntroDeleteError(null);
      setDeletingIntroIds((prev) => (prev.includes(feedbackId) ? prev : [...prev, feedbackId]));
    } else {
      setInterviewDeleteError(null);
      setDeletingInterviewIds((prev) => (prev.includes(feedbackId) ? prev : [...prev, feedbackId]));
    }

    try {
      if (type === "intro") {
        await deleteFeedback(feedbackId);
        setRecentIntroductions((prev) => prev.filter((item) => item.id !== feedbackId));
      } else {
        await deleteInterviewFeedback(feedbackId);
        setInterviewFeedbacks((prev) => prev.filter((item) => item.interviewId !== feedbackId));
      }
      closeDetailIfMatching(feedbackId);
    } catch (err: any) {
      const status = err?.status;
      const message =
        status === 403
          ? "삭제 권한이 없습니다."
          : status === 404
            ? "이미 삭제된 항목입니다."
            : "삭제 중 오류가 발생했습니다.";
      if (type === "intro") {
        setIntroDeleteError(message);
      } else {
        setInterviewDeleteError(message);
      }
    } finally {
      if (type === "intro") {
        setDeletingIntroIds((prev) => prev.filter((id) => id !== feedbackId));
      } else {
        setDeletingInterviewIds((prev) => prev.filter((id) => id !== feedbackId));
      }
    }
  };

  const handleInterviewHistoryClick = (interviewId: number) => {
    if (!onNavigateInterviewResult) return;
    onNavigateInterviewResult(interviewId);
  };

  // 면접 상세 화면
  if (showInterviewDetail) {
    const interviewQuestions = selectedSectionFeedback?.questions || [];
    const interviewSummary = selectedSectionFeedback?.summary;
    const rawTotalScore =
      interviewSummary?.totalScore ?? selectedFeedbackDetail?.totalScore ?? null;
    const interviewOverallScore = coerceNumber(rawTotalScore);
    const interviewOverallFeedback =
      interviewSummary?.overallFeedback ||
      selectedFeedbackDetail?.feedbackText ||
      "";
    const interviewCreatedAt = selectedFeedbackDetail?.createdAt || "";
    const interviewTitle = selectedFeedbackDetail?.title && selectedFeedbackDetail.title.trim().length > 0
      ? selectedFeedbackDetail.title
      : "면접";
    const totalTimeMs = coerceNumber(interviewSummary?.totalTimeMs ?? null);
    const totalTimeText = totalTimeMs ? `${Math.round(totalTimeMs / 1000)}초` : "정보 없음";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInterviewDetail(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            면접 피드백 상세
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
        </div>

        {isLoadingDetail && (
          <div className="text-center py-6 text-muted-foreground">
            피드백 상세를 불러오는 중...
          </div>
        )}

        {/* 면접 정보 카드 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              면접 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">작성 날짜</p>
                <p className="font-medium">{interviewCreatedAt || "정보 없음"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 소요 시간</p>
                <p className="font-medium">{totalTimeText}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 종합 점수 카드 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              종합 점수
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center p-6">
            <p className="text-5xl font-bold text-primary">
              {interviewOverallScore !== null ? `${interviewOverallScore}점` : "정보 없음"}
            </p>
            <p className="text-muted-foreground mt-2">AI가 평가한 면접 종합 점수입니다.</p>
          </CardContent>
        </Card>

        {/* 질문별 상세 결과 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle>질문별 상세 결과</CardTitle>
            <CardDescription>각 질문에 대한 요약 정보를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {interviewQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">질문 정보가 없습니다.</p>
            ) : (
              interviewQuestions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">질문 {index + 1}</h4>
                  </div>
                  <p className="text-muted-foreground">{question}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI 종합 피드백 */}
        <Card className="border-2 rounded-xl bg-gradient-to-r from-primary/5 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              AI 종합 피드백
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/70 p-6 rounded-lg border border-primary/20">
              <div
                className="text-gray-800 prose prose-sm max-w-none leading-relaxed"
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              >
                {interviewOverallFeedback ? (
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => (
                        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200" {...props} />
                      ),
                      p: ({node, ...props}) => (
                        <p className="mb-4 text-gray-700 leading-relaxed" {...props} />
                      ),
                      ol: ({node, ...props}) => (
                        <ol className="list-decimal list-outside ml-6 mb-4 space-y-2" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="list-disc list-outside ml-6 mb-4 space-y-2" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="mb-2 text-gray-700 leading-relaxed" {...props} />
                      ),
                      strong: ({node, ...props}) => (
                        <strong className="font-semibold text-gray-900" {...props} />
                      )
                    }}
                  >
                    {interviewOverallFeedback}
                  </ReactMarkdown>
                ) : (
                  <p className="text-sm text-muted-foreground">피드백 내용이 없습니다.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 자소서 상세 화면
  if (showResumeDetail) {
    const resumeTitle = selectedFeedbackDetail?.title && selectedFeedbackDetail.title.trim().length > 0
      ? selectedFeedbackDetail.title
      : "자기소개서";
    const resumeCreatedAt = selectedFeedbackDetail?.createdAt || "";
    const originalResume = selectedSectionFeedback?.originalResume || "";
    const feedbackText =
      selectedSectionFeedback?.feedback || selectedFeedbackDetail?.feedbackText || "";
    const regenResume = selectedSectionFeedback?.regenResume || "";
    const regenTossResume = selectedSectionFeedback?.regenTossResume || "";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowResumeDetail(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <FileText className="w-8 h-8" />
            자소서 피드백 상세
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
                <span>{resumeTitle}</span>
                {resumeCreatedAt ? <span>· {resumeCreatedAt}</span> : null}
                <Button size="sm" variant="ghost" onClick={handleEditTitle}>
                  수정
                </Button>
              </>
            )}
          </div>
          {titleError && (
            <p className="text-sm text-red-600">{titleError}</p>
          )}
        </div>

        {isLoadingDetail && (
          <div className="text-center py-6 text-muted-foreground">
            피드백 상세를 불러오는 중...
          </div>
        )}

        {/* 자소서 기본 정보 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              자소서 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">제목</p>
                <p className="font-medium">{resumeTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">작성 날짜</p>
                <p className="font-medium">{resumeCreatedAt || "정보 없음"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">피드백 상태</p>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1">
                  피드백 완료
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 원본 자기소개서 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              원본 자기소개서
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📝 원본 자기소개서</h4>
              {originalResume ? (
                <div className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                  <ReactMarkdown>{originalResume}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                  원본 자기소개서 내용이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI 피드백 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              AI 피드백
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              {feedbackText ? (
                <div className="text-yellow-900 whitespace-pre-wrap leading-relaxed">
                  <ReactMarkdown>{feedbackText}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-yellow-900 whitespace-pre-wrap leading-relaxed">
                  피드백 내용이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI 수정 자기소개서 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              AI 수정 자기소개서
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">✨ AI가 수정해준 자기소개서</h4>
              {regenResume ? (
                <div className="text-green-800 whitespace-pre-wrap leading-relaxed">
                  <ReactMarkdown>{regenResume}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-green-800 whitespace-pre-wrap leading-relaxed">
                  수정된 자기소개서 내용이 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 토스 인재상 버전 자기소개서 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              토스 인재상 버전 자기소개서
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-2">🎯 토스 인재상 버전 자기소개서</h4>
              {regenTossResume ? (
                <div className="text-purple-800 whitespace-pre-wrap leading-relaxed">
                  <ReactMarkdown>{regenTossResume}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-purple-800 whitespace-pre-wrap leading-relaxed">
                  토스 버전 자기소개서가 없습니다.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 로딩 중일 때
  if (!isProfileStatusLoaded) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#051243] mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isProfileSetupActive) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <User className="w-8 h-8" />
            학습 프로필 설정
          </h1>
          <p className="text-muted-foreground">{profileSetupMessage}</p>
        </div>

        {!isProfileComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              학습 프로필(전공/목표 직무) 설정 후 이용 가능합니다.
            </p>
          </div>
        )}

        <Card className="border-2 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              프로필 정보 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{saveError}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={editForm.name}
                onChange={(e) => {
                  setEditForm({ ...editForm, name: e.target.value });
                  setSaveError(null);
                }}
                disabled={isSaving}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={editForm.email} readOnly disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label>전공</Label>
              <Input
                value={editForm.major}
                onChange={(e) => {
                  setEditForm({ ...editForm, major: e.target.value });
                  setSaveError(null);
                }}
                disabled={isSaving}
                placeholder="전공을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>목표 직무</Label>
              <Input
                value={editForm.targetJob}
                onChange={(e) => {
                  setEditForm({ ...editForm, targetJob: e.target.value });
                  setSaveError(null);
                }}
                disabled={isSaving}
                placeholder="목표 직무를 입력하세요"
              />
            </div>
            {!isProfileFormValid && profileValidationMessage && !saveError && (
              <p className="text-sm text-red-600">{profileValidationMessage}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveProfile} className="flex-1" disabled={isSaving || !isProfileFormValid}>
                {isSaving ? "저장 중..." : "저장"}
              </Button>
              {isProfileComplete && (
                <Button
                  variant="outline"
                  onClick={handleExitProfileSetup}
                  className="flex-1"
                  disabled={isSaving}
                >
                  취소
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="space-y-2">
        <h1 className="text-primary flex items-center gap-2">
          <User className="w-8 h-8" />
          학습 프로필
        </h1>
        <p className="text-muted-foreground">
          개인 정보, 성취 기록, 그리고 최근 활동을 확인하세요
        </p>
      </div>

      {/* 기본 정보 카드 */}
      <Card className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              기본 정보
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleStartProfileSetup}
              className="flex items-center gap-2 rounded-lg"
            >
              <Settings className="w-4 h-4" />
              프로필 수정
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 학습프로필 상태 안내 문구 */}
          {isProfileStatusLoaded && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                저장된 학습 프로필입니다. 필요하다면 언제든 수정할 수 있습니다.
              </p>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">이름</p>
              <p className="font-medium">{userInfo.name || "이름 미설정"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="font-medium">{userInfo.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">전공</p>
              <p className="font-medium">{userInfo.major || "전공 미설정"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">목표 직무</p>
              <p className="font-medium">{userInfo.targetJob || "목표 직무 미설정"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingDetail && (
        <div className="text-center text-muted-foreground">
          피드백 상세를 불러오는 중...
        </div>
      )}
      {detailError && (
        <div className="text-center text-red-600">
          {detailError}
        </div>
      )}

      {/* 최근 면접 기록 섹션 */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          최근 면접 기록
        </h2>
        {interviewDeleteError && (
          <div className="text-sm text-red-600">{interviewDeleteError}</div>
        )}

        {isLoadingInterviews ? (
          <div className="text-center py-8 text-muted-foreground">
            면접 피드백 리스트를 불러오는 중...
          </div>
        ) : interviewLoadError ? (
          <div className="text-center py-8 text-red-600">
            {interviewLoadError}
          </div>
        ) : interviewFeedbacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 저장된 면접 피드백 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {interviewFeedbacks.map((interview, index) => {
              const interviewId = interview.interviewId ?? null;
              const title =
                interview.title && interview.title.trim().length > 0
                  ? interview.title
                  : `면접 ${index + 1}`;
              const subtitle =
                interview.jobApplied && interview.jobApplied.trim().length > 0
                  ? interview.jobApplied
                  : "";
              const status = (interview as any)?.status;
              const isCompleted =
                status ? status === "COMPLETED" : (interview as any)?.isCompleted ?? (interview as any)?.completed ?? true;
              const durationText = formatDurationFromSec(interview.totalDurationSec ?? null);
              const questionCountValue = coerceNumber(interview.questionCount);
              const questionCountText = questionCountValue !== null ? `${questionCountValue}개` : "-";
              const averageScoreValue = coerceNumber(interview.averageScore);
              const averageScoreText =
                averageScoreValue !== null ? `${averageScoreValue.toFixed(1)}점` : "-";

              return (
              <Card
                key={interviewId ?? title}
                className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20"
                onClick={() => {
                  if (!interviewId) return;
                  handleInterviewHistoryClick(interviewId);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-lg">{title}</p>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1">
                          피드백 완료
                        </Badge>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        disabled={!interviewId || deletingInterviewIds.includes(interviewId)}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (!interviewId) return;
                          handleDeleteFeedback(interviewId, "interview");
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {interviewId && deletingInterviewIds.includes(interviewId) ? "삭제 중..." : "삭제"}
                      </Button>
                    </div>
                  </div>
                  {subtitle ? (
                    <p className="text-sm text-gray-600 mb-3">지원 직무: {subtitle}</p>
                  ) : null}
                  <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {durationText}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {questionCountText}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {averageScoreText}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar className="w-3 h-3" />
                    {interview.createdAt}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 최근 자소서 기록 섹션 */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          최근 자소서 기록
        </h2>
        {introDeleteError && (
          <div className="text-sm text-red-600">{introDeleteError}</div>
        )}
        
        {isLoadingIntroductions ? (
          <div className="text-center py-8 text-muted-foreground">
            자기소개서 피드백 리스트를 불러오는 중...
          </div>
        ) : introLoadError ? (
          <div className="text-center py-8 text-red-600">
            {introLoadError}
          </div>
        ) : recentIntroductions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 저장된 자기소개서 학습 기록이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {recentIntroductions.map((intro) => {
              const title = intro.title && intro.title.trim().length > 0
                ? intro.title
                : "자기소개서";
              const summary = "AI가 분석한 핵심 개선 포인트가 정리된 자기소개서입니다.";

              return (
                <Card 
                  key={intro.id} 
                  className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20"
                  onClick={() => handleFeedbackClick(intro.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-lg">{title}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1">
                          피드백 완료
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={deletingIntroIds.includes(intro.id)}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleDeleteFeedback(intro.id, "intro");
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {deletingIntroIds.includes(intro.id) ? "삭제 중..." : "삭제"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mb-3 text-gray-600 line-clamp-2">{summary}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {intro.createdAt}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
