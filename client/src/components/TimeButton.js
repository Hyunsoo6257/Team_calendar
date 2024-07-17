import React, { useState } from "react";

const Button = ({ time }) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <button
      onClick={handleClick}
      className={`border p-1 rounded ${
        isActive ? "bg-blue-500 text-white" : "bg-white text-blue-500"
      }`}
    >
      {time}
    </button>
  );
};

export default Button;
