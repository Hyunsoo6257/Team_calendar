import React, { useState } from "react";
import dayjs from "dayjs";
import Popup from "./Popup";

const Calendar = () => {
  const today = dayjs();
  const [currentMonth, setCurrentMonth] = useState(today.month());
  const [currentYear, setCurrentYear] = useState(today.year());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

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

  return (
    <div className="p-4 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-5">
        <button onClick={handlePrevMonth}>&lt;</button>
        <div>
          {dayjs(new Date(currentYear, currentMonth)).format("MMMM YYYY")}
        </div>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
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
      <div className="mt-4 flex justify-between">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setSelectedDate(null)}
        >
          Reset
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
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
    </div>
  );
};

export default Calendar;
