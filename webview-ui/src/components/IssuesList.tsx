import React from "react";

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: Array<{
    name: string;
    color: string;
  }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface Props {
  data: Issue[];
  onMessage: (type: string, payload?: any) => void;
}

const IssuesList: React.FC<Props> = ({ data, onMessage }) => {
  const handleRefresh = () => {
    onMessage("refresh");
  };

  const handleShowDetails = (issue: Issue) => {
    onMessage("showDetails", { data: issue });
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
        <h1 className="text-2xl font-bold">Issues</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-vscode-button hover:bg-vscode-button-hover rounded transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((issue) => (
            <div
              key={issue.id}
              className="border border-vscode-border rounded-lg p-4 hover:bg-gray-50 hover:bg-opacity-5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        issue.state === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {issue.state}
                    </span>
                    <span className="text-sm text-gray-400">
                      #{issue.number}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-semibold mb-2 cursor-pointer hover:text-blue-400"
                    onClick={() => handleShowDetails(issue)}
                  >
                    {issue.title}
                  </h3>

                  {issue.labels && issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {issue.labels.map((label, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: `#${label.color}`,
                            color: "#000",
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>By {issue.user.login}</span>
                    <span>Created {formatDate(issue.created_at)}</span>
                    <span>Updated {formatDate(issue.updated_at)}</span>
                  </div>

                  {issue.body && (
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">
                      {issue.body.substring(0, 150)}...
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleShowDetails(issue)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleOpenExternal(issue.html_url)}
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
          <p>No issues found</p>
        </div>
      )}
    </div>
  );
};

export default IssuesList;
