import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Upload, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CVUpload() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Navbar */}
      <nav className="bg-white border-b border-border px-6 md:px-10 py-3 flex items-center sticky top-0 z-10">
        <span className="font-bold text-lg text-primary">QuantaHire</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Back */}
        <Link
          to="/candidate-dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Upload Your CV</h1>
          <p className="text-muted-foreground mt-1">
            Our AI will parse your CV to extract key information for your profile
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">CV Upload</h2>
          <p className="text-sm text-muted-foreground -mt-3">Upload your CV in PDF or DOCX format</p>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragging
                ? "border-primary bg-accent"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <p className="font-medium text-foreground">Drop your CV here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">Supports PDF and DOCX files up to 10MB</p>
              </>
            )}
          </div>

          <Button
            className="w-full h-11 rounded-xl gap-2 bg-primary hover:bg-primary/90"
            disabled={!file}
          >
            <Upload className="w-4 h-4" />
            Select File
          </Button>
        </div>

        {/* AI Info Card */}
        <div className="bg-white border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">AI-Powered CV Parsing</h2>
          </div>
          <ul className="space-y-2.5">
            {[
              "Automatic extraction of contact information",
              "Skills and expertise identification",
              "Work history and education parsing",
              "Structured profile creation for job matching",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-bold mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}