import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "../../lib/api/users";
import AuthShell from "../../components/layout/AuthShell";

type ConsentKey = "terms" | "privacy" | "sensitive" | "infoShare" | "marketing";

interface ConsentDef {
  key: ConsentKey;
  required: boolean;
  hasArrow: boolean;
  hasSub?: boolean;
}

const CONSENT_DEFS: ConsentDef[] = [
  { key: "terms", required: true, hasArrow: true },
  { key: "privacy", required: true, hasArrow: true },
  { key: "sensitive", required: true, hasArrow: true },
  { key: "infoShare", required: true, hasArrow: false, hasSub: true },
  { key: "marketing", required: false, hasArrow: false },
];

const REQUIRED_KEYS = CONSENT_DEFS.filter((d) => d.required).map((d) => d.key);

export default function ConsentPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const isPreSignup = (location.state as { from?: string } | null)?.from === "signup";

  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    terms: false,
    privacy: false,
    sensitive: false,
    infoShare: false,
    marketing: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const allChecked = CONSENT_DEFS.every((d) => consents[d.key]);
  const requiredChecked = REQUIRED_KEYS.every((k) => consents[k]);

  const saveMutation = useMutation({
    mutationFn: () =>
      usersApi.saveConsents([
        { consent_type: "terms_of_service", is_agreed: consents.terms },
        { consent_type: "privacy_policy", is_agreed: consents.privacy },
        { consent_type: "info_share_agreed", is_agreed: consents.infoShare },
        { consent_type: "marketing", is_agreed: consents.marketing },
      ]),
    onSuccess: () => navigate("/survey", { replace: true }),
  });

  const toggleAll = () => {
    const next = !allChecked;
    setConsents({
      terms: next,
      privacy: next,
      sensitive: next,
      infoShare: next,
      marketing: next,
    });
  };
  const toggle = (key: ConsentKey) =>
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = () => {
    setSubmitted(true);
    if (!requiredChecked) return;
    if (isPreSignup) {
      navigate("/signup", {
        state: {
          ...(location.state as Record<string, unknown> ?? {}),
          consents: [
            { consent_type: "terms_of_service",  is_agreed: consents.terms },
            { consent_type: "privacy_policy",     is_agreed: consents.privacy },
            { consent_type: "sensitive_health_info", is_agreed: consents.sensitive },
            { consent_type: "info_share_agreed",  is_agreed: consents.infoShare },
            { consent_type: "marketing",          is_agreed: consents.marketing },
          ],
        },
      });
      return;
    }
    saveMutation.mutate();
  };

  const requiredDefs = CONSENT_DEFS.filter((d) => d.required);
  const marketingDef = CONSENT_DEFS.find((d) => !d.required)!;

  return (
    <AuthShell>
      <div className="flex-1 flex flex-col bg-[#f1f5f9] md:bg-white md:w-full md:max-w-[600px] md:mx-auto md:justify-center md:py-12">
        {/* 헤더 — 모바일만 */}
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
          <p className="text-[24px] font-bold text-[#191919] tracking-[-0.24px]">
            {t("consentPage.title")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
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

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 md:flex-none md:overflow-visible">
          {/* 제목 — 데스크탑/태블릿만 */}
          <h1 className="hidden md:block text-[24px] font-bold text-[#1E293B] mb-4">
            {t("consentPage.title")}
          </h1>

          <div className="flex flex-col gap-[39px] mt-[38px] md:gap-[14px] md:mt-0">
            {/* 전체동의 버튼 — h-[61px], bg #003E7F, rounded-full */}
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-[12px] w-full h-[61px] md:h-[56px] pl-[20px] rounded-full
                         bg-[#003e7f] transition-colors active:scale-[0.99]"
            >
              <CheckboxFilled checked={allChecked} noBorder />
              <span className="text-[18px] md:text-[16px] font-bold text-[#f1f5f9]">
                {t("consentPage.allAgree")}
              </span>
            </button>

            {/* 구분선 — 데스크탑만 */}
            <div className="hidden md:block h-px bg-[#e2e8f0]" />

            {/* 항목 목록 */}
            <div className="flex flex-col gap-[36px] w-full md:gap-[14px]">
              {/* 필수 항목들 — gap-[20px] */}
              <div className="flex flex-col gap-[20px] md:gap-[14px]">
                {requiredDefs.map((def) => (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => toggle(def.key)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-[12px]">
                      <CheckboxFilled checked={consents[def.key]} />
                      <div className="flex flex-col gap-[4px]">
                        <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">
                          {t(`consentPage.items.${def.key}`)}
                        </p>
                        {def.hasSub && (
                          <p className="text-[12px] font-normal text-[#94a3b8] tracking-[-0.24px]">
                            {t("consentPage.items.infoShareSub")}
                          </p>
                        )}
                      </div>
                    </div>
                    {def.hasArrow && (
                      <svg
                        width="8"
                        height="13"
                        viewBox="0 0 8 13"
                        fill="none"
                        stroke="#191919"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0"
                      >
                        <polyline points="1 1 7 6.5 1 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* 마케팅 항목 — outline 체크박스 */}
              <button
                type="button"
                onClick={() => toggle(marketingDef.key)}
                className="flex items-center gap-[12px] text-left"
              >
                <CheckboxOutline checked={consents[marketingDef.key]} />
                <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">
                  {t("consentPage.items.marketing")}
                </p>
              </button>
            </div>
          </div>

          {submitted && !requiredChecked && (
            <p className="text-red text-caption text-center mt-5">
              {t("consentPage.error.requiredAll")}
            </p>
          )}
        </div>

        {/* 하단 버튼 — h-[52px], gradient */}
        <div className="flex-none px-5 pb-10 pt-3 md:pb-0 md:pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className="w-full h-[52px] rounded-full text-[16px] font-medium text-[#f1f5f9]
                       bg-gradient-blue disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {t("consentPage.submit")}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

// 필수 항목 체크박스 — filled square
// noBorder: 전체동의 버튼용 — 항상 #F1F5F9 배경 고정, 체크마크만 색상 변경
function CheckboxFilled({ checked, noBorder }: { checked: boolean; noBorder?: boolean }) {
  if (noBorder) {
    return (
      <div className="w-[20px] h-[20px] flex-shrink-0 flex items-center justify-center rounded-[2px] border border-[#f1f5f9] bg-transparent">
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <polyline
              points="1,4.5 4,8 10,1"
              stroke="#f1f5f9"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    );
  }
  return (
    <div
      className={`w-[20px] h-[20px] flex-shrink-0 flex items-center justify-center
                     transition-colors rounded-[2px]
                     ${checked ? "bg-[#003e7f]" : "border border-[#003e7f] bg-transparent"}`}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <polyline
            points="1,4.5 4,8 10,1"
            stroke="#f1f5f9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

// 마케팅 체크박스 — outline (border 0.5px #003E7F)
function CheckboxOutline({ checked }: { checked: boolean }) {
  return (
    <div
      className={`w-[20px] h-[20px] flex-shrink-0 flex items-center justify-center
                     rounded-[2px] border-[0.5px] border-[#003e7f] transition-colors
                     ${checked ? "bg-[#003e7f]" : "bg-transparent"}`}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <polyline
            points="1,4.5 4,8 10,1"
            stroke="#f1f5f9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
