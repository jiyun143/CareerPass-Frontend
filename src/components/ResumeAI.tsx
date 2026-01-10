import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { FileText, Upload, Bot, CheckCircle, Edit3, X, AlertCircle } from "lucide-react";
import { createIntroductionAIFeedback } from "../api";
import ReactMarkdown from "react-markdown";
import { IntroFeedbackResponse } from "../types/feedback";

interface ResumeAIProps {
  onNavigateProfile?: () => void;
}

export function ResumeAI({ onNavigateProfile }: ResumeAIProps = {}) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'write' | 'analysis' | 'chat'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [directWriteText, setDirectWriteText] = useState('');
  const [aiResult, setAiResult] = useState<IntroFeedbackResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleGoToProfile = () => {
    if (!onNavigateProfile) return;
    onNavigateProfile();
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = () => {
    if (selectedFile) {
      setCurrentStep('analysis');
      // 분석 시뮬레이션 후 결과 페이지로 전환
      setTimeout(() => {
        setCurrentStep('chat');
      }, 2000);
    }
  };

  const handleDirectWrite = () => {
    setCurrentStep('write');
  };

  const handleCancelWrite = () => {
    setCurrentStep('upload');
    setDirectWriteText('');
  };

  const handleCompleteWrite = async () => {
    const resumeContent = directWriteText.trim();
    
    // 빈 입력 체크
    if (!resumeContent) {
      return;
    }

    // 에러 초기화 및 로딩 시작
    setError('');
    setIsAnalyzing(true);
    setCurrentStep('analysis');

    try {
      const result = await createIntroductionAIFeedback(resumeContent);
      let parsedSection = null;

      if (result?.sectionFeedback) {
        if (typeof result.sectionFeedback === "string") {
          try {
            parsedSection = JSON.parse(result.sectionFeedback);
          } catch (parseError) {
            console.error("sectionFeedback 파싱 실패:", parseError);
          }
        } else if (typeof result.sectionFeedback === "object") {
          parsedSection = result.sectionFeedback;
        }
      }

      const mappedResult: IntroFeedbackResponse = {
        feedbackText: result?.feedbackText || "",
        sectionFeedback: parsedSection
      };

      setAiResult(mappedResult);
      setCurrentStep('chat');
    } catch (err: any) {
      console.error('피드백 요청 실패:', err);
      setError("자기소개서 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setCurrentStep('write'); // 에러 시 작성 페이지로 돌아가기
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 직접 작성하기 페이지
  if (currentStep === 'write') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Edit3 className="w-8 h-8" />
            자기소개서 직접 작성
          </h1>
          <p className="text-muted-foreground">자기소개서를 직접 작성하고 AI 피드백을 받아보세요</p>
        </div>

        <Card className="border-2 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              자소서 작성 창
            </CardTitle>
            <CardDescription>
              자기소개서를 작성해 주세요. AI가 내용을 분석하여 맞춤형 피드백을 제공합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            <Textarea
              placeholder="자기소개서를 입력하세요..."
              value={directWriteText}
              onChange={(e) => {
                setDirectWriteText(e.target.value);
                setError(''); // 입력 시 에러 메시지 제거
              }}
              className="min-h-[300px] resize-none border-2 rounded-xl focus:border-primary/50 transition-colors"
              maxLength={2000}
            />
            {!directWriteText.trim() && !error && (
              <p className="text-sm text-red-600">자기소개서를 입력해주세요.</p>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {directWriteText.length} / 2000자
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelWrite}
                  className="px-6"
                  disabled={isAnalyzing}
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
                <Button 
                  onClick={handleCompleteWrite}
                  disabled={!directWriteText.trim() || isAnalyzing}
                  className="px-6"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isAnalyzing ? '분석 중...' : '분석하기'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 작성 가이드 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              작성 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1">💡 효과적인 자소서 작성 팁</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• 구체적인 경험과 성과를 수치로 표현하세요</li>
                <li>• STAR 기법(상황-과제-행동-결과)을 활용하세요</li>
                <li>• 지원 직무와 관련된 역량을 강조하세요</li>
              </ul>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-1">✅ 포함하면 좋은 내용</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• 자기소개 (강점, 성격, 가치관)</li>
                <li>• 지원동기 (회사 및 직무에 대한 관심)</li>
                <li>• 경험 및 역량 (학업, 프로젝트, 경험)</li>
                <li>• 포부 및 계획 (입사 후 목표와 비전)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 분석 중 페이지
  if (currentStep === 'analysis') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Bot className="w-8 h-8" />
            자기소개서 분석 중
          </h1>
          <p className="text-muted-foreground">AI가 자기소개서를 분석하고 있습니다...</p>
        </div>

        <Card className="border-2 rounded-xl p-8">
          <CardContent className="text-center space-y-6">
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h3 className="font-medium">AI 분석 중입니다...</h3>
              <p className="text-muted-foreground">잠시만 기다려주세요. 곧 맞춤형 피드백을 제공해드리겠습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 분석 결과 페이지 (채팅 기능 제거)
  if (currentStep === 'chat') {
    const summaryText =
      aiResult?.feedbackText?.trim() ||
      aiResult?.sectionFeedback?.feedback?.trim() ||
      "";
    const originalResume =
      aiResult?.sectionFeedback?.originalResume?.trim() || directWriteText.trim();
    const regenResume = aiResult?.sectionFeedback?.regenResume?.trim() || "";
    const regenTossResume = aiResult?.sectionFeedback?.regenTossResume?.trim() || "";

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-primary flex items-center gap-2">
            <Bot className="w-8 h-8" />
            자기소개서 AI 피드백
          </h1>
          <p className="text-muted-foreground">AI가 분석한 자기소개서 피드백 결과입니다</p>
        </div>

        {/* AI 분석 결과 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              AI 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiResult ? (
              <div className="space-y-6 mt-6">
                {/* 원본 자기소개서 */}
                <section className="border rounded-lg p-4 bg-white shadow-sm">
                  <h2 className="text-lg font-semibold mb-2">📝 원본 자기소개서</h2>
                  <div 
                    className="text-gray-800 whitespace-pre-wrap break-words"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    {originalResume ? (
                      <ReactMarkdown>{originalResume}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 italic">원본 자기소개서 내용이 없습니다.</p>
                    )}
                  </div>
                </section>

                {/* AI 피드백 */}
                <section className="border rounded-lg p-4 bg-white shadow-sm">
                  <h2 className="text-lg font-semibold mb-2">💡 AI 피드백</h2>
                  <div 
                    className="prose prose-sm max-w-none text-gray-900"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    {summaryText ? (
                      <ReactMarkdown>{summaryText}</ReactMarkdown>
                    ) : (
                      <p className="text-gray-500 italic">피드백 내용이 없습니다.</p>
                    )}
                  </div>
                </section>

                {/* 개선된 자기소개서 버전 */}
                <section className="border rounded-lg p-4 bg-white shadow-sm">
                  <h2 className="text-lg font-semibold mb-2">✨ 개선된 자기소개서 버전</h2>
                  <div 
                    className="text-gray-800 whitespace-pre-wrap break-words"
                    style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  >
                    {regenResume ? (
                      <ReactMarkdown>{regenResume}</ReactMarkdown>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-yellow-800 text-sm">
                          개선된 자기소개서가 제공되지 않았습니다. 
                          <br />
                          콘솔을 확인하여 API 응답 구조를 확인해주세요.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* 토스 인재상 버전 자기소개서 */}
                {regenTossResume && (
                  <section className="border rounded-lg p-4 bg-white shadow-sm">
                    <h2 className="text-lg font-semibold mb-2">🎯 토스 인재상 버전 자기소개서</h2>
                    <div 
                      className="text-gray-800 whitespace-pre-wrap break-words"
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      <ReactMarkdown>{regenTossResume}</ReactMarkdown>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-600">피드백을 불러오는 중...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" className="text-primary" onClick={handleGoToProfile}>
            학습 프로필로 이동
          </Button>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">자기소개서 AI</h1>
        <p className="text-muted-foreground">AI와 함께하는 똑똑한 자소서 작성</p>
      </div>

      {/* 기능 소개 카드 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">자소서 업로드</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              기존 자기소개서를 업로드하면 AI가 맞춤형 피드백을 제공합니다.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">AI 피드백</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              강점이 돋보이도록 글을 다듬는 구체적인 가이드를 받을 수 있습니다.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">예상 질문 생성</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              자소서 내용을 바탕으로 예상 면접 질문을 자동으로 생성합니다.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* 메인 작업 영역 */}
      <Card className="border-2 rounded-xl p-8">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>자기소개서를 업로드해 주세요</CardTitle>
          <CardDescription>
            AI가 당신의 자소서를 분석하여 맞춤형 피드백을 제공합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={handleFileSelect}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium mb-2">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-sm text-muted-foreground">PDF, DOC, DOCX 파일을 지원합니다 (최대 10MB)</p>
            
            {selectedFile && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">선택된 파일: <span className="font-medium">{selectedFile.name}</span></p>
                <p className="text-xs text-muted-foreground">크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}
          </div>

          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="px-8" onClick={handleFileSelect}>
              <Upload className="mr-2 h-4 w-4" />
              파일 선택
            </Button>
            {selectedFile && (
              <Button size="lg" className="px-8" onClick={handleFileUpload}>
                <Bot className="mr-2 h-4 w-4" />
                분석 시작
              </Button>
            )}
            <Button variant="outline" size="lg" className="px-8" onClick={handleDirectWrite}>
              <Edit3 className="mr-2 h-4 w-4" />
              직접 작성하기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 예시 피드백 */}
      <Card className="border-2 rounded-xl">
        <CardHeader>
          <CardTitle>AI 피드백 예시</CardTitle>
          <CardDescription>실제 AI가 제공하는 피드백의 예시입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 개선 제안</h4>
            <p className="text-blue-800">
              "도전적인 프로젝트를 수행했습니다" → "6개월간 팀 리더로서 15명의 개발자와 협업하여 
              사용자 만족도를 30% 향상시킨 프로젝트를 성공적으로 완수했습니다"
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2">✅ 강점 분석</h4>
            <p className="text-green-800">
              리더십과 협업 능력이 잘 드러나며, 구체적인 성과 지표가 포함되어 설득력이 높습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
