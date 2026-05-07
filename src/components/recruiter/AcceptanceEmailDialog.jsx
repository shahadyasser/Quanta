import React, { useState, useEffect } from "react";
import { X, Mail, Loader2, Calendar, Clock, MapPin, Phone, Video, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AcceptanceEmailDialog({ application, recruiterName, companyName, onClose, onSent }) {
  const [mode, setMode] = useState("interview"); // "interview" or "simple"
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewType, setInterviewType] = useState("video");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewDuration, setInterviewDuration] = useState("1 hour");
  const [interviewer, setInterviewer] = useState(recruiterName);
  const [subject, setSubject] = useState(`Congratulations! Interview Invitation for ${application.job_title}`);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Auto-update email body when interview details change
  useEffect(() => {
    if (mode === "interview") {
      const interviewSection = interviewDate && interviewTime
        ? `Interview Details:
Date: ${interviewDate}
Time: ${interviewTime}
Duration: ${interviewDuration}
Type: ${interviewType === "in-person" ? "In-Person" : interviewType === "video" ? "Video Call" : "Phone Call"}
Location/Link: ${interviewLocation}
Interviewer: ${interviewer}`
        : "(Please fill in interview details above)";

      setBody(
        `Dear ${application.candidate_name},

We are pleased to inform you that after reviewing your application for the ${application.job_title} position, we would like to invite you for an interview!

${interviewSection}

Please confirm your availability by replying to this email. If the scheduled time does not work for you, please suggest an alternative.

We look forward to meeting you!

Best regards,
${recruiterName}
${companyName}`
      );
    } else {
      setBody(
        `Dear ${application.candidate_name},

Congratulations! We are pleased to inform you that we would like to move forward with your application for the ${application.job_title} position.

We are impressed with your qualifications and experience. Our team will be in touch shortly with the next steps in our interview process.

Thank you for your interest in joining our team. We look forward to speaking with you soon!

Best regards,
${recruiterName}
${companyName}`
      );
    }
  }, [mode, interviewDate, interviewTime, interviewType, interviewLocation, interviewDuration, interviewer, application]);

  const getLocationPlaceholder = () => {
    if (interviewType === "in-person") return "Enter office address";
    if (interviewType === "video") return "Enter Zoom/Teams link";
    return "Enter phone number";
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ description: "Subject and email body cannot be empty." });
      return;
    }

    if (mode === "interview" && (!interviewDate || !interviewTime)) {
      toast({ description: "Interview date and time are required." });
      return;
    }

    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: application.candidate_email,
        subject: subject,
        body: body,
      });

      const updateData = {
        status: mode === "interview" ? "interview" : "accepted",
        status_email_sent: body,
        updated_date: new Date().toISOString(),
      };

      if (mode === "interview") {
        updateData.interview_date = interviewDate;
        updateData.interview_time = interviewTime;
        updateData.interview_type = interviewType;
        updateData.interview_location = interviewLocation;
        updateData.interview_duration = interviewDuration;
        updateData.interviewer_name = interviewer;
      }

      await base44.entities.Application.update(application.id, updateData);

      toast({ description: `Acceptance email sent to ${application.candidate_email}` });
      onSent();
      onClose();
    } catch (error) {
      toast({ description: `Failed to send email: ${error.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-500" />
              Accept & Schedule Interview for {application.candidate_name}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 bg-muted/30 rounded-lg p-2">
            <button
              onClick={() => setMode("interview")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "interview" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              With Interview
            </button>
            <button
              onClick={() => setMode("simple")}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "simple" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Without Interview
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-foreground">To</label>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 mt-1">
                {application.candidate_email}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-border rounded-lg p-3 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={sending}
              />
            </div>

            {mode === "interview" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm text-blue-900">Interview Details</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={sending}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Time</label>
                    <input
                      type="time"
                      value={interviewTime}
                      onChange={(e) => setInterviewTime(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={sending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">Type</label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={sending}
                    >
                      <option value="in-person">In-Person</option>
                      <option value="video">Video Call</option>
                      <option value="phone">Phone Call</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Duration</label>
                    <select
                      value={interviewDuration}
                      onChange={(e) => setInterviewDuration(e.target.value)}
                      className="w-full border border-border rounded-lg p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={sending}
                    >
                      <option value="30 min">30 min</option>
                      <option value="45 min">45 min</option>
                      <option value="1 hour">1 hour</option>
                      <option value="1.5 hours">1.5 hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">Location or Link</label>
                  <input
                    type="text"
                    placeholder={getLocationPlaceholder()}
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={sending}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">Interviewer Name</label>
                  <input
                    type="text"
                    value={interviewer}
                    onChange={(e) => setInterviewer(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={sending}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-foreground">Email Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full border border-border rounded-lg p-3 text-sm mt-1 h-48 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={sending}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            {mode === "interview" ? (
              <Button
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? "Sending..." : "Send & Schedule"}
              </Button>
            ) : (
              <Button
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? "Sending..." : "Send & Accept"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}