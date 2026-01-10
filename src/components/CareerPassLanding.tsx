import type { ReactNode } from "react";
import "./CareerPassLanding.css";
import img from "figma:asset/4d1244c8cd23f93c1a9d40fe9c4df8756afecddf.png";
import img1 from "figma:asset/ea411b67d9d8f4940503f315d1f62c9645638951.png";
import img2 from "figma:asset/e8ecf5fd235a44ec8892682cb666f9c6ef930952.png";
import imgJobInterview1 from "figma:asset/a760a2b4777fbcfa73298650beeea2b5f7b56133.png";
import imgDocuments1 from "figma:asset/0e09dacb4105c92c909cccbe5e62b5a7a22cbfbf.png";
import imgStudentCard1 from "figma:asset/11876833bc44e79bf713be48e147b2f818473679.png";
import img3 from "figma:asset/b75831d3b3e1189dc1796e5c79e974017e011974.png";
import logoImage from "figma:asset/7c5aa6dae84b9f121dc975eb56a63a422cedd564.png";

type PageType = "main" | "roadmap" | "resume" | "interview";

interface CareerPassLandingProps {
  onPageChange: (page: PageType) => void;
  onLoginClick: () => void;
}

type FeatureCard = {
  title: string;
  subtitle: string;
  image: string;
  page: PageType;
  bullets: { id: string; node: ReactNode }[];
};

type Testimonial = {
  name: string;
  company: string;
  quote: string;
  avatar: string;
};

const featureCards: FeatureCard[] = [
  {
    title: "자격증 로드맵",
    subtitle: "\"커리어 여정의 첫걸음, 자격증 준비부터\"",
    image: imgStudentCard1,
    page: "roadmap",
    bullets: [
      {
        id: "roadmap-1",
        node: (
          <span>
            📍 목표 직무에 맞는 필수 <span className="home-feature-bold">자격증 추천</span>
          </span>
        ),
      },
      {
        id: "roadmap-2",
        node: (
          <span>
            📍 단계별 <span className="home-feature-bold">로드맵</span>과 학습 계획 제공
          </span>
        ),
      },
      {
        id: "roadmap-3",
        node: <span>📍 누구나 무료 확인 가능 → 커리어 방향 설정에 도움</span>,
      },
    ],
  },
  {
    title: "자기소개서 AI",
    subtitle: "\"AI와 함께하는 똑똑한 자소서 작성\"",
    image: imgDocuments1,
    page: "resume",
    bullets: [
      {
        id: "resume-1",
        node: (
          <span>
            📍 자소서 업로드 → 맞춤형 <span className="home-feature-bold">피드백</span> 제공
          </span>
        ),
      },
      {
        id: "resume-2",
        node: (
          <span>
            📍 예상 <span className="home-feature-bold">면접 질문</span> 자동 생성
          </span>
        ),
      },
      {
        id: "resume-3",
        node: <span>📍 강점이 돋보이도록 글 다듬기 가이드</span>,
      },
    ],
  },
  {
    title: "AI 모의면접",
    subtitle: "\"실전 같은 모의면접, AI가 함께합니다\"",
    image: imgJobInterview1,
    page: "interview",
    bullets: [
      {
        id: "interview-1",
        node: (
          <span>
            📍 <span className="home-feature-bold">음성인식</span> 기반 실시간 답변 분석
          </span>
        ),
      },
      {
        id: "interview-2",
        node: <span>📍 발음·속도·어투까지 피드백 제공</span>,
      },
      {
        id: "interview-3",
        node: (
          <span>
            📍 언제 어디서<span className="home-feature-bold">든</span> 실전 같은 면접 경험
          </span>
        ),
      },
    ],
  },
];

const testimonials: Testimonial[] = [
  {
    name: "김*수",
    company: "삼성전자",
    quote:
      "\"CareerPass 덕분에 자소서 피드백과 예상 질문 준비가 훨씬 수월했어요. 면접장에서 자신감이 생겼습니다.\"",
    avatar: img,
  },
  {
    name: "이*연",
    company: "카카오",
    quote:
      "\"AI 모의면접에서 받은 예상질문이 실제 면접에서 나와, 실전에서도 떨지 않고 대답할 수 있었습니다.\"",
    avatar: img1,
  },
  {
    name: "박*지",
    company: "현대자동차",
    quote:
      "\"자격증 로드맵으로 준비 순서를 알 수 있었고, 불필요한 공부 시간을 줄일 수 있었습니다.\"",
    avatar: img1,
  },
  {
    name: "최*현",
    company: "LG유플러스",
    quote:
      "\"합격자 후기를 보며 동기부여를 받고, 저도 CareerPass의 도움으로 원하는 회사에 입사할 수 있었습니다.\"",
    avatar: img,
  },
];

