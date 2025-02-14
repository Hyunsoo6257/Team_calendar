import React, { useEffect, useState } from "react";
import TimeButton from "./TimeButton";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const Popup = ({ selectedDate, handleClosePopup, calendarId }) => {
  console.log("Popup received calendarId:", calendarId); // 디버깅용

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [usedColors, setUsedColors] = useState([]);
  const [isColorLocked, setIsColorLocked] = useState(false);
  const [existingTimes, setExistingTimes] = useState([]);

  // 날짜 포맷 변경
  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");

  useEffect(() => {
    const savedColor = Cookies.get("userPreferredColor");
    if (savedColor) {
      setSelectedColor(savedColor);
      setIsColorLocked(true);
    }

    const fetchData = async () => {
      try {
        const colorResponse = await fetch("/colors/used", {
          credentials: "include",
        });
        if (colorResponse.ok) {
          const colors = await colorResponse.json();
          setUsedColors(colors);
        }

        const scheduleResponse = await fetch(
          `/schedules?date=${formattedDate}&calendarId=${calendarId}`,
          {
            credentials: "include",
          }
        );
        if (scheduleResponse.ok) {
          const schedules = await scheduleResponse.json();
          const userTimes = schedules
            .filter((schedule) => schedule.color === savedColor)
            .map((schedule) => schedule.time);
          setSelectedTimes(userTimes);

          const allTimes = schedules.map((schedule) => ({
            time: schedule.time,
            color: schedule.color,
          }));
          setExistingTimes(allTimes);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [formattedDate, calendarId]);

  const colors = [
    { name: "red", className: "bg-red-500" },
    { name: "yellow", className: "bg-yellow-500" },
    { name: "green", className: "bg-green-500" },
    { name: "blue", className: "bg-blue-500" },
    { name: "purple", className: "bg-purple-500" },
  ];

  const handleColorSelect = (colorName) => {
    if (isColorLocked) return;
    setSelectedColor(colorName);
    Cookies.set("userPreferredColor", colorName, { expires: 7 });
    setIsColorLocked(true);
  };

  const handleTimeClick = (time) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleReset = () => {
    setSelectedTimes([]);
  };

  const handleApply = async () => {
    if (!selectedColor) {
      console.error("No color selected");
      return;
    }

    try {
      if (selectedTimes.length === 0) {
        console.log("Sending delete request for:", {
          date: formattedDate,
          color: selectedColor,
        }); // Debug log

        const response = await fetch("/schedule/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: formattedDate,
            color: selectedColor,
            calendarId: calendarId,
          }),
          credentials: "include",
        });

        const data = await response.json(); // Get the response data
        console.log("Delete response:", data); // Debug log

        if (!response.ok) {
          throw new Error(data.message || "Failed to delete schedules");
        }

        handleClosePopup();
      } else {
        const eventDetails = selectedTimes.map((time) => ({
          time: time,
          date: formattedDate,
          color: selectedColor,
          calendarId: calendarId,
        }));

        for (const eventDetail of eventDetails) {
          await createEvent(eventDetail);
        }
      }
    } catch (error) {
      console.error("Error updating schedules:", error);
      alert(`Failed to update schedule: ${error.message}`);
    }
  };

  const createEvent = async (eventDetail) => {
    if (!calendarId || isNaN(calendarId)) {
      console.error("Invalid calendarId:", calendarId);
      return;
    }

    try {
      console.log("Request payload:", eventDetail);

      const response = await fetch("/schedule/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...eventDetail,
          calendarId: Number(calendarId), // 명시적으로 숫자로 변환
        }),
        credentials: "include",
      });

      const data = await response.json();
      console.log("Raw server response:", data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error("Detailed fetch error:", error);
      throw error;
    }
  };

  const renderColorButton = (color, index) => {
    const isUsed = usedColors.includes(color.name);
    const isCurrentUserColor = selectedColor === color.name;
    const isDisabled = isColorLocked ? !isCurrentUserColor : isUsed;

    return (
      <button
        key={index}
        className={`
          w-6 h-6 rounded-full
          ${color.className}
          ${isCurrentUserColor ? "ring-4 ring-blue-500" : ""}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => !isDisabled && handleColorSelect(color.name)}
        disabled={isDisabled}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg shadow-lg relative bottom-28">
        <div className="mb-4">
          <div className="text-center text-lg font-bold mb-2">
            {formattedDate}
          </div>
          <div>Pick a color</div>
          <div className="flex justify-center space-x-2 my-2">
            {colors.map((color, index) => renderColorButton(color, index))}
          </div>
          <div>Select the time</div>
          <div className="grid grid-cols-5 gap-2 my-2">
            {[...Array(25 - 6 + 1)].map((_, i) => {
              const time = `${i + 6}:00`;
              return (
                <TimeButton
                  key={i + 6}
                  time={time}
                  isSelected={selectedTimes.includes(time)}
                  onClick={() => handleTimeClick(time)}
                />
              );
            })}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={handleClosePopup}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Popup;
