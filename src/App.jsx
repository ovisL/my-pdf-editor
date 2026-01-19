import { useState, useCallback, useEffect } from "react";
import { pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import "./App.css";

import FileUpload from "./components/FileUpload";
import PdfEditor from "./components/PdfEditor";
import PdfSplitter from "./components/PdfSplitter";
import Toast from "./components/Toast";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [step, setStep] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [signatures, setSignatures] = useState([]);
  const [mode, setMode] = useState("sign");
  const [toast, setToast] = useState(null);

  const MIN_SIZE = 20;
  const [pdfWidth, setPdfWidth] = useState(800);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 850) {
        setPdfWidth(window.innerWidth * 0.9);
      } else {
        setPdfWidth(800);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageDataUrl = reader.result;
        const img = new Image();
        img.src = imageDataUrl;
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          const newSignature = {
            id: Date.now(),
            page: pageNumber,
            src: imageDataUrl,
            x: 50,
            y: 50,
            width: 150,
            height: 150 / ratio,
            ratio: ratio,
          };
          setSignatures((prev) => [...prev, newSignature]);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (selectedFile) setStep(2);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSignatures([]);
    setStep(1);
    setPageNumber(1);
    setMode("sign");
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const changePage = (offset) => {
    setPageNumber((prev) => prev + offset);
  };

  const updateSignaturePosition = (id, data) => {
    setSignatures((prev) =>
      prev.map((sig) =>
        sig.id === id ? { ...sig, x: data.x, y: data.y } : sig
      )
    );
  };

  const updateSignatureSize = useCallback((id, e, { size, handle }) => {
    setSignatures((prev) => {
      const targetSig = prev.find((s) => s.id === id);
      if (!targetSig) return prev;

      const {
        width: oldWidth,
        height: oldHeight,
        x: oldX,
        y: oldY,
        ratio,
      } = targetSig;

      let newWidth = size.width;
      let newHeight = size.height;

      if (["ne", "nw", "se", "sw"].includes(handle) && ratio) {
        const deltaW = Math.abs(newWidth - oldWidth);
        const deltaH = Math.abs(newHeight - oldHeight);
        if (deltaH * ratio > deltaW) {
          newWidth = newHeight * ratio;
        } else {
          newHeight = newWidth / ratio;
        }
      }

      if (newWidth < MIN_SIZE) {
        newWidth = MIN_SIZE;
        if (["ne", "nw", "se", "sw"].includes(handle) && ratio)
          newHeight = newWidth / ratio;
      }
      if (newHeight < MIN_SIZE) {
        newHeight = MIN_SIZE;
        if (["ne", "nw", "se", "sw"].includes(handle) && ratio)
          newWidth = newHeight * ratio;
      }

      let newX = oldX;
      let newY = oldY;

      if (handle.includes("w")) newX = oldX + oldWidth - newWidth;
      if (handle.includes("n")) newY = oldY + oldHeight - newHeight;

      return prev.map((sig) =>
        sig.id === id
          ? { ...sig, width: newWidth, height: newHeight, x: newX, y: newY }
          : sig
      );
    });
  }, []);

  const handleDownload = async () => {
    if (!selectedFile || signatures.length === 0) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const viewerWidth = pdfWidth;

      for (const sig of signatures) {
        const pageIndex = sig.page - 1;
        if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) continue;

        const page = pdfDoc.getPages()[pageIndex];

        let image;
        if (sig.src.startsWith("data:image/png")) {
          image = await pdfDoc.embedPng(sig.src);
        } else {
          image = await pdfDoc.embedJpg(sig.src);
        }

        const pdfWidthActual = page.getWidth();
        const pdfHeight = page.getHeight();

        const scaleRatio = pdfWidthActual / viewerWidth;

        const realWidth = sig.width * scaleRatio;
        const realHeight = sig.height * scaleRatio;
        const realX = sig.x * scaleRatio;
        const realY = pdfHeight - sig.y * scaleRatio - realHeight;

        page.drawImage(image, {
          x: realX,
          y: realY,
          width: realWidth,
          height: realHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, `Edited_${selectedFile.name}`);

      showToast("모든 이미지가 저장되었습니다! 🎉", "success");
    } catch (error) {
      console.error(error);
      showToast("저장에 실패했습니다.", "error");
    }
  };

  const handleSplitDownload = async (selectedPageIndices) => {
    if (!selectedFile || selectedPageIndices.length === 0) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(srcDoc, selectedPageIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, `split_${selectedFile.name}`);

      showToast("선택한 페이지가 분할 저장되었습니다! ✂️", "success");
    } catch (error) {
      console.error("분할 저장 오류:", error);
      showToast("분할 저장 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className="container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1>📄 SimplePDF Editor</h1>
      <p className="description">PDF 문서를 쉽고 빠르게 편집하세요.</p>

      {step === 1 && (
        <FileUpload
          selectedFile={selectedFile}
          handleFileChange={handleFileChange}
          handleNext={handleNext}
          onCancel={() => setSelectedFile(null)}
        />
      )}

      {step === 2 && (
        <div className="step-container">
          <div className="mode-tabs">
            <button
              className={`tab-btn ${mode === "sign" ? "active" : ""}`}
              onClick={() => setMode("sign")}
            >
              ✍️ 이미지 추가
            </button>
            <button
              className={`tab-btn ${mode === "split" ? "active" : ""}`}
              onClick={() => setMode("split")}
            >
              ✂️ 페이지 분할
            </button>
          </div>

          {mode === "sign" ? (
            <PdfEditor
              selectedFile={selectedFile}
              pageNumber={pageNumber}
              numPages={numPages}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              changePage={changePage}
              handleReset={handleReset}
              signatures={signatures}
              handleSignatureUpload={handleSignatureUpload}
              updateSignaturePosition={updateSignaturePosition}
              updateSignatureSize={updateSignatureSize}
              pdfWidth={pdfWidth}
              handleDownload={handleDownload}
            />
          ) : (
            <PdfSplitter
              selectedFile={selectedFile}
              numPages={numPages}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              handleSplitDownload={handleSplitDownload}
              handleReset={handleReset}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
