import React, { useState, useEffect, useRef } from "react";
import { User } from "../../../../types/_types";

interface Props {
  availableAssignees: User[];
  currentAssignees: User[];
  onAssigneesChange: (assignees: User[]) => void;
  isLoading?: boolean;
}

const AssigneePicker: React.FC<Props> = ({
  availableAssignees,
  currentAssignees,
  onAssigneesChange,
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

  const filteredAssignees = availableAssignees.filter(
    (assignee) =>
      assignee.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignee.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentAssigneeIds = new Set(
    currentAssignees.map((assignee) => assignee.id)
  );

  const toggleAssignee = (assignee: User) => {
    if (currentAssigneeIds.has(assignee.id)) {
      // Remove assignee
      onAssigneesChange(currentAssignees.filter((a) => a.id !== assignee.id));
    } else {
      // Add assignee
      onAssigneesChange([...currentAssignees, assignee]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-vscode-button hover:bg-vscode-button-hover  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>👤</span>
        <span>Assignees ({currentAssignees.length})</span>
        <span
          className={`transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-vscode-background border border-vscode-border -lg shadow-lg z-50">
          <div className="p-2 border-b border-vscode-border">
            <input
              type="text"
              placeholder="Filter assignees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 text-sm bg-vscode-input text-vscode-foreground border border-gray-300 border-opacity-30  focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredAssignees.length === 0 ? (
              <div className="p-3 text-center text-gray-400 text-sm">
                No assignees found
              </div>
            ) : (
              filteredAssignees.map((assignee) => (
                <div
                  key={assignee.id}
                  onClick={() => toggleAssignee(assignee)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 hover:bg-opacity-10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={currentAssigneeIds.has(assignee.id)}
                    onChange={() => {}} // Handled by onClick
                    className="form-checkbox h-4 w-4 text-blue-500 "
                  />
                  <img
                    src={assignee.avatar_url}
                    alt={assignee.login}
                    className="w-8 h-8 -full flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="font-medium text-sm truncate">
                      {assignee.login}
                    </div>
                    {assignee.full_name && (
                      <div className="text-xs text-gray-400 truncate">
                        {assignee.full_name}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssigneePicker;
