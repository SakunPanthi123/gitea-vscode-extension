import React, { useState, useEffect } from "react";
import { Label, User, CreateIssueRequest } from "./../../../types/_types";
import LabelPicker from "./ui/LabelPicker";
import AssigneePicker from "./ui/AssigneePicker";

interface Props {
  data: {
    labels: Label[];
    assignees: User[];
  };
  onMessage: (type: string, payload?: any) => void;
}

const CreateIssue: React.FC<Props> = ({ data, onMessage }) => {
  const [formData, setFormData] = useState<CreateIssueRequest>({
    title: "",
    body: "",
    assignees: [],
    labels: [],
    closed: false,
  });
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "issueCreated":
          setIsSubmitting(false);
          setError(null);
          // The panel will close automatically in the extension
          break;
        case "createIssueError":
          setIsSubmitting(false);
          setError(message.error);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLabelsChange = (labels: Label[]) => {
    setSelectedLabels(labels);
  };

  const handleAssigneesChange = (assignees: User[]) => {
    setSelectedAssignees(assignees);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (formData.title.length > 255) {
      setError("Title must be less than 255 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Clean up the form data before sending
    const cleanedData = {
      ...formData,
      title: formData.title.trim(),
      body: formData.body?.trim() || "",
      labels:
        selectedLabels.length > 0
          ? selectedLabels.map((label) => label.id)
          : undefined,
      assignees:
        selectedAssignees.length > 0
          ? selectedAssignees.map((assignee) => assignee.login)
          : undefined,
    };

    onMessage("createIssue", { data: cleanedData });
  };

  const handleCancel = () => {
    onMessage("cancel");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Issue</h1>
        <button
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 text-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-vscode-input border border-gray-300 border-opacity-30 text-vscode-input-foreground placeholder-vscode-input-placeholderForeground focus:border-vscode-focus-border focus:outline-none focus:ring-2 focus:ring-vscode-focusBorder"
            placeholder="Issue title"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="body"
            name="body"
            value={formData.body || ""}
            onChange={handleInputChange}
            rows={6}
            className="w-full px-3 py-2 bg-vscode-input border border-gray-300 border-opacity-30 text-vscode-input-foreground placeholder-vscode-input-placeholderForeground focus:border-vscode-focus-border focus:outline-none focus:ring-2 focus:ring-vscode-focusBorder resize-vertical"
            placeholder="Describe the issue..."
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.labels && data.labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Labels</label>
              <LabelPicker
                availableLabels={data.labels}
                currentLabels={selectedLabels}
                onLabelsChange={handleLabelsChange}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {data.assignees && data.assignees.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Assignees
              </label>
              <AssigneePicker
                availableAssignees={data.assignees}
                currentAssignees={selectedAssignees}
                onAssigneesChange={handleAssigneesChange}
                isLoading={isSubmitting}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-vscode-button hover:bg-vscode-button-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? "Creating..." : "Create Issue"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateIssue;
