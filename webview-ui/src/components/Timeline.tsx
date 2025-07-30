import React, { useState, useEffect, useCallback } from "react";
import { TimelineEvent, CommitDetails } from "./../../../types/_types";

interface Props {
  events: TimelineEvent[];
  isLoading?: boolean;
  onMessage?: (type: string, payload?: any) => void;
  enableCommits?: boolean; // New prop to control commit functionality
  canDeleteComments?: boolean; // New prop to control comment deletion
}

const Timeline: React.FC<Props> = ({
  events,
  isLoading,
  onMessage,
  enableCommits = true,
  canDeleteComments = true,
}) => {
  const [commitDetails, setCommitDetails] = useState<
    Record<string, CommitDetails>
  >({});
  const [loadingCommits, setLoadingCommits] = useState<Set<string>>(new Set());

  // Extract commit IDs from pull_push events
  const extractCommitIds = (event: TimelineEvent): string[] => {
    if (event.type !== "pull_push") return [];
    try {
      const pushData = JSON.parse(event.body);
      return pushData.commit_ids || [];
    } catch {
      return [];
    }
  };

  // Fetch commit details for a specific commit
  const fetchCommitDetails = useCallback(
    async (commitId: string) => {
      if (commitDetails[commitId] || loadingCommits.has(commitId)) return;

      setLoadingCommits((prev) => {
        const newSet = new Set(Array.from(prev));
        newSet.add(commitId);
        return newSet;
      });

      if (onMessage) {
        onMessage("getCommitDetails", { commitId });
      }
    },
    [commitDetails, loadingCommits, onMessage]
  );

  // Listen for commit details responses
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "commitDetails") {
        const { commitId, data } = message;
        setCommitDetails((prev) => ({
          ...prev,
          [commitId]: data,
        }));
        setLoadingCommits((prev) => {
          const newSet = new Set(prev);
          newSet.delete(commitId);
          return newSet;
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Auto-fetch commit details when events change
  useEffect(() => {
    if (!onMessage || !events || !enableCommits) return;

    const commitIds: string[] = [];
    events.forEach((event) => {
      if (event.type === "pull_push") {
        const ids = extractCommitIds(event);
        commitIds.push(...ids);
      }
    });

    // Fetch details for all commits
    commitIds.forEach((commitId) => {
      fetchCommitDetails(commitId);
    });
  }, [events, onMessage, fetchCommitDetails, enableCommits]);

  const handleShowCommitDetails = (commitId: string) => {
    if (onMessage && commitDetails[commitId]) {
      onMessage("showCommitDetails", { data: commitDetails[commitId] });
    }
  };
  const handleDeleteComment = (commentId: number) => {
    if (onMessage) {
      onMessage("deleteComment", { commentId });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "comment":
        return "💬";
      case "label":
        return "🏷️";
      case "project":
        return "📋";
      case "pull_push":
        return "🔄";
      case "change_title":
        return "✏️";
      case "merge_pull":
        return "🔀";
      case "delete_branch":
        return "🗂️";
      case "assignee":
        return "👤";
      case "milestone":
        return "🎯";
      case "close":
        return "❌";
      case "reopen":
        return "🔓";
      default:
        return "📝";
    }
  };

  const getEventDescription = (event: TimelineEvent) => {
    switch (event.type) {
      case "comment":
        return "commented";
      case "label":
        return event.label
          ? `added label "${event.label.name}"`
          : "modified labels";
      case "project":
        return event.project_id ? "added to project" : "removed from project";
      case "pull_push":
        try {
          const pushData = JSON.parse(event.body);
          const commitCount = pushData.commit_ids?.length || 0;
          const forceText = pushData.is_force_push ? " (force push)" : "";
          return `pushed ${commitCount} commit${
            commitCount !== 1 ? "s" : ""
          }${forceText}`;
        } catch {
          return "pushed commits";
        }
      case "change_title":
        return `changed title from "${event.old_title}" to "${event.new_title}"`;
      case "merge_pull":
        return "merged this pull request";
      case "delete_branch":
        return `deleted branch "${event.old_ref}"`;
      case "assignee":
        return event.removed_assignee ? "removed assignee" : "assigned to";
      case "milestone":
        return event.milestone
          ? "added to milestone"
          : "removed from milestone";
      case "close":
        return "closed this";
      case "reopen":
        return "reopened this";
      default:
        return event.type.replace("_", " ");
    }
  };

  const shouldShowBody = (event: TimelineEvent) => {
    return event.type === "comment" && event.body && event.body.trim() !== "";
  };

  const renderCommitDetails = (event: TimelineEvent) => {
    if (event.type !== "pull_push" || !enableCommits) return null;

    const commitIds = extractCommitIds(event);
    if (commitIds.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {commitIds.map((commitId) => {
          const details = commitDetails[commitId];
          const isLoading = loadingCommits.has(commitId);

          return (
            <div
              key={commitId}
              className="bg-gray-50 bg-opacity-5 rounded border border-gray-300 border-opacity-20 p-3"
            >
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-300 bg-opacity-20 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-300 bg-opacity-20 rounded w-1/2"></div>
                </div>
              ) : details ? (
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-200 mb-1">
                        {details.commit.message.split("\n")[0]}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-3">
                        <span>
                          <code className="bg-gray-600 bg-opacity-30 px-1 rounded">
                            {commitId.substring(0, 8)}
                          </code>
                        </span>
                        <span>
                          📄 {details.files.length} file
                          {details.files.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-green-400">
                          +{details.stats.additions}
                        </span>
                        <span className="text-red-400">
                          -{details.stats.deletions}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShowCommitDetails(commitId)}
                      className="px-2 py-1 bg-vscode-button hover:bg-vscode-button-hover rounded transition-colors text-xs"
                    >
                      View Details
                    </button>
                  </div>

                  {details.files.length <= 3 ? (
                    <div className="space-y-1">
                      {details.files.map((file, index) => (
                        <div
                          key={index}
                          className="text-xs text-gray-400 font-mono"
                        >
                          <span
                            className={`inline-block w-1 mr-2 ${
                              file.status === "added"
                                ? "text-green-400"
                                : file.status === "modified"
                                ? "text-yellow-400"
                                : file.status === "deleted"
                                ? "text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {file.status === "added"
                              ? "+"
                              : file.status === "modified"
                              ? "~"
                              : file.status === "deleted"
                              ? "-"
                              : "•"}
                          </span>
                          {file.filename}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Click "View Details" to see all {details.files.length}{" "}
                      changed files
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-300 bg-opacity-20 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-300 bg-opacity-20 rounded w-1/2"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 bg-opacity-20 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 bg-opacity-20 rounded w-3/4"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 bg-opacity-20 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-300 bg-opacity-20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <div className="text-4xl mb-2">📝</div>
        <p>No timeline events found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-gray-100 bg-opacity-10 rounded-full flex items-center justify-center text-sm">
              {getEventIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-px h-full bg-gray-300 bg-opacity-20 mt-2"></div>
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-start gap-3">
              <img
                src={event.user.avatar_url}
                alt={event.user.login}
                className="w-6 h-6 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-start gap-2 text-sm">
                  <span className="font-medium">{event.user.login}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-gray-400">
                      {getEventDescription(event)}
                    </span>
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                  {event.type === "comment" && canDeleteComments && (
                    <button
                      onClick={() => handleDeleteComment(event.id)}
                      className="ml-2 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-400 hover:bg-opacity-10 rounded transition-colors"
                      title="Delete comment"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {event.type === "label" && event.label && (
                  <div className="mt-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `#${event.label.color}`,
                        color: "#000",
                      }}
                    >
                      {event.label.name}
                    </span>
                  </div>
                )}

                {renderCommitDetails(event)}

                {shouldShowBody(event) && (
                  <div className="mt-2 p-3 bg-gray-50 bg-opacity-5 rounded border-l-2 border-gray-300 border-opacity-30">
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {event.body}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
