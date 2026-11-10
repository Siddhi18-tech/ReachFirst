"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  FileCheck2,
  CreditCard,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Shield,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Validation Schema (Single Form State) ─────────────────────────────────────
const applySchema = z.object({
  // Step 1: Organisation Details
  name: z.string().min(2, "Organisation name must be at least 2 characters"),
  registrationType: z.enum(["govt", "platform"]),
  registrationNumber: z.string().min(3, "Valid registration number required"),
  description: z.string().min(20, "Describe your relief capabilities (min 20 characters)"),

  // Step 2: Documents (Stored as File object or null)
  // Step 3: Bank & Contact Details
  bankName: z.string().min(2, "Bank name required"),
  accountNumber: z.string().min(6, "Valid bank account number required"),
  ifscCode: z.string().min(4, "Valid IFSC code required"),
  contactEmail: z.string().email("Valid official email required"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(5, "Office physical address required"),
  baseLat: z.string().optional(),
  baseLng: z.string().optional(),

  // Step 4: Declaration
  declarationAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the governance declaration to proceed",
  }),
});

type ApplyFormData = z.infer<typeof applySchema>;

const STEPS = [
  { id: 1, label: "Organisation", icon: Building2 },
  { id: 2, label: "Registration Docs", icon: FileCheck2 },
  { id: 3, label: "Bank & Contact", icon: CreditCard },
  { id: 4, label: "Review & Submit", icon: Eye },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export default function NgoApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // File states (managed alongside useForm)
  const [certFile, setCertFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      name: "",
      registrationType: "platform",
      registrationNumber: "",
      description: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      contactEmail: "",
      phone: "",
      address: "",
      baseLat: "11.6854",
      baseLng: "76.1320",
      declarationAccepted: false,
    },
    mode: "onTouched",
  });

  const formValues = watch();

  // Validate file helper
  const handleValidateFile = (
    file: File | undefined,
    fieldName: string,
    setFileState: (f: File | null) => void
  ) => {
    setFileErrors((prev) => ({ ...prev, [fieldName]: "" }));
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileErrors((prev) => ({
        ...prev,
        [fieldName]: "Invalid format. Only PDF, JPG, and PNG files are accepted.",
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileErrors((prev) => ({
        ...prev,
        [fieldName]: `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max size is 5MB.`,
      }));
      return;
    }

    setFileState(file);
  };

  // Step progression validation
  const handleNextStep = async () => {
    setServerError(null);

    if (currentStep === 1) {
      const isValid = await trigger(["name", "registrationType", "registrationNumber", "description"]);
      if (isValid) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!certFile) {
        setFileErrors((prev) => ({
          ...prev,
          certificate: "Registration certificate is required.",
        }));
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const isValid = await trigger([
        "bankName",
        "accountNumber",
        "ifscCode",
        "contactEmail",
        "phone",
        "address",
      ]);
      if (isValid) setCurrentStep(4);
    }
  };

  // Final Form Submission via FormData
  const onSubmit = async (data: ApplyFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("registrationType", data.registrationType);
      formData.append("registrationNumber", data.registrationNumber);
      formData.append("description", data.description);

      formData.append("bankName", data.bankName);
      formData.append("accountNumber", data.accountNumber);
      formData.append("ifscCode", data.ifscCode);
      formData.append("contactEmail", data.contactEmail);
      formData.append("phone", data.phone);
      formData.append("address", data.address);
      formData.append("baseLat", data.baseLat || "0");
      formData.append("baseLng", data.baseLng || "0");

      if (certFile) formData.append("certificate", certFile);
      if (taxFile) formData.append("taxDoc", taxFile);
      if (historyFile) formData.append("disasterHistory", historyFile);

      const res = await fetch("/api/ngo/apply", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      router.push("/ngo/profile?applied=true");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Submission error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-low py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Page Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-primary/10 text-primary text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Frontline Disaster Relief Accreditation
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Apply for ReliefTrack Accreditation
          </h1>
          <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
            Accredited NGOs receive prioritized donor routing and verified escrow disbursements based on field proof.
          </p>
        </div>

        {/* 4-Step Indicator Strip */}
        <div className="bg-white rounded-card p-3 border border-outline-variant/70 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-input text-xs font-bold transition-all",
                    isCurrent && "bg-primary text-white shadow-xs",
                    isDone && "bg-primary/10 text-primary",
                    !isCurrent && !isDone && "text-outline bg-surface-container/50"
                  )}
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="hidden sm:inline font-mono">0{step.id}.</span>
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Multi-Step Form */}
        <div className="bg-white rounded-card border border-outline-variant/70 shadow-modal p-6 sm:p-8">
          {serverError && (
            <div className="mb-6 p-4 rounded-input bg-urgent-container/40 border border-urgent/30 text-xs text-urgent flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ── STEP 1: Organisation Details ─────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-outline-variant/60 pb-3">
                  <h2 className="text-lg font-bold text-on-surface">Step 1: Organisation Details</h2>
                  <p className="text-xs text-on-surface-variant">
                    Provide the official identity and mission scope of your relief team.
                  </p>
                </div>

                <div>
                  <label className="label">
                    Full Registered Organisation Name <span className="text-urgent">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kerala Disaster Relief Trust"
                    className="input"
                    {...register("name")}
                  />
                  {errors.name && <p className="text-xs text-urgent mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="label">Accreditation Category</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={cn(
                        "p-4 rounded-card border cursor-pointer transition-all flex flex-col justify-between",
                        formValues.registrationType === "govt"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-outline-variant/80 hover:bg-surface-container/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-on-surface">🏛️ Government Registered</span>
                        <input
                          type="radio"
                          value="govt"
                          className="sr-only"
                          {...register("registrationType")}
                        />
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Entities registered under FCRA, Darpan, or State Disaster Management (Score Bonus: +10)
                      </p>
                    </label>

                    <label
                      className={cn(
                        "p-4 rounded-card border cursor-pointer transition-all flex flex-col justify-between",
                        formValues.registrationType === "platform"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-outline-variant/80 hover:bg-surface-container/40"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-on-surface">✅ Platform Verified</span>
                        <input
                          type="radio"
                          value="platform"
                          className="sr-only"
                          {...register("registrationType")}
                        />
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        Non-profit trusts & registered societies audited via ReliefTrack standards (Score Bonus: +6)
                      </p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">
                    Registration / Darpan / 12A Number <span className="text-urgent">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KL/2021/0284819"
                    className="input font-mono"
                    {...register("registrationNumber")}
                  />
                  {errors.registrationNumber && (
                    <p className="text-xs text-urgent mt-1">{errors.registrationNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">
                    Relief Capabilities & Mission Description <span className="text-urgent">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your frontline capabilities, volunteer strength, medical/ration logistics, and operational history..."
                    className="input !h-auto py-2.5"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-xs text-urgent mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Registration Documents ──────────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-slide-up">
                <div className="border-b border-outline-variant/60 pb-3">
                  <h2 className="text-lg font-bold text-on-surface">Step 2: Registration Documents</h2>
                  <p className="text-xs text-on-surface-variant">
                    Upload official documents for admin review. Only PDF, JPG, and PNG files up to 5MB are accepted.
                  </p>
                </div>

                {/* Doc 1: Registration Certificate */}
                <div className="p-4 rounded-card border border-outline-variant/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface block">
                        NGO Registration Certificate <span className="text-urgent">*</span>
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Society registration or Trust deed certificate
                      </span>
                    </div>
                    {certFile && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-primary font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={(e) =>
                      handleValidateFile(e.target.files?.[0], "certificate", setCertFile)
                    }
                    className="w-full text-xs text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                  />
                  {fileErrors.certificate && (
                    <p className="text-xs text-urgent flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fileErrors.certificate}
                    </p>
                  )}
                </div>

                {/* Doc 2: Tax Exemption Document */}
                <div className="p-4 rounded-card border border-outline-variant/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface block">
                        80G / 12A / FCRA Certificate (Optional)
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Income tax exemption recognition for donor receipts
                      </span>
                    </div>
                    {taxFile && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-primary font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={(e) =>
                      handleValidateFile(e.target.files?.[0], "taxDoc", setTaxFile)
                    }
                    className="w-full text-xs text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                  />
                  {fileErrors.taxDoc && (
                    <p className="text-xs text-urgent flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fileErrors.taxDoc}
                    </p>
                  )}
                </div>

                {/* Doc 3: Disaster History */}
                <div className="p-4 rounded-card border border-outline-variant/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-on-surface block">
                        Past Relief Operations Record (Optional)
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Audit report, field photos, or newspaper coverage of past missions
                      </span>
                    </div>
                    {historyFile && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-primary font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={(e) =>
                      handleValidateFile(e.target.files?.[0], "disasterHistory", setHistoryFile)
                    }
                    className="w-full text-xs text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                  />
                  {fileErrors.disasterHistory && (
                    <p className="text-xs text-urgent flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {fileErrors.disasterHistory}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: Bank & Contact ──────────────────────────────────── */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-slide-up">
                <div className="border-b border-outline-variant/60 pb-3">
                  <h2 className="text-lg font-bold text-on-surface">Step 3: Bank Account & Field Headquarters</h2>
                  <p className="text-xs text-on-surface-variant">
                    Escrow reimbursements are wired directly to this official registered NGO account.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Bank Name <span className="text-urgent">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      className="input"
                      {...register("bankName")}
                    />
                    {errors.bankName && <p className="text-xs text-urgent mt-1">{errors.bankName.message}</p>}
                  </div>

                  <div>
                    <label className="label">IFSC Code <span className="text-urgent">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      className="input font-mono uppercase"
                      {...register("ifscCode")}
                    />
                    {errors.ifscCode && <p className="text-xs text-urgent mt-1">{errors.ifscCode.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="label">Official Account Number <span className="text-urgent">*</span></label>
                  <input
                    type="password"
                    placeholder="Enter account number"
                    className="input font-mono"
                    {...register("accountNumber")}
                  />
                  {errors.accountNumber && (
                    <p className="text-xs text-urgent mt-1">{errors.accountNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Official Email <span className="text-urgent">*</span></label>
                    <input
                      type="email"
                      placeholder="admin@yourngo.org"
                      className="input"
                      {...register("contactEmail")}
                    />
                    {errors.contactEmail && (
                      <p className="text-xs text-urgent mt-1">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Emergency Hotline Phone <span className="text-urgent">*</span></label>
                    <input
                      type="text"
                      placeholder="+91 98470 12345"
                      className="input font-mono"
                      {...register("phone")}
                    />
                    {errors.phone && <p className="text-xs text-urgent mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="label">Operational Headquarters Address <span className="text-urgent">*</span></label>
                  <input
                    type="text"
                    placeholder="District, City, Pin Code, State"
                    className="input"
                    {...register("address")}
                  />
                  {errors.address && <p className="text-xs text-urgent mt-1">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Base Latitude (for Proximity Engine)</label>
                    <input
                      type="text"
                      placeholder="e.g. 11.6854"
                      className="input font-mono"
                      {...register("baseLat")}
                    />
                  </div>
                  <div>
                    <label className="label">Base Longitude</label>
                    <input
                      type="text"
                      placeholder="e.g. 76.1320"
                      className="input font-mono"
                      {...register("baseLng")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Review & Submit ─────────────────────────────────── */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-slide-up">
                <div className="border-b border-outline-variant/60 pb-3">
                  <h2 className="text-lg font-bold text-on-surface">Step 4: Review Application & Declaration</h2>
                  <p className="text-xs text-on-surface-variant">
                    Please audit all submitted information before dispatching to the verification board.
                  </p>
                </div>

                {/* Summary Grid */}
                <div className="bg-surface-container/40 rounded-card p-5 border border-outline-variant/60 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-outline uppercase text-[10px] block">Organisation</span>
                      <span className="font-bold text-on-surface text-sm">{formValues.name}</span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px] block">Category & Reg ID</span>
                      <span className="font-mono text-on-surface font-semibold">
                        {formValues.registrationType.toUpperCase()} • {formValues.registrationNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px] block">Bank Account</span>
                      <span className="font-mono text-on-surface">
                        {formValues.bankName} (IFSC: {formValues.ifscCode})
                      </span>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px] block">Emergency Contact</span>
                      <span className="font-mono text-on-surface">
                        {formValues.contactEmail} • {formValues.phone}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/60 pt-3">
                    <span className="text-outline uppercase text-[10px] block mb-1">Attached Files</span>
                    <div className="flex flex-wrap gap-2">
                      {certFile && (
                        <span className="px-2.5 py-1 bg-white border border-outline-variant rounded-pill font-mono text-[11px] text-primary font-semibold flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {certFile.name}
                        </span>
                      )}
                      {taxFile && (
                        <span className="px-2.5 py-1 bg-white border border-outline-variant rounded-pill font-mono text-[11px] text-on-surface flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {taxFile.name}
                        </span>
                      )}
                      {historyFile && (
                        <span className="px-2.5 py-1 bg-white border border-outline-variant rounded-pill font-mono text-[11px] text-on-surface flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {historyFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Governance Declaration */}
                <div className="p-4 rounded-card bg-primary-container/10 border border-primary/20 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Autonomous Escrow Governance Undertaking
                  </h4>
                  <ul className="space-y-1.5 text-xs text-on-surface-variant">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Every rupee disbursed requires EXIF GPS metadata verification from ground delivery.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Material procurement must adhere to transparent itemized budgets parsed by AI.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>False reporting leads to permanent de-listing and reporting to NDMA authorities.</span>
                    </li>
                  </ul>

                  <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                      {...register("declarationAccepted")}
                    />
                    <span className="text-xs font-semibold text-on-surface">
                      I formally certify that all submitted credentials are valid and agree to the ReliefTrack escrow audit protocol.
                    </span>
                  </label>
                  {errors.declarationAccepted && (
                    <p className="text-xs text-urgent font-medium">{errors.declarationAccepted.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Form Navigation Actions ───────────────────────────────────── */}
            <div className="flex items-center justify-between pt-5 border-t border-outline-variant/60">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="py-2.5 px-4 rounded-input border border-outline-variant text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="py-2.5 px-6 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-8 rounded-input bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Accreditation Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
