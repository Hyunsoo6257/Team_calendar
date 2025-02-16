import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Popup from "./Popup";
import Cookies from "js-cookie";

const Calendar = () => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today.month());
  const [currentYear, setCurrentYear] = useState(today.year());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [calendarId, setCalendarId] = useState(null);

  const startDay = dayjs(new Date(currentYear, currentMonth, 1)).day();
  const daysInMonth = dayjs(new Date(currentYear, currentMonth + 1, 0)).date();

  const API_URL =
    process.env.NODE_ENV === "production"
      ? "http://time4team-env.eba-2mxpvpsk.ap-southeast-2.elasticbeanstalk.com" // 배포 환경
      : process.env.REACT_APP_API_URL; // 개발 환경

  useEffect(() => {
    // 저장된 캘린더 ID가 있으면 그걸 사용
    const savedCalendarId = Cookies.get("calendarId");
    console.log("Initial cookie value:", savedCalendarId);

    if (savedCalendarId) {
      setCalendarId(Number(savedCalendarId));
      console.log("Using saved calendarId:", savedCalendarId);
    } else {
      fetch(`${API_URL}/calendar/default`, {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("Got new calendarId:", data.calendarId);
            Cookies.set("calendarId", String(data.calendarId), { expires: 7 });
            setCalendarId(Number(data.calendarId));
          }
        })
        .catch((error) => {
          console.error("Error fetching default calendar:", error);
        });
    }
  }, []);

  const handleDateClick = (date) => {
    // 날짜 문자열 직접 생성
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(date).padStart(2, "0")}`;

    setSelectedDate(formattedDate);
    setShowPopup(true);
    console.log("Selected date:", formattedDate); // 디버깅용
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  const handleClosePopup = () => {
    setShowPopup(false);
  };
  const handleFindAvailableTime = () => {
    setShowResults(true);
  };
  const handleShare = async () => {
    try {
      const data = await handleCreateNewCalendar();
      if (data.success) {
        const shareUrl = `${window.location.origin}/calendar/${data.shareCode}`;
        setShareUrl(shareUrl);
      }
    } catch (error) {
      console.error("Error sharing calendar:", error);
    }
  };

  const handleCreateNewCalendar = async () => {
    try {
      const response = await fetch(`${API_URL}/calendar/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();
      console.log("Create calendar response:", data); // 디버깅용

      if (data.success) {
        Cookies.set("calendarId", String(data.calendarId), { expires: 7 });
        setCalendarId(Number(data.calendarId));
        return data;
      }
    } catch (error) {
      console.error("Error creating new calendar:", error);
      throw error;
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      {/* Create New Calendar 버튼 */}
      <div className="mb-4 flex justify-end">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleCreateNewCalendar}
        >
          Create New Calendar
        </button>
      </div>
      {/* Calendar header */}
      <div className="flex justify-between items-center mb-5">
        <button onClick={handlePrevMonth}>&lt;</button>
        <div>
          {dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY")}
        </div>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      {/* Calendar Day */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div key={day} className="font-bold">
            {day}
          </div>
        ))}
        {[...Array(startDay)].map((_, i) => (
          <div key={i} className="p-2"></div>
        ))}
        {[...Array(daysInMonth)].map((_, i) => (
          <div
            key={i + 1}
            className={`p-2 cursor-pointer ${
              selectedDate && dayjs(selectedDate).format("D") === String(i + 1)
                ? "bg-blue-200 rounded"
                : ""
            } ${
              today.date() === i + 1 &&
              today.month() === currentMonth &&
              today.year() === currentYear
                ? "bg-red-200 rounded"
                : ""
            }`}
            onClick={() => handleDateClick(i + 1)}
          >
            {i + 1}
          </div>
        ))}
      </div>
      {/* Calendar Footer */}
      <div className="mt-4 flex justify-between">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleShare}
        >
          Share Calendar
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleFindAvailableTime}
        >
          Find the available time
        </button>
      </div>
      {showPopup && selectedDate && calendarId && !isNaN(calendarId) && (
        <Popup
          selectedDate={selectedDate}
          handleClosePopup={handleClosePopup}
          calendarId={calendarId}
        />
      )}
      {/* 디버깅용 */}
      {console.log("Popup conditions:", {
        showPopup,
        selectedDate,
        calendarId,
      })}

      {shareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg shadow-lg relative">
            <div className="mb-4">
              <div className="text-center text-lg font-bold mb-4">
                Share Calendar
              </div>
              <p className="text-center mb-4">
                Share this link with others (max 5 people)
              </p>
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="border p-2 w-full mb-4"
              />
              <div className="flex justify-center">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setShareUrl(""); // Close the popup after copying
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setShareUrl("")}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
