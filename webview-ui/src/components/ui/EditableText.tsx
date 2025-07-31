import React, { useState, useEffect } from "react";
import { Icons } from "./Icons";

interface Props {
  value: string;
  onSave: (newValue: string) => void;
  onRequestMarkdownRender?: (markdown: string) => void;
  renderedHtml?: string;
  isTitle?: boolean;
  className?: string;
  placeholder?: string;
}

const EditableText: React.FC<Props> = ({
  value,
  onSave,
  onRequestMarkdownRender,
  renderedHtml,
  isTitle = false,
  className = "",
  placeholder = "Enter text...",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  // Only render markdown on mount if we don't have HTML yet
  useEffect(() => {
    if (
      !isTitle &&
      value &&
      value.trim() !== "" &&
      onRequestMarkdownRender &&
      !renderedHtml
    ) {
      onRequestMarkdownRender(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Request markdown when rendered HTML becomes empty (e.g., after refresh)
  useEffect(() => {
    if (
      !isTitle &&
      value &&
      value.trim() !== "" &&
      onRequestMarkdownRender &&
      !renderedHtml
    ) {
      onRequestMarkdownRender(value);
    }
  }, [renderedHtml]); 

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() !== value.trim()) {
      onSave(editValue.trim());

      // Request markdown rendering after 2 seconds of successful edit
      if (!isTitle && onRequestMarkdownRender) {
        setTimeout(() => {
          onRequestMarkdownRender(editValue.trim());
        }, 2000);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {isTitle ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 text-xl font-bold border border-gray-300 border-opacity-30 bg-vscode-input text-vscode-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            placeholder={placeholder}
          />
        ) : (
          <textarea
            rows={14}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 border border-gray-300 border-opacity-30 bg-vscode-input text-vscode-foreground resize-vertical min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            placeholder={placeholder}
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-vscode-button hover:bg-vscode-button-hover transition-colors text-sm"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-2 ${className}`}>
      <div className="flex-1">
        {isTitle ? (
          <h1 className="text-3xl font-bold">{value}</h1>
        ) : value ? (
          <div className="prose prose-invert max-w-none">
            {renderedHtml ? (
              <div
                className="rendered-markdown text-sm text-gray-300"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                style={{
                  lineHeight: "1.6",
                }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-300">
                {value}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">{placeholder}</p>
        )}
      </div>
      <button
        onClick={handleEdit}
        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-gray-300 hover:bg-gray-400 hover:bg-opacity-10 transition-all"
        title={`Edit ${isTitle ? "title" : "description"}`}
      >
        <Icons name="edit" />
      </button>
    </div>
  );
};

export default EditableText;
