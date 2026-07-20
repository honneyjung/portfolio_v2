import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api/auth";
import AuthShell from "../../components/layout/AuthShell";

// 검증된 해밀리안 (이름/이메일은 백엔드에 코드→정보 조회 API가 생기면 채움)
type VerifiedManager = { code: string; name?: string; email?: string };

export default function HemilianLinkPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const location = useLocation();
  const formData = (location.state as Record<string, unknown>) ?? {};

  const [code, setCode] = useState((formData.cfwCode as string) ?? "");
  const [verified, setVerified] = useState<VerifiedManager | null>(null);
  const [error, setError] = useState("");

  const verifyMutation = useMutation({
    mutationFn: () => authApi.getHemilianInfo(code.trim()),
    onSuccess: (res) => {
      const info = res.data;
      if (info?.hemilian_code) {
        setError("");
        setVerified({ code: info.hemilian_code, name: info.name });
      } else {
        setVerified(null);
        setError(t("hemilianLinkPage.invalidCode"));
      }
    },
    onError: () => setError(t("hemilianLinkPage.invalidCode")),
  });

  const handleClose = () => navigate("/signup", { state: formData });
  const handleReenter = () => {
    setVerified(null);
    setError("");
  };
  const handleSave = () =>
    navigate("/signup", { state: { ...formData, cfwCode: verified?.code ?? code.trim() } });

  return (
    <AuthShell>
      <div className="flex-1 flex flex-col bg-onboarding md:bg-white md:w-full md:max-w-[560px] md:mx-auto md:justify-center md:py-12">
        {/* 헤더 — × 닫기 (모바일만) */}
        <header className="md:hidden flex-none flex justify-end px-5 py-5">
          <button type="button" onClick={handleClose} className="p-1 text-gray-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 md:flex-none md:overflow-visible md:px-0 flex flex-col gap-[24px]">
          <p className="text-[24px] md:text-[28px] font-bold text-[#191919] leading-snug tracking-[-0.24px] whitespace-pre-line">
            {t("hemilianLinkPage.title")}
          </p>

          {/* 코드 입력 카드 — 입력칸과 코드확인 버튼은 간격(gap-3)으로 분리 (붙이지 않음) */}
          <div className="bg-[#dbeafe] rounded-[16px] px-[20px] py-[16px] flex flex-col gap-3">
            <p className="text-[14px] font-medium text-[#003e7f] tracking-[-0.32px]">
              {t("hemilianLinkPage.codeLabel")}
            </p>
            <input
              type="text"
              placeholder={t("hemilianLinkPage.codePlaceholder")}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (verified) setVerified(null);
              }}
              className="w-full h-[48px] bg-white rounded-full pl-5 text-[15px] text-gray-900 tracking-[-0.32px]
                         placeholder:text-[#94a3b8] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => verifyMutation.mutate()}
              disabled={!code.trim() || verifyMutation.isPending}
              className="w-full h-[44px] rounded-full bg-[#003e7f] text-white text-[14px] font-bold
                         disabled:opacity-50 active:scale-[0.99] transition-all"
            >
              {verifyMutation.isPending ? t("hemilianLinkPage.verifying") : t("hemilianLinkPage.verify")}
            </button>
            {error && <p className="text-red text-caption">{error}</p>}
          </div>

          {/* 검증 후: 담당 해밀리안 확인 섹션 */}
          {verified && (
            <>
              <div className="h-px bg-[#e2e8f0]" />
              <p className="text-[20px] md:text-[22px] font-bold text-[#191919] leading-snug whitespace-pre-line">
                {t("hemilianLinkPage.confirmTitle")}
              </p>
              <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[16px] px-[15px] py-[13px] flex items-center gap-3">
                <div className="flex-none size-[48px] rounded-full bg-[#003e7f] flex items-center justify-center">
                  <span className="text-[18px] font-bold text-white">
                    {verified.name?.[0] ?? "H"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#1e293b]">
                    {verified.name} · {verified.code}
                  </p>
                </div>
              </div>

              {/* 다시 입력 / 저장하기 */}
              <div className="flex gap-[8px] pt-1">
                <button
                  type="button"
                  onClick={handleReenter}
                  className="flex-1 h-[48px] rounded-full bg-[#e2e8f0] text-[#64748b] text-[15px] font-medium
                             active:scale-[0.98] transition-all"
                >
                  {t("hemilianLinkPage.reenter")}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 h-[48px] rounded-full bg-[#003e7f] text-white text-[15px] font-bold
                             active:scale-[0.98] transition-all"
                >
                  {t("hemilianLinkPage.save")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
