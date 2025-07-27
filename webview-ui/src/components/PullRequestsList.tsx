import React from "react";
import { PullRequest } from "./_types";

interface Props {
  data: PullRequest[];
  onMessage: (type: string, payload?: any) => void;
}

const PullRequestsList: React.FC<Props> = ({ data, onMessage }) => {
  const handleRefresh = () => {
    onMessage("refresh");
  };

  const handleShowDetails = (pr: PullRequest) => {
    onMessage("showDetails", { data: pr });
  };

  const handleOpenExternal = (url: string) => {
    onMessage("openExternal", { url });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pull Requests</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-vscode-button hover:bg-vscode-button-hover rounded transition-colors"
        >
          Refresh
        </button>
      </div>

      {data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((pr) => (
            <div
              key={pr.id}
              className="border border-vscode-border rounded-lg p-4 hover:bg-gray-50 hover:bg-opacity-5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        pr.state === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {pr.state}
                    </span>
                    <span className="text-sm text-gray-400">#{pr.number}</span>
                  </div>

                  <h3
                    className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-400"
                    onClick={() => handleShowDetails(pr)}
                  >
                    {pr.title}
                  </h3>

                  <div className="text-sm text-gray-400 mb-2">
                    <span>
                      {pr.head.ref} → {pr.base.ref}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>By {pr.user.login}</span>
                    <span>Created {formatDate(pr.created_at)}</span>
                    <span>Updated {formatDate(pr.updated_at)}</span>
                  </div>

                  {pr.body && (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                      {pr.body.substring(0, 150)}...
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleShowDetails(pr)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleOpenExternal(pr.html_url)}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No pull requests found</p>
        </div>
      )}
    </div>
  );
};

export default PullRequestsList;
