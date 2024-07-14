// Result.js
import React from "react";

const Result = ({ data }) => {
  return (
    <div className="mt-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="mb-2 p-4 border rounded-lg bg-white shadow-md"
        >
          <div className="text-lg font-semibold">{item.date}</div>
          <div className="text-blue-600">
            {item.startTime} ~ {item.endTime}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Result;
