import { useState, useEffect } from "react";
import { Dashboard } from "./Dashboard";
import { DepartmentSelector, departments } from "./DepartmentSelector";
import { JobSelector } from "./JobSelector";
import { RoadmapView } from "./RoadmapView";
import { SubjectRoadmapView } from "./SubjectRoadmapView";
import { CertificationRoadmapView } from "./CertificationRoadmapView";
import { ProfileSection } from "./ProfileSection";
import { LearningProfile } from "./LearningProfile";
import { ResumeAI } from "./ResumeAI";
import { InterviewAI } from "./InterviewAI";
import { ProfileRequired } from "./ProfileRequired";
import { ProfileSetupRequiredDialog } from "./ProfileSetupRequiredDialog";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { GraduationCap, MapPin, BookOpen, Award, LogOut, User, FileText, Mic, Home } from "lucide-react";
import logoImage from "figma:asset/7c5aa6dae84b9f121dc975eb56a63a422cedd564.png";
import { getMe, createUser } from "../api";

type PageType = 'main' | 'roadmap' | 'resume' | 'interview' | 'profile';

interface CareerPackAppProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onLogout: () => void;
  onProfileComplete?: () => void;
  api?: any;
}

export function CareerPackApp({ currentPage, onPageChange, onLogout, onProfileComplete, api }: CareerPackAppProps) {
  const [currentSection, setCurrentSection] = useState("dashboard");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [roadmapType, setRoadmapType] = useState<"subject" | "certification" | "">("");
  const [showInterviewDetail, setShowInterviewDetail] = useState(false);
  const [showResumeDetail, setShowResumeDetail] = useState(false);
  const [showProfileSetupDialog, setShowProfileSetupDialog] = useState(false);

  // 사용자 정보 상태 관리
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);
  
  // 학습프로필 정보 상태 (LearningProfile에서 업데이트됨)
  const [profileInfo, setProfileInfo] = useState<{
    name: string;
    major: string;
    targetJob: string;
  } | null>(null);
  
  // 학습프로필 완료 여부 계산 함수 (백엔드 우선, localStorage 보조)
  const isProfileCompleted = (): boolean => {
    if (user?.profileCompleted === false) return false;
    if (user?.profileCompleted === true) return true;
    const profile = localStorage.getItem('userProfile');
    if (!profile) {
      return false;
    }
    try {
      const parsed = JSON.parse(profile);
      // name, major, targetJob 모두 truthy여야 완료
      return !!(parsed.name && parsed.major && parsed.targetJob);
    } catch {
      return false;
    }
  };

  const selectedDeptData = departments.find(dept => dept.id === selectedDepartment);
  const availableJobs = selectedDeptData?.jobs || [];

  // 사용자 초기화 함수
  const initUser = async () => {
    try {
      setLoadingUser(true);
      setMeError(null);
      
      // localStorage에서 이메일 확인 (OAuth 콜백에서 저장했을 수 있음)
      const storedEmail = localStorage.getItem('careerpass_email');
      
      // 1) getMe() 호출
      const me = await getMe();
      if (import.meta.env.DEV) {
        console.log("[CareerPackApp] /me success", {
          email: me?.email,
          profileCompleted: me?.profileCompleted
        });
      }
      setUser(me);
    } catch (err: any) {
      console.error("유저 정보 로딩 실패:", err);
      
      // 2) 실패하면: 에러 메시지에 404 또는 "not found" 또는 "USER_NOT_FOUND" 있으면 createUser() 실행
      const errorMessage = err.message || '';
      const isNotFoundError = 
        err.message?.includes('404') || 
        err.message?.includes('not found') || 
        err.message?.includes('Not Found') ||
        err.message?.includes('USER_NOT_FOUND');
      
      // HTTP 500 에러 또는 서버 에러인 경우 localStorage에서 복구 시도
      const isServerError = 
        err.message?.includes('500') || 
        err.message?.includes('HTTP error! status: 500') ||
        err.message?.includes('Internal Server Error');
      
      if (isNotFoundError) {
        try {
          // createUser({ nickname:"신규 사용자", major:"미설정", targetJob:"미설정" })
          const created = await createUser({ 
            nickname: "신규 사용자", 
            major: "미설정", 
            targetJob: "미설정" 
          });
          setUser(created);
        } catch (createErr: any) {
          console.error("사용자 생성 실패:", createErr);
          setMeError(createErr.message || "사용자 생성 중 오류가 발생했습니다.");
        }
      } else if (isServerError) {
        // HTTP 500 에러인 경우 localStorage에서 정보 복구 시도
        const storedProfile = localStorage.getItem('userProfile');
        const storedEmail = localStorage.getItem('careerpass_email');
        
        if (storedProfile || storedEmail) {
          try {
            if (storedProfile) {
              const parsed = JSON.parse(storedProfile);
              setUser({
                id: localStorage.getItem('userId') || null,
                email: parsed.email || storedEmail || '',
                nickname: parsed.name || '',
                major: parsed.department || '',
                targetJob: parsed.targetJob || '',
                profileCompleted: parsed.isComplete || false
              });
            } else if (storedEmail) {
              // 이메일만 있는 경우 기본 사용자 객체 설정
              setUser({
                id: localStorage.getItem('userId') || null,
                email: storedEmail,
                nickname: '',
                major: '',
                targetJob: '',
                profileCompleted: false
              });
            }
            setMeError(null); // 에러 무시하고 계속 진행
            console.log('HTTP 500 에러 발생했으나 localStorage에서 정보 복구 성공');
          } catch {
            setMeError(null);
          }
        } else {
          // localStorage에도 정보가 없으면 에러 표시하지 않고 null로 설정
          setMeError(null);
          setUser(null);
        }
      } else {
        // CORS 에러 또는 네트워크 에러인 경우 localStorage에서 기존 사용자 정보 사용
        if (err.message?.includes('Failed to fetch') || err.message?.includes('CORS') || err.name === 'TypeError') {
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            try {
              const parsed = JSON.parse(storedProfile);
              setUser({
                id: localStorage.getItem('userId') || null,
                email: parsed.email || '',
                nickname: parsed.name || '',
                major: parsed.department || '',
                targetJob: parsed.targetJob || '',
                profileCompleted: parsed.isComplete || false
              });
              setMeError(null);
            } catch {
              setMeError(null);
            }
          } else {
            setMeError(null);
          }
        } else {
          // 기타 에러는 localStorage에서 복구 시도
          const storedProfile = localStorage.getItem('userProfile');
          const storedEmail = localStorage.getItem('careerpass_email');
          if (storedProfile || storedEmail) {
            try {
              if (storedProfile) {
                const parsed = JSON.parse(storedProfile);
                setUser({
                  id: localStorage.getItem('userId') || null,
                  email: parsed.email || storedEmail || '',
                  nickname: parsed.name || '',
                  major: parsed.department || '',
                  targetJob: parsed.targetJob || '',
                  profileCompleted: parsed.isComplete || false
                });
              } else {
                setUser({
                  id: localStorage.getItem('userId') || null,
                  email: storedEmail || '',
                  nickname: '',
                  major: '',
                  targetJob: '',
                  profileCompleted: false
                });
              }
              setMeError(null);
            } catch {
              setMeError(null);
            }
          } else {
            setMeError(null); // 에러 표시하지 않음
          }
        }
      }
    } finally {
      setLoadingUser(false);
    }
  };

  // 사용자 정보 초기화
  useEffect(() => {
    initUser();
  }, []);
  
  // localStorage에서 profileInfo 초기화
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        setProfileInfo({
          name: parsed.name || "",
          major: parsed.major || "",
          targetJob: parsed.targetJob || ""
        });
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }, []);

  // 기존 코드 호환성을 위해 me를 user의 alias로 사용
  const me = user;

  // 프로필 완료 후 profileCompleted를 true로 설정
  const handleProfileComplete = () => {
    // user 상태의 profileCompleted를 true로 갱신
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, profileCompleted: true };
    });

    // 상위 컴포넌트의 onProfileComplete 콜백 호출 (있는 경우)
    if (onProfileComplete) {
      onProfileComplete();
    }
  };
  
  // 학습프로필 정보 변경 핸들러
  const handleProfileInfoChange = (info: { name: string; major: string; targetJob: string }) => {
    setProfileInfo(info);
    // localStorage도 함께 업데이트 (이미 LearningProfile에서 저장했지만 동기화)
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        parsed.name = info.name;
        parsed.major = info.major;
        parsed.targetJob = info.targetJob;
        localStorage.setItem('userProfile', JSON.stringify(parsed));
      } catch {
        // 파싱 실패 시 무시
      }
    }
  };
  
  // 페이지 변경 핸들러 (학습프로필 미완성 체크 포함)
  const handlePageChangeWithCheck = (page: PageType) => {
    // roadmap, resume, interview 접근 시 학습프로필 완료 여부 확인
    if ((page === 'roadmap' || page === 'resume' || page === 'interview') && !isProfileCompleted()) {
      setShowProfileSetupDialog(true);
      onPageChange('profile');
      return;
    }
    
    // 학습프로필 완료되었거나 profile 페이지인 경우 정상 이동
    onPageChange(page);
  };

  // Reset job selection when department changes
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    setSelectedJob("");
    setRoadmapType("");
  };

  const renderRoadmapSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-primary">취업 로드맵</h1>
        <p className="text-muted-foreground">
          학과별 직무 연계 교육과정 및 자격증 로드맵을 확인하세요
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2>학과 및 직무 선택</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <DepartmentSelector
            selectedDepartment={selectedDepartment}
            onDepartmentChange={handleDepartmentChange}
          />
          <JobSelector
            jobs={availableJobs}
            selectedJob={selectedJob}
            onJobChange={setSelectedJob}
          />
        </div>
        {selectedDepartment && !selectedJob && (
          <p className="text-muted-foreground mt-4">
            {selectedDeptData?.name}을(를) 선택하셨습니다. 이제 관심 있는 직무를 선택해주세요.
          </p>
        )}
      </Card>

      {selectedDepartment && selectedJob ? (
        <div className="space-y-6">
          {/* 로드맵 유형 선택 */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2>로드맵 유형 선택</h2>
            </div>
            <div className="flex gap-4">
              <Button
                variant={roadmapType === "subject" ? "default" : "outline"}
                onClick={() => setRoadmapType("subject")}
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                교과목 로드맵
              </Button>
              <Button
                variant={roadmapType === "certification" ? "default" : "outline"}
                onClick={() => setRoadmapType("certification")}
                className="flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                자격증 로드맵
              </Button>
            </div>
          </Card>

          {/* 선택된 로드맵 표시 */}
          {roadmapType === "subject" && (
            <SubjectRoadmapView
              selectedDepartment={selectedDepartment}
              selectedJob={selectedJob}
            />
          )}
          {roadmapType === "certification" && (
            <CertificationRoadmapView
              selectedDepartment={selectedDepartment}
              selectedJob={selectedJob}
            />
          )}
          {!roadmapType && (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <BookOpen className="w-16 h-16 text-blue-500" />
                  <Award className="w-16 h-16 text-purple-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">로드맵 유형을 선택해주세요</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    교과목 로드맵에서는 학년별 필수/권장 교과목을, 
                    자격증 로드맵에서는 취득 권장 자격증을 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-muted-foreground">학과 연계 교육과정 로드맵</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                원하는 학과와 직무를 선택하시면 학년별 필수 교과목과 
                취득 권장 자격증을 확인하실 수 있습니다.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderSubjectsSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-primary flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          교과목 로드맵
        </h1>
        <p className="text-muted-foreground">
          학과별 교육과정 로드맵을 확인하세요
        </p>
      </div>

      <Card className="border-2 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2>학과 선택</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <DepartmentSelector
            selectedDepartment={selectedDepartment}
            onDepartmentChange={handleDepartmentChange}
          />
        </div>
        {selectedDepartment && (
          <p className="text-muted-foreground mt-4">
            {selectedDeptData?.name}을(를) 선택하셨습니다.
          </p>
        )}
      </Card>

      {selectedDepartment ? (
        <SubjectRoadmapView
          selectedDepartment={selectedDepartment}
        />
      ) : (
        <Card className="border-2 rounded-xl p-12">
          <div className="text-center space-y-4">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-muted-foreground">학과별 교육과정 로드맵</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                원하는 학과를 선택하시면 학년별 필수 교과목과 권장 교과목을 확인하실 수 있습니다.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderCertificationsSection = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-primary flex items-center gap-2">
          <Award className="w-8 h-8" />
          자격증 로드맵
        </h1>
        <p className="text-muted-foreground">
          취득 권장 자격증을 확인하세요
        </p>
      </div>

      <Card className="border-2 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2>학과 및 직무 선택</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <DepartmentSelector
            selectedDepartment={selectedDepartment}
            onDepartmentChange={handleDepartmentChange}
          />
          <JobSelector
            jobs={availableJobs}
            selectedJob={selectedJob}
            onJobChange={setSelectedJob}
          />
        </div>
        {selectedDepartment && !selectedJob && (
          <p className="text-muted-foreground mt-4">
            {selectedDeptData?.name}을(를) 선택하셨습니다. 이제 관심 있는 직무를 선택해주세요.
          </p>
        )}
      </Card>

      {selectedDepartment && selectedJob ? (
        <CertificationRoadmapView
          selectedDepartment={selectedDepartment}
          selectedJob={selectedJob}
        />
      ) : (
        <Card className="border-2 rounded-xl p-12">
          <div className="text-center space-y-4">
            <Award className="w-16 h-16 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h3 className="text-muted-foreground">취득 권장 자격증</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                원하는 학과와 직무를 선택하시면 취득을 권장하는 자격증을 확인하실 수 있습니다.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderMainContent = () => {
    // 메인 페이지가 아닌 경우 해당 페이지 컴포넌트 렌더링
    if (currentPage === 'resume') {
      return <ResumeAI />;
    }
    if (currentPage === 'interview') {
      return <InterviewAI />;
    }
    if (currentPage === 'profile') {
      return (
        <LearningProfile 
          userId={me?.id} 
          email={me?.email}
          onProfileComplete={handleProfileComplete}
          onProfileInfoChange={handleProfileInfoChange}
        />
      );
    }

    // 로드맵 페이지의 경우 섹션에 따라 다르게 렌더링
    if (currentPage === 'roadmap') {
      switch (currentSection) {
        case "dashboard":
          return <Dashboard />;
        case "subjects":
          return renderSubjectsSection();
        case "certifications":
          return renderCertificationsSection();
        default:
          return <Dashboard />;
      }
    }

    // 기본값은 대시보드
    return <Dashboard />;
  };

  // 로딩 중일 때
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#051243] mx-auto mb-4"></div>
          <p className="text-gray-600">초기화 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생 시 (CORS 에러가 아닌 경우만 표시)
  if (meError && !meError.includes('Failed to fetch')) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="space-y-4">
            <h2 className="text-[#051243] text-lg font-semibold">로그인 정보 오류</h2>
            <p className="text-muted-foreground">{meError}</p>
            <Button onClick={onLogout} variant="outline">
              로그아웃
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 프로필 미완료 시 ProfileRequired 화면 강제 표시
  // 단, 현재 경로가 'profile' (learning-profile)일 때는 예외로 하고 LearningProfile을 바로 보여주기
  // 학습프로필 완료 여부는 localStorage 기준으로 판단
  if (!isProfileCompleted() && currentPage !== 'profile') {
    return (
      <ProfileRequired
        onGoToProfile={() => {
          onPageChange('profile');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* 상단 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8">
                <img src={logoImage} alt="CareerPass Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-[#051243]">CareerPass</h2>
              </div>
            </div>

            {/* 메뉴 */}
            <div className="flex items-center gap-2">
              <Button
                variant={currentPage === 'roadmap' ? "default" : "ghost"}
                className={currentPage === 'roadmap' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100 hover:text-[#051243]"}
                onClick={() => {
                  if (currentPage === 'roadmap') {
                    setCurrentSection('dashboard');
                  }
                  handlePageChangeWithCheck('roadmap');
                }}
              >
                <MapPin className="w-4 h-4 mr-2" />
                취업 로드맵
              </Button>
              <Button
                variant={currentPage === 'resume' ? "default" : "ghost"}
                className={currentPage === 'resume' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100 hover:text-[#051243]"}
                onClick={() => handlePageChangeWithCheck('resume')}
              >
                <FileText className="w-4 h-4 mr-2" />
                자기소개서 AI
              </Button>
              <Button
                variant={currentPage === 'interview' ? "default" : "ghost"}
                className={currentPage === 'interview' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100 hover:text-[#051243]"}
                onClick={() => handlePageChangeWithCheck('interview')}
              >
                <Mic className="w-4 h-4 mr-2" />
                AI 모의면접
              </Button>
              <Button
                variant={currentPage === 'profile' ? "default" : "ghost"}
                className={currentPage === 'profile' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100 hover:text-[#051243]"}
                onClick={() => onPageChange('profile')}
              >
                <User className="w-4 h-4 mr-2" />
                학습 프로필
              </Button>
              
              <div className="ml-4 pl-4 border-l border-gray-200">
                <Button
                  variant="outline"
                  onClick={onLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          </div>

          {/* 취업 로드맵 하위 메뉴 */}
          {currentPage === 'roadmap' && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button
                variant={currentSection === 'dashboard' ? "default" : "ghost"}
                size="sm"
                className={currentSection === 'dashboard' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100"}
                onClick={() => setCurrentSection('dashboard')}
              >
                대시보드
              </Button>
              <Button
                variant={currentSection === 'subjects' ? "default" : "ghost"}
                size="sm"
                className={currentSection === 'subjects' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100"}
                onClick={() => setCurrentSection('subjects')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                교과목
              </Button>
              <Button
                variant={currentSection === 'certifications' ? "default" : "ghost"}
                size="sm"
                className={currentSection === 'certifications' ? "bg-[#051243] text-white hover:bg-[#051243]/90" : "hover:bg-gray-100"}
                onClick={() => setCurrentSection('certifications')}
              >
                <Award className="w-4 h-4 mr-2" />
                자격증
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-8">
        {renderMainContent()}
      </main>
      
      {/* 학습프로필 설정 안내 팝업 */}
      <ProfileSetupRequiredDialog
        isOpen={showProfileSetupDialog}
        onClose={() => setShowProfileSetupDialog(false)}
        onGoToProfile={() => {
          onPageChange('profile');
          setShowProfileSetupDialog(false);
        }}
      />
    </div>
  );
}
