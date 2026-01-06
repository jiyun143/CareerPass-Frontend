import { useEffect, useState } from "react";
import { AuthCallback } from "./AuthCallback";
import { CareerPassLanding } from "./components/CareerPassLanding";
import { CareerPackApp } from "./components/CareerPackApp";
import { LoginPage } from "./components/LoginPage";
import { LoginRequired } from "./components/LoginRequired";
import { ProfileRequired } from "./components/ProfileRequired";
import fetchApi, { getMe } from "./api";
import { clearAccessToken } from "./authToken";

type PageType = "main" | "roadmap" | "resume" | "interview" | "profile";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("main");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [me, setMe] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const isAuthCallback =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth/callback");

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[debug] VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL);
    }
  }, []);

  // 🔑 앱 시작 시 로그인 상태 확인 (/me)
  useEffect(() => {
    if (isAuthCallback) return;

    const fetchMe = async () => {
      try {
        const res = await getMe();
        if (import.meta.env.DEV) {
          console.log("[debug] /me success", res);
        }
        setMe(res);
        setIsLoggedIn(true);
        setShowLogin(false);
        setCurrentPage("profile");
        if (import.meta.env.DEV) {
          console.log(
            "[debug] landing page set",
            { profileCompleted: res?.profileCompleted, page: "profile" }
          );
        }
      } catch {
        setMe(null);
        setIsLoggedIn(false);
      }
    };

    fetchMe();
  }, [isAuthCallback]);

  // 로그인 상태 아직 모르면 로딩 상태
  if (isLoggedIn === null) {
    if (isAuthCallback) return <AuthCallback />;
    return null; // 필요하면 로딩 컴포넌트
  }

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  const isProfileComplete =
    me?.profileCompleted === true
      ? true
      : me?.profileCompleted === false
        ? false
        : !!me && !!me.nickname && !!me.major && !!me.targetJob;

  const handlePageChange = (page: PageType) => {
    if (page !== "main" && !isLoggedIn) {
      setCurrentPage("login-required" as PageType);
      return;
    }

    if (
      page !== "main" &&
      page !== "profile" &&
      isLoggedIn &&
      !isProfileComplete
    ) {
      setCurrentPage("profile" as PageType);
      return;
    }

    setCurrentPage(page);
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleBackToMain = () => {
    setShowLogin(false);
    setCurrentPage("main");
  };

  const handleLogout = async () => {
    try {
      await fetchApi("/logout", { method: "POST" });
    } catch {}

    clearAccessToken();
    setIsLoggedIn(false);
    setMe(null);
    setCurrentPage("main");
  };

  const handleProfileComplete = async () => {
    try {
      const res = await getMe();
      setMe(res);
    } catch {}
  };

  const handleGoToProfile = () => {
    setCurrentPage("profile");
  };

  // 로그인 페이지
  if (showLogin) {
    return <LoginPage onLogin={() => {}} onBack={handleBackToMain} />;
  }

  // 로그인 필요
  if (currentPage === "login-required") {
    return <LoginRequired onBackToMain={handleBackToMain} />;
  }

  // 프로필 필요
  if (currentPage === "profile-required") {
    return <ProfileRequired onGoToProfile={handleGoToProfile} />;
  }

  // 메인
  if (currentPage === "main") {
    return (
      <CareerPassLanding
        onPageChange={handlePageChange}
        onLoginClick={handleLoginClick}
      />
    );
  }

  // 로그인된 상태 앱
  return (
    <CareerPackApp
      currentPage={currentPage}
      onPageChange={handlePageChange}
      onLogout={handleLogout}
      onProfileComplete={handleProfileComplete}
    />
  );
}
