import React, { useState, useEffect, useCallback } from "react";
import { TimelineEvent, CommitDetails } from "../../../../types/_types";
import { Icons } from "./Icons";

interface Props {
  events: TimelineEvent[];
  isLoading?: boolean;
  onMessage?: (type: string, payload?: any) => void;
  enableCommits?: boolean; // New prop to control commit functionality
  canDeleteComments?: boolean; // New prop to control comment deletion
  canEditComments?: boolean; // New prop to control comment editing
}

const Timeline: React.FC<Props> = ({
  events,
  isLoading,
  onMessage,
  enableCommits = true,
  canDeleteComments = true,
  canEditComments = true,
}) => {
  const [commitDetails, setCommitDetails] = useState<
    Record<string, CommitDetails>
  >({});
  const [loadingCommits, setLoadingCommits] = useState<Set<string>>(new Set());
  const [deleteState, setDeleteState] = useState<boolean>(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>("");

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

  const handleEditComment = (commentId: number, currentBody: string) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentBody);
  };

  const handleSaveEdit = (commentId: number) => {
    if (onMessage && editCommentText.trim()) {
      onMessage("editComment", { commentId, body: editCommentText.trim() });
      setEditingCommentId(null);
      setEditCommentText("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText("");
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
      case "comment_ref":
        return "🔗";
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

  // Helper function to determine if a label was added or removed
  const getLabelAction = (
    currentEvent: TimelineEvent,
    allEvents: TimelineEvent[]
  ) => {
    if (!currentEvent.label || currentEvent.type !== "label") {
      return "modified labels";
    }

    const labelId = currentEvent.label.id;
    let occurrenceCount = 0;

    // Count occurrences of this label up to the current event
    for (const event of allEvents) {
      if (event.type === "label" && event.label && event.label.id === labelId) {
        occurrenceCount++;
        if (event.id === currentEvent.id) {
          break;
        }
      }
    }

    // Odd occurrences = added, Even occurrences = removed
    const action = occurrenceCount % 2 === 1 ? "added" : "removed";
    return `${action} label "${currentEvent.label.name}"`;
  };

  // Helper function to generate descriptive text for comment_ref events
  const getCommentRefDescription = (event: TimelineEvent): string => {
    if (!event.ref_issue || !event.ref_comment || !event.ref_action) {
      return "referenced this";
    }

    const refIssue = event.ref_issue;
    const refAction = event.ref_action;

    // Determine if it's a pull request or issue
    const isPullRequest = refIssue.pull_request !== undefined;
    const itemType = isPullRequest ? "pull request" : "issue";

    // Create descriptive text based on the action
    let actionText = "";
    switch (refAction.toLowerCase()) {
      case "closes":
      case "close":
        actionText = `referenced a ${itemType} that will close this issue`;
        break;
      case "fixes":
      case "fix":
        actionText = `referenced a ${itemType} that will fix this issue`;
        break;
      case "resolves":
      case "resolve":
        actionText = `referenced a ${itemType} that will resolve this issue`;
        break;
      case "mentions":
      case "mention":
        actionText = `mentioned this in ${itemType}`;
        break;
      default:
        actionText = `referenced this in ${itemType}`;
    }

    return actionText;
  };

  const getEventDescription = (event: TimelineEvent) => {
    switch (event.type) {
      case "comment":
        return "commented";
      case "comment_ref":
        return getCommentRefDescription(event);
      case "label":
        return getLabelAction(event, events);
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
              className="bg-gray-50 bg-opacity-5  border border-gray-300 border-opacity-20 p-3"
            >
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-300 bg-opacity-20  w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-300 bg-opacity-20  w-1/2"></div>
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
                          <code className="bg-gray-600 bg-opacity-30 px-1 ">
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
                      className="px-2 py-1 bg-vscode-button hover:bg-vscode-button-hover  transition-colors text-xs"
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
                  <div className="h-3 bg-gray-300 bg-opacity-20  w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-300 bg-opacity-20  w-1/2"></div>
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
          <div className="h-4 bg-gray-300 bg-opacity-20  w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 bg-opacity-20  w-3/4"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 bg-opacity-20  w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-300 bg-opacity-20  w-1/2"></div>
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
            <div className="w-8 h-8 bg-gray-100 bg-opacity-10 -full flex items-center justify-center text-sm">
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
                className="w-6 h-6 -full"
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
                  {event.type === "comment" &&
                  canDeleteComments &&
                  !deleteState ? (
                    <div className="flex gap-1">
                      {canEditComments && (
                        <button
                          onClick={() =>
                            handleEditComment(event.id, event.body)
                          }
                          className="px-2 py-1 text-gray-300 hover:bg-gray-400 hover:bg-opacity-10  transition-colors"
                          title="Edit comment"
                        >
                          <Icons name="edit" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeleteState(true);
                        }}
                        className="px-2 py-1 text-gray-300 hover:bg-gray-400 hover:bg-opacity-10  transition-colors"
                        title="Delete comment"
                      >
                        <Icons name="trash" />
                      </button>
                    </div>
                  ) : (
                    event.type === "comment" &&
                    canDeleteComments && (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => {
                            handleDeleteComment(event.id);
                            setDeleteState(false);
                          }}
                          className="ml-2 px-2 py-1 hover:bg-opacity-10  transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setDeleteState(false);
                          }}
                          className="ml-2 px-2 py-1 bg-vscode-button hover:bg-vscode-button-hover hover:bg-opacity-10  transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )
                  )}
                </div>

                {event.type === "label" && event.label && (
                  <div className="mt-2">
                    <span
                      className="px-2 py-1  text-xs font-medium"
                      style={{
                        backgroundColor: `#${event.label.color}`,
                        color: "#000",
                      }}
                    >
                      {event.label.name}
                    </span>
                  </div>
                )}

                {event.type === "comment_ref" && event.ref_issue && (
                  <div className="mt-2 p-3 bg-blue-50 bg-opacity-5 border-l-2 border-blue-400 border-opacity-50">
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">
                        {event.ref_issue.pull_request ? "🔀" : "🐛"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <a
                            href={event.ref_issue.html_url}
                            className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            #{event.ref_issue.number}
                          </a>
                          <span className="text-xs text-gray-400">
                            {event.ref_issue.pull_request
                              ? "Pull Request"
                              : "Issue"}
                          </span>
                          {event.ref_issue.pull_request?.draft && (
                            <span className="px-1.5 py-0.5 bg-gray-600 bg-opacity-50 text-xs text-gray-300 rounded">
                              Draft
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              event.ref_issue.state === "open"
                                ? "bg-green-600 bg-opacity-50 text-green-300"
                                : "bg-red-600 bg-opacity-50 text-red-300"
                            }`}
                          >
                            {event.ref_issue.state}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 font-medium mb-2">
                          {event.ref_issue.title}
                        </div>
                        {event.ref_comment && event.ref_comment.body && (
                          <div className="text-xs text-gray-400 bg-gray-800 bg-opacity-30 p-2 rounded border-l-2 border-gray-600">
                            <div className="flex items-center gap-1 mb-1 text-gray-500">
                              <span>💬</span>
                              <span>Referenced comment:</span>
                            </div>
                            <div className="text-gray-300 whitespace-pre-wrap">
                              {event.ref_comment.body.length > 200
                                ? `${event.ref_comment.body.substring(
                                    0,
                                    200
                                  )}...`
                                : event.ref_comment.body}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {renderCommitDetails(event)}

                {shouldShowBody(event) && (
                  <div className="mt-2 p-3 bg-gray-50 bg-opacity-5  border-l-2 border-gray-300 border-opacity-30">
                    {editingCommentId === event.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="w-full p-2  border border-gray-300 border-opacity-30 bg-vscode-input text-vscode-foreground resize-vertical min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(event.id)}
                            className="px-3 py-1 bg-vscode-button hover:bg-vscode-button-hover  transition-colors text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700  transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">
                        {event.body}
                      </div>
                    )}
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
