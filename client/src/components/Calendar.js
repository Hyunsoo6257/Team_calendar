import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Popup from "./Popup";
import Cookies from "js-cookie";
import AvailableTimesList from "./AvailableTimesList";

const Calendar = () => {
  // Simplify environment variable check
  console.log("=== Environment Variables Check ===");
  console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);

  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today.month());
  const [currentYear, setCurrentYear] = useState(today.year());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [calendarId, setCalendarId] = useState(null);
  const [availableTimes, setAvailableTimes] = useState(() => {
    const saved = localStorage.getItem("availableTimes");
    return saved ? JSON.parse(saved) : [];
  });
  const [showAvailableTimes, setShowAvailableTimes] = useState(false);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [isDataChanged, setIsDataChanged] = useState(false);

  const startDay = dayjs(new Date(currentYear, currentMonth, 1)).day();
  const daysInMonth = dayjs(new Date(currentYear, currentMonth + 1, 0)).date();

  // Simplify API URL setup
  const API_URL = process.env.REACT_APP_API_URL;
  console.log("Using API URL:", API_URL);

  useEffect(() => {
    // Initialize default calendarId
    setCalendarId(1); // Always start with 1

    // Get necessary information
    const savedCalendarId = Cookies.get("calendarId");
    const pathParts = window.location.pathname.split("/");
    const shareCode = pathParts[2];

    if (shareCode) {
      // When accessing via Share URL
      fetch(`${API_URL}/calendar/byShareCode/${shareCode}`, {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            Cookies.set("calendarId", "1"); // Always set to 1
            setCalendarId(1);
          }
        });
    } else if (savedCalendarId) {
      // Regular access + existing cookie
      Cookies.set("calendarId", "1"); // Overwrite existing cookie to 1
      setCalendarId(1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("availableTimes", JSON.stringify(availableTimes));
  }, [availableTimes]);

  const handleDateClick = async (date) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(date).padStart(2, "0")}`;

    // API URL 디버깅
    console.log("API URL:", API_URL);
    console.log(
      "Full Request URL:",
      `${API_URL}/schedules?date=${formattedDate}&calendarId=${calendarId}`
    );
    console.log("calendarId:", calendarId);

    try {
      const response = await fetch(
        `${API_URL}/schedules?date=${formattedDate}&calendarId=${calendarId}`,
        { credentials: "include" }
      );
      const data = await response.json();
      setBookedTimes(data);
      setSelectedDate(formattedDate);
      setShowPopup(true);
    } catch (error) {
      console.error("Error details:", error);
    }
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
    if (isDataChanged) {
      const fetchBookedTimes = async () => {
        const response = await fetch(
          `${API_URL}/schedules?date=${selectedDate}&calendarId=${calendarId}`,
          { credentials: "include" }
        );
        const data = await response.json();
        setBookedTimes(data);
      };
      fetchBookedTimes();
    }
    setShowPopup(false);
  };
  const handleFindAvailableTime = async () => {
    try {
      const response = await fetch(
        `${API_URL}/available-times?calendarId=${calendarId}`,
        { credentials: "include" }
      );
      const data = await response.json();

      if (data.success) {
        setAvailableTimes(data.availableTimes); // 상태 업데이트
        setShowAvailableTimes(true);
      }
    } catch (error) {
      console.error("Error fetching available times:", error);
    }
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
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl shadow-md mb-4">
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
                selectedDate &&
                dayjs(selectedDate).format("D") === String(i + 1)
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
        <div className="mt-4 pb-4 mx-2 flex justify-between">
          <button
            className="bg-blue-500 text-white px-3 py-2 rounded"
            onClick={handleShare}
          >
            Share Calendar
          </button>
          <button
            className="bg-blue-500 text-white px-3 py-2 rounded"
            onClick={handleFindAvailableTime}
          >
            Find the available time
          </button>
        </div>
        {showPopup && (
          <Popup
            selectedDate={selectedDate}
            bookedTimes={bookedTimes}
            onClose={handleClosePopup}
            calendarId={calendarId}
            onUpdateBookedTimes={setBookedTimes}
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

      {/* 가능한 시간 목록 - 캘린더 아래에 직접 표시 */}
      {showAvailableTimes && availableTimes.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-lg font-bold mb-4">Available Times</h3>
          <div className="space-y-2">
            {availableTimes.map((slot, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 rounded-lg flex justify-between items-center"
              >
                <div className="text-blue-600">
                  {dayjs(slot.date).format("MM/DD")}
                </div>
                <div className="font-medium">
                  {slot.startTime} ~ {slot.endTime}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
