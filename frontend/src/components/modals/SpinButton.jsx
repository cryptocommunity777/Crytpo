import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Simple Spin button — looks like other action buttons.
 * Props:
 *  - className (optional) to override/add classes
 *  - label (optional) to change text
 */
const SpinButton = ({ className = "", label = "🎰 Spin to Win" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // redirect to spin-income page
    navigate("/spin-income");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        `px-3 py-2 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ` +
        `bg-amber-500 hover:bg-amber-600 text-slate-900 ${className}`
      }
    >
     </button>
  );
};

export default SpinButton;
