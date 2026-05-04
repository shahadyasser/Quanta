import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Upload, CheckCircle, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function CVUpload() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Find or create the candidate's profile record
    const init = async () => {
      const user = await base44.auth.me();
      if (!user) return;
      const existing = await base44.entities.CandidateProfile.filter({ email: user.email });
      if (existing.length > 0) {
        setCandidateId(existing[0].id);
      } else {
        const created = await base44.entities.CandidateProfile.create({
          email: user.email,
          full_name: user.full_name,
          user_id: user.id,
          role: "candidate",
          status: "pending"
        });
        setCandidateId(created.id);
      }
    };
    init();
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setError(null);
    setUploading(true);

    // 1. Upload CV file
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    setProcessing(true);

    // 2. Trigger RAG pipeline
    const response = await base44.functions.invoke("processCV", {
      cv_url: file_url,
      candidate_id: candidateId
    });

    setProcessing(false);
    if (response.data?.success) {
      setDone(true);
    } else {
      setError("Processing failed. Please try again.");
    }
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
            Our AI will parse your CV to extract skills, experience, and match you to job requirements
          </p>
        </div>

        {/* Success State */}
        {done ? (
          <div className="bg-white border border-green-200 rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">CV Processed Successfully!</h2>
            <p className="text-muted-foreground text-sm">Your CV has been analyzed. Skills, experience, and match scores have been extracted and saved to your profile.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate("/candidate-dashboard")}>
                Go to Dashboard
              </Button>
              <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={() => { setDone(false); setFile(null); }}>
                Upload Another
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Upload Card */}
            <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-foreground">CV Upload</h2>
              <p className="text-sm text-muted-foreground -mt-3">Upload your CV in PDF or DOCX format</p>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && !processing && inputRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
              >
                <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
                {file ? (
                  <>
                    <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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

              {/* Status Messages */}
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading CV...
                </div>
              )}
              {processing && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI is analyzing your CV — extracting skills, experience, and computing match score...</span>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                className="w-full h-11 rounded-xl gap-2 bg-primary hover:bg-primary/90"
                disabled={!file || uploading || processing}
                onClick={handleUpload}
              >
                {uploading || processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Uploading..." : processing ? "Processing..." : "Upload & Analyze CV"}
              </Button>
            </div>

            {/* AI Info Card */}
            <div className="bg-white border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">AI-Powered RAG Pipeline</h2>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Automatic extraction of contact information",
                  "Skills and expertise identification",
                  "Work history and education parsing",
                  "AI match score computation against job requirements",
                  "Strengths and improvement areas analysis",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}