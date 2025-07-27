import React from "react";

interface TimelineEvent {
  id: number;
  type: string;
  html_url: string;
  pull_request_url: string;
  issue_url: string;
  user: {
    id: number;
    login: string;
    login_name: string;
    full_name: string;
    email: string;
    avatar_url: string;
    html_url: string;
    username: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
  old_project_id: number;
  project_id: number;
  old_milestone: any;
  milestone: any;
  tracked_time: any;
  old_title: string;
  new_title: string;
  old_ref: string;
  new_ref: string;
  ref_issue: any;
  ref_comment: any;
  ref_action: string;
  ref_commit_sha: string;
  review_id: number;
  label: {
    id: number;
    name: string;
    exclusive: boolean;
    is_archived: boolean;
    color: string;
    description: string;
    url: string;
  } | null;
  assignee: any;
  assignee_team: any;
  removed_assignee: boolean;
  resolve_doer: any;
  dependent_issue: any;
}

interface Props {
  events: TimelineEvent[];
  isLoading?: boolean;
}

const Timeline: React.FC<Props> = ({ events, isLoading }) => {
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
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                    {getEventDescription(event)}
                  </span>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(event.created_at)}
                  </span>
                  </div>
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
