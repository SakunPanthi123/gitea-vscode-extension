import React, { useState, useEffect, useRef } from "react";
import { Label } from "../../../../types/_types";

interface Props {
  availableLabels: Label[];
  currentLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  isLoading?: boolean;
}

const LabelPicker: React.FC<Props> = ({
  availableLabels,
  currentLabels,
  onLabelsChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentLabelIds = new Set(currentLabels.map((label) => label.id));

  const toggleLabel = (label: Label) => {
    if (currentLabelIds.has(label.id)) {
      // Remove label
      onLabelsChange(currentLabels.filter((l) => l.id !== label.id));
    } else {
      // Add label
      onLabelsChange([...currentLabels, label]);
    }
  };

  const getContrastColor = (hexColor: string) => {
    // Remove # if present
    const color = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-vscode-button hover:bg-vscode-button-hover  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Labels ({currentLabels.length})</span>
        <span
          className={`transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-vscode-background border border-vscode-border -lg shadow-lg z-50">
          <div className="p-2 border-b border-vscode-border">
            <input
              type="text"
              placeholder="Filter labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-sm bg-vscode-input text-vscode-foreground border border-gray-300 border-opacity-30  focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredLabels.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                No labels found
              </div>
            ) : (
              filteredLabels.map((label) => (
                <div
                  key={label.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleLabel(label);
                  }}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 hover:bg-opacity-10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentLabelIds.has(label.id)}
                    onChange={() => {}} // Handled by onClick
                    className="form-checkbox h-4 w-4 text-blue-500 "
                  />
                  <span
                    className="px-2 py-1  text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: `#${label.color}`,
                      color: getContrastColor(label.color),
                    }}
                  >
                    {label.name}
                  </span>
                  {label.description && (
                    <span className="text-xs text-gray-400 truncate">
                      {label.description}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelPicker;
