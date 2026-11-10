"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  MapPin,
  FileText,
  CheckCircle,
  Upload,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

// ── Complete Application Schema ─────────────────────────────────────────────
const schema = z.object({
  // Step 1: Organisation Details
  name: z.string().min(2, "Organisation name must be at least 2 characters"),
  registrationNumber: z.string().min(3, "Registration / 80G number is required"),
  registrationType: z.enum(["govt", "platform"]),
  description: z.string().min(20, "Please provide a detailed description (min 20 characters)"),

  // Step 2: Registration Docs
  certUrl: z.string().min(1, "Registration certificate is required"),
  taxDocUrl: z.string().optional(),
  disasterHistoryUrl: z.string().optional(),

  // Step 3: Bank & Contact
  address: z.string().min(5, "Physical headquarters address is required"),
  baseLat: z.string().optional(),
  baseLng: z.string().optional(),
  website: z.string().url("Enter a valid URL (e.g. https://relief.org)").optional().or(z.literal("")),
  phone: z.string().min(8, "Valid contact telephone number is required"),
  bankAccount: z.string().min(6, "Bank account number is required for escrow disbursements"),
  bankIfsc: z.string().min(4, "Bank IFSC or routing code is required"),

  // Step 4: Declaration
  declarationAccepted: z.boolean().refine((v) => v === true, {
    message: "You must accept the truthfulness and escrow audit declaration",
  }),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, label: "Organisation Details", icon: Building2 },
  { id: 2, label: "Registration Docs", icon: FileText },
  { id: 3, label: "Bank & Contact", icon: CreditCard },
  { id: 4, label: "Review & Submit", icon: CheckCircle },
];

