document.addEventListener("DOMContentLoaded", function () {
  // 1. 전체 슬라이드 개수 파악 및 세팅
  const totalSlides = document.querySelectorAll(".careMain__ban--swiper .swiper-slide").length;
  document.querySelector(".ban-total").textContent = totalSlides;

  // 2. Swiper 초기화
  const mainBannerSwiper = new Swiper(".careMain__ban--swiper", {
    loop: true, // 무한 반복 설정
    autoplay: {
      delay: 5000, // 5초(5000ms)마다 자동 실행
      disableOnInteraction: false, // 사용자가 스와이프를 건드린 후에도 자동 재생 유지
    },
    // 이벤트 리스너: 슬라이드가 바뀔 때마다 실행
    on: {
      slideChange: function () {
        // realIndex는 복제된 슬라이드를 제외한 실제 순서(0부터 시작)를 반환합니다.
        document.querySelector(".ban-current").textContent = this.realIndex + 1;
      },
    },
  });
});

// [케어네이션 간병정보] 슬라이드 초기화
const infoSwiperContainer = document.querySelector(".careMain__info--swiper");

if (infoSwiperContainer) {
  const infoSwiper = new Swiper(".careMain__info--swiper", {
    loop: true, // 무한 반복
    autoplay: {
      delay: 5000, // 5초마다 자동 실행
      disableOnInteraction: false,
    },
    // 하단 숫자 도트(Pagination) 설정
    pagination: {
      el: ".careMain__info--dot",
      clickable: true, // 도트를 클릭하면 해당 슬라이드로 이동
      // 기존 디자인처럼 <li> 태그 안에 숫자가 들어가도록 커스텀 생성
      renderBullet: function (index, className) {
        return '<li class="' + className + '">' + (index + 1) + "</li>";
      },
    },
  });
}

// [케어메이트 정보] 도넛 차트 그리기
const chartCanvas = document.getElementById("caremateChart");

if (chartCanvas) {
  new Chart(chartCanvas, {
    type: "doughnut", // 도넛 형태 지정
    data: {
      labels: ["내국인", "외국인"],
      datasets: [
        {
          // HTML에 기재된 데이터 (80.1과 합쳐서 100이 되도록 19.9로 조정했습니다)
          data: [80.1, 19.9],
          backgroundColor: [
            "#8B6B56", // 내국인 색상 (메인 컬러에 맞춰 임의 지정)
            "#E5DCD5", // 외국인 색상
          ],
          borderWidth: 0, // 도넛 조각 사이의 선 없애기
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // 부모 div(.mainDataInfo__chart--canvas) 크기에 꽉 차게 맞춤
      cutout: "75%", // 도넛의 뚫린 구멍 크기 (퍼센트가 클수록 얇아집니다)
      plugins: {
        legend: {
          display: false, // HTML에 이미 범례를 만들었으므로 기본 범례는 숨김 처리
        },
        tooltip: {
          enabled: true, // 마우스 올렸을 때 툴팁 표시
        },
      },
    },
  });
}

// [간병 서비스 신청하기] 버튼 페이지 이동
const applyBtn = document.querySelector(".careMain__btn");

if (applyBtn) {
  applyBtn.addEventListener("click", function () {
    // 새 창이 아닌 현재 창에서 1.html로 이동
    window.location.href = "1.html";
  });
}

// 보호자 후기
const reviewBtn = document.querySelector(".careMain__review--list button");
if (reviewBtn) {
  reviewBtn.addEventListener("click", function () {
    window.location.href = "0-4.html";
  });
}
