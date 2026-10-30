"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, MapPin, FileText, CheckCircle, Upload,
  AlertCircle, Loader2, ArrowRight, ArrowLeft, ExternalLink, X
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Organisation name required"),
  registrationNumber: z.string().optional(),
  description: z.string().min(20, "Min 20 characters describing your work"),
  registrationType: z.enum(["govt", "platform"]),
  address: z.string().min(5, "Address required"),
  baseLat: z.string().optional(),
  baseLng: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  // Docs — URLs after upload
  certUrl: z.string().optional(),
  taxDocUrl: z.string().optional(),
  disasterHistoryUrl: z.string().optional(),
  declarationAccepted: z.boolean().refine((v) => v === true, "You must accept the declaration"),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: "Organisation Info", icon: Building2 },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Documents", icon: FileText },
  { id: 4, label: "Declaration", icon: CheckCircle },
];

// ── File Upload Widget ─────────────────────────────────────────────────────────
function DocUploader({
  label,
  description,
  onUpload,
  uploadedUrl,
  required,
}: {
  label: string;
  description: string;
  onUpload: (url: string) => void;
  uploadedUrl?: string;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "ngo-docs");

    try {
      const res = await fetch("/api/upload/document", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUpload(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="label">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <p className="text-xs text-on-surface-variant mb-2">{description}</p>
      {uploadedUrl ? (
        <div className="flex items-center gap-2 p-3 bg-tertiary-50 border border-tertiary-200 rounded-input">
          <CheckCircle className="w-4 h-4 text-tertiary shrink-0" />
          <span className="text-xs text-tertiary-700 font-medium flex-1 truncate">Uploaded successfully</span>
          <a href={uploadedUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
            View <ExternalLink className="w-3 h-3" />
          </a>
          <button type="button" onClick={() => onUpload("")} className="text-outline hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed border-outline-variant rounded-card p-6 text-center cursor-pointer",
            "hover:border-primary hover:bg-primary-50 transition-all duration-200",
            uploading && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary mx-auto animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-outline mx-auto mb-2" />
          )}
          <p className="text-sm text-on-surface-variant">
            {uploading ? "Uploading..." : "Click to upload or drag & drop"}
          </p>
          <p className="text-xs text-outline mt-1">JPG, PNG, PDF · Max 10MB</p>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept="image/*,.pdf"
            onChange={handleFile}
            disabled={uploading}
          />
        </div>
      )}
      {error && <p className="text-xs text-error flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function NGOApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [taxDocUrl, setTaxDocUrl] = useState("");
  const [disasterHistoryUrl, setDisasterHistoryUrl] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { registrationType: "platform", declarationAccepted: false },
  });

  const regType = watch("registrationType");

  // Step validation fields
  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ["name", "registrationNumber", "description", "registrationType"],
    2: ["address", "baseLat", "baseLng", "website", "phone"],
    3: [],
    4: ["declarationAccepted"],
  };

  async function nextStep() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/ngo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          docs: {
            certificate: certUrl || undefined,
            taxDoc: taxDocUrl || undefined,
            disasterHistory: disasterHistoryUrl || undefined,
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Submission failed");
      router.push("/ngo/profile?applied=true");
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-low py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">NGO Accreditation Application</h1>
          <p className="text-sm text-on-surface-variant mt-1">Complete all steps to submit your application for review</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-input text-sm font-medium transition-all",
                  step === s.id && "bg-primary text-white",
                  step > s.id && "bg-tertiary-50 text-tertiary-700",
                  step < s.id && "text-outline"
                )}
              >
                {step > s.id ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <s.icon className="w-4 h-4 shrink-0" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-1", step > s.id ? "bg-tertiary" : "bg-outline-variant")} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card p-8 animate-slide-up">
            {serverError && (
              <div className="mb-5 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-input text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {serverError}
              </div>
            )}

            {/* ── Step 1: Organisation Info ── */}
            {step === 1 && (
              <div className="space-y-5 animate-slide-up">
                <h2 className="text-lg font-semibold text-on-surface border-b border-outline-variant pb-3">
                  Organisation Information
                </h2>

                <div>
                  <label className="label">Organisation Name <span className="text-error">*</span></label>
                  <input className="input" placeholder="e.g. Assam Relief Foundation" {...register("name")} />
                  {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="label">Registration Type <span className="text-error">*</span></label>
                  <div className="flex rounded-input border border-outline-variant overflow-hidden">
                    {[
                      { value: "govt", label: "🏛️ Government Registered", desc: "MCA/NGO Darpan/FCRA" },
                      { value: "platform", label: "✅ Trust/Society", desc: "Registered Trust/Society" },
                    ].map((t) => (
                      <label
                        key={t.value}
                        className={cn(
                          "flex-1 p-3 cursor-pointer transition-colors text-center",
                          regType === t.value ? "bg-primary text-white" : "bg-white hover:bg-surface-low text-on-surface"
                        )}
                      >
                        <input type="radio" className="sr-only" value={t.value} {...register("registrationType")} />
                        <p className="text-sm font-semibold">{t.label}</p>
                        <p className={cn("text-xs mt-0.5", regType === t.value ? "text-white/70" : "text-on-surface-variant")}>
                          {t.desc}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Registration Number</label>
                  <input className="input" placeholder="e.g. ARF/2018/001" {...register("registrationNumber")} />
                </div>

                <div>
                  <label className="label">About your organisation <span className="text-error">*</span></label>
                  <textarea
                    className="input !h-auto py-2.5"
                    rows={4}
                    placeholder="Describe your disaster relief work, affected regions, and past operations..."
                    {...register("description")}
                  />
                  {errors.description && <p className="mt-1 text-xs text-error">{errors.description.message}</p>}
                </div>
              </div>
            )}

            {/* ── Step 2: Location ── */}
            {step === 2 && (
              <div className="space-y-5 animate-slide-up">
                <h2 className="text-lg font-semibold text-on-surface border-b border-outline-variant pb-3">
                  Contact & Location
                </h2>

                <div>
                  <label className="label">Office Address <span className="text-error">*</span></label>
                  <input className="input" placeholder="Full address including city and state" {...register("address")} />
                  {errors.address && <p className="mt-1 text-xs text-error">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Base Latitude</label>
                    <input className="input font-mono" placeholder="e.g. 26.2006" {...register("baseLat")} />
                  </div>
                  <div>
                    <label className="label">Base Longitude</label>
                    <input className="input font-mono" placeholder="e.g. 92.9376" {...register("baseLng")} />
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant -mt-3">
                  💡 Used in the priority ranking engine to calculate proximity to disaster zones.
                </p>

                <div>
                  <label className="label">Website</label>
                  <input className="input" placeholder="https://yourorg.org" {...register("website")} />
                  {errors.website && <p className="mt-1 text-xs text-error">{errors.website.message}</p>}
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input className="input" placeholder="+91 9876543210" {...register("phone")} />
                </div>
              </div>
            )}

            {/* ── Step 3: Documents ── */}
            {step === 3 && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-lg font-semibold text-on-surface border-b border-outline-variant pb-3">
                  Document Upload
                </h2>
                <p className="text-sm text-on-surface-variant">
                  All documents are stored securely on Cloudinary. EXIF metadata is read server-side before upload.
                </p>

                <DocUploader
                  label="Registration Certificate"
                  description="Upload your NGO/Trust/Society registration certificate (PDF or image)"
                  required
                  uploadedUrl={certUrl}
                  onUpload={setCertUrl}
                />

                <DocUploader
                  label="Tax Exemption Document"
                  description="80G certificate, FCRA certificate, or equivalent tax exemption document"
                  uploadedUrl={taxDocUrl}
                  onUpload={setTaxDocUrl}
                />

                <DocUploader
                  label="Past Disaster Operations Proof"
                  description="Photos or reports from previous disaster relief operations (shows track record)"
                  uploadedUrl={disasterHistoryUrl}
                  onUpload={setDisasterHistoryUrl}
                />
              </div>
            )}

            {/* ── Step 4: Declaration ── */}
            {step === 4 && (
              <div className="space-y-6 animate-slide-up">
                <h2 className="text-lg font-semibold text-on-surface border-b border-outline-variant pb-3">
                  Declaration & Submission
                </h2>

                <div className="bg-surface-container rounded-card p-5 space-y-3 text-sm text-on-surface-variant">
                  <h3 className="font-semibold text-on-surface">By submitting this application, you confirm:</h3>
                  <ul className="space-y-2 list-none">
                    {[
                      "All information provided is accurate and verifiable",
                      "Your organisation is legally registered in India",
                      "You consent to platform review of submitted documents",
                      "Funds received will be used exclusively for stated disaster relief activities",
                      "You will submit photo and financial proof for every milestone payout",
                      "False information may result in permanent de-listing and legal action",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    {...register("declarationAccepted")}
                  />
                  <span className="text-sm text-on-surface group-hover:text-primary transition-colors">
                    I have read and accept the above declaration on behalf of my organisation
                  </span>
                </label>
                {errors.declarationAccepted && (
                  <p className="text-xs text-error flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.declarationAccepted.message}
                  </p>
                )}
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(s - 1, 1))}
                className={cn("btn-secondary", step === 1 && "invisible")}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < 4 ? (
                <button type="button" onClick={nextStep} className="btn-primary">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-4">
          Applications are typically reviewed within 2–3 business days.
        </p>
      </div>
    </div>
  );
}
