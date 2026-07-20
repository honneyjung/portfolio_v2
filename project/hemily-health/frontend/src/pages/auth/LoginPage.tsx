import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLogin } from "../../hooks/useAuth";
import logo from "../../assets/images/img_logo.png";
import AuthShell from "../../components/layout/AuthShell";

const PW_LOWER = /[a-z]/;
const PW_DIGIT = /[0-9]/;
const PW_SPECIAL = /[^a-zA-Z0-9]/;

function usernameErrorCode(v: string) {
  if (!v) return "usernameRequired" as const;
  return null;
}

function pwErrorCode(pw: string) {
  if (!pw) return "pwRequired" as const;
  if (pw.length < 8) return "pwTooShort" as const;
  if (!PW_LOWER.test(pw)) return "pwNoLower" as const;
  if (!PW_DIGIT.test(pw)) return "pwNoDigit" as const;
  if (!PW_SPECIAL.test(pw)) return "pwNoSpecial" as const;
  return null;
}

// 로그인 전용 input 클래스
const INPUT_CLS = `
  w-full h-[49px] pl-6 pr-4 rounded-full bg-onboarding border-0
  md:h-[52px] md:bg-[#F1F5F9] md:border md:border-[#94A3B8]
  text-body-sm text-gray-900
  placeholder:text-label placeholder:font-normal placeholder:text-gray-300
  outline-none transition-colors
`;

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const loginMutation = useLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });
  const [apiError, setApiError] = useState("");

  const usernameCode = touched.username ? usernameErrorCode(username) : null;
  const pwCode = touched.password ? pwErrorCode(password) : null;
  const usernameError = usernameCode ? t(`login.error.${usernameCode}`) : "";
  const pwError = pwCode ? t(`login.error.${pwCode}`) : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    setApiError("");
    if (usernameErrorCode(username) || pwErrorCode(password)) return;
    loginMutation.mutate(
      { username, password },
      { onError: () => setApiError(t("login.error.loginFailed")) },
    );
  };

  return (
    <AuthShell>
      <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-page-login md:bg-white md:px-0 md:w-full md:max-w-[400px] md:mx-auto">
        {/* 로고 — 모바일만 (md+는 브랜드 패널이 대체) */}
        <div className="mb-10 md:hidden">
          <img
            src={logo}
            alt="Hemily Health"
            className="w-full h-[130px] object-contain"
          />
        </div>

        {/* 제목 — 데스크탑/태블릿만 */}
        <h1 className="hidden md:block text-[32px] font-bold text-[#1E293B] mb-3">
          {t("login.title")}
        </h1>

        {/* 폼 */}
        <form onSubmit={handleSubmit} noValidate>
          {/* 아이디 */}
          <div>
            <label className="block text-label font-medium text-sub-text mb-3">
              {t("login.username")}
            </label>
            <input
              type="text"
              placeholder={t("login.usernamePlaceholder")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
              autoComplete="username"
              className={INPUT_CLS}
            />
            {usernameError && (
              <p className="text-red text-caption mt-1.5">{usernameError}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="mt-4">
            <label className="block text-label font-medium text-sub-text mb-3">
              {t("login.password")}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() =>
                  setTouched((prev) => ({ ...prev, password: true }))
                }
                autoComplete="current-password"
                className={`${INPUT_CLS} pr-14`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {!showPw ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            {pwError && (
              <p className="text-red text-caption mt-1.5">{pwError}</p>
            )}
          </div>

          {/* API 에러 */}
          {apiError && (
            <p className="text-red text-caption text-center mt-2">{apiError}</p>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="bg-blue w-full mt-5 py-4 rounded-full
                       text-white text-body-sm font-bold
                       disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {loginMutation.isPending
              ? t("login.submitting")
              : t("login.submit")}
          </button>

          {/* 회원가입 버튼 — background_blue */}
          <Link
            to="/consent"
            state={{ from: "signup" }}
            className="block w-full mt-2 py-4 rounded-full bg-blue-bg text-center
                       text-body-sm font-bold text-blue active:scale-[0.98] transition-all"
          >
            {t("login.goSignup")}
          </Link>
        </form>

        {/* 비밀번호 찾기 */}
        <div className="mt-5 text-center">
          <Link
            to="/forgot-password"
            className="text-label text-gray-900 underline underline-offset-2"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
