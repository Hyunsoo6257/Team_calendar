import React from "react";
import Button from "../components/Button";

const Popup = ({ selectedDate, handleClosePopup }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg shadow-lg relative">
        <div className="text-center mb-4">
          <div className="text-lg font-bold mb-2">{selectedDate}</div>
          <div>Pick a color</div>
          <div className="flex justify-center space-x-2 my-2">
            <button className="w-6 h-6 bg-red-500 rounded-full"></button>
            <button className="w-6 h-6 bg-yellow-500 rounded-full"></button>
            <button className="w-6 h-6 bg-green-500 rounded-full"></button>
            <button className="w-6 h-6 bg-blue-500 rounded-full"></button>
            <button className="w-6 h-6 bg-purple-500 rounded-full"></button>
          </div>
          <div>Select the time</div>
          <div className="grid grid-cols-5 gap-2 my-2">
            {[...Array(25 - 6 + 1)].map((_, i) => (
              <Button key={i + 6} time={`${i + 6}:00`} />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleClosePopup}
          >
            Reset
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
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
