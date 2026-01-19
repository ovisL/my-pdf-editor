import React, { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { parsePageRange } from "../utils/pageHelper";

const PdfSplitter = ({
  selectedFile,
  numPages,
  onDocumentLoadSuccess,
  handleSplitDownload,
  handleReset,
}) => {
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [inputText, setInputText] = useState("");

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (!text.trim()) {
      if (text === "") setSelectedIndices(new Set());
      return;
    }

    const indices = parsePageRange(text, numPages);
    setSelectedIndices(new Set(indices));
  };

  const togglePage = (index) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const selectAll = () => {
    const all = Array.from({ length: numPages }, (_, i) => i);
    setSelectedIndices(new Set(all));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
    setInputText("");
  };

  return (
    <div className="step-container">
      <div
        className="pdf-controls"
        style={{ flexDirection: "column", alignItems: "stretch", gap: "15px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button className="btn btn-text" onClick={handleReset}>
            <span style={{ marginRight: "5px" }}>←</span> 나가기
          </button>

          <span className="page-info">
            총 {numPages}페이지 중{" "}
            <span style={{ color: "var(--primary-color)" }}>
              {selectedIndices.size}
            </span>
            장 선택됨
          </span>
        </div>

        <div className="splitter-tools">
          <input
            type="text"
            className="page-input"
            placeholder="예: 1, 3-5, 8 (범위 입력)"
            value={inputText}
            onChange={handleInputChange}
          />
          <div className="tool-buttons">
            <button className="btn btn-secondary btn-sm" onClick={selectAll}>
              전체 선택
            </button>
            <button className="btn btn-secondary btn-sm" onClick={deselectAll}>
              초기화
            </button>
          </div>
        </div>
      </div>

      <div className="thumbnail-grid-container">
        <Document file={selectedFile} onLoadSuccess={onDocumentLoadSuccess}>
          <div className="thumbnail-grid">
            {Array.from(new Array(numPages), (el, index) => {
              const isSelected = selectedIndices.has(index);
              return (
                <div
                  key={`thumb_${index}`}
                  className={`thumbnail-item ${isSelected ? "selected" : ""}`}
                  onClick={() => togglePage(index)}
                >
                  <div className="thumbnail-overlay">
                    {isSelected && <div className="check-mark">✔</div>}
                  </div>
                  <Page
                    pageNumber={index + 1}
                    width={150}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="thumbnail-page"
                  />
                  <div className="thumbnail-number">{index + 1}</div>
                </div>
              );
            })}
          </div>
        </Document>
      </div>

      <div
        className="pdf-pagination"
        style={{ borderTop: "none", paddingTop: "10px" }}
      >
        <button
          className="btn btn-primary"
          style={{ maxWidth: "300px", padding: "15px" }}
          disabled={selectedIndices.size === 0}
          onClick={() =>
            handleSplitDownload(
              Array.from(selectedIndices).sort((a, b) => a - b)
            )
          }
        >
          ✂️ 선택한 페이지 추출하기 ({selectedIndices.size}장)
        </button>
      </div>
    </div>
  );
};

export default PdfSplitter;
