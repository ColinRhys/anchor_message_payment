import React, { useState } from "react";

// Reusable button to copy values that can then be pasted

interface CopyButtonProps {
  valueToCopy: string;
  label: string;
}

const CopyButton = ({ valueToCopy, label }: CopyButtonProps) => {
  const [copyStatus, setCopyStatus] = useState("");
  const handleCopy = () => {
    navigator.clipboard
      .writeText(valueToCopy)
      .then(() => {
        setCopyStatus(`Copied "${valueToCopy}" to the clipboard`);
        setTimeout(() => setCopyStatus(""), 3000);
      })
      .catch((err) => {
        setCopyStatus("Failed to copy");
        console.error("Could not copy text: ", err);
      });
  };

  return (
    <div>
      <button onClick={handleCopy}>{label}</button>
      {copyStatus && <p>{copyStatus}</p>}
    </div>
  );
};

export default CopyButton;
