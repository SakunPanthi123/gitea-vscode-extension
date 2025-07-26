import React, { useState, useEffect } from "react";
import PullRequestsList from "./components/PullRequestsList";
import IssuesList from "./components/IssuesList";
import PullRequestDetails from "./components/PullRequestDetails";
import IssueDetails from "./components/IssueDetails";
import "./App.css";

declare global {
  interface Window {
    vscode: any;
    initialData: any;
    viewType: string;
  }
}

function App() {
  const [data, setData] = useState(window.initialData);
  const [viewType] = useState(window.viewType);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "updateData":
          setData(message.data);
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendMessage = (type: string, payload?: any) => {
    window.vscode.postMessage({
      type,
      ...payload,
    });
  };

  const renderView = () => {
    switch (viewType) {
      case "pullrequests":
        return <PullRequestsList data={data} onMessage={sendMessage} />;
      case "issues":
        return <IssuesList data={data} onMessage={sendMessage} />;
      case "pullrequest":
        return <PullRequestDetails data={data} onMessage={sendMessage} />;
      case "issue":
        return <IssueDetails data={data} onMessage={sendMessage} />;
      default:
        return (
          <div className="p-4 text-red-500">Unknown view type: {viewType}</div>
        );
    }
  };

  return (
    <div className="min-h-screen text-vscode-foreground bg-vscode-background">
      {renderView()}
    </div>
  );
}

export default App;
