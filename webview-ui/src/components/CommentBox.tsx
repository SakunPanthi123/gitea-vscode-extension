import React, { useState } from "react";

interface Props {
  onAddComment: (comment: string) => void;
  isLoading?: boolean;
}

const CommentBox: React.FC<Props> = ({ onAddComment, isLoading = false }) => {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && !isLoading) {
      onAddComment(comment.trim());
      setComment("");
    }
  };

  return (
    <div className="bg-gray-50 bg-opacity-5 rounded-lg p-4 border border-gray-300 border-opacity-20">
      <h3 className="text-lg font-semibold mb-3">Add a comment</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 rounded border border-gray-300 border-opacity-30 bg-vscode-input text-vscode-input-foreground placeholder-vscode-input-placeholderForeground resize-vertical min-h-[100px] focus:outline-none focus:ring-2 focus:ring-vscode-focusBorder"
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!comment.trim() || isLoading}
            className="px-4 py-2 bg-vscode-button hover:bg-vscode-button-hover disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            {isLoading ? "Adding comment..." : "Add comment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentBox;
