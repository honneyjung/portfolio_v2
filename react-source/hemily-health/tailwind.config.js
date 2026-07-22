/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Hemily BLUE ──────────────────────────
        // hemily_blue    : #003E7F  → blue (DEFAULT)
        // sub_blue       : #69BBE4  → blue-mid
        // background_blue: #BCE4F8  → blue-light (survey bg)
        // background_blue: #DBEAFE  → blue-bg    (login 회원가입 버튼)
        // disabled_blue  : #A0B6CE  → blue-muted
        // bottom_blue    : #D2DFED  → blue-btn
        blue: {
          DEFAULT: "#003E7F",
          mid: "#69BBE4",
          light: "#BCE4F8",
          bg: "#DBEAFE",
          muted: "#A0B6CE",
          btn: "#D2DFED",
          outline: "#5BA3D9",   // outline_blue
          disable: "#94A3B8",   // disable_blue
        },
        // ── Page backgrounds ─────────────────────
        // bg-200 (login page bg)   : #F8FAFF  → page-login
        // onboarding_bg (signup bg): #F1F5F9  → onboarding
        // bg / input bg            : #F1F5F9  → onboarding (same)
        "page-login":  "#F8FAFF",
        "onboarding":  "#F1F5F9",
        // ── Sub text ─────────────────────────────
        // sub_text: #64748B → sub-text
        "sub-text": "#64748B",
        // ── Hemily RED ───────────────────────────
        // hemily_red    : #9D0006  → red (DEFAULT)
        // sub_red       : #F1C2C0  → red-mid
        // success       : #FFE3DD  → red-light
        // background_red: #FFF5F2  → red-muted
        red: {
          DEFAULT: "#9D0006",
          mid: "#F1C2C0",
          light: "#FFE3DD",
          muted: "#FFF5F2",
        },
        // ── Grayscale ────────────────────────────
        // text           : #191919  → gray-900
        // text_secondary : #555555  → gray-600
        // disabled       : #C5C5C5  → gray-300
        // bg             : #F4F4F4  → gray-100
        // Bg-100         : #FCFCFC  → gray-50
        gray: {
          900: "#191919",
          600: "#555555",
          300: "#C5C5C5",
          100: "#F4F4F4",
          50: "#FCFCFC",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Heading / Title / Body / Label / Caption
        heading: ["32px", { lineHeight: "1.3", fontWeight: "700" }],
        title: ["24px", { lineHeight: "1.4", fontWeight: "700" }],
        "body-lg": ["21px", { lineHeight: "1.5" }],
        "body-md": ["18px", { lineHeight: "1.5" }],
        "body-sm": ["16px", { lineHeight: "1.5" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "1.4" }],
      },
    },
  },
  plugins: [
    require("tailwindcss-rtl"), // ms-*, me-*, ps-*, pe-* 등 RTL 대응 유틸리티 추가
  ],
};
