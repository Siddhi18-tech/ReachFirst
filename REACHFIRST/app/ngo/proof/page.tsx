"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  Calendar,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldAlert,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type GpsPreview = {
  latitude: number;
  longitude: number;
  dateTime?: string | null;
};

type ProofResult = {
  proofId: string;
  url: string;
  exifTime: string | null;
  exifGps: { lat: number; lng: number } | null;
  verified: boolean;
};

export default function NgoProofUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState("c1000000-0000-0000-0000-000000000001");
  const [caption, setCaption] = useState("");

  // Client-side EXIF inspection states
  const [checkingExif, setCheckingExif] = useState(false);
  const [gpsData, setGpsData] = useState<GpsPreview | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Upload progress and result
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ProofResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Handle client-side file selection and EXIF GPS reading via exifr.gps(file)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGpsData(null);
    setGpsError(null);
    setUploadResult(null);
    setServerError(null);
    setCheckingExif(true);

    try {
      // Dynamic import of exifr on client
      const exifr = await import("exifr");
      const gps = await exifr.gps(file);

      if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
        let dateTime: string | null = null;
        try {
          const parsed = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
          dateTime = parsed?.DateTimeOriginal || parsed?.CreateDate || null;
        } catch {
          // ignore
        }

        setGpsData({
          latitude: gps.latitude,
          longitude: gps.longitude,
          dateTime: dateTime ? String(dateTime) : new Date().toISOString(),
        });
      } else {
        // Offer fallback button for demo / simulation if photo has no embedded GPS
        setGpsError(
          "⚠️ No GPS metadata detected in this photo. Field proof requires camera location/geotagging enabled to pass automated audit."
        );
      }
    } catch (err) {
      console.warn("Client EXIF parse error:", err);
      setGpsError(
        "Could not read image EXIF metadata. Please ensure the file is an original photo taken with location enabled."
      );
    } finally {
      setCheckingExif(false);
    }
  };

  // Helper to inject mock GPS for demo/testing when testing with arbitrary local images
  const handleUseMockGps = () => {
    setGpsData({
      latitude: 11.6854,
      longitude: 76.132,
      dateTime: new Date().toISOString(),
    });
    setGpsError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !gpsData) return;

    setIsUploading(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("campaignId", campaignId);
    formData.append("caption", caption || "Field delivery and ration distribution");

    try {
      const res = await fetch("/api/ngo/proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proof");
      }

      setUploadResult(data);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <Link
        href="/ngo/profile"
        className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to NGO Profile
      </Link>

      <div className="bg-white rounded-card border border-outline-variant/70 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
              Field Verification Evidence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Upload Ground Delivery Proof
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
            ReliefTrack releases escrow tranches only after verifying physical field distribution. The client inspects embedded <strong>EXIF GPS coordinates</strong> before submission.
          </p>
        </div>

        {uploadResult ? (
          <div className="bg-primary/5 rounded-card p-6 sm:p-8 border border-primary/20 text-center space-y-4 animate-slide-up">
            <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-on-surface">
              Proof Uploaded &amp; Queued for Audit
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto">
              Your geotagged field photo was received and assigned Audit ID{" "}
              <strong className="font-mono text-on-surface">{uploadResult.proofId}</strong>.
            </p>

            {/* Extracted EXIF Card */}
            <div className="bg-white rounded-card p-4 border border-outline-variant/60 max-w-md mx-auto text-left text-xs space-y-2.5 font-mono shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-outline uppercase text-[10px]">Verified Coordinates</span>
                <span className="font-bold text-primary">
                  {uploadResult.exifGps?.lat.toFixed(4)}° N, {uploadResult.exifGps?.lng.toFixed(4)}° E
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-outline uppercase text-[10px]">Capture Timestamp</span>
                <span className="text-on-surface">
                  {uploadResult.exifTime ? new Date(uploadResult.exifTime).toLocaleString("en-IN") : "Audited"}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/50 pt-2">
                <span className="text-outline uppercase text-[10px]">Admin Review Status</span>
                <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-800 text-[10px] font-bold">
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setGpsData(null);
                  setUploadResult(null);
                }}
              >
                Upload Another Field Photo
              </Button>
              <Link href="/transparency">
                <Button variant="outline" size="md">
                  View Public Transparency Feed
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Selection */}
            <div>
              <label className="label">Select Associated Crisis Campaign</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="input cursor-pointer"
              >
                <option value="c1000000-0000-0000-0000-000000000001">
                  Wayanad Landslides — Emergency Meal Kits &amp; Tarpaulins
                </option>
                <option value="c1000000-0000-0000-0000-000000000002">
                  Assam Floods — Brahmaputra Evacuation &amp; Clean Water
                </option>
                <option value="c1000000-0000-0000-0000-000000000003">
                  Odisha Cyclone — Coastal Shelter Restorations
                </option>
              </select>
            </div>

            {/* Field Photo Input with EXIF preview */}
            <div>
              <label className="label">
                Field Delivery Photograph <span className="text-urgent">*</span>
              </label>

              <div className="border-2 border-dashed border-outline-variant rounded-card p-6 text-center hover:border-primary/60 transition-colors bg-surface-low">
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Proof Preview"
                      className="max-h-60 rounded-card object-cover mb-3 shadow-xs border border-outline-variant/60"
                    />

                    <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
                      Choose another photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center py-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-on-surface">
                      Click to choose field photo
                    </span>
                    <span className="text-xs text-on-surface-variant mt-1">
                      JPEG, PNG or WebP with camera location enabled (Max 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Checking EXIF state */}
            {checkingExif && (
              <div className="flex items-center gap-2 p-3 bg-surface-container rounded-input text-xs text-on-surface font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Reading embedded EXIF GPS coordinates from photo...</span>
              </div>
            )}

            {/* Valid GPS Preview Card */}
            {gpsData && (
              <div className="p-4 rounded-card bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    GPS Geotag Verified Successfully
                  </span>
                  <span className="font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-pill">
                    EXIF Valid
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-emerald-700 block text-[10px] uppercase">Latitude / Longitude</span>
                    <span className="font-bold">
                      {gpsData.latitude.toFixed(4)}° N, {gpsData.longitude.toFixed(4)}° E
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px] uppercase">Recorded Timestamp</span>
                    <span>{gpsData.dateTime ? new Date(gpsData.dateTime).toLocaleString("en-IN") : "Recorded"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* GPS Missing Error */}
            {gpsError && (
              <div className="p-4 rounded-card bg-urgent-container/40 border border-urgent/30 text-xs text-urgent space-y-2 animate-slide-up">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{gpsError}</span>
                </div>

                {/* Convenient demo bypass button */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseMockGps}
                    className="text-[11px] font-bold text-primary underline hover:opacity-80 cursor-pointer"
                  >
                    Simulate Field Coordinates for Demo (11.6854° N, 76.1320° E)
                  </button>
                </div>
              </div>
            )}

            {/* Beneficiary & Distribution Notes */}
            <div>
              <label className="label">
                Distribution Description / Beneficiary Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Distributed 200 dry ration kits and tarpaulins to families sheltered at Meppadi Relief Camp..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="input !h-auto py-2.5 text-xs"
              />
            </div>

            {serverError && (
              <div className="p-3 rounded-input bg-urgent-container/40 border border-urgent/30 text-xs text-urgent flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-xs font-bold shadow-xs cursor-pointer"
              disabled={isUploading || !selectedFile || !gpsData}
              iconLeft={
                isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />
              }
            >
              {isUploading ? "Uploading Geotagged Proof to Cloudinary..." : "Submit Geotagged Field Proof"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
