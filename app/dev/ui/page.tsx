"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Select,
  Modal,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Stepper,
  ProgressBar,
  Skeleton,
  EmptyState,
} from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function DevUiShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectValue, setSelectValue] = useState("option1");

  const stepperSteps = [
    { step: 1, label: "Payment received", done: true, at: "2026-08-01T10:30:00Z" },
    { step: 2, label: "Held in escrow", done: true, at: "2026-08-01T10:30:00Z" },
    { step: 3, label: "Field proof verified", done: false },
    { step: 4, label: "Funds released", done: false },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="border-b border-outline-variant pb-6">
        <Badge variant="platform" className="mb-2">Stitch Design System</Badge>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
          ReliefTrack UI Component Library
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Showcase and interactive test harness for shared Phase 1 components.
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Amber</Button>
          <Button variant="tertiary">Tertiary Forest</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="urgent">Urgent Crimson</Button>
          <Button variant="primary" isLoading loadingText="Processing">Loading</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
            Large with Icon
          </Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="GOVT" dot>GOVERNMENT ACCREDITED</Badge>
          <Badge variant="PLATFORM" dot>PLATFORM VERIFIED</Badge>
          <Badge variant="URGENT" dot>CRITICAL (LVL 4)</Badge>
          <Badge variant="HIGH" dot>HIGH (LVL 3)</Badge>
          <Badge variant="MODERATE">MODERATE (LVL 2)</Badge>
          <Badge variant="LOW">LOW (LVL 1)</Badge>
          <Badge variant="NONE">UNVERIFIED</Badge>
          <Badge variant="outline">OUTLINE BADGE</Badge>
        </div>
      </section>

      {/* Stepper */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Stepper (4-Step Escrow Audit Trail)</h2>
        <Card>
          <Stepper steps={stepperSteps} currentStep={3} />
        </Card>
      </section>

      {/* Progress Bars */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Progress Bar (Cap & Fund Utilization)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="space-y-4">
            <ProgressBar value={72} max={100} showLabel label="Campaign Funding Cap Utilization" variant="primary" />
            <ProgressBar value={40} max={100} showLabel label="Secondary Progress" variant="secondary" />
            <ProgressBar value={95} max={100} showLabel label="Urgent Quota" variant="urgent" />
          </Card>
          <Card className="space-y-4">
            <ProgressBar value={100} max={100} showLabel label="Fully Released (Tertiary)" variant="tertiary" size="lg" />
            <ProgressBar value={30} max={100} size="sm" variant="primary" />
          </Card>
        </div>
      </section>

      {/* Form Inputs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Form Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Donation Amount (INR)"
            placeholder="e.g. 5000"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Enter amount in Indian Rupees."
          />
          <Input
            label="Invalid Input Test"
            defaultValue="invalid_number"
            error="Amount must be a valid positive number"
          />
          <Select
            label="Select Crisis Zone"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            options={[
              { value: "option1", label: "Wayanad Landslides (Kerala)" },
              { value: "option2", label: "Brahmaputra Floods (Assam)" },
              { value: "option3", label: "Cyclone Dana (Odisha)" },
            ]}
          />
        </div>
      </section>

      {/* Card & Modal */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Card and Modal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="GOVT">GOVERNMENT</Badge>
                <span className="font-mono text-xs text-outline">#1 RANKED</span>
              </div>
              <CardTitle>Kerala Relief Front</CardTitle>
              <CardDescription>
                Stationed 24 km from epicenter. 93% verified delivery rate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressBar value={280000} max={1000000} showLabel label="₹2.8L raised of ₹10L cap" />
            </CardContent>
            <CardFooter>
              <span className="font-mono text-xs font-bold text-primary">Score: 94/100</span>
              <Button size="sm" onClick={() => setModalOpen(true)}>Open Modal</Button>
            </CardFooter>
          </Card>

          <EmptyState
            title="No Unverified Proofs"
            description="All field deliveries have been reviewed and approved by the platform administrators."
            action={<Button variant="outline" size="sm">Refresh Queue</Button>}
          />
        </div>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Table (Ledger / List)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NGO Name</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Milestone Action</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold">Kerala Relief Front</TableCell>
              <TableCell><Badge variant="GOVT">GOVT</Badge></TableCell>
              <TableCell>500 Meal Kits distributed in Meppadi</TableCell>
              <TableCell className="font-mono font-bold text-primary">₹1,50,000</TableCell>
              <TableCell><Badge variant="platform">DISBURSED</Badge></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold">Rapid Response India</TableCell>
              <TableCell><Badge variant="PLATFORM">PLATFORM</Badge></TableCell>
              <TableCell>Clean drinking water cans deployed</TableCell>
              <TableCell className="font-mono font-bold text-primary">₹80,000</TableCell>
              <TableCell><Badge variant="platform">DISBURSED</Badge></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-on-surface">Loading Skeletons</h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </section>

      {/* Interactive Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Admin Verification Confirmation"
        description="Verify this geotagged delivery photo and release the associated milestone funds."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
              Confirm & Release
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-on-surface">
            Are you sure you want to verify the field proof from <strong>Kerala Relief Front</strong>?
          </p>
          <div className="p-3 bg-surface-container rounded-card text-xs font-mono space-y-1">
            <p>GPS: 11.6841° N, 76.1302° E</p>
            <p>Milestone: Procure & distribute 500 dry ration kits</p>
            <p className="text-primary font-bold">Release Amount: ₹1,50,000</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
