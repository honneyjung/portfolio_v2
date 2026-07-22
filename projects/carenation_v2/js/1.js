document.addEventListener('DOMContentLoaded', function () {

  /* ================================================================
     1. fullSlideWrap — 좋은 이유 슬라이더
     - service__reason--check 탭 버튼으로 슬라이드 전환
     - slideBtnWrap 이전·다음 버튼으로 전환
  ================================================================ */
  const reasonBtns = document.querySelectorAll('.service__reason--check button');
  const fullPrev   = document.querySelector('.fullSlideWrap .slideBtnWrap button:first-child');
  const fullNext   = document.querySelector('.fullSlideWrap .slideBtnWrap button:last-child');

  const fullSwiper = new Swiper('.fullSlideWrap__content', {
    speed: 400,
    allowTouchMove: false,
    on: {
      slideChange() {
        syncReasonBtns(this.realIndex);
      },
    },
  });

  function syncReasonBtns(idx) {
    reasonBtns.forEach((btn, i) => {
      btn.closest('li').classList.toggle('slick-active', i === idx);
    });
  }

  reasonBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => fullSwiper.slideTo(i));
  });

  fullPrev && fullPrev.addEventListener('click', () => fullSwiper.slidePrev());
  fullNext && fullNext.addEventListener('click', () => fullSwiper.slideNext());


  /* ================================================================
     2. cardSlideWrap — 보호자 후기 슬라이더
     - PC : slidesPerView auto (css width 416px 유지), spaceBetween 24
     - 모바일 : 1개씩, spaceBetween 16
     - slideBtnWrap 이전·다음 버튼으로 전환
  ================================================================ */
  const cardPrev = document.querySelector('.cardSlideWrap .slideBtnWrap button:first-child');
  const cardNext = document.querySelector('.cardSlideWrap .slideBtnWrap button:last-child');

  const cardSwiper = new Swiper('.cardSlideWrap__con', {
    speed: 400,
    slidesPerView: 1,
    spaceBetween: 16,
    breakpoints: {
      1024: {
        slidesPerView: 'auto',
        spaceBetween: 24,
      },
    },
  });

  cardPrev && cardPrev.addEventListener('click', () => cardSwiper.slidePrev());
  cardNext && cardNext.addEventListener('click', () => cardSwiper.slideNext());

});