export function CareerPassLanding({ onPageChange, onLoginClick }: CareerPassLandingProps) {
  return (
    <div className="home-wrapper" data-name="main page - 로그인 전">
      <div className="home-container">
        <header className="home-header">
          <div className="home-logo">
            <img src={logoImage} alt="CareerPass Logo" className="home-logo-image" />
          </div>
          <div className="home-header-right">
            <nav className="home-nav-links" aria-label="주요 메뉴">
              <button
                onClick={() => onPageChange("roadmap")}
                className="home-nav-link font-['Noto_Sans_KR:Medium',_sans-serif]"
              >
                취업 로드맵
              </button>
              <button
                onClick={() => onPageChange("resume")}
                className="home-nav-link font-['Noto_Sans_KR:Medium',_sans-serif]"
              >
                자기소개서 AI
              </button>
              <button
                onClick={() => onPageChange("interview")}
                className="home-nav-link font-['Noto_Sans_KR:Medium',_sans-serif]"
              >
                AI 모의면접
              </button>
            </nav>
            <button
              onClick={onLoginClick}
              className="home-login-button"
              aria-label="회원가입/로그인"
            >
              <span className="home-profile-icon">
                <svg className="home-profile-svg" fill="none" preserveAspectRatio="none" viewBox="0 0 62 62">
                  <circle cx="31" cy="31" r="30.5" stroke="var(--stroke-0, black)" />
                </svg>
                <span
                  className="home-profile-image"
                  data-name="프로필"
                  style={{ backgroundImage: `url('${img2}')` }}
                />
              </span>
              <span className="home-login-text font-['Noto_Sans_KR:Medium',_sans-serif]">
                회원가입/로그인
              </span>
            </button>
          </div>
        </header>

        <main className="home-main">
          <section className="home-hero">
            <div className="home-hero-media">
              <div className="home-hero-bubble">
                <img src={img3} alt="CareerPass 메인 일러스트" className="home-hero-image" />
              </div>
            </div>
            <div className="home-hero-content">
              <h1 className="home-hero-title font-['Source_Serif_Pro:Regular',_'Noto_Sans_KR:Regular',_sans-serif]">
                CareerPass
              </h1>
              <p className="home-hero-subtitle font-['Noto_Sans_KR:Light',_sans-serif]">
                취업 성공으로 향하는 가장 확실한 패스
              </p>
            </div>
          </section>

          <div className="home-divider" role="presentation" />

          <section className="home-feature-grid" aria-label="서비스 소개">
            {featureCards.map((card) => (
              <button
                key={card.title}
                className="home-feature-card"
                onClick={() => onPageChange(card.page)}
              >
                <div className="home-feature-header">
                  <h2 className="home-feature-title font-['Noto_Sans_KR:Light',_sans-serif]">
                    {card.title}
                  </h2>
                  <p className="home-feature-subtitle font-['Noto_Sans_KR:Regular',_sans-serif]">
                    {card.subtitle}
                  </p>
                </div>
                <img src={card.image} alt="" className="home-feature-image" />
                <ul className="home-feature-list font-['Noto_Sans_KR:Regular',_sans-serif]">
                  {card.bullets.map((bullet) => (
                    <li key={bullet.id}>{bullet.node}</li>
                  ))}
                </ul>
              </button>
            ))}
          </section>

          <div className="home-divider" role="presentation" />

          <section className="home-testimonials" aria-label="합격자 후기">
            <h2 className="home-section-title font-['Noto_Sans_KR:Medium',_sans-serif]">합격자 후기</h2>
            <div className="home-testimonial-list">
              {testimonials.map((item) => (
                <div key={item.name} className="home-testimonial-card">
                  <div className="home-testimonial-text">
                    <p className="home-testimonial-name font-['Noto_Sans_KR:Light',_sans-serif]">
                      {item.name} · {item.company} 합격
                    </p>
                    <p className="home-testimonial-quote font-['Noto_Sans_KR:Light',_sans-serif]">
                      {item.quote}
                    </p>
                  </div>
                  <div
                    className="home-testimonial-avatar"
                    style={{ backgroundImage: `url('${item.avatar}')` }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="home-divider" role="presentation" />

          <footer className="home-footer font-['Noto_Sans_KR:Light',_sans-serif]">
            회사소개     |     이용약관     |     개인정보처리방침     |     고객센터     @careerpass
          </footer>
        </main>
      </div>
    </div>
  );
}
