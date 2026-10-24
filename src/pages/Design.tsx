import React, { useState } from "react";
import {
  Button, NavLink, Input, Textarea, Select, Toggle, FileDropzone, Card,
  Badge, StatusBadge, PriorityBadge, Tabs, Modal, Drawer, Tooltip,
  Skeleton, EmptyState, Pagination, StarRating, Countdown, Row,
  ChapterChip, StatBlock, SideRail, CursorRing, showToast,
} from "../components/ui";
import { Atmosphere } from "../components/ui/Atmosphere";
import { ComplaintStatus, Priority } from "../shared/types";
import { Search, Bell, ArrowRight, AlertTriangle, CheckCircle, Clock, FileText, Info } from "lucide-react";

export default function Design() {
  const [activeTab, setActiveTab] = useState("buttons");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toggleOn, setToggleOn] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [selectVal, setSelectVal] = useState("plumbing");
  const [rating, setRating] = useState(2);
  const [page, setPage] = useState(1);

  const tabs = [
    { key: "tokens", label: "Tokens" },
    { key: "typography", label: "Typography" },
    { key: "buttons", label: "Buttons" },
    { key: "inputs", label: "Inputs" },
    { key: "feedback", label: "Feedback" },
    { key: "badges", label: "Badges" },
    { key: "data", label: "Data Display" },
    { key: "overlays", label: "Overlays" },
    { key: "layout", label: "Layout" },
    { key: "states", label: "States" },
  ];

  return (
    <div className="min-h-screen bg-ink text-bone relative">
      <Atmosphere />
      <CursorRing />

      {/* Header */}
      <header className="relative z-10 border-b border-line">
        <div className="max-w-[1400px] mx-auto px-[var(--pad)] py-6 flex items-center justify-between">
          <div>
            <p className="eyebrow eyebrow-ember mb-2">Design System · v1.0</p>
            <h1 className="display display-md">HMCS Cinematic Night</h1>
            <p className="body-sm mt-2 text-bone-dim">
              A watchful, calm, accountable hostel at night.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="#tokens" hindi="रंग">Tokens</NavLink>
            <NavLink href="#typography" hindi="अक्षर">Typography</NavLink>
            <NavLink href="#components" hindi="अंग">Components</NavLink>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="relative z-10 border-b border-line sticky top-0 bg-ink/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-[var(--pad)]">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap border-b-2 transition-all duration-300 ${
                  activeTab === tab.key
                    ? "border-ember text-ember"
                    : "border-transparent text-bone-dim hover:text-bone"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-[var(--pad)] py-12">
        {activeTab === "tokens" && <TokensSection />}
        {activeTab === "typography" && <TypographySection />}
        {activeTab === "buttons" && (
          <ButtonsSection
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
          />
        )}
        {activeTab === "inputs" && (
          <InputsSection
            inputVal={inputVal}
            setInputVal={setInputVal}
            selectVal={selectVal}
            setSelectVal={setSelectVal}
            toggleOn={toggleOn}
            setToggleOn={setToggleOn}
            files={files}
            setFiles={setFiles}
          />
        )}
        {activeTab === "feedback" && <FeedbackSection />}
        {activeTab === "badges" && <BadgesSection />}
        {activeTab === "data" && <DataSection rating={rating} setRating={setRating} page={page} setPage={setPage} />}
        {activeTab === "overlays" && (
          <OverlaysSection
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            drawerOpen={drawerOpen}
            setDrawerOpen={setDrawerOpen}
          />
        )}
        {activeTab === "layout" && <LayoutSection />}
        {activeTab === "states" && <StatesSection />}
      </main>

      <footer className="relative z-10 border-t border-line mt-20">
        <div className="max-w-[1400px] mx-auto px-[var(--pad)] py-8 text-center">
          <p className="body-xs">HMCS Design System · Cinematic Night · WCAG 2.1 AA Compliant</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="display display-sm mb-2">{title}</h2>
        {subtitle && <p className="body-sm text-bone-dim">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h3 className="eyebrow mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  const colsClass = cols === 2 ? "grid-cols-1 md:grid-cols-2" : cols === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
  return <div className={`grid ${colsClass} gap-4`}>{children}</div>;
}

function Swatch({ name, value, className = "" }: { name: string; value: string; className?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-line">
      <div className={`w-12 h-12 rounded-lg border border-line ${className}`} style={{ background: value }} />
      <div>
        <p className="text-sm text-bone font-medium">{name}</p>
        <p className="text-xs text-muted mono">{value}</p>
      </div>
    </div>
  );
}

// ─── Tokens Section ────────────────────────────────────────────────────────────
function TokensSection() {
  return (
    <>
      <Section title="Color Tokens" subtitle="A dark, quiet palette with warm amber lamps.">
        <SubSection title="Surfaces">
          <Grid cols={4}>
            <Swatch name="Ink" value="#05070a" />
            <Swatch name="Ink 2" value="#0a0e12" />
            <Swatch name="Ink 3" value="#0f151a" />
            <Swatch name="Line" value="rgba(223,231,224,0.13)" />
          </Grid>
        </SubSection>
        <SubSection title="Text">
          <Grid cols={4}>
            <Swatch name="Bone" value="#dfe7e0" />
            <Swatch name="Bone Dim" value="#aab4ad" />
            <Swatch name="Muted" value="#8a958e" />
          </Grid>
        </SubSection>
        <SubSection title="Accents">
          <Grid cols={4}>
            <Swatch name="Ember" value="#f5a524" />
            <Swatch name="Emergency" value="#e5484d" />
            <Swatch name="Resolved" value="#6fcf97" />
            <Swatch name="Info" value="#7fb4c9" />
          </Grid>
        </SubSection>
      </Section>

      <Section title="Spacing & Layout">
        <Grid cols={3}>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Padding</p>
            <p className="mono text-sm">clamp(20px, 3.4vw, 56px)</p>
          </div>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Nav Height</p>
            <p className="mono text-sm">84px</p>
          </div>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Max Width</p>
            <p className="mono text-sm">1360px</p>
          </div>
        </Grid>
      </Section>

      <Section title="Motion">
        <Grid cols={3}>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Ease</p>
            <p className="mono text-xs">cubic-bezier(.22,.61,.36,1)</p>
          </div>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Ease Out</p>
            <p className="mono text-xs">cubic-bezier(.16,1,.3,1)</p>
          </div>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Ease IO</p>
            <p className="mono text-xs">cubic-bezier(.65,0,.35,1)</p>
          </div>
        </Grid>
      </Section>
    </>
  );
}

// ─── Typography Section ────────────────────────────────────────────────────────
function TypographySection() {
  return (
    <>
      <Section title="Display Headings" subtitle="Uppercase, line-height 1.055, letter-spacing -.012em, weight 400.">
        <div className="space-y-6">
          <p className="display display-xl">Hostel Management</p>
          <p className="display display-lg">Complaint System</p>
          <p className="display display-md">Cinematic Night</p>
          <p className="display display-sm">Watchful · Calm · Accountable</p>
        </div>
      </Section>

      <Section title="Eyebrows" subtitle="10px, weight 500, tracking .22em, uppercase.">
        <div className="space-y-4">
          <p className="eyebrow">Default Eyebrow</p>
          <p className="eyebrow eyebrow-ember">Ember Eyebrow</p>
        </div>
      </Section>

      <Section title="Body Text">
        <div className="space-y-4 max-w-2xl">
          <p className="body">
            Body text (15px, line-height 1.6). The hostel at night is watchful and calm.
            Warm lit windows are the only bright things — each one a student's voice.
          </p>
          <p className="body-sm">
            Small body (13px). Used for secondary information and metadata.
          </p>
          <p className="body-xs">
            Extra small (11px). Used for captions and fine print.
          </p>
        </div>
      </Section>

      <Section title="Devanagari" subtitle="Noto Sans Devanagari — horizontal only, never vertical.">
        <div className="space-y-4">
          <p className="text-2xl devanagari" lang="hi">होस्टल शिकायत प्रणाली</p>
          <p className="text-lg devanagari" lang="hi">रात की निगरानी</p>
          <p className="text-sm devanagari" lang="hi">शांत · जिम्मेदार · पारदर्शी</p>
        </div>
      </Section>

      <Section title="Numerals" subtitle="Tabular figures for aligned numbers.">
        <div className="grid grid-cols-3 gap-4 max-w-md">
          <div className="p-4 rounded-lg border border-line text-center">
            <p className="text-3xl font-light tabular">072</p>
            <p className="eyebrow mt-2">Hours</p>
          </div>
          <div className="p-4 rounded-lg border border-line text-center">
            <p className="text-3xl font-light tabular">024</p>
            <p className="eyebrow mt-2">Hours</p>
          </div>
          <div className="p-4 rounded-lg border border-line text-center">
            <p className="text-3xl font-light tabular">010</p>
            <p className="eyebrow mt-2">Upvotes</p>
          </div>
        </div>
      </Section>
    </>
  );
}

// ─── Buttons Section ───────────────────────────────────────────────────────────
function ButtonsSection({ modalOpen, setModalOpen, drawerOpen, setDrawerOpen }: any) {
  return (
    <>
      <Section title="Button" subtitle="Primary ember pill with slide-up fill on hover.">
        <SubSection title="Variants">
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="text" iconRight={<ArrowRight className="w-4 h-4" />}>Text with Arrow</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="secondary">Secondary</Button>
          </div>
        </SubSection>
        <SubSection title="Sizes">
          <div className="flex flex-wrap gap-4 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </SubSection>
        <SubSection title="States">
          <div className="flex flex-wrap gap-4 items-center">
            <Button>Default</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button icon={<ArrowRight className="w-4 h-4" />}>With Icon</Button>
          </div>
        </SubSection>
      </Section>

      <Section title="NavLink" subtitle="Two-line rolling hover reveals Hindi word.">
        <div className="flex gap-8 p-6 rounded-xl border border-line">
          <NavLink href="#" hindi="शिकायत">Complaints</NavLink>
          <NavLink href="#" hindi="सहायता">Support</NavLink>
          <NavLink href="#" hindi="समाधान" active>Resolve</NavLink>
        </div>
      </Section>
    </>
  );
}

// ─── Inputs Section ────────────────────────────────────────────────────────────
function InputsSection({ inputVal, setInputVal, selectVal, setSelectVal, toggleOn, setToggleOn, files, setFiles }: any) {
  return (
    <>
      <Section title="Input" subtitle="Hairline borders with ember focus line.">
        <Grid cols={2}>
          <Input label="Default" placeholder="Enter text..." value={inputVal} onChange={e => setInputVal(e.target.value)} />
          <Input label="With Error" placeholder="Invalid input" error="This field is required" />
          <Input label="With Hint" placeholder="Enter email" hint="We'll never share your email" />
          <Input label="Disabled" placeholder="Cannot edit" disabled />
        </Grid>
      </Section>

      <Section title="Textarea" subtitle="With character counter.">
        <Grid cols={2}>
          <Textarea label="Description" placeholder="Describe the issue..." value="" onChange={() => {}} />
          <Textarea label="With Counter" placeholder="Max 500 chars" showCount maxLength={500} value="" onChange={() => {}} />
        </Grid>
      </Section>

      <Section title="Select">
        <Grid cols={2}>
          <Select
            label="Category"
            value={selectVal}
            onChange={setSelectVal}
            options={[
              { value: "plumbing", label: "Plumbing" },
              { value: "electrical", label: "Electrical" },
              { value: "cleanliness", label: "Cleanliness" },
            ]}
          />
          <Select label="With Error" value="" onChange={() => {}} options={[]} error="Please select a category" />
        </Grid>
      </Section>

      <Section title="Toggle">
        <div className="space-y-4">
          <Toggle checked={toggleOn} onChange={setToggleOn} label="Email notifications" />
          <Toggle checked={true} onChange={() => {}} label="Always on (disabled)" />
        </div>
      </Section>

      <Section title="FileDropzone">
        <FileDropzone files={files} onFilesChange={setFiles} maxFiles={4} />
      </Section>
    </>
  );
}

// ─── Feedback Section ──────────────────────────────────────────────────────────
function FeedbackSection() {
  return (
    <>
      <Section title="Toast">
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => showToast("success", "Complaint submitted successfully!")}>Success Toast</Button>
          <Button onClick={() => showToast("error", "Failed to upload file")} variant="ghost">Error Toast</Button>
          <Button onClick={() => showToast("info", "Your complaint has been acknowledged")} variant="text">Info Toast</Button>
        </div>
      </Section>

      <Section title="Tooltip">
        <div className="flex gap-4">
          <Tooltip content="This is a tooltip">
            <Button>Hover me</Button>
          </Tooltip>
          <Tooltip content="More information here">
            <span className="text-bone-dim cursor-help border-b border-dashed border-bone-dim">Hover for info</span>
          </Tooltip>
        </div>
      </Section>
    </>
  );
}

// ─── Badges Section ────────────────────────────────────────────────────────────
function BadgesSection() {
  return (
    <>
      <Section title="Badge" subtitle="Color + icon + text, never color alone.">
        <SubSection title="Variants">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="ember">Ember</Badge>
            <Badge variant="emergency">Emergency</Badge>
            <Badge variant="resolved">Resolved</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
        </SubSection>
      </Section>

      <Section title="StatusBadge" subtitle="One per complaint status, always with icon + text.">
        <div className="flex flex-wrap gap-3">
          {Object.values(ComplaintStatus).map(status => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="PriorityBadge">
        <div className="flex flex-wrap gap-3">
          <PriorityBadge priority={Priority.NORMAL} />
          <PriorityBadge priority={Priority.EMERGENCY} />
        </div>
      </Section>
    </>
  );
}

// ─── Data Display Section ──────────────────────────────────────────────────────
function DataSection({ rating, setRating, page, setPage }: any) {
  return (
    <>
      <Section title="Card">
        <Grid cols={2}>
          <Card>
            <h3 className="text-lg font-medium text-bone mb-2">Default Card</h3>
            <p className="body-sm">Content goes here with default padding.</p>
          </Card>
          <Card hover>
            <h3 className="text-lg font-medium text-bone mb-2">Hoverable Card</h3>
            <p className="body-sm">Hover to see the ember border glow.</p>
          </Card>
        </Grid>
      </Section>

      <Section title="Tabs">
        <Tabs
          tabs={[
            { key: "feed", label: "Feed", count: 24 },
            { key: "mine", label: "My Complaints", count: 3 },
            { key: "resolved", label: "Resolved", count: 12 },
          ]}
          activeTab="feed"
          onChange={() => {}}
        />
      </Section>

      <Section title="StarRating" subtitle="1 to 3 stars.">
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-2">Interactive</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="eyebrow mb-2">Readonly</p>
            <StarRating value={3} readonly />
          </div>
          <div>
            <p className="eyebrow mb-2">Sizes</p>
            <div className="flex gap-6">
              <StarRating value={2} readonly size="sm" />
              <StarRating value={2} readonly size="md" />
              <StarRating value={2} readonly size="lg" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Countdown" subtitle="Live countdown with overdue state.">
        <Grid cols={3}>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Time Remaining</p>
            <Countdown deadlineAt={new Date(Date.now() + 3600000 * 5).toISOString()} />
          </div>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Compact</p>
            <Countdown deadlineAt={new Date(Date.now() + 3600000 * 2).toISOString()} compact />
          </div>
          <div className="p-4 rounded-lg border border-line">
            <p className="eyebrow mb-2">Overdue</p>
            <Countdown deadlineAt={new Date(Date.now() - 3600000).toISOString()} />
          </div>
        </Grid>
      </Section>

      <Section title="Row" subtitle="Numbered list row with ember underline on hover.">
        <div className="space-y-2">
          <Row number={1} title="Leaking tap in Room 204" description="Bathroom tap dripping continuously for 2 days" meta={<StatusBadge status={ComplaintStatus.IN_PROGRESS} />} />
          <Row number={2} title="Broken ceiling fan" description="Fan makes loud noise and oscillates violently" meta={<PriorityBadge priority={Priority.EMERGENCY} />} />
          <Row number={3} title="WiFi not working" description="Internet connectivity down for entire floor" meta={<Countdown deadlineAt={new Date(Date.now() + 3600000 * 8).toISOString()} compact />} />
        </div>
      </Section>

      <Section title="ChapterChip">
        <div className="flex flex-wrap gap-3">
          <ChapterChip>Chapter 01</ChapterChip>
          <ChapterChip>Normal Priority</ChapterChip>
          <ChapterChip>72 Hours</ChapterChip>
        </div>
      </Section>

      <Section title="StatBlock">
        <Grid cols={4}>
          <StatBlock label="Active" value={24} />
          <StatBlock label="Emergency" value={7} subtitle="This week" />
          <StatBlock label="Resolved" value={156} subtitle="All time" />
          <StatBlock label="Avg Rating" value="2.4" subtitle="out of 3" />
        </Grid>
      </Section>

      <Section title="Pagination">
        <Pagination current={page} total={10} onChange={setPage} />
      </Section>
    </>
  );
}

// ─── Overlays Section ──────────────────────────────────────────────────────────
function OverlaysSection({ modalOpen, setModalOpen, drawerOpen, setDrawerOpen }: any) {
  return (
    <>
      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Action">
          <p className="body mb-6">Are you sure you want to proceed? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </Section>

      <Section title="Drawer">
        <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Complaint Details">
          <div className="space-y-4">
            <p className="body">This is a drawer with complaint details.</p>
            <p className="body-sm">It slides in from the right on desktop and full-screen on mobile.</p>
          </div>
        </Drawer>
      </Section>
    </>
  );
}

// ─── Layout Section ────────────────────────────────────────────────────────────
function LayoutSection() {
  return (
    <>
      <Section title="SideRail" subtitle="Dot navigation for sections (visible on large screens).">
        <div className="relative h-96 border border-line rounded-xl p-6">
          <p className="body-sm text-bone-dim">SideRail dots appear fixed on the right side of the viewport on large screens.</p>
          <SideRail sections={["intro", "features", "pricing", "contact"]} activeSection="features" />
        </div>
      </Section>

      <Section title="Atmosphere" subtitle="Film grain + vignette + scrim layers (always on).">
        <Card>
          <p className="body-sm text-bone-dim">
            The atmosphere is always present in the background: a film grain overlay (5.5% opacity, overlay blend),
            a soft radial vignette, and a faint scrim behind text for readability.
          </p>
        </Card>
      </Section>
    </>
  );
}

// ─── States Section ────────────────────────────────────────────────────────────
function StatesSection() {
  return (
    <>
      <Section title="Skeleton" subtitle="Loading states.">
        <Grid cols={2}>
          <Card>
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </Card>
          <Card>
            <div className="flex gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </Card>
        </Grid>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No complaints found"
          description="Try adjusting your filters or search query."
        />
      </Section>

      <Section title="Focus States" subtitle="All interactive elements have visible focus rings.">
        <div className="flex flex-wrap gap-4">
          <Button>Tab to me</Button>
          <Input placeholder="Tab to me" />
          <Select value="" onChange={() => {}} options={[{ value: "a", label: "Option A" }]} />
          <Toggle checked={false} onChange={() => {}} label="Tab to me" />
        </div>
        <p className="body-xs mt-4">
          Press Tab to navigate. Focus ring: 2px solid ember, offset 3px.
        </p>
      </Section>

      <Section title="Accessibility Notes">
        <Card>
          <div className="space-y-3 body-sm">
            <p>✓ All text meets WCAG AA contrast (4.5:1 minimum)</p>
            <p>✓ Status/priority badges use color + icon + text</p>
            <p>✓ 44px minimum touch targets</p>
            <p>✓ Keyboard navigation for all interactive elements</p>
            <p>✓ Screen reader support with ARIA labels</p>
            <p>✓ Respects prefers-reduced-motion</p>
            <p>✓ Devanagari text is horizontal only (never vertical)</p>
            <p>✓ 3D canvas (when added) will be aria-hidden</p>
          </div>
        </Card>
      </Section>
    </>
  );
}
