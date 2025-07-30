import React, { useEffect, useState } from "react";
import Timeline from "./Timeline";
import CommentBox from "./CommentBox";
import { PullRequest, TimelineEvent } from "./../../../types/_types";

interface Props {
  data: PullRequest;
  timeline?: TimelineEvent[];
  onMessage: (type: string, payload?: any) => void;
}

const PullRequestDetails: React.FC<Props> = ({ data, timeline, onMessage }) => {
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>(
    timeline || []
  );
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(!timeline);
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    if (!timeline) {
      // Request timeline data if not provided
      onMessage("getTimeline", { pullRequestNumber: data.number });
    }
  }, [data.number, timeline, onMessage]);

  useEffect(() => {
    // Listen for timeline updates
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "timelineData") {
        setTimelineData(message.data);
        setIsLoadingTimeline(false);
      } else if (message.type === "commentAdded") {
        // Refresh timeline when comment is added
        onMessage("getTimeline", { pullRequestNumber: data.number });
        setIsAddingComment(false);
      } else if (message.type === "commentDeleted") {
        // Refresh timeline when comment is deleted
        onMessage("getTimeline", { pullRequestNumber: data.number });
      } else if (message.type === "commentEdited") {
        // Refresh timeline when comment is edited
        onMessage("getTimeline", { pullRequestNumber: data.number });
      } else if (message.type === "updateData") {
        // Data updated (e.g., pull request closed/reopened)
        // The parent will handle the data update, we just need to refresh
        onMessage("refresh");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [data.number, onMessage]);

  const handleRefresh = () => {
    onMessage("refresh");
    setIsLoadingTimeline(true);
    onMessage("getTimeline", { pullRequestNumber: data.number });
  };

  const handleOpenExternal = (url: string) => {
    onMessage("openExternal", { url });
  };

  const handleAddComment = (comment: string) => {
    setIsAddingComment(true);
    onMessage("addComment", { pullRequestNumber: data.number, body: comment });
  };

  const handleClosePullRequest = () => {
    onMessage("closePullRequest");
  };

  const handleReopenPullRequest = () => {
    onMessage("reopenPullRequest");
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
              className={`px-3 py-1  text-sm font-medium ${
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
            className="px-4 py-2 bg-vscode-button hover:bg-vscode-button-hover  transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => handleOpenExternal(data.html_url)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700  transition-colors"
          >
            Open in Gitea
          </button>
          {data.state === "open" ? (
            <button
              onClick={handleClosePullRequest}
              className="px-4 py-2 bg-red-600 hover:bg-red-700  transition-colors"
            >
              Close Pull Request
            </button>
          ) : (
            <button
              onClick={handleReopenPullRequest}
              className="px-4 py-2 bg-green-600 hover:bg-green-700  transition-colors"
            >
              Reopen Pull Request
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-6">
          <div className="bg-gray-50 bg-opacity-5 -lg p-4 w-full">
            <h3 className="text-lg font-semibold mb-3">Branch Information</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 ">
                {data.head.ref}
              </span>
              <span>→</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 ">
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
                  {data.mergeable ? "✓ Can be merged" : "✗ Merge conflicts"}
                </span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 bg-opacity-5 -lg p-4 w-full">
            <h3 className="text-lg font-semibold mb-3">Author</h3>
            <div className="flex items-center gap-3">
              <img
                src={data.user.avatar_url}
                alt={data.user.login}
                className="w-10 h-10 -full"
              />
              <div>
                <div className="font-medium">{data.user.login}</div>
                <div className="text-sm text-gray-400">
                  Created {formatDate(data.created_at)}
                </div>
                <div className="text-sm text-gray-400">
                  Updated {formatDate(data.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 bg-opacity-5 -lg p-4">
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

        <div className="space-y-4">
          <div className="bg-gray-50 bg-opacity-5 -lg p-4">
            <h3 className="text-lg font-semibold mb-3">Timeline</h3>
            <Timeline
              events={timelineData}
              isLoading={isLoadingTimeline}
              onMessage={onMessage}
              enableCommits={true}
              canDeleteComments={true}
              canEditComments={true}
            />
          </div>
          <div>
            <CommentBox
              onAddComment={handleAddComment}
              isLoading={isAddingComment}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PullRequestDetails;
