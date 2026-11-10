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
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

type ProofUploadResult = {
  proofId: string;
  url: string;
  exifTime: string | null;
  exifGps: { lat: number; lng: number } | null;
  verified: boolean;
};

type ClientGpsPreview = {
  latitude: number;
  longitude: number;
  timestamp?: string;
};

export default function NgoProofUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState("c1000000-0000-0000-0000-000000000001");
  const [caption, setCaption] = useState("");
  const [clientGps, setClientGps] = useState<ClientGpsPreview | null>(null);
  const [gpsMissingWarning, setGpsMissingWarning] = useState<string | null>(null);
  const [isReadingExif, setIsReadingExif] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ProofUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read EXIF on client with exifr before uploading
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadResult(null);
    setErrorMsg(null);
    setClientGps(null);
    setGpsMissingWarning(null);
    setIsReadingExif(true);

    try {
      // Dynamic import of exifr to keep bundle light and client safe
      const exifr = await import("exifr");
      const gps = await exifr.gps(file);
      const metadata = await exifr.parse(file, { tiff: true, exif: true }).catch(() => null);

      if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
        const timeVal = metadata?.DateTimeOriginal || metadata?.CreateDate;
        setClientGps({
          latitude: gps.latitude,
          longitude: gps.longitude,
          timestamp: timeVal ? new Date(timeVal).toLocaleString("en-IN") : undefined,
        });
        setGpsMissingWarning(null);
      } else {
        setClientGps(null);
        setGpsMissingWarning(
          "⚠️ No EXIF GPS coordinates found in this image. Field proof requires GPS geotags to qualify for automated escrow release. Please upload a photo taken directly on a mobile device with location services enabled."
        );
      }
    } catch (err) {
      console.warn("Client EXIF extraction:", err);
      setGpsMissingWarning(
        "Could not read EXIF location data. If this photo was saved via messaging apps (e.g. WhatsApp), GPS metadata may have been stripped."
      );
    } finally {
      setIsReadingExif(false);
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
    formData.append("caption", caption || "Field delivery distribution to flood victims");

    try {
      // Submit as FormData to /api/ngo/proof
      const res = await fetch("/api/ngo/proof", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload ground delivery proof");
      }

      setUploadResult(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to process and upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="section max-w-3xl mx-auto py-8 px-4">
      <Link
        href="/ngo/profile"
        className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to NGO Relief Portal</span>
      </Link>

      <Card className="p-6 md:p-8 shadow-sm border-outline-variant/60">
        <div className="flex items-center gap-2 mb-1.5">
          <Camera className="w-5 h-5 text-primary" />
          <Badge variant="PLATFORM" dot>
            Field Audit Verification
          </Badge>
          <span className="text-[11px] font-mono text-on-surface-variant">
            EXIF Protocol 1.4
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface mb-2">
          Upload Ground Delivery Proof
        </h1>
        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
          Submit geotagged photos of physical relief distribution to flood/landslide victims.
          Our client and server engine inspects embedded EXIF coordinates and timestamps to authenticate
          ground delivery before releasing escrow disbursements.
        </p>

        {uploadResult ? (
          <div className="bg-surface-container/60 rounded-card p-6 border border-primary/30 text-center animate-in fade-in">
            <div className="w-14 h-14 bg-primary-container text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-lg font-bold text-on-surface mb-1">
              Field Proof Submitted for Admin Verification
            </h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-5 leading-relaxed">
              Your ground delivery photo has been registered with cryptographically validated EXIF coordinates.
              The admin team has received it in the audit queue.
            </p>

            {/* Extracted Metadata Card */}
            <div className="bg-surface rounded-card p-4 border border-outline-variant/60 max-w-sm mx-auto text-left text-xs mb-6 space-y-2.5">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>GPS Coordinates</span>
                </span>
                <span className="font-mono font-bold text-on-surface">
                  {uploadResult.exifGps
                    ? `${uploadResult.exifGps.lat.toFixed(4)}, ${uploadResult.exifGps.lng.toFixed(4)}`
                    : "Not embedded"}
                </span>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  <span>Field Timestamp</span>
                </span>
                <span className="font-mono text-on-surface">
                  {uploadResult.exifTime
                    ? new Date(uploadResult.exifTime).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                </span>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-tertiary" />
                  <span>Verification Status</span>
                </span>
                <Badge variant={uploadResult.verified ? "GOVT" : "HIGH"} dot>
                  {uploadResult.verified ? "Verified by Admin" : "Awaiting Admin Review"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadResult(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setClientGps(null);
                }}
              >
                Upload Another Photo
              </Button>
              <Link
                href="/transparency"
                className="py-2 px-4 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>View Public Transparency Feed</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-6">
            {/* Campaign Selection */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                Assigned Disaster Relief Campaign <span className="text-urgent">*</span>
              </label>
              <Input
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="text-xs font-mono"
                placeholder="Campaign UUID (e.g. c1000000-0000-0000-0000-000000000001)"
                required
              />
            </div>

            {/* Photo Upload Zone */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                Field Photo with Embedded EXIF GPS <span className="text-urgent">*</span>
              </label>

              <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-card p-6 text-center cursor-pointer block bg-surface-container/20 transition-all">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Field proof preview"
                      className="max-h-56 mx-auto rounded-card object-cover shadow-sm border border-outline-variant"
                    />
                    <p className="text-xs font-semibold text-primary">
                      Click to choose a different photo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">
                        Click to select field photo (JPG / PNG / WebP)
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        Client reads embedded GPS metadata instantly using exifr
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Reading EXIF Spinner */}
            {isReadingExif && (
              <div className="p-3 bg-surface-container/60 rounded-input flex items-center gap-2 text-xs text-on-surface">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Reading embedded EXIF GPS tags...</span>
              </div>
            )}

            {/* Client-Side EXIF GPS Preview Card */}
            {clientGps && (
              <div className="p-4 rounded-card bg-tertiary-container/15 border border-tertiary/40 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-tertiary mb-2">
                  <CheckCircle2 className="w-4 h-4 text-tertiary" />
                  <span>Client-Side Geolocation Preview Detected (exifr):</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase block">
                      Latitude
                    </span>
                    <span className="font-bold text-on-surface">
                      {clientGps.latitude.toFixed(6)}° N
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase block">
                      Longitude
                    </span>
                    <span className="font-bold text-on-surface">
                      {clientGps.longitude.toFixed(6)}° E
                    </span>
                  </div>
                </div>
                {clientGps.timestamp && (
                  <div className="mt-2 text-[11px] text-on-surface-variant">
                    Capture Timestamp: <span className="font-mono font-semibold">{clientGps.timestamp}</span>
                  </div>
                )}
              </div>
            )}

            {/* GPS Missing Warning */}
            {gpsMissingWarning && (
              <div className="p-3.5 rounded-card bg-urgent-container/20 border border-urgent/40 text-xs text-urgent flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{gpsMissingWarning}</span>
              </div>
            )}

            {/* Distribution Caption */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1 uppercase tracking-wider">
                Distribution Description / Milestone Notes
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Distributed 250 food packets and clean water containers in Morigaon camp."
                className="w-full p-2.5 rounded-input bg-surface border border-outline-variant/80 focus:border-primary text-xs text-on-surface outline-none"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-input bg-error-container/20 border border-urgent/30 text-xs text-urgent flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!selectedFile || isUploading || isReadingExif}
              isLoading={isUploading}
              className="w-full text-xs font-bold"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              <span>Submit Photo for Admin Verification</span>
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
