import React from "react";

interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  mergeable: boolean;
}

interface Props {
  data: PullRequest;
  onMessage: (type: string, payload?: any) => void;
}

const PullRequestDetails: React.FC<Props> = ({ data, onMessage }) => {
  const handleRefresh = () => {
    onMessage("refresh");
  };

  const handleOpenExternal = (url: string) => {
    onMessage("openExternal", { url });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                data.state === "open"
                  ? "bg-green-100 text-green-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {data.state}
            </span>
            <span className="text-lg text-gray-400">#{data.number}</span>
          </div>

          <h1 className="text-3xl font-bold mb-4">{data.title}</h1>

          <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
            <span>By {data.user.login}</span>
            <span>Created {formatDate(data.created_at)}</span>
            <span>Updated {formatDate(data.updated_at)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-vscode-button hover:bg-vscode-button-hover rounded transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => handleOpenExternal(data.html_url)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Open in Gitea
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-50 bg-opacity-5 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Branch Information</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {data.head.ref}
              </span>
              <span>→</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                {data.base.ref}
              </span>
            </div>
            {data.mergeable !== undefined && (
              <div className="mt-2">
                <span
                  className={`text-sm font-medium ${
                    data.mergeable ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {data.mergeable ? "✓ Mergeable" : "✗ Conflicts detected"}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 bg-opacity-5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            {data.body ? (
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300">
                  {data.body}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No description provided
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 bg-opacity-5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Author</h3>
            <div className="flex items-center gap-3">
              <img
                src={data.user.avatar_url}
                alt={data.user.login}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium">{data.user.login}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 bg-opacity-5 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Created:</span>
                <span>{formatDate(data.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Updated:</span>
                <span>{formatDate(data.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">State:</span>
                <span className="capitalize">{data.state}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PullRequestDetails;
