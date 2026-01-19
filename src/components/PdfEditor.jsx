import React, { useRef } from "react";
import { Document, Page } from "react-pdf";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";

const SignatureItem = ({ sig, onDrag, onResize, isSelected }) => {
  const nodeRef = useRef(null);

  return (
    <Draggable
      bounds="parent"
      nodeRef={nodeRef}
      cancel=".react-resizable-handle"
      position={{ x: sig.x, y: sig.y }}
      onDrag={(e, data) => onDrag(sig.id, data)}
    >
      <div
        ref={nodeRef}
        style={{ position: "absolute", left: 0, top: 0, zIndex: 10 }}
        className="signature-image-wrapper"
      >
        <ResizableBox
          width={sig.width}
          height={sig.height}
          onResize={(e, data) => onResize(sig.id, e, data)}
          resizeHandles={["sw", "se", "nw", "ne", "w", "e", "n", "s"]}
          minConstraints={[5, 5]}
          maxConstraints={[1000, 1000]}
          className="signature-resizable-box"
        >
          <img
            src={sig.src}
            className="signature-image"
            alt="signature"
            draggable={false}
            style={{
              border: isSelected ? "1px dashed #007bff" : "none",
            }}
          />
        </ResizableBox>
      </div>
    </Draggable>
  );
};

const PdfEditor = ({
  selectedFile,
  pageNumber,
  numPages,
  onDocumentLoadSuccess,
  changePage,
  handleReset,
  signatures,
  handleSignatureUpload,
  updateSignaturePosition,
  updateSignatureSize,
  handleDownload,
  pdfWidth,
}) => {
  const currentPageSignatures = signatures.filter((s) => s.page === pageNumber);

  return (
    <div className="step-container">
      <div className="pdf-controls">
        <div className="controls-left">
          <button className="btn btn-text" onClick={handleReset}>
            <span style={{ marginRight: "5px" }}>←</span> 나가기
          </button>
        </div>

        <span className="page-info">
          Page {pageNumber}{" "}
          <span style={{ color: "var(--text-sub)", fontWeight: 400 }}>
            {" "}
            / {numPages || "-"}
          </span>
        </span>

        <div className="controls-right">
          <label className="btn btn-signature btn-action">
            <span style={{ marginRight: "6px" }}>🖼️</span> 이미지 추가
            <input
              type="file"
              accept="image/*"
              onChange={handleSignatureUpload}
              style={{ display: "none" }}
            />
          </label>

          <button
            className="btn btn-primary btn-action"
            onClick={handleDownload}
            disabled={signatures.length === 0}
          >
            💾 저장하기
          </button>
        </div>
      </div>

      <div className="pdf-viewer-container">
        <Document file={selectedFile} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNumber}
            width={pdfWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            canvasBackground="white"
          />
        </Document>

        {currentPageSignatures.map((sig) => (
          <SignatureItem
            key={sig.id}
            sig={sig}
            onDrag={updateSignaturePosition}
            onResize={updateSignatureSize}
          />
        ))}
      </div>

      <div className="pdf-pagination">
        <button
          className="btn btn-secondary"
          disabled={pageNumber <= 1}
          onClick={() => changePage(-1)}
          style={{ minWidth: "110px" }}
        >
          ◀ 이전
        </button>

        <button
          className="btn btn-secondary"
          disabled={pageNumber >= numPages}
          onClick={() => changePage(1)}
          style={{ minWidth: "110px" }}
        >
          다음 ▶
        </button>
      </div>
    </div>
  );
};

export default PdfEditor;
