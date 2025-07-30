import React from "react";
import { CommitDetails as CommitDetailsType } from "../../../types/_types";

interface Props {
  data: CommitDetailsType;
  onMessage: (type: string, payload?: any) => void;
}

const CommitDetails: React.FC<Props> = ({ data, onMessage }) => {
  const handleOpenExternal = (url: string) => {
    onMessage("openExternal", { url });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case "added":
        return "✅";
      case "modified":
        return "✏️";
      case "deleted":
        return "❌";
      case "renamed":
        return "📝";
      default:
        return "📄";
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case "added":
        return "text-green-400";
      case "modified":
        return "text-yellow-400";
      case "deleted":
        return "text-red-400";
      case "renamed":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Commit Details</h1>
      </div>

      <div className="space-y-6">
        {/* Commit Header */}
        <div className="bg-vscode-editor-background border border-vscode-panel-border rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <img
              src={data.author.avatar_url}
              alt={data.author.login}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{data.author.login}</span>
                <span className="text-gray-400">committed</span>
                <span className="text-gray-500 text-sm">
                  {formatDate(data.commit.committer.date)}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                SHA:{" "}
                <code className="bg-gray-600 bg-opacity-30 px-1 rounded">
                  {data.sha.substring(0, 8)}
                </code>
              </div>
            </div>
            <button
              onClick={() => handleOpenExternal(data.html_url)}
              className="px-3 py-1 bg-vscode-button hover:bg-vscode-button-hover rounded transition-colors text-sm"
            >
              View on Gitea
            </button>
          </div>

          {/* Commit Message */}
          <div className="bg-gray-50 bg-opacity-5 rounded border-l-4 border-blue-400 p-3">
            <pre className="text-sm whitespace-pre-wrap text-gray-200">
              {data.commit.message.trim()}
            </pre>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-vscode-editor-background border border-vscode-panel-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Changes Summary</h3>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span>{data.stats.additions} additions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded-full"></span>
              <span>{data.stats.deletions} deletions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Total:</span>
              <span>{data.stats.total} changes</span>
            </div>
          </div>
        </div>

        {/* Files Changed */}
        <div className="bg-vscode-editor-background border border-vscode-panel-border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">
            Files Changed ({data.files.length})
          </h3>
          <div className="space-y-2">
            {data.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-gray-50 bg-opacity-5 rounded hover:bg-opacity-10 transition-colors"
              >
                <span className="text-lg">
                  {getFileStatusIcon(file.status)}
                </span>
                <span
                  className={`text-xs uppercase font-medium ${getFileStatusColor(
                    file.status
                  )}`}
                >
                  {file.status}
                </span>
                <code className="flex-1 text-sm font-mono text-gray-300">
                  {file.filename}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitDetails;
