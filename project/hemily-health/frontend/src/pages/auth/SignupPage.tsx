import { useState, useEffect, forwardRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import { ko } from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";
import { useRegister } from "../../hooks/useAuth";
import type { ConsentItem } from "../../lib/api/auth";
import { useSurveyStore } from "../../lib/store/surveyStore";
import AuthShell from "../../components/layout/AuthShell";

const USERNAME_REGEX = /^[a-z0-9]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_LOWER = /[a-z]/;
const PW_DIGIT = /[0-9]/;
const PW_SPECIAL = /[^a-zA-Z0-9]/;

function usernameErrorCode(v: string) {
  if (!v) return "usernameRequired" as const;
  if (v.length < 8) return "usernameTooShort" as const;
  if (v.length >= 20) return "usernameTooLong" as const;
  if (!USERNAME_REGEX.test(v)) return "usernameInvalid" as const;
  return null;
}
function nameErrorCode(v: string) {
  return v.trim() ? null : ("nameRequired" as const);
}
function emailErrorCode(v: string) {
  if (!v) return null; // 선택 입력
  if (!EMAIL_REGEX.test(v)) return "emailInvalid" as const;
  return null;
}
function pwErrorCode(v: string) {
  if (!v) return "pwRequired" as const;
  if (v.length < 8) return "pwTooShort" as const;
  if (!PW_LOWER.test(v)) return "pwNoLower" as const;
  if (!PW_DIGIT.test(v)) return "pwNoDigit" as const;
  if (!PW_SPECIAL.test(v)) return "pwNoSpecial" as const;
  return null;
}
function confirmErrorCode(pw: string, v: string) {
  if (!v) return "pwConfirmRequired" as const;
  if (pw !== v) return "pwConfirmMismatch" as const;
  return null;
}

function EyeIcon({ open }: { open: boolean }) {
  return (
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
      {open ? (
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
  );
}

function CalendarIcon() {
  return (
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

const BirthDateInput = forwardRef<
  HTMLDivElement,
  { value?: string; onClick?: () => void }
>(({ value, onClick }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className="input flex items-center pr-3 cursor-pointer"
  >
    <span
      className={`flex-1 text-body-sm ${value ? "text-gray-900" : "text-gray-300"}`}
    >
      {value || "YYYY / MM / DD"}
    </span>
    <CalendarIcon />
  </div>
));
BirthDateInput.displayName = "BirthDateInput";

type AccountType = "general" | "hemilian";

export default function SignupPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const registerMutation = useRegister();
  const { setGender, setBirthDate } = useSurveyStore();

  const [scrolled, setScrolled] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("general");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cfwCode, setCfwCode] = useState("");
  const [hemilianCode, setHemilianCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [gender, setGenderState] = useState<"male" | "female" | "">("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [touched, setTouched] = useState({
    username: false,
    name: false,
    email: false,
    password: false,
    confirmPw: false,
    hemilianCode: false,
    phone: false,
  });
  const [apiError, setApiError] = useState("");
  const [emailDuplicateError, setEmailDuplicateError] = useState("");
  const [savedConsents, setSavedConsents] = useState<ConsentItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setBirthYear(String(date.getFullYear()));
      setBirthMonth(String(date.getMonth() + 1).padStart(2, "0"));
      setBirthDay(String(date.getDate()).padStart(2, "0"));
    } else {
      setBirthYear("");
      setBirthMonth("");
      setBirthDay("");
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // HemilianLinkPage에서 돌아올 때 폼 상태 복원
  useEffect(() => {
    const s = location.state as Record<string, unknown> | null;
    if (!s) return;
    if (typeof s.accountType === "string") setAccountType(s.accountType as AccountType);
    if (typeof s.username === "string") setUsername(s.username);
    if (typeof s.name === "string") setName(s.name);
    if (typeof s.email === "string") setEmail(s.email);
    if (typeof s.phone === "string") setPhone(s.phone);
    if (typeof s.cfwCode === "string") setCfwCode(s.cfwCode);
    if (typeof s.password === "string") setPassword(s.password);
    if (typeof s.confirmPw === "string") setConfirmPw(s.confirmPw);
    if (typeof s.gender === "string") setGenderState(s.gender as "male" | "female" | "");
    if (s.selectedDate) handleDateChange(new Date(s.selectedDate as string));
    if (Array.isArray(s.consents)) setSavedConsents(s.consents as ConsentItem[]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usernameCode = touched.username ? usernameErrorCode(username) : null;
  const nameCode = touched.name ? nameErrorCode(name) : null;
  const emailCode = touched.email ? emailErrorCode(email) : null;
  const pwCode = touched.password ? pwErrorCode(password) : null;
  const confirmCode = touched.confirmPw
    ? confirmErrorCode(password, confirmPw)
    : null;
  const hemilianInvalid =
    touched.hemilianCode && accountType === "hemilian" && !hemilianCode.trim();

  const usernameError = usernameCode ? t(`signup.error.${usernameCode}`) : "";
  const nameError = nameCode ? t(`signup.error.${nameCode}`) : "";
  const emailError = emailCode ? t(`signup.error.${emailCode}`) : "";
  const pwError = pwCode ? t(`signup.error.${pwCode}`) : "";
  const confirmError = confirmCode ? t(`signup.error.${confirmCode}`) : "";
  const hemilianError = hemilianInvalid
    ? t("signup.error.hemilianCodeRequired")
    : "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      username: true,
      name: true,
      email: true,
      password: true,
      confirmPw: true,
      hemilianCode: true,
      phone: true,
    });
    setApiError("");
    setEmailDuplicateError("");

    if (
      usernameErrorCode(username) ||
      nameErrorCode(name) ||
      emailErrorCode(email) ||
      pwErrorCode(password) ||
      confirmErrorCode(password, confirmPw)
    )
      return;
    if (accountType === "hemilian" && !hemilianCode.trim()) return;

    if (accountType === "general") {
      if (!phone || !gender || !birthYear || !birthMonth || !birthDay) {
        setApiError(t("signup.error.requiredFields"));
        return;
      }
    }

    if (gender) setGender(gender);
    if (birthYear && birthMonth && birthDay) {
      setBirthDate(`${birthYear}-${birthMonth}-${birthDay}`);
    }

    registerMutation.mutate(
      {
        account_type: accountType,
        userid: username.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        password,
        password_confirm: confirmPw,
        phone_number: phone ? phone.replace(/\D/g, "") : undefined,
        gender: gender || undefined,
        birth_date:
          birthYear && birthMonth && birthDay
            ? `${birthYear}-${birthMonth}-${birthDay}`
            : undefined,
        hemilian_referral_code:
          accountType === "general" && cfwCode ? cfwCode.trim() : undefined,
        hemilian_code:
          accountType === "hemilian" ? hemilianCode.trim() : undefined,
        consents: savedConsents,
      },
      {
        onSuccess: () => setShowSuccessModal(true),
        onError: (err: unknown) => {
          const res = (
            err as {
              response?: { status?: number; data?: { detail?: string; error?: { message?: string } } };
            }
          )?.response;
          if (res?.status === 409) {
            const detail = res.data?.error?.message ?? res.data?.detail ?? "";
            if (detail.includes("userid") || detail.includes("username")) {
              setApiError(t("signup.error.usernameDuplicate"));
            } else if (detail.includes("해밀리안 코드")) {
              setApiError("이미 사용 중인 해밀리안 코드입니다.");
            } else if (detail.includes("이메일")) {
              setEmailDuplicateError(t("signup.error.emailDuplicate"));
            } else {
              setApiError(t("signup.error.registerFailed"));
            }
          } else {
            setApiError(t("signup.error.registerFailed"));
          }
        },
      },
    );
  };

  return (
    <AuthShell>
      {/* 스크롤 시 fixed 헤더 — 모바일만 */}
      {scrolled && (
        <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center px-4 py-3 bg-white border-b border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mr-4 p-1 text-gray-900"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-body-sm font-bold text-gray-900">
            {t("signup.title")}
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-onboarding md:bg-white md:w-full md:max-w-[640px] md:mx-auto">

      {/* 데스크탑/태블릿 제목 */}
      <h1 className="hidden md:block px-6 pt-12 pb-1 text-[28px] font-bold text-[#1E293B]">
        {t("signup.title")}
      </h1>

      {/* 기본 헤더 — 모바일만 */}
      <header className="md:hidden flex-none flex items-center justify-between px-5 py-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 text-[#191919]"
        >
          <svg
            width="12"
            height="21"
            viewBox="0 0 12 21"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="11 1 1 10.5 11 20" />
          </svg>
        </button>
        <h1 className="text-[24px] font-bold text-[#191919] tracking-[-0.24px]">
          {t("signup.title")}
        </h1>
        <button
          type="button"
          onClick={() => navigate("/login", { replace: true })}
          className="p-1 text-[#191919]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* 폼 */}
      <form
        id="signup-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex-1 overflow-y-auto px-6 py-6 space-y-5 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-5 md:gap-y-5 md:content-start"
      >
        {/* ── 회원 유형 ─────────────────────────────── */}
        <section className="md:col-span-2">
          <p className="text-label font-bold text-gray-900 mb-3">
            {t("signup.accountType.section")}
          </p>
          <div className="flex gap-2">
            {(["general", "hemilian"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`flex-1 h-[65px] rounded-2xl flex flex-col items-center justify-center gap-[5px] text-body-sm font-bold transition-colors ${
                  accountType === type
                    ? "bg-blue text-white"
                    : "bg-gray-100 text-gray-900 border border-gray-300"
                }`}
              >
                {t(`signup.accountType.${type}`)}
                <span
                  className={`block text-caption font-normal mt-0.5 ${
                    accountType === type ? "text-blue-light" : "text-gray-600"
                  }`}
                >
                  {t(`signup.accountType.${type}Sub`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 아이디 ───────────────────────────────── */}
        <div>
          <label className="block text-label font-medium text-gray-600 mb-3">
            {t("signup.username")}
          </label>
          <input
            type="text"
            placeholder={t("signup.usernamePlaceholder")}
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""),
              )
            }
            onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
            autoComplete="username"
            maxLength={19}
            className="input"
          />
          {usernameError && (
            <p className="text-red text-caption mt-1.5">{usernameError}</p>
          )}
        </div>

        {/* ── 비밀번호 ─────────────────────────────── */}
        <div>
          <label className="block text-label font-medium text-gray-600 mb-3">
            {t("signup.password")}
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder={t("signup.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              autoComplete="new-password"
              className="input pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900"
            >
              <EyeIcon open={!showPw} />
            </button>
          </div>
          {pwError && <p className="text-red text-caption mt-1.5">{pwError}</p>}
        </div>

        {/* ── 비밀번호 확인 ─────────────────────────── */}
        <div>
          <label className="block text-label font-medium text-gray-600 mb-3">
            {t("signup.passwordConfirm")}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder={t("signup.passwordConfirmPlaceholder")}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, confirmPw: true }))
              }
              autoComplete="new-password"
              className="input pr-14"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900"
            >
              <EyeIcon open={!showConfirm} />
            </button>
          </div>
          {confirmError && (
            <p className="text-red text-caption mt-1.5">{confirmError}</p>
          )}
        </div>

        {/* ── 이름 ─────────────────────────────────── */}
        <div>
          <label className="block text-label font-medium text-gray-600 mb-3">
            {t("signup.name")}
          </label>
          <input
            type="text"
            placeholder={t("signup.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            className="input"
          />
          {nameError && (
            <p className="text-red text-caption mt-1.5">{nameError}</p>
          )}
        </div>

        {/* ── 이메일 (선택) ─────────────────────────── */}
        <div>
          <label className="block text-label font-medium text-gray-600 mb-3">
            {t("signup.email")}
          </label>
          <input
            type="email"
            placeholder={t("signup.emailPlaceholder")}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailDuplicateError(""); }}
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            autoComplete="email"
            className="input"
          />
          {(emailError || emailDuplicateError) && (
            <p className="text-red text-caption mt-1.5">{emailDuplicateError || emailError}</p>
          )}
        </div>

        {/* ── 휴대폰 번호 ─────────────────────────── */}
        <div>
          <label className="block text-label font-medium text-gray-600 mb-3">
            {t("signup.phone")}
          </label>
          <input
            type="tel"
            placeholder={t("signup.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
            className="input"
          />
          {touched.phone && accountType === "general" && !phone.trim() && (
            <p className="text-red text-caption mt-1.5">{t("signup.error.phoneRequired")}</p>
          )}
        </div>

        {/* ── 코드 입력 (조건부) ─────────────────────── */}
        {accountType === "general" ? (
          <div>
            <label className="block text-label font-medium text-gray-600 mb-3">
              {t("signup.cfwCode")}
            </label>
            <input
              type="text"
              readOnly
              placeholder={t("signup.cfwCodePlaceholder")}
              value={cfwCode}
              onClick={() =>
                navigate("/signup/hemilian-link", {
                  state: {
                    accountType,
                    username,
                    name,
                    email,
                    phone,
                    cfwCode,
                    password,
                    confirmPw,
                    gender,
                    selectedDate: selectedDate?.toISOString() ?? null,
                  },
                })
              }
              className="input cursor-pointer"
            />
          </div>
        ) : (
          <div>
            <label className="block text-label font-medium text-gray-600 mb-3">
              {t("signup.hemilianCode")}
            </label>
            <input
              type="text"
              placeholder={t("signup.hemilianCodePlaceholder")}
              value={hemilianCode}
              onChange={(e) => setHemilianCode(e.target.value)}
              onBlur={() =>
                setTouched((prev) => ({ ...prev, hemilianCode: true }))
              }
              className="input"
            />
            {hemilianError && (
              <p className="text-red text-caption mt-1.5">{hemilianError}</p>
            )}
            <button
              type="button"
              className="w-full mt-2 py-3 rounded-full bg-blue-muted text-white text-body-sm font-bold
                         active:scale-[0.98] transition-all"
            >
              {t("signup.hemilianCodeVerify")}
            </button>
          </div>
        )}

        {/* ── 가입 설문 ─────────────────────────────── */}
        <section className="md:col-span-2">
          <p className="text-label font-bold text-gray-900 mb-3">
            {t("signup.survey.section")}
          </p>

          {/* 성별 */}
          <div className="mb-5">
            <label className="block text-label font-medium text-gray-600 mb-3">
              {t("signup.survey.gender")}
            </label>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderState(g)}
                  className={`flex-1 py-[14px] rounded-full text-body-sm font-bold transition-colors ${
                    gender === g
                      ? "bg-blue text-white"
                      : "bg-blue-muted text-white"
                  }`}
                >
                  {t(`signup.survey.${g}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-label font-medium text-gray-600 mb-3">
              {t("signup.survey.birthdate")}
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy / MM / dd"
              locale={ko}
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
              maxDate={new Date()}
              customInput={<BirthDateInput />}
              wrapperClassName="w-full"
              popperPlacement="bottom-start"
              popperClassName="z-50"
            />
          </div>
        </section>

        {apiError && (
          <p className="text-red text-caption text-center md:col-span-2">{apiError}</p>
        )}
      </form>

      {/* ── 가입하기 버튼 ─────────────────────────────── */}
      <div className="flex-none px-6 py-4">
        <button
          type="submit"
          form="signup-form"
          disabled={registerMutation.isPending}
          className="bg-gradient-blue w-full py-[14px] rounded-full text-white text-body-sm font-bold
                     disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {registerMutation.isPending
            ? t("signup.submitting")
            : t("signup.submit")}
        </button>
      </div>

      </div>{/* bg-onboarding wrapper */}

      {/* 회원가입 완료 팝업 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl px-8 py-8 mx-6 flex flex-col items-center gap-6 shadow-xl">
            <p className="text-[18px] font-bold text-[#191919] text-center tracking-[-0.36px]">
              회원가입이 완료되었습니다.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full h-[48px] rounded-full bg-blue text-white text-[16px] font-bold
                         active:scale-[0.98] transition-all"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
