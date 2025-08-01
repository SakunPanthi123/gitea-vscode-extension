import React, { useEffect, useState, useCallback } from "react";
import Timeline from "./ui/Timeline";
import CommentBox from "./ui/CommentBox";
import LabelPicker from "./ui/LabelPicker";
import AssigneePicker from "./ui/AssigneePicker";
import EditableText from "./ui/EditableText";
import ReactionPicker from "./ui/ReactionPicker";
import { Issue, TimelineEvent, Label, User } from "../../../types/_types";

interface Props {
  data: Issue;
  timeline?: TimelineEvent[];
  onMessage: (type: string, payload?: any) => void;
}

const IssueDetails: React.FC<Props> = ({ data, timeline, onMessage }) => {
  const [timelineData, setTimelineData] = useState<TimelineEvent[]>(
    timeline || []
  );
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(!timeline);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [availableAssignees, setAvailableAssignees] = useState<User[]>([]);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [renderedDescriptionHtml, setRenderedDescriptionHtml] =
    useState<string>("");

  // No automatic clearing - only clear on explicit refresh

  useEffect(() => {
    if (!timeline) {
      // Request timeline data if not provided
      onMessage("getTimeline", { issueNumber: data.number });
    }

    // Request available labels
    onMessage("getRepositoryLabels");

    // Request available assignees
    onMessage("getRepositoryAssignees");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.number, timeline]); // Removed onMessage from dependencies to prevent infinite refreshing

  useEffect(() => {
    // Listen for timeline updates
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "timelineData") {
        setTimelineData(message.data);
        setIsLoadingTimeline(false);
      } else if (message.type === "commentAdded") {
        // Refresh timeline when comment is added
        onMessage("getTimeline", { issueNumber: data.number });
        setIsAddingComment(false);
      } else if (message.type === "commentDeleted") {
        // Refresh timeline when comment is deleted
        onMessage("getTimeline", { issueNumber: data.number });
      } else if (message.type === "commentEdited") {
        // Refresh timeline when comment is edited
        onMessage("getTimeline", { issueNumber: data.number });
      } else if (message.type === "updateData") {
        // Data updated (e.g., issue closed/reopened)
        // The parent will handle the data update automatically - no refresh needed
        // Removed onMessage("refresh") to prevent infinite loop
      } else if (message.type === "repositoryLabels") {
        setAvailableLabels(message.data);
        setIsLoadingLabels(false);
      } else if (message.type === "labelsUpdated") {
        // Labels were updated, refresh the issue data
        onMessage("refresh");
      } else if (message.type === "repositoryAssignees") {
        setAvailableAssignees(message.data);
        setIsLoadingAssignees(false);
      } else if (message.type === "assigneesUpdated") {
        // Assignees were updated, refresh the issue data
        onMessage("refresh");
      } else if (message.type === "markdownRendered") {
        // Rendered markdown received
        setRenderedDescriptionHtml(message.data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.number]); // Removed onMessage from dependencies to prevent infinite refreshing

  const handleRefresh = () => {
    onMessage("refresh");
    setIsLoadingTimeline(true);
    onMessage("getTimeline", { issueNumber: data.number });

    // Clear rendered HTML on explicit refresh to force re-rendering
    setRenderedDescriptionHtml("");
  };

  const handleOpenExternal = (url: string) => {
    onMessage("openExternal", { url });
  };

  const handleAddComment = (comment: string) => {
    setIsAddingComment(true);
    onMessage("addComment", { issueNumber: data.number, body: comment });
  };

  const handleCloseIssue = () => {
    onMessage("closeIssue");
  };

  const handleReopenIssue = () => {
    onMessage("reopenIssue");
  };

  const handleLabelsChange = (newLabels: Label[]) => {
    const labelIds = newLabels.map((label) => label.id);
    onMessage("updateIssueLabels", { labelIds });
  };

  const handleAssigneesChange = (newAssignees: User[]) => {
    const assigneeUsernames = newAssignees.map((assignee) => assignee.login);
    onMessage("updateIssueAssignees", { assignees: assigneeUsernames });
  };

  const handleEditTitle = (newTitle: string) => {
    onMessage("editIssueTitle", { title: newTitle });
  };

  const handleEditDescription = (newDescription: string) => {
    onMessage("editIssueDescription", { body: newDescription });
  };

  const handleRequestMarkdownRender = useCallback(
    (markdown: string) => {
      onMessage("renderMarkdown", { markdown });
    },
    [onMessage]
  );

  // Reaction handlers
  const handleAddIssueReaction = (reaction: string) => {
    onMessage("addIssueReaction", { issueNumber: data.number, reaction });
  };

  const handleRemoveIssueReaction = (reaction: string) => {
    onMessage("removeIssueReaction", { issueNumber: data.number, reaction });
  };

  // Convert simplified issue labels to full Label objects when possible
  const getCurrentLabels = (): Label[] => {
    if (!data.labels) return [];

    return data.labels.map((issueLabel) => {
      // Try to find the full label from available labels
      const fullLabel = availableLabels.find(
        (availableLabel) => availableLabel.name === issueLabel.name
      );

      if (fullLabel) {
        return fullLabel;
      }

      // Create a minimal Label object if not found
      return {
        id: -1, // Temporary ID
        name: issueLabel.name,
        color: issueLabel.color,
        exclusive: false,
        is_archived: false,
        description: "",
        url: "",
      };
    });
  };

  const getCurrentAssignees = (): User[] => {
    if (!data.assignees) return [];
    return data.assignees;
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
                  : "bg-red-100 text-red-800"
              }`}
            >
              {data.state}
            </span>
            <span className="text-lg text-gray-400">#{data.number}</span>
          </div>

          <div className="mb-4">
            <EditableText
              value={data.title}
              onSave={handleEditTitle}
              isTitle={true}
              placeholder="Enter issue title..."
            />
          </div>

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
              onClick={handleCloseIssue}
              className="px-4 py-2 bg-red-600 hover:bg-red-700  transition-colors"
            >
              Close Issue
            </button>
          ) : (
            <button
              onClick={handleReopenIssue}
              className="px-4 py-2 bg-green-600 hover:bg-green-700  transition-colors"
            >
              Reopen Issue
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="flex-1 -lg p-4 bg-gray-50 bg-opacity-5 ">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Labels</h3>
                <LabelPicker
                  availableLabels={availableLabels}
                  currentLabels={getCurrentLabels()}
                  onLabelsChange={handleLabelsChange}
                  isLoading={isLoadingLabels}
                />
              </div>
              {data.labels && data.labels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.labels.map((label, index) => (
                    <span
                      key={index}
                      className="px-3 py-1  text-sm font-medium"
                      style={{
                        backgroundColor: `#${label.color}`,
                        color: "#000",
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No labels assigned
                </p>
              )}
            </div>
          </div>
          <div className="flex-1 -lg p-4 bg-gray-50 bg-opacity-5">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Assignees</h3>
                <AssigneePicker
                  availableAssignees={availableAssignees}
                  currentAssignees={getCurrentAssignees()}
                  onAssigneesChange={handleAssigneesChange}
                  isLoading={isLoadingAssignees}
                />
              </div>
              {data.assignees && data.assignees.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {data.assignees.map((assignee) => (
                    <div key={assignee.id} className="flex items-center gap-2">
                      <img
                        src={assignee.avatar_url}
                        alt={assignee.login}
                        className="w-6 h-6 -full"
                      />
                      <span className="text-sm font-medium">
                        {assignee.login}
                      </span>
                      {assignee.full_name && (
                        <span className="text-xs text-gray-400">
                          ({assignee.full_name})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No assignees</p>
              )}
            </div>
          </div>
          <div className="bg-gray-50 bg-opacity-5 -lg p-4">
            <h3 className="text-lg font-semibold mb-3">Author</h3>
            <div className="flex items-center gap-3">
              <img
                src={data.user.avatar_url}
                alt={data.user.login}
                className="w-10 h-10 -full"
              />
              <div>
                <div className="font-medium">{data.user.login}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="">
          <div className="bg-gray-50 bg-opacity-5 -lg p-4 ">
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <EditableText
              value={data.body || ""}
              onSave={handleEditDescription}
              onRequestMarkdownRender={handleRequestMarkdownRender}
              renderedHtml={renderedDescriptionHtml}
              isTitle={false}
              placeholder="No description provided"
            />
            <div className="mt-4">
              <ReactionPicker
                reactions={data.reactions || []}
                onAddReaction={handleAddIssueReaction}
                onRemoveReaction={handleRemoveIssueReaction}
              />
            </div>
          </div>
          <div className="bg-gray-50 bg-opacity-5 -lg p-4 mt-4">
            <h3 className="text-lg font-semibold mb-3">Timeline</h3>
            <Timeline
              events={timelineData}
              isLoading={isLoadingTimeline}
              onMessage={onMessage}
              enableCommits={false}
              canDeleteComments={true}
              canEditComments={true}
              canReact={true}
            />
          </div>
          <div className="mt-4">
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

export default IssueDetails;
