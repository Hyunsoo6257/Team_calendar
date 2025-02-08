import React from "react";

const TimeButton = ({ time, isSelected, onClick }) => {
  return (
    <button
      className={`
        border p-1 rounded
        ${isSelected ? "bg-blue-500 text-white" : "bg-white text-blue-500"}
      `}
      onClick={onClick}
    >
      {time}
    </button>
  );
};

export default TimeButton;
