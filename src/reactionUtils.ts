import { Reaction, ReactionSummary, User } from "../types/_types";

/**
 * Transform raw reactions from the Gitea API into ReactionSummary format
 * Groups reactions by content and counts them
 */
export function transformReactionsToSummary(
  reactions: Reaction[],
  currentUser?: User
): ReactionSummary[] {
  if (!reactions || reactions.length === 0) {
    return [];
  }

  // Group reactions by content
  const reactionGroups = reactions.reduce((groups, reaction) => {
    const content = reaction.content;
    if (!groups[content]) {
      groups[content] = [];
    }
    groups[content].push(reaction);
    return groups;
  }, {} as Record<string, Reaction[]>);

  // Transform to ReactionSummary format
  const result = Object.entries(reactionGroups).map(
    ([content, groupedReactions]) => {
      const users = groupedReactions.map((r) => r.user);
      const currentUserReacted = currentUser
        ? users.some(
            (user) =>
              user.id === currentUser.id || user.login === currentUser.login
          )
        : false;

      return {
        content,
        count: groupedReactions.length,
        users,
        me: currentUserReacted,
      };
    }
  );

  return result;
}

/**
 * Available reaction emojis with their corresponding names
 */
export const AVAILABLE_REACTIONS = [
  { emoji: "👍", name: "+1", label: "thumbs up" },
  { emoji: "👎", name: "-1", label: "thumbs down" },
  { emoji: "😄", name: "laugh", label: "laugh" },
  { emoji: "🎉", name: "hooray", label: "hooray" },
  { emoji: "😕", name: "confused", label: "confused" },
  { emoji: "❤️", name: "heart", label: "heart" },
  { emoji: "🚀", name: "rocket", label: "rocket" },
  { emoji: "👀", name: "eyes", label: "eyes" },
];
