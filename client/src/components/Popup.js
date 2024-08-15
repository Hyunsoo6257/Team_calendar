import React, { useEffect, useState } from "react";
import TimeButton from "./TimeButton";

const Popup = ({ selectedDate, handleClosePopup }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedTimes, setSelectedTimes] = useState([]);

  const colors = [
    { name: "red", className: "bg-red-500" },
    { name: "yellow", className: "bg-yellow-500" },
    { name: "green", className: "bg-green-500" },
    { name: "blue", className: "bg-blue-500" },
    { name: "purple", className: "bg-purple-500" },
  ];

  const handleTimeClick = (time) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleApply = async () => {
    const eventDetails = {
      time: 6, // Assuming `time` is in "HH:mm" format
      date: "2024-08-19",
      color_id: 1, // Assuming `selectedColor` is the color_id
    };

    const payload = { eventDetails };

    try {
      console.log(payload);
      console.log("=What the fuck");
      const response = await createEvent(payload);
      console.log("Event details created successfully:", response);
    } catch (error) {
      console.error("Error creating event details:", error);
    }
  };

  async function createEvent(eventDetail) {
    try {
      const response = await fetch("http://localhost:4000/schedule/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(eventDetail),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      throw error;
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-4 rounded-lg shadow-lg relative bottom-28">
        <div className="mb-4">
          <div className="text-center text-lg font-bold mb-2">
            {selectedDate}
          </div>
          <div>Pick a color</div>
          <div className="flex justify-center space-x-2 my-2">
            {colors.map((color, index) => (
              <button
                key={index}
                className={`w-6 h-6 rounded-full ${color.className} ${
                  selectedColor === color.name ? "ring-4 ring-blue-500" : ""
                }`}
                onClick={() => setSelectedColor(color.name)}
              ></button>
            ))}
          </div>
          <div>Select the time</div>
          <div className="grid grid-cols-5 gap-2 my-2">
            {[...Array(25 - 6 + 1)].map((_, i) => (
              <TimeButton
                key={i + 6}
                time={`${i + 6}:00`}
                isSelected={selectedTimes.includes(`${i + 6}:00`)}
                onClick={() => handleTimeClick(`${i + 6}:00`)}
              />
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
