import React from "react"
import { useParams } from "react-router-dom";
import { PDFviewer } from "../index";

const Plot = () => {
  const { projectId } = useParams();

  return (
    <div className="App container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plot Details Viewer</h1>
      <PDFviewer projectId={projectId} />
    </div>
  );
};

export default Plot;
