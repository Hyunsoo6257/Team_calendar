import React from "react";

const TimeButton = ({ time, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`border p-1 rounded ${
        isSelected ? "bg-blue-500 text-white" : "bg-white text-blue-500"
      }`}
    >
      {time}
    </button>
  );
};

export default TimeButton;
