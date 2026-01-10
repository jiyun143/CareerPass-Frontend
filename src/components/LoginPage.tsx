const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import logoImage from "figma:asset/83510238e736cd0a50e47278737c5f6a27f22463.png";

interface LoginPageProps {
  onLogin: () => void;
  onBack: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const handleGoogleLogin = () => {
    if (import.meta.env.DEV) {
      console.log("[Login] redirecting to OAuth", `${API_BASE_URL}/oauth2/authorization/google`);
    }
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 뒤로가기 버튼 */}
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          메인으로 돌아가기
        </Button>

        {/* 로고 및 타이틀 */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16">
              <img src={logoImage} alt="CareerPass Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#051243]">CareerPass</h1>
            <p className="text-gray-600">취업 성공으로 향하는 가장 확실한 패스</p>
          </div>
        </div>

        {/* 구글 로그인 카드 */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>간편 로그인</CardTitle>
            <CardDescription>
              구글 계정으로 빠르게 로그인하여 맞춤형 취업 로드맵을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGoogleLogin}
              variant="outline" 
              className="w-full h-12 text-base border-2 hover:bg-gray-50 transition-colors"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path 
                  fill="#4285F4" 
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path 
                  fill="#34A853" 
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path 
                  fill="#FBBC05" 
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path 
                  fill="#EA4335" 
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google 계정으로 로그인
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>로그인 시 개인정보보호정책 및 서비스약관에 동의하게 됩니다.</p>
            </div>
          </CardContent>
        </Card>

        {/* 추가 정보 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            아직 계정이 없으신가요?
          </p>
          <p className="text-xs text-muted-foreground">
            Google 계정으로 로그인하면 자동으로 계정이 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
