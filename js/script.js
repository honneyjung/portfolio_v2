document.addEventListener("DOMContentLoaded", () => {
  // 1. 네비게이션 링크와 메인 섹션 요소들을 모두 선택합니다.
  const navLinks = document.querySelectorAll(".nav-link");
  const pageSections = document.querySelectorAll(".page-section");

  // 2. 각 메뉴 링크에 클릭 이벤트를 등록합니다.
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // 앵커 태그의 기본 동작(페이지 상단으로 튕기거나 이동하는 현상)을 막습니다.
      e.preventDefault();

      // 3. 모든 메뉴 링크에서 'active' 클래스를 제거하고, 클릭된 링크에만 추가합니다.
      navLinks.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      // 4. 클릭된 링크의 href 속성값 (예: '#portfolio', '#resume')을 가져옵니다.
      const targetId = this.getAttribute("href");

      // 5. 모든 섹션을 숨김 처리(active 클래스 제거) 합니다.
      pageSections.forEach((section) => {
        section.classList.remove("active");
      });

      // 6. 클릭한 메뉴와 연결된 타겟 섹션만 화면에 표시(active 클래스 추가) 합니다.
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
      }
    });
  });
});
