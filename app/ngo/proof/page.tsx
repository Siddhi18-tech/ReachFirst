"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle2, AlertCircle, Camera, MapPin, Calendar, ArrowLeft, Loader2, Sparkles } from "lucide-react";

type ProofUploadResult = {
  proofId: string;
  url: string;
  exifTime: string | null;
  exifGps: { lat: number; lng: number } | null;
  verified: boolean;
};

export default function NgoProofUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState("c1111111-1111-1111-1111-111111111111");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ProofUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("campaignId", campaignId);
    formData.append("caption", caption || "Field delivery distribution");

    try {
      const res = await fetch("/api/proofs/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload proof");
      }

      setUploadResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to process and upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="section max-w-3xl mx-auto py-8">
      <Link
        href="/ngo/profile"
        className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to NGO Portal
      </Link>

      <div className="bg-surface rounded-card border border-outline-variant/60 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Camera className="w-5 h-5 text-primary" />
          <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
            Field Verification Evidence
          </span>
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Upload Ground Delivery Proof</h1>
        <p className="text-xs text-on-surface-variant mb-6">
          Submit photo evidence of relief material distribution. Our system automatically extracts embedded EXIF GPS coordinates and timestamp to verify authenticity before unlocking milestone funds.
        </p>

        {uploadResult ? (
          <div className="bg-surface-container/60 rounded-card p-6 border border-primary/30 text-center animate-fade-in">
            <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1">Evidence Submitted for Audit</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
              EXIF metadata extracted successfully. Your proof has been submitted to the Admin review queue.
            </p>

            {/* Extracted Metadata Card */}
            <div className="bg-surface rounded-card p-4 border border-outline-variant/60 max-w-sm mx-auto text-left text-xs mb-6 space-y-2">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>GPS Lat / Lng:</span>
                </span>
                <span className="font-mono text-on-surface font-semibold">
                  {uploadResult.exifGps?.lat.toFixed(4) ?? "Unavailable"}, {uploadResult.exifGps?.lng.toFixed(4) ?? "Unavailable"}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  <span>Captured Time:</span>
                </span>
                <span className="font-mono text-on-surface font-semibold">
                  {uploadResult.exifTime ? new Date(uploadResult.exifTime).toLocaleString() : "Unavailable"}
                </span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span>Verification State:</span>
                <span className="text-amber-600 font-semibold font-mono">Pending Admin Review</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setUploadResult(null);
                }}
                className="py-2 px-4 rounded-input bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors"
              >
                Upload Another Proof
              </button>
              <Link
                href="/transparency"
                className="py-2 px-4 rounded-input border border-outline text-on-surface text-xs font-medium hover:bg-surface-container transition-colors"
              >
                View Public Transparency Feed
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                Select Responding Campaign
              </label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full py-2.5 px-3 rounded-input bg-surface border border-outline-variant/80 text-xs text-on-surface font-medium focus:border-primary outline-none"
              >
                <option value="c1111111-1111-1111-1111-111111111111">
                  Barpeta Clean Water & Medical Emergency Kits (Assam Floods)
                </option>
                <option value="c2222222-2222-2222-2222-222222222222">
                  Dhubri Temporary Shelter & Ration Logistics (Assam Floods)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                Field Photo Evidence
              </label>
              <div className="border-2 border-dashed border-outline-variant/80 rounded-card p-6 text-center hover:border-primary/60 transition-colors bg-surface-container/20">
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Proof Preview"
                      className="max-h-56 rounded-card object-cover mb-3 shadow-xs border border-outline-variant/60"
                    />
                    <label className="text-xs text-primary font-semibold cursor-pointer hover:underline">
                      Choose a different photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-primary mb-2" />
                    <span className="text-xs font-bold text-on-surface">Click to select photo</span>
                    <span className="text-[11px] text-on-surface-variant mt-1">
                      JPEG, PNG or HEIC with camera EXIF enabled (Max 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">
                Distribution Description / Beneficiary Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Distributed 150 water purification kits to displaced families in Ward 4, Barpeta."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 rounded-input bg-surface border border-outline-variant/80 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-input bg-error-container text-on-error-container text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-3 px-4 rounded-input bg-primary text-on-primary font-bold text-xs hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting EXIF & Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify EXIF & Submit Proof</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
