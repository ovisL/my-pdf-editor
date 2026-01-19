import React from "react";

const FileUpload = ({
  selectedFile,
  handleFileChange,
  handleNext,
  onCancel,
}) => {
  return (
    <div className="step-container">
      {!selectedFile && (
        <div className="upload-area">
          <label style={{ cursor: "pointer" }}>
            <span style={{ fontSize: "3rem" }}>📂</span>
            <p>
              <strong>클릭하여 PDF 선택</strong>
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        </div>
      )}

      {selectedFile && (
        <div className="file-card">
          <div className="file-info">
            <span style={{ fontSize: "2.5rem" }}>📄</span>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <div style={{ width: "100%", display: "flex", gap: "10px" }}>
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              style={{ flex: 1 }}
            >
              취소
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNext}
              style={{ flex: 2 }}
            >
              편집 시작하기 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
