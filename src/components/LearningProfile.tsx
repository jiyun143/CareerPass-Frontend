import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// 백엔드 API 호출 제거 (localStorage만 사용)
import { 
  User, 
  GraduationCap, 
  Target, 
  BookOpen,
  Award,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Star,
  Settings,
  X,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { fetchUserLearningProfile, updateUserProfile } from "../api";

// 하드코딩된 자기소개서 피드백 (사용자 제공 내용 기반)
const hardcodedFeedback = `## 전체적인 평가
제공해주신 자기소개서는 시스템소프트웨어 개발자로서의 목표와 이를 위해 준비해 온 경험들이 잘 드러나 있습니다. 특히 '사용자가 보지 못하는 곳의 안정성을 책임지는 사람'이라는 표현을 통해 백엔드 및 시스템 영역에 대한 방향성이 분명하게 전달됩니다. 다만, 각 경험 간의 연결성과 구체적인 기술 스택/성과를 조금 더 보완하면 더 설득력 있는 자기소개서가 될 수 있습니다.

## 강점 분석
1. **진로 선택의 일관성**
   - 컴퓨터공학과 전공 선택부터 백엔드/시스템 개발자를 목표로 한 이유까지 논리적으로 이어져 있습니다.
   - ‘눈에 보이지 않는 영역의 안정성을 책임지는 사람’에 매력을 느꼈다는 부분은 지원 직무와 매우 잘 맞는 메시지입니다.

2. **안정성에 대한 문제의식**
   - 서버, 인프라, 시스템 레벨에서의 안정성을 중요하게 생각하는 태도가 잘 드러나 있습니다.
   - 특히 장애 상황, 예측 불가능한 트래픽, 예외 케이스 처리 등 시스템 관점의 사고를 하고 있다는 점이 돋보입니다.

3. **데이터 기반 문제 해결 태도**
   - 단순히 '열심히 했다'가 아니라, 로그 분석, 지표 확인, 병목 구간 파악 등의 과정을 통해 문제를 해결하려는 태도가 강점입니다.

4. **협업과 커뮤니케이션에 대한 인식**
   - 팀 프로젝트에서의 역할, 프론트엔드와의 소통, API 스펙 조율 등 협업 경험을 언급한 점이 긍정적입니다.

## 개선이 필요한 부분
1. **구체적인 경험과 수치 보강**
   - 예: "API 응답 속도를 개선했다", "안정성을 높였다"는 식의 표현보다는  
     - *어떤 상황에서* (트래픽, 장애 유형 등)
     - *어떤 지표를 기준으로* (응답 시간, 에러율 등)
     - *얼마나 개선했는지* (예: 40% 단축, 에러율 30% 감소 등)
     를 함께 적어주면 임팩트가 훨씬 커집니다.

2. **기술 스택 명시**
   - 사용한 언어, 프레임워크, 데이터베이스, 인프라 환경 등을 조금 더 구체적으로 언급하면 '시스템소프트웨어 개발자'로서의 역량이 더 분명하게 드러납니다.
   - 예: Spring / Node.js / NestJS / MySQL / Redis / Kafka / Docker / Kubernetes 등 실제로 다뤄본 기술이 있다면 자연스럽게 녹여내세요.

3. **토스(또는 지원 회사)와의 연결 강화**
   - 단순히 "안정성이 중요한 회사라서 끌렸다"가 아니라,
     - 해당 회사의 기술 블로그, 발표, 아키텍처 사례
     - 사용하는 기술 스택
     - 서비스 철학(예: 토스의 '집요함', '데이터 기반 의사결정' 등)
     과 본인의 경험을 연결해 주면 설득력이 높아집니다.

4. **문항 구조화**
   - 하나의 긴 에세이 형식보다는, 문항별로 메시지를 분리하거나, 문단별로 주제를 명확히 하는 것이 좋습니다.
   - 예를 들어:
     1) 지원 동기 및 진로 선택 배경  
     2) 안정성을 중시하게 된 계기와 관련 경험  
     3) 데이터 기반 문제 해결 경험  
     4) 협업 경험 및 커뮤니케이션 스타일  
     5) 입사 후 기여하고 싶은 부분  
     으로 나누면 읽는 사람이 이해하기 훨씬 편합니다.

## 문장/표현 측면 피드백
- 전체적으로 문장은 매끄럽고 한국어 표현도 자연스럽습니다.
- 다만, 다음과 같은 점을 신경 쓰면 더 좋아질 수 있습니다.
  - 비슷한 의미의 문장이 반복되지 않도록 정리
  - "열심히", "최선을 다해" 같은 추상적인 표현보다, 구체적인 행동과 결과 위주로 작성
  - 한 문단에 너무 많은 메시지를 담지 않기 (핵심 1~2개만 남기기)

## AI 수정 자기소개서 활용 팁
- AI가 생성해준 수정본(\`regen_resume\`)은 그대로 제출용으로 쓰기보다는,
  - 구조(문단 구성, 흐름)
  - 표현 방식(강조하는 부분, 정리된 문장)
  을 참고용으로 활용하는 것을 추천합니다.
- 특히, 본인이 실제로 경험하지 않은 내용이나 과장된 표현이 포함되지 않도록 반드시 본인의 언어로 재작성하는 과정이 필요합니다.

## 종합 정리
- 현재 자기소개서는 **방향성(시스템소프트웨어/백엔드 개발자)**, **가치관(안정성, 책임감)**, **문제 해결 태도(데이터 기반 분석)** 측면에서 매우 좋은 기반을 갖추고 있습니다.
- 여기에 **구체적인 수치/지표**, **기술 스택**, **회사와의 명확한 연결점**을 보강하면 실제 현업 개발자/면접관에게도 강하게 각인되는 자기소개서가 될 수 있습니다.

앞으로는 실제 프로젝트 코드와 시스템 구성도를 기반으로, 성능 개선이나 장애 대응 경험을 더 쌓아가면서 이를 자기소개서와 포트폴리오에 구조적으로 정리해 보시면 좋겠습니다.`;

interface LearningProfileProps {
  userId?: number;
  email?: string;
  onProfileComplete?: () => void;
  onProfileInfoChange?: (userInfo: { name: string; major: string; targetJob: string }) => void;
}

export function LearningProfile({ userId, email, onProfileComplete, onProfileInfoChange }: LearningProfileProps = {}) {
  const emailFromMe = email || "";
  const [userInfo, setUserInfo] = useState({
    id: null as number | null,
    name: "",
    email: emailFromMe,
    major: "",
    targetJob: ""
  });
  // 학습프로필 완료 여부 계산 함수
  const calculateProfileCompleted = (info: typeof userInfo): boolean => {
    return !!(info.name && info.name.trim() !== "" && 
              info.major && info.major.trim() !== "" && 
              info.targetJob && info.targetJob.trim() !== "");
  };

  const [profileCompleted, setProfileCompleted] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: emailFromMe,
    major: "",
    targetJob: ""
  });
  const [showInterviewDetail, setShowInterviewDetail] = useState(false);
  const [showResumeDetail, setShowResumeDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ========== [시연용] 사용자 정보 초기화 - 페이지 이동 시 유지, 서버 재시작 시 초기화 ==========
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // [시연용] sessionStorage를 사용하여 플래그 관리
      // - 페이지 이동 시에는 유지됨 (같은 브라우저 탭)
      // - npm run dev로 서버 재시작 후 브라우저를 새로 열면 초기화됨 (sessionStorage 특성)
      const savedFlag = sessionStorage.getItem('learningProfileSaved');
      const isSaved = savedFlag === 'true';
      
      setIsProfileSaved(isSaved);
      
      if (isSaved) {
        // [시연용] 저장된 경우에만 learningProfile에서 값 불러오기
        // 페이지 이동 시에도 값이 유지되도록 함
        const storedProfile = localStorage.getItem('learningProfile');
        if (storedProfile) {
          try {
            const parsed = JSON.parse(storedProfile);
            const loadedUserInfo = {
              id: null as number | null,
              name: parsed.name || "",
              email: parsed.email || emailFromMe,
              major: parsed.major || "",
              targetJob: parsed.targetJob || parsed.jobTitle || ""
            };
            setUserInfo(loadedUserInfo);
            setProfileCompleted(calculateProfileCompleted(loadedUserInfo));
          } catch (parseError) {
            console.error('learningProfile 파싱 실패:', parseError);
            // 파싱 실패 시 빈 값으로 시작
            const defaultUserInfo = {
              id: null as number | null,
              name: "",
              email: emailFromMe,
              major: "",
              targetJob: ""
            };
            setUserInfo(defaultUserInfo);
            setProfileCompleted(false);
          }
        } else {
          // 플래그는 true인데 데이터가 없으면 빈 값으로 시작
          const defaultUserInfo = {
            id: null as number | null,
            name: "",
            email: emailFromMe,
            major: "",
            targetJob: ""
          };
          setUserInfo(defaultUserInfo);
          setProfileCompleted(false);
        }
      } else {
        // [시연용] 저장 전 상태: 빈 값으로 시작
        // npm run dev로 서버 재시작 후 브라우저를 새로 열면 sessionStorage가 비어있어서 여기로 옴
        const defaultUserInfo = {
          id: null as number | null,
          name: "",
          email: emailFromMe,
          major: "",
          targetJob: ""
        };
        setUserInfo(defaultUserInfo);
        setProfileCompleted(false);
      }
    } catch (error) {
      console.error('프로필 초기화 실패:', error);
      // 에러 발생 시 빈 값으로 시작
      const defaultUserInfo = {
        id: null as number | null,
        name: "",
        email: emailFromMe,
        major: "",
        targetJob: ""
      };
      setUserInfo(defaultUserInfo);
      setProfileCompleted(false);
      setIsProfileSaved(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // 자기소개서 리스트 로드
  const loadIntroductions = async () => {
    try {
      setIsLoadingIntroductions(true);
      const profile = await fetchUserLearningProfile(1);
      let intros = profile.recentIntroductions ?? [];

      // [시연용] 항상 하드코딩된 최근 자소서 1개가 "저장된 것처럼" 보이도록 추가
      const hardcodedIntro = {
        introductionId: 9999,
        title: "토스 자기소개서",
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')
      };

      const existsHardcoded = intros.some(
        (intro: any) => intro.introductionId === hardcodedIntro.introductionId
      );

      if (!existsHardcoded) {
        intros = [hardcodedIntro, ...intros];
      }

      setRecentIntroductions(intros);
    } catch (e) {
      console.error('자기소개서 리스트 로드 실패:', e);
      // 에러 발생 시 빈 배열로 설정
      setRecentIntroductions([]);
    } finally {
      setIsLoadingIntroductions(false);
    }
  };

  useEffect(() => {
    loadIntroductions();

    // 자기소개서 저장 이벤트 리스너 등록
    const handleIntroductionSaved = () => {
      console.log('자기소개서 저장 이벤트 감지, 리스트 갱신 중...');
      // 짧은 딜레이 후 리스트 다시 로드 (서버 반영 시간 고려)
      setTimeout(() => {
        loadIntroductions();
      }, 500);
    };

    window.addEventListener('introductionSaved', handleIntroductionSaved);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('introductionSaved', handleIntroductionSaved);
    };
  }, []);

  const [achievements] = useState([
    {
      type: "certification",
      title: "정보처리기사",
      date: "2024.12.15",
      status: "완료",
      grade: "합격",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200"
    },
    {
      type: "certification", 
      title: "SQLD",
      date: "2024.11.20",
      status: "완료",
      grade: "합격",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200"
    },
    {
      type: "subject",
      title: "데이터베이스 시스템",
      date: "2024.12.10",
      status: "완료",
      grade: "A+",
      credits: "3학점",
      color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      type: "subject",
      title: "자료구조와 알고리즘",
      date: "2024.11.25",
      status: "완료", 
      grade: "A",
      credits: "3학점",
      color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      type: "subject",
      title: "운영체제",
      date: "2024.11.15",
      status: "완료",
      grade: "B+",
      credits: "3학점", 
      color: "bg-blue-100 text-blue-700 border-blue-200"
    }
  ]);

  // [시연용] 하드코딩된 최근 면접 기록 (사용자 제공 자기소개서 기반)
  const [recentInterviews] = useState([
    {
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, ''),
      company: "토스",
      position: "시스템소프트웨어 개발자",
      major: "컴퓨터공학과",
      feedback: "제공된 자기소개서 기반 면접 피드백입니다.",
      rating: 4.5,
      questions: [
        "자기소개를 해주세요.",
        "백엔드 개발자로서 안정성을 중요하게 생각하는 이유와 경험을 설명해주세요.",
        "팀 프로젝트에서 협업 경험과 의견 조율 과정을 구체적으로 설명해주세요.",
        "데이터 기반 문제 해결 경험에 대해 자세히 설명하고, 어떤 데이터를 어떻게 분석했는지 말씀해주세요.",
        "토스에 지원한 동기와 입사 후 어떤 기여를 하고 싶은지 말씀해주세요."
      ],
      answers: [
        "네, 안녕하세요. 저는 '사용자가 보지 못하는 곳의 안정성을 책임지는 사람'에 매력을 느껴 백엔드 개발자를 목표로 해왔습니다. 컴퓨터공학과 전공 과정에서 자료구조·운영체제·데이터베이스 등 핵심 이론을 학습하며, 눈에 보이는 기능보다 시스템이 견고하게 동작하도록 만드는 설계와 구조에 더 큰 흥미를 느꼈습니다. 특히 서버가 예측 불가한 트래픽이나 오류 상황에서도 안정적으로 서비스를 제공해야 한다는 점에서 백엔드 개발자의 책임감과 판단력이 중요하다는 사실을 실감했고, 이러한 부분은 금융 서비스의 특성상 안정성이 핵심인 토스의 개발 문화와 가장 잘 맞닿아 있다고 느꼈습니다.",
        "백엔드 개발은 서비스의 핵심 인프라를 담당하기 때문에 안정성이 최우선이라고 생각합니다. 과거 프로젝트에서 사용자 활동 로그를 분석해 API 응답 속도 저하 구간을 찾아내고, 쿼리 구조를 개선해 평균 응답 속도를 40% 단축했던 경험이 있습니다. 이 과정에서 작은 코드 변경이나 설계 오류가 전체 서비스에 미치는 영향을 직접 체감하며 안정성의 중요성을 깨달았습니다.",
        "팀 프로젝트에서는 백엔드 개발자로서 프론트엔드 팀원과 API 스펙을 맞추는 과정에서 적극적으로 소통했습니다. 단순히 요청을 구현하는 것을 넘어, 왜 필요한지, 어떤 제약이 있는지, 더 나은 방식은 없는지를 먼저 질문하며 의견을 조율했습니다. 이를 통해 프로젝트 전체 흐름을 정리하고, 효율적인 협업을 이끌어낼 수 있었습니다.",
        "프로젝트에서 대용량 데이터 처리 시 API 응답 속도 저하 문제가 발생했습니다. 저는 사용자 활동 로그를 수집하여 데이터베이스 쿼리 패턴과 인덱스 사용 현황을 분석했습니다. 특정 쿼리가 비효율적으로 동작하고 있음을 확인하고, 인덱스를 추가하고 쿼리 구조를 최적화하여 평균 응답 속도를 40% 단축시켰습니다. 이 경험을 통해 데이터 기반으로 문제를 진단하고 해결하는 중요성을 배웠습니다.",
        "토스는 금융 서비스의 핵심인 안정성을 최우선으로 여기며, 수평적이고 데이터 기반의 의사결정 문화를 가지고 있다는 점에서 깊은 매력을 느꼈습니다. 저는 기술적 깊이를 계속 확장하고, 다양한 팀과 협력하여 사용자에게 신뢰할 수 있는 서비스를 제공하는 백엔드 개발자로 성장하고 싶습니다. 토스에서 이러한 성장 방향을 가장 잘 실현할 수 있다고 확신합니다."
      ],
      overallScore: 88,
      overallFeedback: `## 전체적인 평가

토스 시스템소프트웨어(백엔드) 개발자로서의 방향성과 강점을 잘 보여준 모의 면접이었습니다. 안정성, 데이터 기반 문제 해결, 협업에 대한 관점이 일관되게 드러난 점이 인상적입니다.

## 잘한 점

- **직무 이해도**: '사용자가 보지 못하는 곳의 안정성을 책임지는 사람'이라는 표현처럼, 백엔드/시스템 개발자의 역할을 정확히 이해하고 있습니다.

- **구체적인 경험 제시**: API 응답 속도 40% 단축, 로그 분석을 통한 병목 구간 파악 등 숫자와 과정이 함께 제시되어 설득력이 높습니다.

- **협업 경험**: 프론트엔드와의 API 스펙 조율, 일정 관리 등 팀 단위 협업 상황을 잘 설명했습니다.

- **데이터 기반 사고**: 감이 아니라 로그·지표를 기반으로 문제를 정의하고 해결하는 접근이 토스 문화와도 잘 맞습니다.

## 보완하면 좋은 점

- **기술 스택 언급**: 사용했던 언어, 프레임워크, DB 등(예: Spring, Node.js, MySQL 등)을 조금 더 구체적으로 언급하면 기술적 깊이가 더 잘 드러납니다.

- **토스와의 연결 강화**: 토스의 서비스/아키텍처, 기술 블로그 내용 등과 본인 경험을 더 직접적으로 연결해 주면 지원 동기가 더 설득력 있어집니다.

- **답변 구조 정리**: 일부 답변은 메시지가 조금 길게 느껴질 수 있어, 결론 → 근거 → 사례 순으로만 깔끔하게 정리하면 전달력이 더 좋아집니다.

## 종합 코멘트

현재만으로도 안정성과 데이터 기반 문제 해결을 중시하는 백엔드 개발자로서 좋은 인상을 줄 수 있는 수준입니다. 향후에는 특정 기술 스택에 대한 깊이와, 실제 서비스 환경에서의 장애 대응/성능 최적화 경험을 더 쌓는다면 토스 백엔드 조직에서도 크게 성장할 수 있을 것으로 보입니다.`
    }
  ]);

  // 자기소개서 리스트 상태 (백엔드 + 하드코딩 1개)
  const [recentIntroductions, setRecentIntroductions] = useState<Array<{
    introductionId: number;
    title: string | null;
    date: string;
  }>>([]);
  const [isLoadingIntroductions, setIsLoadingIntroductions] = useState(false);

  const handleEditProfile = () => {
    // 모달 열 때 입력 필드 초기값 설정
    setEditForm({
      name: userInfo.name || "",
      email: userInfo.email || emailFromMe,
      major: userInfo.major || "",
      targetJob: userInfo.targetJob || ""
    });
    setSaveError(null); // 에러 상태 초기화
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // ========== [시연용] 프론트 상태 갱신 ==========
      const newUserInfo = {
        id: userInfo.id,
        name: editForm.name,
        email: userInfo.email || emailFromMe,
        major: editForm.major,
        targetJob: editForm.targetJob
      };
      
      setUserInfo(newUserInfo);
      setProfileCompleted(calculateProfileCompleted(newUserInfo));
      
      // ========== [시연용] learningProfile을 localStorage에 저장 ==========
      // 프로필 정보는 localStorage.learningProfile에 저장 (페이지 이동 시에도 유지)
      const learningProfile = {
        name: editForm.name,
        major: editForm.major,
        jobTitle: editForm.targetJob,
        email: userInfo.email || emailFromMe
      };
      localStorage.setItem('learningProfile', JSON.stringify(learningProfile));
      
      // ========== [시연용] 저장 버튼을 누른 경우에만 learningProfileSaved를 true로 설정 ==========
      // sessionStorage를 사용하여 플래그 저장
      // - 페이지 이동 시에는 유지됨 (같은 브라우저 탭)
      // - npm run dev로 서버 재시작 후 브라우저를 새로 열면 sessionStorage가 비어있어서 초기화됨
      sessionStorage.setItem('learningProfileSaved', 'true');
      setIsProfileSaved(true);
      
      // 상위 컴포넌트에 userInfo 변경 알림
      if (onProfileInfoChange) {
        onProfileInfoChange({
          name: newUserInfo.name,
          major: newUserInfo.major,
          targetJob: newUserInfo.targetJob
        });
      }

      // 성공 메시지 표시 (3초 후 자동 사라짐)
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

      // 모달 닫기
      setShowEditProfile(false);

      // 프로필 설정 완료 콜백 호출
      if (onProfileComplete) {
        onProfileComplete();
      }
    } catch (err: any) {
      console.error('프로필 저장 실패:', err);
      setSaveError(err.message || '프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInterviewClick = () => {
    setShowInterviewDetail(true);
  };

  const handleResumeClick = () => {
    setShowResumeDetail(true);
  };

  // 면접 상세 화면 (하드코딩된 최근 면접 기록 기반)
  if (showInterviewDetail) {
    const interview = recentInterviews[0];
    const interviewDate = interview.date || new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '');
    const interviewCompany = interview.company || "모의 면접";
    const interviewPosition = interview.position || "백엔드 개발자";
    const interviewMajor = interview.major || "컴퓨터공학과";
    const interviewQuestions = interview.questions || [];
    const interviewAnswers = interview.answers || [];
    const interviewOverallScore = interview.overallScore || 0;
    const interviewOverallFeedback = interview.overallFeedback || "";

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
          <h1 className="text-primary flex items체 gap-2">
            <MessageSquare className="w-8 h-8" />
            면접 피드백 상세
          </h1>
          <p className="text-muted-foreground">{interviewCompany} {interviewPosition} 면접 결과 및 피드백입니다</p>
        </div>

        {/* 면접 정보 카드 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              면접 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">전공</p>
                <p className="font-medium">{interviewMajor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">직무</p>
                <p className="font-medium">{interviewPosition}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">면접 날짜</p>
                <p className="font-medium">{interviewDate}</p>
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
            <p className="text-5xl font-bold text-primary">{interviewOverallScore}점</p>
            <p className="text-muted-foreground mt-2">AI가 평가한 면접 종합 점수입니다.</p>
          </CardContent>
        </Card>

        {/* 질문별 상세 결과 */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle>질문별 상세 결과</CardTitle>
            <CardDescription>각 질문에 대한 답변 분석 결과입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {interviewQuestions.map((question, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">질문 {index + 1}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>답변 시간: {Math.floor(Math.random() * 30) + 30}초</span>
                    <span className="font-medium text-primary">{Math.floor(Math.random() * 20) + 70}점</span>
                  </div>
                </div>
                <p className="text-muted-foreground">{question}</p>
                <div className="bg-muted/50 p-3 rounded border-l-4 border-primary/20">
                  <p className="text-sm text-muted-foreground italic">답변 내용: {interviewAnswers[index] || "답변 내용이 없습니다."}</p>
                </div>
              </div>
            ))}
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
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 자소서 상세 화면
  if (showResumeDetail) {
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
          <p className="text-muted-foreground">최근 자기소개서에 대한 AI 피드백입니다</p>
        </div>

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
                <p className="font-medium">토스 자기소개서</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">작성 날짜</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '.').replace(/\s/g, '')}
                </p>
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
              <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                저는 “사용자가 보지 못하는 곳의 안정성을 책임지는 사람”에 매력을 느껴 백엔드 개발자를 목표로 해왔습니다. 컴퓨터공학과 전공 과정에서 자료구조·운영체제·데이터베이스 등 핵심 이론을 학습하며, 눈에 보이는 기능보다 시스템이 견고하게 동작하도록 만드는 설계와 구조에 더 큰 흥미를 느꼈습니다. 특히 서버가 예측 불가한 트래픽이나 오류 상황에서도 안정적으로 서비스를 제공해야 한다는 점에서 백엔드 개발자의 책임감과 판단력이 중요하다는 사실을 실감했고, 이러한 부분은 금융 서비스의 특성상 안정성이 핵심인 토스의 개발 문화와 가장 잘 맞닿아 있다고 느꼈습니다.

                팀 프로젝트에서는 “백엔드는 서비스의 중심축”이라는 생각으로 협업에 적극적으로 참여했습니다. 백엔드 특성상 여러 팀과 의견을 조율해야 하기 때문에 단순히 요청대로 기능을 구현하는 데서 멈추지 않고, 왜 필요한지, 어떤 제약이 있는지, 더 나은 구조는 없는지를 먼저 질문했습니다. 프론트엔드 팀원과 API 스펙을 맞추는 과정에서도 기능 구현보다 먼저 커뮤니케이션 구조와 일정 관리를 정리하여 프로젝트 전체 흐름을 조율했습니다. 이러한 경험은 다양한 직군이 빠르게 협력하며 문제를 해결하는 토스의 수평적 조직 문화와도 자연스럽게 연결된다고 생각합니다.

                저는 백엔드 업무에서 필수적인 꼼꼼함과 데이터 기반 접근을 매우 중요하게 여깁니다. 데이터베이스 설계 시 작은 제약 조건 하나가 성능과 안정성에 큰 차이를 만들고, 일정 관리는 장애 대응 속도와 서비스 신뢰도에 직결되기 때문입니다. 실제로 프로젝트에서 사용자 활동 로그를 분석해 API 응답 속도 저하 구간을 찾아내고, 쿼리 구조를 개선해 평균 응답 속도를 40% 단축했습니다. 이 경험을 통해 “문제를 감으로 해결하지 않고, 데이터로 원인을 추적하는 것”이 백엔드 개발자의 핵심 태도임을 깨달았고, 이는 데이터 기반 의사결정을 중시하는 토스가 추구하는 방향과도 일치합니다.

                백엔드 개발은 단순한 기술 구현을 넘어, 다양한 팀과 함께 사용자가 신뢰할 수 있는 서비스를 만드는 일이라 생각합니다. 저는 앞으로도 기술적 깊이를 넓히고, 변화에 빠르게 대응하며, 팀과 함께 더 나은 결정을 만들어가는 개발자로 성장하고 싶습니다. 그리고 이러한 성장 방향을 가장 잘 실현할 수 있는 곳이 토스의 백엔드 조직이라 확신합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI 분석 결과 (Markdown) */}
        <Card className="border-2 rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              AI 피드백
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📋 AI 피드백</h4>
              <div 
                className="text-blue-800 prose prose-sm max-w-none"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                <ReactMarkdown>{hardcodedFeedback}</ReactMarkdown>
              </div>
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
              <p className="text-green-800 whitespace-pre-wrap leading-relaxed">
                저는 "사용자가 보지 못하는 곳의 안정성을 책임지는 사람"에 매력을 느껴 시스템 소프트웨어 개발자, 특히 백엔드 개발자를 목표로 해왔습니다. 컴퓨터공학과 전공 과정에서 자료구조, 운영체제, 데이터베이스 등 핵심 이론을 학습하며, 눈에 보이는 기능보다 시스템이 견고하게 동작하도록 만드는 설계와 구조에 더 큰 흥미를 느꼈습니다. 특히 서버가 예측 불가한 트래픽이나 오류 상황에서도 안정적으로 서비스를 제공해야 한다는 점에서 백엔드 개발자의 책임감과 판단력이 중요하다는 사실을 실감했습니다. 이러한 가치관은 금융 서비스의 특성상 안정성이 핵심인 토스의 개발 문화와 가장 잘 맞닿아 있다고 생각합니다.

팀 프로젝트에서는 "백엔드는 서비스의 중심축"이라는 생각으로 협업에 적극적으로 참여했습니다. 백엔드 특성상 여러 팀과 의견을 조율해야 하기 때문에 단순히 요청대로 기능을 구현하는 데서 멈추지 않고, 왜 필요한지, 어떤 제약이 있는지, 더 나은 구조는 없는지를 먼저 질문했습니다. 프론트엔드 팀원과 API 스펙을 맞추는 과정에서도 기능 구현보다 먼저 커뮤니케이션 구조와 일정 관리를 정리하여 프로젝트 전체 흐름을 조율했습니다. 이러한 경험은 다양한 직군이 빠르게 협력하며 문제를 해결하는 토스의 수평적 조직 문화와도 자연스럽게 연결된다고 생각합니다.

저는 백엔드 업무에서 필수적인 꼼꼼함과 데이터 기반 접근을 매우 중요하게 여깁니다. 데이터베이스 설계 시 작은 제약 조건 하나가 성능과 안정성에 큰 차이를 만들고, 일정 관리는 장애 대응 속도와 서비스 신뢰도에 직결되기 때문입니다. 실제로 프로젝트에서 대용량 트래픽 상황에서 API 응답 속도 저하 문제가 발생했을 때, 사용자 활동 로그를 수집하여 데이터베이스 쿼리 패턴과 인덱스 사용 현황을 분석했습니다. 특정 쿼리가 비효율적으로 동작하고 있음을 확인하고, 인덱스를 추가하고 쿼리 구조를 최적화하여 평균 응답 속도를 40% 단축했습니다. 이 경험을 통해 "문제를 감으로 해결하지 않고, 데이터로 원인을 추적하는 것"이 백엔드 개발자의 핵심 태도임을 깨달았고, 이는 데이터 기반 의사결정을 중시하는 토스가 추구하는 방향과도 일치합니다.

백엔드 개발은 단순한 기술 구현을 넘어, 다양한 팀과 함께 사용자가 신뢰할 수 있는 서비스를 만드는 일이라 생각합니다. 토스의 기술 블로그와 아키텍처 사례를 통해 학습한 내용을 바탕으로, 저는 앞으로도 기술적 깊이를 넓히고, 변화에 빠르게 대응하며, 팀과 함께 더 나은 결정을 만들어가는 개발자로 성장하고 싶습니다. 그리고 이러한 성장 방향을 가장 잘 실현할 수 있는 곳이 토스의 시스템 소프트웨어 개발 조직이라 확신합니다.
              </p>
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
              <div 
                className="text-purple-800 whitespace-pre-wrap leading-relaxed"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                <ReactMarkdown>
{`저는 **"사용자가 보지 못하는 곳의 안정성을 책임지는 사람"**에 매력을 느껴 시스템 소프트웨어 개발자, 특히 백엔드 개발자를 목표로 해왔습니다. 컴퓨터공학과 전공 과정에서 자료구조, 운영체제, 데이터베이스 등 핵심 이론을 학습하며, 눈에 보이는 기능보다 시스템이 견고하게 동작하도록 만드는 설계와 구조에 더 큰 흥미를 느꼈습니다. 특히 서버가 예측 불가한 트래픽이나 오류 상황에서도 안정적으로 서비스를 제공해야 한다는 점에서 백엔드 개발자의 책임감과 판단력이 중요하다는 사실을 실감했습니다. 이러한 가치관은 금융 서비스의 특성상 안정성이 핵심인 토스의 개발 문화와 가장 잘 맞닿아 있다고 생각합니다.

## 집요함 (Persistence)

팀 프로젝트에서는 **"백엔드는 서비스의 중심축"**이라는 생각으로 협업에 적극적으로 참여했습니다. 백엔드 특성상 여러 팀과 의견을 조율해야 하기 때문에 단순히 요청대로 기능을 구현하는 데서 멈추지 않고, 왜 필요한지, 어떤 제약이 있는지, 더 나은 구조는 없는지를 먼저 질문했습니다. 프론트엔드 팀원과 API 스펙을 맞추는 과정에서도 기능 구현보다 먼저 커뮤니케이션 구조와 일정 관리를 정리하여 프로젝트 전체 흐름을 조율했습니다. 이러한 경험은 다양한 직군이 빠르게 협력하며 문제를 해결하는 토스의 수평적 조직 문화와도 자연스럽게 연결된다고 생각합니다.

## 데이터 기반 의사결정 (Data-Driven Decision Making)

저는 백엔드 업무에서 필수적인 꼼꼼함과 데이터 기반 접근을 매우 중요하게 여깁니다. 데이터베이스 설계 시 작은 제약 조건 하나가 성능과 안정성에 큰 차이를 만들고, 일정 관리는 장애 대응 속도와 서비스 신뢰도에 직결되기 때문입니다. 실제로 프로젝트에서 대용량 트래픽 상황에서 API 응답 속도 저하 문제가 발생했을 때, 사용자 활동 로그를 수집하여 데이터베이스 쿼리 패턴과 인덱스 사용 현황을 분석했습니다. 특정 쿼리가 비효율적으로 동작하고 있음을 확인하고, 인덱스를 추가하고 쿼리 구조를 최적화하여 평균 응답 속도를 40% 단축했습니다. 이 경험을 통해 **"문제를 감으로 해결하지 않고, 데이터로 원인을 추적하는 것"**이 백엔드 개발자의 핵심 태도임을 깨달았고, 이는 데이터 기반 의사결정을 중시하는 토스가 추구하는 방향과도 일치합니다.

## 사용자 중심 사고 (User-Centric Thinking)

백엔드 개발은 단순한 기술 구현을 넘어, 다양한 팀과 함께 사용자가 신뢰할 수 있는 서비스를 만드는 일이라 생각합니다. 토스의 기술 블로그와 아키텍처 사례를 통해 학습한 내용을 바탕으로, 저는 앞으로도 기술적 깊이를 넓히고, 변화에 빠르게 대응하며, 팀과 함께 더 나은 결정을 만들어가는 개발자로 성장하고 싶습니다. 그리고 이러한 성장 방향을 가장 잘 실현할 수 있는 곳이 토스의 시스템 소프트웨어 개발 조직이라 확신합니다.`}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#051243] mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 프로필 수정 오버레이 */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2 rounded-xl bg-white shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  프로필 수정
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowEditProfile(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 text-sm">{saveError}</p>
                </div>
              )}
              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 text-sm">프로필이 저장되었습니다.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>이름</Label>
                <Input 
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm({...editForm, name: e.target.value});
                    setSaveError(null);
                    setSaveSuccess(false);
                  }}
                  disabled={isSaving}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input 
                  value={editForm.email}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label>전공</Label>
                <Input 
                  value={editForm.major}
                  onChange={(e) => {
                    setEditForm({...editForm, major: e.target.value});
                    setSaveError(null);
                    setSaveSuccess(false);
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
                    setEditForm({...editForm, targetJob: e.target.value});
                    setSaveError(null);
                    setSaveSuccess(false);
                  }}
                  disabled={isSaving}
                  placeholder="목표 직무를 입력하세요"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveProfile} 
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditProfile(false);
                    setSaveError(null);
                  }}
                  className="flex-1"
                  disabled={isSaving}
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              onClick={handleEditProfile}
              className="flex items-center gap-2 rounded-lg"
            >
              <Settings className="w-4 h-4" />
              설정/수정
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 학습프로필 상태 안내 문구 */}
          {!isProfileSaved ? (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-yellow-800">
                  아직 학습 프로필이 설정되지 않았습니다. 이름, 전공, 목표 직무를 입력해 주세요.
                </p>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleEditProfile}
                  className="ml-4 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  학습프로필 설정
                </Button>
              </div>
            </div>
          ) : (
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

      {/* 성취 기록 섹션 */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          성취 기록
        </h2>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 자격증 취득 내역 카드 */}
          <Card className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
                자격증 취득 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.filter(item => item.type === 'certification').map((cert, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50/70 border border-emerald-200/30">
                    <div className="p-2 rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{cert.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 rounded-full px-3 py-1">
                          ✅ {cert.grade}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {cert.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 교과목 성적 카드 */}
          <Card className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                교과목 성적 내역
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.filter(item => item.type === 'subject').map((subject, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50/70 border border-blue-200/30">
                    <div className="p-2 rounded-full bg-blue-400 text-white">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{subject.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${subject.grade === 'A+' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : subject.grade === 'A' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-sky-100 text-sky-700 border-sky-300'} rounded-full px-3 py-1`}>
                          {subject.grade}
                        </Badge>
                        <Badge variant="outline" className="text-xs rounded-full border-blue-200">
                          {subject.credits}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {subject.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 최근 면접 기록 섹션 */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          최근 면접 기록
        </h2>
        
        <div className="space-y-4">
          {recentInterviews.map((interview, index) => (
            <Card 
              key={index} 
              className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20"
              onClick={handleInterviewClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-lg">{interview.company}</p>
                    <p className="text-muted-foreground">{interview.position}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-700">{interview.rating}</span>
                  </div>
                </div>
                <p className="text-sm mb-3 text-gray-600 line-clamp-2">{interview.feedback}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {interview.date}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 최근 자소서 기록 섹션 */}
      <div className="space-y-6">
        <h2 className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          최근 자소서 기록
        </h2>
        
        {isLoadingIntroductions ? (
          <div className="text-center py-8 text-muted-foreground">
            자기소개서 리스트를 불러오는 중...
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
                : "토스 자기소개서";
              const summary = "AI가 분석한 핵심 개선 포인트가 정리된 자기소개서입니다.";

              return (
                <Card 
                  key={intro.introductionId} 
                  className="border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/20"
                  onClick={handleResumeClick}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-lg">{title}</p>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1">
                        피드백 완료
                      </Badge>
                    </div>
                    <p className="text-sm mb-3 text-gray-600 line-clamp-2">{summary}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {intro.date}
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
