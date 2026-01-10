import { useEffect, useState } from "react";
import fetchApi from "./api";
import { clearAccessToken, setAccessToken } from "./authToken";

export function AuthCallback() {
  const [message, setMessage] = useState("로그인 처리 중입니다...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (import.meta.env.DEV) {
      console.log("[AuthCallback] callback params", { code, error });
    }

    if (error) {
      clearAccessToken();
      setMessage("로그인 중 오류가 발생했습니다. 다시 시도해 주세요.");
      if (import.meta.env.DEV) {
        console.error("[AuthCallback] received error param", error);
      }
      return;
    }

    if (!code) {
      clearAccessToken();
      setMessage("유효하지 않은 로그인 응답입니다.");
      return;
    }

    const exchangeToken = async () => {
      try {
        if (import.meta.env.DEV) {
          console.log("[AuthCallback] exchanging code for token");
        }
        const res = await fetchApi("/auth/token", {
          method: "POST",
          body: { code },
        });
        const accessToken = res?.accessToken;

        if (!accessToken) {
          setMessage("토큰을 받지 못했습니다. 다시 로그인해 주세요.");
          return;
        }

        setAccessToken(accessToken);

        if (import.meta.env.DEV) {
          console.log("[AuthCallback] token exchange success");
        }

        window.location.replace("/");
      } catch (err) {
        setMessage("로그인 처리에 실패했습니다. 다시 시도해 주세요.");
        clearAccessToken();
        if (import.meta.env.DEV) {
          console.error("[AuthCallback] token exchange failed", err);
        }
      }
    };

    exchangeToken();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] p-6">
      <div className="bg-white shadow-md rounded-xl p-6 text-center space-y-3 max-w-sm w-full">
        <h1 className="text-xl font-semibold text-[#051243]">로그인 처리 중</h1>
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => window.location.replace("/")}
          type="button"
        >
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
