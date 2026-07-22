document.addEventListener('DOMContentLoaded', function () {

  /* ================================================================
     1. main__ban 배너 슬라이더
     - 모바일(<1024px)에서만 Swiper 활성화 (loop + autoplay)
     - PC에서는 destroy → CSS가 아이템을 세로로 쌓음
  ================================================================ */
  const banSwiper = new Swiper('.main__ban', {
    loop: true,
    speed: 600,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
  });


  /* ================================================================
     2. 주요서비스 탭 슬라이더 (slideWrap)
     - PC : 탭 버튼(btnWrap) 클릭으로 슬라이드 전환 / 터치 비활성
            이전·다음 버튼(pcBtn)으로 전환
     - 모바일 : 터치 스와이프 활성 / mobileBtn 페이지네이션 연동
  ================================================================ */
  const tabBtns        = document.querySelectorAll('.main__tabSlide--btnWrap button');
  const mobilePagerBtns = document.querySelectorAll('.main__tabSlide--mobileBtn button');
  const pcPrevBtn      = document.querySelector('.main__tabSlide--pcBtn button:first-child');
  const pcNextBtn      = document.querySelector('.main__tabSlide--pcBtn button:last-child');

  const tabSwiper = new Swiper('.slideWrap', {
    speed: 500,
    allowTouchMove: false,   // 초기값 PC — resize 핸들러에서 갱신
    on: {
      slideChange() {
        syncActive(this.realIndex);
      },
    },
  });

  // 탭 버튼 + 모바일 페이저 active 동기화
  function syncActive(idx) {
    tabBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
    mobilePagerBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
  }

  // PC / 모바일 전환 시 터치 허용 여부 갱신
  function updateTouchMode() {
    tabSwiper.allowTouchMove = window.innerWidth < 1024;
  }
  updateTouchMode();
  window.addEventListener('resize', updateTouchMode);

  // 탭 버튼 클릭 → 해당 슬라이드로 이동
  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => tabSwiper.slideTo(i));
  });

  // 모바일 페이저 클릭 → 해당 슬라이드로 이동
  mobilePagerBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => tabSwiper.slideTo(i));
  });

  // PC 이전·다음 버튼
  pcPrevBtn && pcPrevBtn.addEventListener('click', () => tabSwiper.slidePrev());
  pcNextBtn && pcNextBtn.addEventListener('click', () => tabSwiper.slideNext());

});
