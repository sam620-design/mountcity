import React from "react"
import {PDFviewer} from "../index";
import { Lpdf } from "../indeximages";
import { Lodhipur} from "../indeximages";

const Plot = () => {
  return (
    <div className="App container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Plot Details Viewer</h1>
            <PDFviewer pdfFile={Lpdf}  />
        </div>
  );
};

export default Plot;
