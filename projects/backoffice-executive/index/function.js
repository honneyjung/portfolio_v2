document.addEventListener("DOMContentLoaded", function () {
  autoSubMenu();
  tableStatus();
  foldContent();
  tableFilter();

  /* 서브 헤더 함수 */
  function autoSubMenu() {
    let header = document.querySelector("header");
    let subHeader = document.createElement("ul");
    let tableEls = document.querySelectorAll(".tableWrap");

    // subHeader ul 생성
    header.appendChild(subHeader);

    tableEls.forEach((element, index) => {
      let subHeaderEl = document.createElement("li");
      let aTag = document.createElement("a");

      let subTit = element.querySelector(".tableWrap__tit h2");
      subTit.setAttribute("id", `${index}`);
      aTag.href = `#${index}`;
      aTag.textContent = subTit.innerText;
      subHeaderEl.appendChild(aTag);
      subHeader.appendChild(subHeaderEl);

      // 뱃지 생성 추가 필요할 시 재진행 예정
      /* if (element.hasChildNodes("tr.new")) {
          let badge = document.createElement("span");
          subHeaderEl.appendChild(badge);
          badge.classList.add("new");
        }

        if (element.hasChildNodes("tr.update")) {
          let badge = document.createElement("span");
          subHeaderEl.appendChild(badge);
          badge.classList.add("update");
        } */
    });
  }

  // 날짜 함수
  function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear() % 100;
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);

    return `${year}-${month}-${day}`;
  }

  // 테이블 관련 함수
  function tableStatus() {
    const currentDate = getCurrentDate();
    let tableWrap = document.querySelectorAll(".tableWrap");

    const tableWrapCol = tableWrap[0].querySelector("colgroup");

    // html, 날짜, 상태 인덱스 번호 파라미터로 넣어주세요.
    tableIndex(4, 5, 6);
    // html, 날짜, 상태 셀 함수
    function tableIndex(html, date, status) {
      tableWrap.forEach((table) => {
        // 테이블 col 전체 제어 하기 위해 클론
        let tableWrapColClone = tableWrapCol.cloneNode(true);
        let tbl = table.querySelector("table");
        tbl.insertBefore(tableWrapColClone, tbl.firstChild);

        let tableRows = table.querySelectorAll("tbody tr");
        tableRows.forEach((row) => {
          let tableCols = row.querySelectorAll("td");

          // 테이블 html 셀
          let htmlCells = tableCols[html].querySelector("a");
          let htmlText = htmlCells.getAttribute("href");
          if (htmlText !== "") {
            let resultText = htmlText.replace(/^(\.\.\/)*(html\/)*|\.html$/g, "");
            htmlCells.textContent = resultText;
          }
          htmlCells.parentNode.addEventListener("mouseenter", () => {
            let spanTag = document.createElement("span");
            spanTag.classList.add("mark");
            for (i = 0; i < 4; i++) {
              if (tableCols[i].innerText) {
                tableCols[i].appendChild(spanTag);
              }
            }
          });
          htmlCells.parentNode.addEventListener("mouseleave", () => {
            for (i = 0; i < 4; i++) {
              let spanTag = tableCols[i].querySelector(".mark");
              if (spanTag) {
                spanTag.remove();
              }
            }
          });

          // 테이블 날짜 셀
          let dateCells = tableCols[date];
          let dateText = dateCells.innerText.trim();

          if (dateText !== "" && !isNaN(dateText)) {
            // 숫자인 경우, 문자열로 처리하여 포맷
            let dateString = dateText.toString();
            let formattedDate = `${dateString.slice(0, 2)}-${dateString.slice(
              2,
              4,
            )}-${dateString.slice(4)}`;

            // 포맷된 날짜를 셀에 설정
            dateCells.innerText = formattedDate;

            if (formattedDate !== currentDate && dateText.includes("/")) {
              dateCells.parentNode.classList.add("update");
            } else if (formattedDate == currentDate || formattedDate < currentDate) {
              dateCells.parentNode.classList.add("new");
            }
          } else {
            if (dateText.includes("TBD")) {
              dateCells.parentNode.classList.add("determined");
            } else if (dateText.includes("x")) {
              dateCells.parentNode.classList.add("delete");
            }
          }

          // 테이블 상태 셀
          let statusCells = tableCols[status];
          if (statusCells.parentNode.classList.contains("update")) {
            statusCells.textContent = "수정";
          } else if (statusCells.parentNode.classList.contains("new")) {
            statusCells.textContent = "작업 완료";
          } else if (statusCells.parentNode.classList.contains("determined")) {
            statusCells.textContent = "추후 작업 필요";
          } else if (statusCells.parentNode.classList.contains("delete")) {
            statusCells.textContent = "미사용";
          }
        });
      });
    }
  }

  // 필터 함수
  function tableFilter() {
    let btnFilter = document.querySelector(".btnFilter");
    let filterWrap = document.querySelector(".filterWrap");
    btnFilter.addEventListener("click", () => {
      if (filterWrap.classList.contains("active")) {
        filterWrap.classList.remove("active");
      } else {
        filterWrap.classList.add("active");
      }
    });

    let tables = document.querySelectorAll(".tableWrap");
    let filterList = document.querySelectorAll(".filterWrap__list button");
    let allFilter = filterList[0].textContent.trim();
    let pageFilter = filterList[1].textContent.trim();
    let popupFilter = filterList[2].textContent.trim();

    // 필터 클릭 이벤트
    filterList.forEach((item, index) => {
      item.addEventListener("click", () => {
        let filterText = item.textContent.trim();

        if (filterText === allFilter) {
          filterTable(allFilter); // 모든 행 보이기
        } else if (filterText === pageFilter) {
          filterTable(true); // 팝업 텍스트를 포함하는 행 숨김
        } else if (filterText === popupFilter) {
          filterTable(false); // 팝업 텍스트를 포함하지 않는 행 숨김
        }
        filterWrap.classList.remove("active");
      });
    });

    function filterTable(showPopup) {
      tables.forEach((table) => {
        let rows = table.querySelectorAll("tbody tr");

        rows.forEach((row) => {
          let cells = Array.from(row.querySelectorAll("td")).slice(0, 4);
          let shouldShowRow = true; // 기본적으로 행을 보이도록 설정

          cells.forEach((cell) => {
            let cellText = cell.textContent.trim();
            let hasPopup = cellText.includes(popupFilter);

            if (showPopup === true && hasPopup) {
              shouldShowRow = false; // 페이지 필터 조건
            } else if (showPopup === false && !hasPopup && cellText.length > 0) {
              shouldShowRow = false; // 팝업 필터 조건
            } else if (showPopup === allFilter) {
              shouldShowRow = true; // 모든 행을 보여줌
            }
          });
          row.style.display = shouldShowRow ? "" : "none"; // 행의 표시 여부 결정
        });
      });
    }
  }

  // 폴딩 기능 함수
  function foldContent() {
    let btnFold = document.querySelectorAll(".btnFold");
    let btnAllFold = document.querySelector(".btnAllFold");
    let tableWrap = document.querySelectorAll(".tableWrap");

    // 전체 폴딩 버튼
    btnAllFold.addEventListener("click", () => {
      if (Array.from(tableWrap).some((item) => item.classList.contains("fold"))) {
        tableWrap.forEach((item) => {
          item.classList.remove("fold");
        });
        btnAllFold.classList.remove("active");
      } else {
        tableWrap.forEach((item) => {
          item.classList.add("fold");
        });
        btnAllFold.classList.add("active");
      }
    });

    // 각 폴딩 버튼
    btnFold.forEach((item) => {
      item.addEventListener("click", () => {
        let parent = item.closest(".tableWrap");

        if (parent.classList.contains("fold")) {
          parent.classList.remove("fold");
        } else {
          parent.classList.add("fold");
        }

        if (Array.from(tableWrap).some((item) => item.classList.contains("fold"))) {
          btnAllFold.classList.add("active");
        } else {
          btnAllFold.classList.remove("active");
        }
      });
    });
  }

  // 스크롤 이벤트
  const floatingWrap = document.querySelector(".floatingWrap");
  let titleSticky = document.querySelectorAll(".stickyWrap");

  window.addEventListener("scroll", () => {
    let posY = window.scrollY;
    if (posY > 90) {
      floatingWrap.classList.add("active");
    } else {
      floatingWrap.classList.remove("active");
    }

    titleSticky.forEach((item) => {
      let parent = item.closest(".tableWrap");
      let stickyPos = item.offsetTop;
      let parentTop = parent.offsetTop;

      if (posY > parentTop && posY < parentTop + parent.clientHeight) {
        item.classList.add("sticky");
      } else {
        item.classList.remove("sticky");
      }
    });
  });

  const btnTop = document.querySelector(".btnTop");
  btnTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
    });
  });
});
