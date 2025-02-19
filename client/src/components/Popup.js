import React, { useEffect, useState } from "react";
import TimeButton from "./TimeButton";
import Cookies from "js-cookie";
import dayjs from "dayjs";

const Popup = ({
  selectedDate,
  bookedTimes,
  onClose,
  calendarId,
  onUpdateBookedTimes,
}) => {
  // API URL 설정 단순화
  const API_URL = process.env.REACT_APP_API_URL;
  console.log("Popup using API URL:", API_URL);

  console.log("Popup received calendarId:", calendarId); // 디버깅용

  const [selectedColor, setSelectedColor] = useState("blue");
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
        const colorResponse = await fetch(`${API_URL}/colors/used`, {
          credentials: "include",
        });
        if (colorResponse.ok) {
          const colors = await colorResponse.json();
          setUsedColors(colors);
        }

        const scheduleResponse = await fetch(
          `${API_URL}/schedules?date=${formattedDate}&calendarId=${calendarId}`,
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

  // DB 업데이트 함수 정의
  const updateDatabase = async () => {
    try {
      // 기존 일정 삭제
      await fetch(`${API_URL}/schedule/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          date: selectedDate,
          calendarId: calendarId,
        }),
      });

      // 선택된 시간이 있으면 새로운 일정 생성
      if (selectedTimes.length > 0) {
        // 각 선택된 시간에 대해 개별적으로 저장
        for (const time of selectedTimes) {
          const eventDetail = {
            time: time,
            date: selectedDate,
            color: selectedColor,
            calendarId: calendarId,
          };

          await fetch(`${API_URL}/schedule/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(eventDetail),
          });
        }
      }
    } catch (error) {
      console.error("Error in updateDatabase:", error);
      throw error;
    }
  };

  const handleApply = async () => {
    try {
      await updateDatabase();
      onUpdateBookedTimes(selectedTimes);
      onClose();
    } catch (error) {
      console.error("Error applying changes:", error);
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

  // bookedTimes를 이용해 UI 업데이트
  const isTimeBooked = (time) => {
    return bookedTimes.some((booking) => booking.time === time);
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
          onClick={onClose}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Popup;