// ── Strict Client-Validated Doc Uploader ────────────────────────────────────
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

    // 1. Client-Side File Type Validation: PDF, JPG, PNG
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedMimeTypes.includes(file.type)) {
      setError("Invalid file format. Only PDF, JPG, or PNG files are accepted.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // 2. Client-Side File Size Validation: < 5MB
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      setError(`File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed is 5MB.`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "ngo-docs");

    try {
      const res = await fetch("/api/upload/document", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Document upload failed");
      onUpload(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Document upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-on-surface">
        {label} {required && <span className="text-urgent">*</span>}
      </label>
      <p className="text-[11px] text-on-surface-variant mb-2">{description}</p>

      {uploadedUrl ? (
        <div className="flex items-center gap-2 p-3 bg-tertiary-container/10 border border-tertiary/30 rounded-input">
          <CheckCircle2 className="w-4 h-4 text-tertiary shrink-0" />
          <span className="text-xs text-tertiary font-semibold flex-1 truncate">
            Document uploaded successfully
          </span>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            type="button"
            onClick={() => onUpload("")}
            className="text-on-surface-variant hover:text-urgent p-1 transition-colors cursor-pointer"
            title="Remove document"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed border-outline-variant/80 rounded-card p-5 text-center cursor-pointer",
            "hover:border-primary hover:bg-primary-container/5 transition-all duration-200",
            uploading && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-primary mx-auto animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-primary mx-auto mb-1.5" />
          )}
          <p className="text-xs font-semibold text-on-surface">
            {uploading ? "Verifying and uploading document..." : "Click to upload file"}
          </p>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            PDF, JPG, PNG &bull; Strict max size &lt; 5MB
          </p>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pdf,image/png,image/jpeg"
            onChange={handleFile}
            disabled={uploading}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-urgent flex items-center gap-1 mt-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Multi-Step NGO Accreditation Application ────────────────────────────────
export default function NGOApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // Single useForm state for all 4 steps
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      registrationNumber: "",
      registrationType: "govt",
      description: "",
      certUrl: "",
      taxDocUrl: "",
      disasterHistoryUrl: "",
      address: "",
      baseLat: "26.1445",
      baseLng: "91.7362",
      website: "",
      phone: "+91 98765 43210",
      bankAccount: "",
      bankIfsc: "",
      declarationAccepted: false,
    },
  });

  const regType = watch("registrationType");
  const certUrlVal = watch("certUrl");
  const taxDocUrlVal = watch("taxDocUrl");
  const disasterHistoryUrlVal = watch("disasterHistoryUrl");

  // Step-wise validation fields
  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ["name", "registrationNumber", "description", "registrationType"],
    2: ["certUrl"],
    3: ["address", "phone", "bankAccount", "bankIfsc"],
    4: ["declarationAccepted"],
  };

  async function nextStep() {
    const fieldsToValidate = stepFields[step];
    const valid = await trigger(fieldsToValidate);
    if (valid) {
      setStep((s) => Math.min(s + 1, 4));
    }
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setServerError("");

    try {
      // Submit as FormData or JSON
      const res = await fetch("/api/ngo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          registrationNumber: data.registrationNumber,
          registrationType: data.registrationType,
          description: data.description,
          address: data.address,
          baseLat: data.baseLat,
          baseLng: data.baseLng,
          website: data.website || null,
          phone: data.phone,
          docs: {
            certificate: data.certUrl,
            taxDoc: data.taxDocUrl || undefined,
            disasterHistory: data.disasterHistoryUrl || undefined,
          },
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? "Failed to submit application");
      }

      router.push("/ngo/profile?applied=true");
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : "Submission failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="section max-w-3xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="GOVT" dot>
            Accreditation Protocol
          </Badge>
          <span className="text-[11px] font-mono text-on-surface-variant">
            Standard Verification V2
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
          NGO Accreditation Application
        </h1>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
          Accredited NGOs unlock direct access to disaster responder rankings, automated AI inventory budgets,
          and verified escrow release tranches.
        </p>
      </div>

      {/* Step Indicator Header */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {STEPS.map((s) => {
          const isDone = step > s.id;
          const isCurrent = step === s.id;

          return (
            <div
              key={s.id}
              className={cn(
                "p-3 rounded-card border transition-all text-center",
                isCurrent && "border-primary bg-primary text-white shadow-xs font-bold",
                isDone && "border-tertiary/40 bg-tertiary-container/10 text-tertiary font-semibold",
                !isCurrent && !isDone && "border-outline-variant/60 bg-surface text-on-surface-variant"
              )}
            >
              <div className="flex items-center justify-center gap-1.5 text-xs">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <s.icon className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline">Step {s.id}</span>
              </div>
              <p className="text-[11px] mt-0.5 truncate">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main Multi-Step Form */}
      <Card className="p-6 md:p-8 shadow-sm border-outline-variant/60">
        {serverError && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 bg-error-container/20 border border-urgent/30 rounded-input text-xs text-urgent">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── STEP 1: Organisation Details ── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-outline-variant/40 pb-3">
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Step 1: Organisation Details</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Provide your NGO&apos;s registered legal identity and accreditation level.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Organisation Legal Name <span className="text-urgent">*</span>
                </label>
                <Input
                  placeholder="e.g. Rapid Relief International India"
                  className="text-xs"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-urgent mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Accreditation Tier <span className="text-urgent">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={cn(
                      "p-3.5 rounded-card border cursor-pointer transition-all flex items-start gap-3",
                      regType === "govt"
                        ? "border-tertiary bg-tertiary-container/10 ring-2 ring-tertiary/20"
                        : "border-outline-variant hover:border-outline"
                    )}
                  >
                    <input
                      type="radio"
                      value="govt"
                      {...register("registrationType")}
                      className="mt-0.5 accent-tertiary"
                    />
                    <div>
                      <span className="font-bold text-xs text-on-surface block">
                        Government Accredited (FCRA / Darpan)
                      </span>
                      <span className="text-[11px] text-on-surface-variant block mt-0.5">
                        Higher priority score (+10 pts) in emergency relief algorithms.
                      </span>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "p-3.5 rounded-card border cursor-pointer transition-all flex items-start gap-3",
                      regType === "platform"
                        ? "border-primary bg-primary-container/10 ring-2 ring-primary/20"
                        : "border-outline-variant hover:border-outline"
                    )}
                  >
                    <input
                      type="radio"
                      value="platform"
                      {...register("registrationType")}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <span className="font-bold text-xs text-on-surface block">
                        Platform Verified Responder
                      </span>
                      <span className="text-[11px] text-on-surface-variant block mt-0.5">
                        Standard accreditation verified by ReliefTrack admin team.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Registration / 80G / FCRA Number <span className="text-urgent">*</span>
                </label>
                <Input
                  placeholder="e.g. NGO-IND-2024-9841"
                  className="text-xs font-mono"
                  {...register("registrationNumber")}
                />
                {errors.registrationNumber && (
                  <p className="text-xs text-urgent mt-1">
                    {errors.registrationNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Mission Statement & Field Capabilities <span className="text-urgent">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your active disaster relief capabilities, geographic reach, volunteer network, and previous relief operations..."
                  className="w-full p-3 rounded-input bg-surface border border-outline-variant/80 focus:border-primary text-xs text-on-surface outline-none"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-urgent mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Registration Docs ── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-outline-variant/40 pb-3">
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Step 2: Legal Registration Documents</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Upload audited compliance certificates. Strict client validation enforces PDF/JPG/PNG and &lt; 5MB.
                </p>
              </div>

              <DocUploader
                label="Official NGO Registration Certificate"
                description="Government registration certificate, Trust Deed, or Society Registration document (PDF, JPG, PNG &bull; &lt; 5MB)"
                uploadedUrl={certUrlVal}
                onUpload={(url) => setValue("certUrl", url, { shouldValidate: true })}
                required
              />
              {errors.certUrl && (
                <p className="text-xs text-urgent">{errors.certUrl.message}</p>
              )}

              <DocUploader
                label="Tax Exemption Certificate (80G / 12A / 501c3)"
                description="Tax exemption certificate validating eligible donor tax receipts."
                uploadedUrl={taxDocUrlVal}
                onUpload={(url) => setValue("taxDocUrl", url)}
              />

              <DocUploader
                label="Past Disaster Operational Record / Audit Report"
                description="Annual report or audited expenditure breakdown from prior emergency missions."
                uploadedUrl={disasterHistoryUrlVal}
                onUpload={(url) => setValue("disasterHistoryUrl", url)}
              />
            </div>
          )}

          {/* ── STEP 3: Bank & Contact ── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-outline-variant/40 pb-3">
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Step 3: Bank Details & Operational Headquarters</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Verified bank coordinates are used for automated escrow milestone disbursements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Headquarters Physical Address <span className="text-urgent">*</span>
                </label>
                <Input
                  placeholder="e.g. 42 MG Road, Guwahati, Assam 781001"
                  className="text-xs"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-xs text-urgent mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Operational Base Latitude
                  </label>
                  <Input
                    placeholder="26.1445"
                    className="text-xs font-mono"
                    {...register("baseLat")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Operational Base Longitude
                  </label>
                  <Input
                    placeholder="91.7362"
                    className="text-xs font-mono"
                    {...register("baseLng")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Emergency Contact Phone <span className="text-urgent">*</span>
                  </label>
                  <Input
                    placeholder="+91 98765 43210"
                    className="text-xs font-mono"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-xs text-urgent mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Official Website URL
                  </label>
                  <Input
                    placeholder="https://relieforg.in"
                    className="text-xs"
                    {...register("website")}
                  />
                  {errors.website && (
                    <p className="text-xs text-urgent mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-card bg-surface-container/50 border border-outline-variant/60 space-y-4">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                  Escrow Disbursement Bank Coordinates
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface mb-1">
                      Bank Account Number <span className="text-urgent">*</span>
                    </label>
                    <Input
                      placeholder="e.g. 50100234918231"
                      className="text-xs font-mono"
                      {...register("bankAccount")}
                    />
                    {errors.bankAccount && (
                      <p className="text-xs text-urgent mt-1">
                        {errors.bankAccount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface mb-1">
                      Bank IFSC / Swift Code <span className="text-urgent">*</span>
                    </label>
                    <Input
                      placeholder="e.g. HDFC0000123"
                      className="text-xs font-mono uppercase"
                      {...register("bankIfsc")}
                    />
                    {errors.bankIfsc && (
                      <p className="text-xs text-urgent mt-1">{errors.bankIfsc.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Review & Submit ── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="border-b border-outline-variant/40 pb-3">
                <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Step 4: Review & Legal Declaration</span>
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Confirm the accuracy of your application details before final submission to the admin queue.
                </p>
              </div>

              {/* Review Card */}
              <div className="bg-surface-container/40 rounded-card p-5 border border-outline-variant/60 space-y-3 text-xs">
                <div className="flex justify-between items-start pb-2 border-b border-outline-variant/40">
                  <span className="text-on-surface-variant">Organisation Name:</span>
                  <span className="font-bold text-on-surface text-right">{getValues("name")}</span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-outline-variant/40">
                  <span className="text-on-surface-variant">Accreditation Tier:</span>
                  <Badge variant={getValues("registrationType") === "govt" ? "GOVT" : "PLATFORM"}>
                    {getValues("registrationType") === "govt"
                      ? "Government Accredited"
                      : "Platform Verified"}
                  </Badge>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-outline-variant/40">
                  <span className="text-on-surface-variant">Registration / 80G:</span>
                  <span className="font-mono text-on-surface">{getValues("registrationNumber")}</span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-outline-variant/40">
                  <span className="text-on-surface-variant">Headquarters Address:</span>
                  <span className="text-on-surface text-right max-w-xs">{getValues("address")}</span>
                </div>

                <div className="flex justify-between items-start pb-2 border-b border-outline-variant/40">
                  <span className="text-on-surface-variant">Bank Account / IFSC:</span>
                  <span className="font-mono text-on-surface">
                    {getValues("bankAccount")} &bull; {getValues("bankIfsc")}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-on-surface-variant">Certificate Upload:</span>
                  <span className="text-tertiary font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Attached & Verified
                  </span>
                </div>
              </div>

              {/* Legal Declaration Checkbox */}
              <div className="p-4 rounded-input bg-surface-container/60 border border-outline-variant/60 flex items-start gap-3">
                <input
                  id="declaration-checkbox"
                  type="checkbox"
                  {...register("declarationAccepted")}
                  className="mt-0.5 w-4 h-4 text-primary rounded accent-primary cursor-pointer shrink-0"
                />
                <label
                  htmlFor="declaration-checkbox"
                  className="text-xs text-on-surface leading-relaxed cursor-pointer select-none"
                >
                  <strong className="block text-on-surface font-semibold mb-0.5">
                    Legal Undertaking & Escrow Release Agreement
                  </strong>
                  I hereby solemnly affirm that all submitted documents and registration numbers are genuine.
                  I agree that all donations received via ReliefTrack will be held in escrow and released solely
                  upon admin verification of timestamped, geotagged proof photos of direct aid delivery.
                </label>
              </div>
              {errors.declarationAccepted && (
                <p className="text-xs text-urgent font-medium">
                  {errors.declarationAccepted.message}
                </p>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/40 mt-6">
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={prevStep}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Previous Step
              </Button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <Button type="button" variant="primary" size="sm" onClick={nextStep}>
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={submitting}
                className="bg-tertiary hover:bg-tertiary-hover text-white text-xs font-bold"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>Submit Accreditation Application</span>
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
