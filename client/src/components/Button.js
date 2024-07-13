import React from "react";

const Button = ({ children, onClick }) => (
  <button
    className="bg-blue-500 text-white px-4 py-2 rounded"
    onClick={onClick}
  >
    {children}
  </button>
);

export default Button;
