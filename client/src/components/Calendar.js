import React, { useState } from "react";
import dayjs from "dayjs";
import Popup from "./Popup";

const Calendar = () => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today.month());
  const [currentYear, setCurrentYear] = useState(today.year());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const startDay = dayjs(new Date(currentYear, currentMonth, 1)).day();
  const daysInMonth = dayjs(new Date(currentYear, currentMonth + 1, 0)).date();

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowPopup(true);
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
      const response = await fetch("http://localhost:4000/calendar/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        const shareUrl = `${window.location.origin}/calendar/${data.shareCode}`;
        setShareUrl(shareUrl);
      }
    } catch (error) {
      console.error("Error creating share link:", error);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md">
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
              selectedDate === i + 1 ? "bg-blue-200 rounded" : ""
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
      {showPopup && (
        <Popup
          selectedDate={dayjs(
            new Date(currentYear, currentMonth, selectedDate)
          ).format("DD.MM")}
          handleClosePopup={handleClosePopup}
        />
      )}
      {/* {showResults && (
        <Result
          data={dummyData}
          handleFindAvailableTime={handleFindAvailableTime}
        />
      )} */}

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
