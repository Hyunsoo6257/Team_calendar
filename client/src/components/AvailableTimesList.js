import React from "react";
import dayjs from "dayjs";

const AvailableTimesList = ({ availableTimes, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-2xl w-full">
        {/* 헤더 */}
        <div className="text-xl font-bold mb-4 text-center">
          Select the time
        </div>

        {/* 닫기 버튼 */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>

        {/* 시간 그리드 */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          {availableTimes.map((slot, index) => (
            <div
              key={index}
              className={`
                p-2 rounded text-center cursor-pointer
                ${
                  slot.isSelected
                    ? "bg-blue-500 text-white"
                    : "text-blue-500 hover:bg-blue-100"
                }
              `}
            >
              {slot.time}
            </div>
          ))}
        </div>

        {/* 날짜별 구분선 */}
        <div className="mt-4 text-gray-500 text-sm">
          {dayjs(availableTimes[0]?.date).format("YYYY-MM-DD")}
        </div>
      </div>
    </div>
  );
};

export default AvailableTimesList;
