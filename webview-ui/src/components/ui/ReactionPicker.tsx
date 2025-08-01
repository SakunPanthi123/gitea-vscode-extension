import React, { useState, useRef, useEffect } from "react";
import { ReactionSummary } from "../../../../types/_types";
import { Icons } from "./Icons";

interface Props {
  reactions?: ReactionSummary[];
  onAddReaction: (reaction: string) => void;
  onRemoveReaction: (reaction: string) => void;
  disabled?: boolean;
  className?: string;
}

// Common Gitea reactions
const REACTION_EMOJIS = [
  { emoji: "👍", name: "+1", label: "thumbs up" },
  { emoji: "👎", name: "-1", label: "thumbs down" },
  { emoji: "😄", name: "laugh", label: "laugh" },
  { emoji: "🎉", name: "hooray", label: "hooray" },
  { emoji: "😕", name: "confused", label: "confused" },
  { emoji: "❤️", name: "heart", label: "heart" },
  { emoji: "🚀", name: "rocket", label: "rocket" },
  { emoji: "👀", name: "eyes", label: "eyes" },
];

const ReactionPicker: React.FC<Props> = ({
  reactions = [],
  onAddReaction,
  onRemoveReaction,
  disabled = false,
  className = "",
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const handleReactionClick = (reactionName: string) => {
    const existingReaction = reactions.find((r) => r.content === reactionName);

    if (existingReaction && existingReaction.me) {
      // User has already reacted, remove reaction
      onRemoveReaction(reactionName);
    } else {
      // User hasn't reacted, add reaction
      onAddReaction(reactionName);
    }
  };

  const handleEmojiClick = (reactionName: string) => {
    handleReactionClick(reactionName);
    setShowPicker(false);
  };

  return (
    <div className={`relative ${className} w-max`} ref={pickerRef}>
      {/* Existing reactions */}
      <div className="flex flex-wrap gap-1 mb-2 w-max">
        {reactions.map((reaction) => (
          <button
            key={reaction.content}
            onClick={() => handleReactionClick(reaction.content)}
            disabled={disabled}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
              reaction.me
                ? "bg-vscode-button text-vscode-button-foreground border-vscode-button"
                : "bg-vscode-input text-vscode-foreground border-vscode-input-border hover:bg-vscode-input-hover"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={`${reaction.count} reaction${
              reaction.count !== 1 ? "s" : ""
            }`}
          >
            <span>
              {REACTION_EMOJIS.find((e) => e.name === reaction.content)
                ?.emoji || reaction.content}
            </span>
            <span className="text-xs font-medium">{reaction.count}</span>
          </button>
        ))}

        {/* Add reaction button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={disabled}
          className={`flex items-center justify-center w-6 h-6 text-vscode-foreground border border-vscode-input-border rounded hover:bg-vscode-input-hover transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          title="Add reaction"
        >
          <Icons name="plus" />
        </button>
      </div>

      {/* Reaction picker dropdown */}
      {showPicker && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-vscode-background border border-vscode-input-border rounded shadow-lg z-10 min-w-max">
          <div className="grid grid-cols-4 gap-1">
            {REACTION_EMOJIS.map((reactionEmoji) => {
              const existingReaction = reactions.find(
                (r) => r.content === reactionEmoji.name
              );
              const isSelected = existingReaction?.me || false;

              return (
                <button
                  key={reactionEmoji.name}
                  onClick={() => handleEmojiClick(reactionEmoji.name)}
                  className={`p-2 text-lg rounded hover:bg-vscode-input-hover transition-colors ${
                    isSelected
                      ? "bg-vscode-button text-vscode-button-foreground"
                      : ""
                  }`}
                  title={reactionEmoji.label}
                >
                  {reactionEmoji.emoji}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;
