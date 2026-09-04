"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleDot,
  CircleHelp,
  Info,
  LockKeyhole,
  Play,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TestTube2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  bugs,
  edges,
  nodeSettings,
  nodes,
  remediationPaths,
  type Bug,
  type NetworkNode,
  type NodeSetting,
} from "./network-data";
import {
  PixelComputer,
  PixelDatabase,
  PixelGlobe,
  PixelLaptop,
  PixelServer,
  PixelShield,
  PixelSwitch,
  PixelTerminal,
  PixelWifi,
  type PixelIconProps,
} from "./pixel-icons";

type TestReport = {
  clean: boolean;
  unresolved: string[];
  run: number;
};

type PentestStage = {
  phase: string;
  name: string;
  tool: string;
  command: string;
  output: string;
  purpose: string;
  affected: string[];
};

type TimelineTone = "pending" | "running" | "observed" | "clear" | "finding";

const pentestStages: PentestStage[] = [
  {
    phase: "01",
    name: "Scope & rules of engagement",
    tool: "PENTEST-BOX",
    command: "scope --case northstar-01",
    output: "Authorised target, source address and test window confirmed.",
    purpose: "Confirm the tester is inside the approved, non-destructive scope.",
    affected: [],
  },
  {
    phase: "02",
    name: "Asset discovery",
    tool: "dig / host",
    command: "dig northstar.example A +short",
    output: "203.0.113.10 → edge firewall; published service identified.",
    purpose: "Resolve the public name and identify the first reachable asset.",
    affected: [],
  },
  {
    phase: "03",
    name: "Port & service enumeration",
    tool: "nmap",
    command: "nmap -sV -Pn 203.0.113.10",
    output: "443/tcp HTTPS · 22/tcp SSH · 80/tcp HTTP response observed.",
    purpose: "Enumerate reachable listeners before asking what each service exposes.",
    affected: ["fw-ssh", "web-tls"],
  },
  {
    phase: "04",
    name: "Transport & TLS checks",
    tool: "openssl / curl",
    command: "openssl s_client · curl -I",
    output: "Certificate, redirects and security headers compared with the baseline.",
    purpose: "Check whether the web path protects credentials and sessions in transit.",
    affected: ["web-tls"],
  },
  {
    phase: "05",
    name: "Web surface mapping",
    tool: "HTTP probe",
    command: "GET / · safe path checks",
    output: "Portal and administration paths catalogued without destructive payloads.",
    purpose: "Map the application surface and validate the observations from the port scan.",
    affected: ["web-tls"],
  },
  {
    phase: "06",
    name: "Boundary validation",
    tool: "nmap / policy probes",
    command: "controlled source-and-port tests",
    output: "Firewall, VLAN and lateral reachability rules tested from authorised positions.",
    purpose: "Test whether network boundaries actually stop an untrusted source.",
    affected: ["fw-ssh", "db-acl", "wifi-guest", "switch-ports", "fileshare", "admin-rdp"],
  },
  {
    phase: "07",
    name: "Availability & endpoint checks",
    tool: "mtr / link counters / agent",
    command: "mtr --report · show interfaces · baseline query",
    output: "Uplink loss, link errors and endpoint patch posture compared with the baseline.",
    purpose: "Security controls are not enough if a physical fault or stale endpoint breaks the service.",
    affected: ["uplink-cable", "pc-patch"],
  },
  {
    phase: "08",
    name: "Retest & report",
    tool: "diff / evidence log",
    command: "compare before → after",
    output: "Open paths are recorded for the defender; fixes are not assumed effective.",
    purpose: "Turn the observations into findings and verify the current configuration.",
    affected: bugs.map((bug) => bug.id),
  },
];

const deviceIcons: Record<NetworkNode["icon"], ComponentType<PixelIconProps>> = {
  globe: PixelGlobe,
  shield: PixelShield,
  server: PixelServer,
  switch: PixelSwitch,
  database: PixelDatabase,
  computer: PixelComputer,
  laptop: PixelLaptop,
  wifi: PixelWifi,
  terminal: PixelTerminal,
};

const nodeMap = new Map(nodes.map((node) => [node.id, node]));
const settingMap = new Map<string, NodeSetting>(
  Object.values(nodeSettings).flat().map((setting) => [setting.id, setting]),
);

function severityLabel(severity: Bug["severity"]) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function bugsForNode(nodeId: string) {
  return bugs.filter((bug) => bug.deviceId === nodeId);
}

function valueForSetting(settingId: string, overrides: Record<string, string>) {
  return overrides[settingId] ?? settingMap.get(settingId)?.value ?? "";
}

function bugIsRemediated(bug: Bug, overrides: Record<string, string>) {
  const paths = remediationPaths[bug.id] ?? [];
  return paths.some((path) => path.every((requirement) => valueForSetting(requirement.settingId, overrides) === requirement.value));
}

function settingIsRelevant(settingId: string) {
  return bugs.some((bug) => (remediationPaths[bug.id] ?? []).some((path) => path.some((requirement) => requirement.settingId === settingId)));
}

function timelineTone(stage: PentestStage, index: number, activeStep: number, report: TestReport | null): TimelineTone {
  if (report) {
    if (!stage.affected.length) return "observed";
    return stage.affected.some((bugId) => report.unresolved.includes(bugId)) ? "finding" : "clear";
  }
  if (index === activeStep - 1) return "running";
  if (index < activeStep) return stage.affected.length ? "clear" : "observed";
  return "pending";
}

function timelineToneLabel(tone: TimelineTone) {
  if (tone === "finding") return "FINDING";
  if (tone === "clear") return "CLEAR";
  if (tone === "running") return "RUNNING";
  if (tone === "observed") return "OBSERVED";
  return "QUEUED";
}

function stageFindings(stage: PentestStage, report: TestReport | null) {
  if (!report) return [];
  return bugs.filter((bug) => stage.affected.includes(bug.id) && report.unresolved.includes(bug.id));
}

function stageForBug(bugId: string) {
  return pentestStages.findIndex((stage) => stage.affected.includes(bugId));
}

export default function Home() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeModalTab, setNodeModalTab] = useState<"overview" | "settings">("overview");
  const [selectedStageIndex, setSelectedStageIndex] = useState<number | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [settingOverrides, setSettingOverrides] = useState<Record<string, string>>({});
  const [report, setReport] = useState<TestReport | null>(null);
  const [testing, setTesting] = useState(false);
  const [testRuns, setTestRuns] = useState(0);
  const [hardMode, setHardMode] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [configurationChanged, setConfigurationChanged] = useState(false);
  const timerRef = useRef<number[]>([]);

  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const selectedFinding = selectedFindingId ? bugs.find((bug) => bug.id === selectedFindingId) ?? null : null;
  const verifiedCount = report ? bugs.length - report.unresolved.length : 0;
  const progress = Math.round((verifiedCount / bugs.length) * 100);

  const currentResolvedIds = useMemo(
    () => bugs.filter((bug) => bugIsRemediated(bug, settingOverrides)).map((bug) => bug.id),
    [settingOverrides],
  );

  useEffect(() => () => {
    timerRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!selectedNodeId) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedNodeId(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedNodeId]);

  function clearTimers() {
    timerRef.current.forEach((timer) => window.clearTimeout(timer));
    timerRef.current = [];
  }

  function openNode(nodeId: string, tab: "overview" | "settings" = "overview") {
    setSelectedNodeId(nodeId);
    setNodeModalTab(tab);
  }

  function selectStage(index: number) {
    const stage = pentestStages[index];
    const findings = stageFindings(stage, report);
    setSelectedStageIndex(index);
    setSelectedFindingId(findings[0]?.id ?? null);
  }

  function openFinding(bugId: string) {
    const index = stageForBug(bugId);
    setSelectedStageIndex(index >= 0 ? index : null);
    setSelectedFindingId(bugId);
    setSelectedNodeId(null);
  }

  function updateSetting(settingId: string, value: string) {
    setSettingOverrides((current) => ({ ...current, [settingId]: value }));
    setConfigurationChanged(true);
  }

  function testSystem() {
    if (testing) return;
    clearTimers();
    setTesting(true);
    setReport(null);
    setSelectedStageIndex(null);
    setSelectedFindingId(null);
    setScanStep(0);
    setConfigurationChanged(false);

    const nextRun = testRuns + 1;
    pentestStages.forEach((_, index) => {
      timerRef.current.push(window.setTimeout(() => setScanStep(index + 1), index * 620));
    });
    timerRef.current.push(window.setTimeout(() => {
      const unresolved = bugs
        .filter((bug) => !bugIsRemediated(bug, settingOverrides))
        .map((bug) => bug.id);
      setReport({ clean: unresolved.length === 0, unresolved, run: nextRun });
      setTestRuns(nextRun);
      setTesting(false);
      setScanStep(pentestStages.length);
      const firstFinding = unresolved[0];
      if (firstFinding) {
        const firstStage = stageForBug(firstFinding);
        setSelectedStageIndex(firstStage >= 0 ? firstStage : null);
        setSelectedFindingId(firstFinding);
      }
    }, pentestStages.length * 620 + 350));
  }

  function resetLab() {
    clearTimers();
    setSelectedNodeId(null);
    setNodeModalTab("overview");
    setSelectedStageIndex(null);
    setSelectedFindingId(null);
    setSettingOverrides({});
    setReport(null);
    setTesting(false);
    setTestRuns(0);
    setScanStep(0);
    setConfigurationChanged(false);
  }

  return (
    <main className={["lab-shell", hardMode ? "hard-mode" : ""].join(" ")}>
      <header className="lab-header">
        <div className="brand-lockup">
          <div className="pixel-brand-mark"><PixelSwitch /></div>
          <div>
            <p className="brand-eyebrow">LEARN / NETWORKS</p>
            <h1>Network repair lab</h1>
          </div>
        </div>
        <div className="header-center">
          <span className="case-label">CASE 01</span>
          <span className="case-title">Northstar Logistics · pre-launch review</span>
          <span className="case-hint">MAP → SETTINGS → PENTEST</span>
        </div>
        <div className="header-actions">
          <div className="header-test-cluster">
            <div className="header-test-row">
              <div className="control-progress">
                <div><span>Controls verified</span><strong>{verifiedCount} / {bugs.length}</strong></div>
                <Progress value={progress} aria-label={verifiedCount + " of " + bugs.length + " controls verified"} />
              </div>
              <Button className="test-button" onClick={testSystem} disabled={testing}>
                {testing ? <ScanLine className="spin-icon" /> : <TestTube2 />}
                {testing ? "Pentester running…" : report ? "Run test again" : "Test the system"}
              </Button>
            </div>
            {testing && (
              <div className="top-scan-status" aria-live="polite">
                <span>{pentestStages[Math.max(0, scanStep - 1)]?.tool ?? "PENTEST-BOX"}</span>
                <strong>{pentestStages[Math.max(0, scanStep - 1)]?.name ?? "Starting authorised scan…"}</strong>
              </div>
            )}
          </div>
          <span className="authorized-chip"><LockKeyhole /> authorised simulation</span>
          <button className={["difficulty-toggle", hardMode ? "active" : ""].join(" ")} onClick={() => setHardMode((value) => !value)} aria-pressed={hardMode} disabled={testing}>
            {hardMode ? "Hard mode" : "Easy mode"}
          </button>
          <Button className="light-button" variant="ghost" size="sm" onClick={resetLab}><RotateCcw /> Reset</Button>
        </div>
      </header>

      <div className="lab-grid map-first-grid">
        <section className="network-panel" aria-labelledby="network-heading">
          <div className="network-panel-heading">
            <div><p className="section-eyebrow">ARCHITECTURE MAP</p><h2 id="network-heading">Northstar network</h2></div>
            <div className="network-heading-meta">
              {report ? (
                <>
                  <span><i className="map-dot open" /> {report.unresolved.length} finding{report.unresolved.length === 1 ? "" : "s"} open</span>
                  <span><i className="map-dot fixed" /> {verifiedCount} verified</span>
                </>
              ) : (
                <span className="map-mode-hint">{testing ? "LIVE PENTEST · FINDINGS STILL HIDDEN" : "FINDINGS HIDDEN · CLICK A NODE TO INSPECT"}</span>
              )}
            </div>
          </div>
          <div className="network-scroll">
            <div className="network-board">
              <div className="board-zone zone-outside"><span>OUTSIDE</span><small>authorised source</small></div>
              <div className="board-zone zone-edge"><span>EDGE</span><small>trust boundary</small></div>
              <div className="board-zone zone-dmz"><span>DMZ</span><small>published service</small></div>
              <div className="board-zone zone-inside"><span>INSIDE</span><small>trusted segments</small></div>
              <svg className="network-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {edges.map((edge) => {
                  const from = nodeMap.get(edge.from)!;
                  const to = nodeMap.get(edge.to)!;
                  const active = selectedFinding && (selectedFinding.deviceId === edge.from || selectedFinding.deviceId === edge.to);
                  return <line key={edge.from + "-" + edge.to} x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y} className={active ? "is-active" : ""} vectorEffect="non-scaling-stroke" />;
                })}
              </svg>
              {edges.map((edge) => {
                const from = nodeMap.get(edge.from)!;
                const to = nodeMap.get(edge.to)!;
                return <span key={"edge-label-" + edge.from + "-" + edge.to} className="wire-label" style={{ left: ((from.position.x + to.position.x) / 2) + "%", top: ((from.position.y + to.position.y) / 2) + "%" }}>{edge.label}</span>;
              })}
              {nodes.map((node) => {
                const Icon = deviceIcons[node.icon];
                const nodeBugs = bugsForNode(node.id);
                const unresolved = nodeBugs.filter((bug) => report?.unresolved.includes(bug.id));
                const prepared = nodeBugs.some((bug) => currentResolvedIds.includes(bug.id)) && unresolved.length > 0;
                const fixed = Boolean(report) && nodeBugs.length > 0 && unresolved.length === 0;
                const isSelected = node.id === selectedNodeId;
                const status = unresolved.length ? "open" : fixed ? "fixed" : "";
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={["network-node", node.zone, isSelected ? "is-selected" : "", fixed ? "is-fixed" : "", prepared ? "is-prepared" : ""].filter(Boolean).join(" ")}
                    style={{ left: node.position.x + "%", top: node.position.y + "%" }}
                    onClick={() => openNode(node.id)}
                    aria-label={"Inspect " + node.name}
                  >
                    <span className="node-sprite"><Icon /></span>
                    <span className="node-copy"><strong>{node.name}</strong><small>{node.role}</small></span>
                    {status && <span className={["node-status", status].join(" ")}>{status === "fixed" ? <Check /> : <AlertTriangle />}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="network-caption">
            <span><CircleDot /> {report ? "Click a red test step for evidence, or open any node to change its settings." : "Click any node to inspect it. The first pentest reveals which settings become attack paths."}</span>
            <span className="sprite-credit">Pixel device glyphs · MIT / pixelarticons</span>
          </div>
        </section>

        <aside className="repair-panel console-panel" aria-labelledby="console-heading">
          <PentestConsole
            testing={testing}
            scanStep={scanStep}
            report={report}
            configurationChanged={configurationChanged}
            selectedStageIndex={selectedStageIndex}
            selectedFindingId={selectedFindingId}
            onRun={testSystem}
            onSelectStage={selectStage}
            onSelectFinding={openFinding}
          />
        </aside>
      </div>

      {selectedNode && (
        <NodeModal
          node={selectedNode}
          tab={nodeModalTab}
          onTabChange={setNodeModalTab}
          onClose={() => setSelectedNodeId(null)}
          report={report}
          testing={testing}
          configurationChanged={configurationChanged}
          hardMode={hardMode}
          overrides={settingOverrides}
          onSettingChange={updateSetting}
          onOpenFinding={openFinding}
        />
      )}

      <footer className="lab-footer"><span><ShieldCheck /> Training environment · fictional systems only</span><span>Use only on owned or authorised systems · Northstar snapshot 2026-08-18</span></footer>
    </main>
  );
}

function PentestConsole({
  testing,
  scanStep,
  report,
  configurationChanged,
  selectedStageIndex,
  selectedFindingId,
  onRun,
  onSelectStage,
  onSelectFinding,
}: {
  testing: boolean;
  scanStep: number;
  report: TestReport | null;
  configurationChanged: boolean;
  selectedStageIndex: number | null;
  selectedFindingId: string | null;
  onRun: () => void;
  onSelectStage: (index: number) => void;
  onSelectFinding: (bugId: string) => void;
}) {
  const selectedStage = selectedStageIndex === null ? null : pentestStages[selectedStageIndex] ?? null;
  const selectedBug = selectedFindingId ? bugs.find((bug) => bug.id === selectedFindingId) ?? null : null;
  const selectedStageFindings = selectedStage ? stageFindings(selectedStage, report) : [];
  const liveStage = testing ? pentestStages[Math.max(0, scanStep - 1)] : null;

  return (
    <div className="pentest-console">
      <div className="console-heading">
        <div className="console-heading-icon"><ScanLine /></div>
        <div><p className="section-eyebrow">PENTEST CONSOLE</p><h2 id="console-heading">Mock test findings</h2></div>
        {report && <span className={["console-report-badge", report.clean ? "clean" : "open"].join(" ")}>{report.clean ? <><Check /> CLEAN</> : <><AlertTriangle /> {report.unresolved.length} OPEN</>}</span>}
      </div>

      {configurationChanged && report && (
        <div className="console-stale" role="status"><Settings2 /><span>Settings changed since Run {report.run}. Run the test again to verify the new path.</span></div>
      )}

      {testing && liveStage && (
        <div className="live-console-card" aria-live="polite">
          <div className="live-console-top"><span className="card-label">NOW RUNNING</span><span>{liveStage.tool}</span></div>
          <strong>{liveStage.name}</strong>
          <code>{liveStage.command}</code>
          <small>{liveStage.output}</small>
        </div>
      )}

      {!testing && !report && (
        <div className="console-empty">
          <div className="console-empty-icon"><PixelShield /><span><Search /></span></div>
          <p className="section-eyebrow">READY TO TEST</p>
          <h3>Let the tester trace the path</h3>
          <p>Run the authorised sequence to discover exposed listeners, weak boundaries, stale endpoint state, and the physical link that affects availability.</p>
          <Button variant="outline" onClick={onRun}><Play /> Run first pentest</Button>
          <div className="console-sequence">
            <span><strong>8</strong><small>test stages</small></span>
            <span><strong>{bugs.length}</strong><small>modeled findings</small></span>
            <span><strong>0</strong><small>revealed yet</small></span>
          </div>
        </div>
      )}

      {(testing || report) && (
        <PentestTimeline
          activeStep={testing ? scanStep : pentestStages.length}
          testing={testing}
          report={report}
          selectedStageIndex={selectedStageIndex}
          onSelectStage={onSelectStage}
        />
      )}

      {report && selectedStage && (
        <StageEvidence
          stage={selectedStage}
          report={report}
          selectedBug={selectedBug}
          selectedStageFindings={selectedStageFindings}
          onSelectFinding={onSelectFinding}
        />
      )}

      {report && !selectedStage && (
        <div className="console-prompt"><Info /><span>Select a red <strong>FINDING</strong> step above to see the exact command, evidence, and affected asset.</span></div>
      )}

      {report && (
        <div className={["console-summary", report.clean ? "clean" : "open"].join(" ")}>
          {report.clean ? <Check /> : <AlertTriangle />}
          <div><strong>{report.clean ? "No modeled path reproduced." : report.unresolved.length + " modeled path" + (report.unresolved.length === 1 ? "" : "s") + " still open."}</strong><p>{report.clean ? "The current settings survived the complete authorised sequence." : "Open each red step, locate its asset, and change the relevant setting before retesting."}</p></div>
        </div>
      )}
    </div>
  );
}

function PentestTimeline({
  activeStep,
  testing,
  report,
  selectedStageIndex,
  onSelectStage,
}: {
  activeStep: number;
  testing: boolean;
  report: TestReport | null;
  selectedStageIndex: number | null;
  onSelectStage: (index: number) => void;
}) {
  return (
    <div className="pentest-timeline console-timeline" aria-label="Pentest execution chain">
      <div className="timeline-heading"><div><span className="section-eyebrow">TEST CHAIN</span><h3>{report ? "Run " + report.run + " · evidence summary" : "Pentester execution chain"}</h3></div><span className="timeline-count">{testing ? Math.min(activeStep, pentestStages.length) : pentestStages.length} / {pentestStages.length}</span></div>
      <div className="timeline-list">
        {pentestStages.map((stage, index) => {
          const tone = timelineTone(stage, index, activeStep, report);
          const running = testing && tone === "running";
          const findings = stageFindings(stage, report);
          const actionable = Boolean(report && index < activeStep && (stage.affected.length || findings.length));
          const rowClass = ["timeline-row", tone === "finding" ? "is-clickable" : "", selectedStageIndex === index ? "is-selected" : "", "tone-" + tone].filter(Boolean).join(" ");
          const content = (
            <>
              <span className="timeline-marker">{tone === "clear" ? <Check /> : tone === "finding" ? <AlertTriangle /> : running ? <ScanLine className="spin-icon" /> : tone === "observed" ? <Search /> : stage.phase}</span>
              <div className="timeline-copy">
                <div className="timeline-top"><strong>{stage.name}</strong><span>{stage.tool}</span></div>
                <div className="timeline-result">{timelineToneLabel(tone)}</div>
                <code>{stage.command}</code>
                <small>{report ? stage.output : running ? "Collecting evidence… " + stage.output : stage.output}</small>
              </div>
              {actionable && <ChevronRight className="timeline-chevron" />}
            </>
          );
          return actionable
            ? <button type="button" className={rowClass} key={stage.phase} onClick={() => onSelectStage(index)} aria-label={"Open findings from " + stage.name}>{content}</button>
            : <div className={rowClass} key={stage.phase}>{content}</div>;
        })}
      </div>
      <p className="timeline-note">A mock, non-destructive sequence for this fictional authorised environment. Tool names show the tester’s reasoning; no real network is scanned.</p>
    </div>
  );
}

function StageEvidence({
  stage,
  report,
  selectedBug,
  selectedStageFindings,
  onSelectFinding,
}: {
  stage: PentestStage;
  report: TestReport;
  selectedBug: Bug | null;
  selectedStageFindings: Bug[];
  onSelectFinding: (bugId: string) => void;
}) {
  const bugBelongsToStage = selectedBug ? stage.affected.includes(selectedBug.id) : false;
  const detailBug = selectedBug && bugBelongsToStage && report.unresolved.includes(selectedBug.id) ? selectedBug : null;
  const asset = detailBug ? nodeMap.get(detailBug.deviceId) : null;

  return (
    <div className="stage-evidence">
      <div className="stage-evidence-heading"><span className="section-eyebrow">STEP DETAILS</span><span>{stage.tool}</span></div>
      <div className="stage-evidence-command"><code>{stage.command}</code><p>{stage.purpose}</p></div>
      {selectedStageFindings.length > 0 ? (
        <>
          <div className="finding-list-heading"><strong>Findings from this step</strong><span>{selectedStageFindings.length}</span></div>
          <div className="console-finding-list">
            {selectedStageFindings.map((bug) => {
              const node = nodeMap.get(bug.deviceId);
              return <button type="button" key={bug.id} className={["console-finding-row", detailBug?.id === bug.id ? "is-selected" : ""].filter(Boolean).join(" ")} onClick={() => onSelectFinding(bug.id)}>
                <span className={"console-finding-dot " + bug.severity} />
                <span><strong>{bug.title}</strong><small>{node?.name} · {bug.category === "availability" ? "Availability" : severityLabel(bug.severity)}</small></span>
                <ChevronRight />
              </button>;
            })}
          </div>
          {detailBug && asset ? (
            <div className="finding-detail-card">
              <div className="finding-detail-top"><span className={["severity-pill", detailBug.severity].join(" ")}>{detailBug.category === "availability" ? "AVAILABILITY" : severityLabel(detailBug.severity)}</span><span>{asset.name}</span></div>
              <h3>{detailBug.reportFinding}</h3>
              <div className="finding-detail-grid">
                <div><span className="card-label">TESTED</span><strong>{stage.tool}</strong><small>{stage.name}</small></div>
                <div><span className="card-label">FOUND</span><strong>{detailBug.evidence}</strong><small>{detailBug.summary}</small></div>
              </div>
              <div className="finding-risk"><span className="card-label">WHY IT MATTERS</span><p>{detailBug.risk}</p></div>
              <div className="finding-detail-actions"><span><strong>Affected asset: {asset.name}.</strong> Find it on the architecture map, open the node, then use its Settings tab.</span><em>{detailBug.reportHint}</em></div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="stage-clear-card"><Check /><div><strong>{stage.name} came back clear.</strong><p>{stage.output}</p></div></div>
      )}
    </div>
  );
}

function NodeModal({
  node,
  tab,
  onTabChange,
  onClose,
  report,
  testing,
  configurationChanged,
  hardMode,
  overrides,
  onSettingChange,
  onOpenFinding,
}: {
  node: NetworkNode;
  tab: "overview" | "settings";
  onTabChange: (tab: "overview" | "settings") => void;
  onClose: () => void;
  report: TestReport | null;
  testing: boolean;
  configurationChanged: boolean;
  hardMode: boolean;
  overrides: Record<string, string>;
  onSettingChange: (settingId: string, value: string) => void;
  onOpenFinding: (bugId: string) => void;
}) {
  const Icon = deviceIcons[node.icon];
  const zoneLabel = node.zone === "outside" ? "OUTSIDE" : node.zone === "perimeter" ? "PERIMETER" : node.zone === "dmz" ? "DMZ" : "INTERNAL";
  const attachedBugs = bugsForNode(node.id);
  const unresolved = attachedBugs.filter((bug) => report?.unresolved.includes(bug.id));
  const nodeStatus = report && attachedBugs.length ? unresolved.length ? "OPEN FINDING" : "VERIFIED CLEAN" : "REFERENCE NODE";

  return (
    <div className="node-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="node-modal" role="dialog" aria-modal="true" aria-labelledby="node-modal-title">
        <div className="node-modal-topline"><span className="section-eyebrow">ARCHITECTURE MAP / NODE INSPECTOR</span><button type="button" onClick={onClose} aria-label="Close node window"><X /></button></div>
        <div className="node-modal-title">
          <div className={["node-info-icon", node.zone].join(" ")}><Icon /></div>
          <div><span className={["severity-text", unresolved.length ? "critical" : "low"].join(" ")}>{nodeStatus}</span><h2 id="node-modal-title">{node.name}</h2><p>{node.role}</p></div>
          <span className="node-modal-ip">{node.ip} · {zoneLabel} ZONE</span>
        </div>
        <div className="node-modal-tabs" role="tablist" aria-label="Node information">
          <button type="button" role="tab" aria-selected={tab === "overview"} className={tab === "overview" ? "is-active" : ""} onClick={() => onTabChange("overview")}><Info /> Overview</button>
          <button type="button" role="tab" aria-selected={tab === "settings"} className={tab === "settings" ? "is-active" : ""} onClick={() => onTabChange("settings")}><SlidersHorizontal /> Settings <span>{(nodeSettings[node.id] ?? []).length}</span></button>
        </div>
        <div className="node-modal-body">
          {tab === "overview" ? (
            <NodeOverview node={node} report={report} testing={testing} configurationChanged={configurationChanged} attachedBugs={attachedBugs} unresolved={unresolved} onOpenSettings={() => onTabChange("settings")} onOpenFinding={onOpenFinding} />
          ) : (
            <NodeSettingsPanel node={node} report={report} testing={testing} configurationChanged={configurationChanged} hardMode={hardMode} overrides={overrides} onSettingChange={onSettingChange} />
          )}
        </div>
        <div className="node-modal-footer"><CircleHelp /><span>{hardMode ? "Hard mode hides the expected baseline. Use the evidence and retest result to reason about the safe value." : "Easy mode reveals the expected baseline after the first pentest. Changes are local to this simulation."}</span></div>
      </section>
    </div>
  );
}

function NodeOverview({
  node,
  report,
  testing,
  configurationChanged,
  attachedBugs,
  unresolved,
  onOpenSettings,
  onOpenFinding,
}: {
  node: NetworkNode;
  report: TestReport | null;
  testing: boolean;
  configurationChanged: boolean;
  attachedBugs: Bug[];
  unresolved: Bug[];
  onOpenSettings: () => void;
  onOpenFinding: (bugId: string) => void;
}) {
  const context = node.id === "internet"
    ? "The internet is the untrusted source network. The tester starts here, so perimeter controls must decide which requests can enter."
    : node.id === "pentest-box"
      ? "This is the authorised test console. It creates the source traffic and records controlled evidence; it is not an attack target."
      : node.id === "core-sw"
        ? "The core switch carries the trust boundaries between the perimeter, server VLANs, employee access ports, and wireless network."
        : node.role + " sits in the " + (node.zone === "dmz" ? "published-service" : node.zone) + " part of the path. Its settings and connections define what the tester can reach.";

  return (
    <div className="node-overview">
      <div className="node-context-card"><span className="card-label">WHY THIS ASSET MATTERS</span><p>{context}</p></div>
      <div className="node-overview-grid">
        <div><span className="card-label">ROLE</span><strong>{node.role}</strong><small>{node.zone === "outside" ? "Untrusted / authorised source" : "Part of the Northstar request path"}</small></div>
        <div><span className="card-label">ADDRESS</span><strong>{node.ip}</strong><small>{node.zone.toUpperCase()} zone</small></div>
        <div><span className="card-label">TEST STATE</span><strong>{testing ? "In progress" : report ? (unresolved.length ? "Finding open" : attachedBugs.length ? "Verified clean" : "Reference") : "Not tested"}</strong><small>{configurationChanged ? "Settings changed since last run" : report ? "Last run " + report.run : "Findings hidden"}</small></div>
      </div>
      {!report ? (
        <div className="node-pending-card"><Search /><div><strong>Findings are hidden until the first pentest.</strong><p>You can inspect every current value now. The tester will tell you which deviation is a real attack path.</p></div></div>
      ) : attachedBugs.length ? (
        <div className="node-findings-block">
          <div className="node-findings-heading"><span className="section-eyebrow">PENTEST OBSERVATIONS</span><span>{unresolved.length ? unresolved.length + " open" : "verified"}</span></div>
          {attachedBugs.map((bug) => {
            const stage = pentestStages.find((item) => item.affected.includes(bug.id));
            const isOpen = report.unresolved.includes(bug.id);
            return (
              <div className={["node-finding-card", isOpen ? "open" : "passed"].join(" ")} key={bug.id}>
                <span className={"console-finding-dot " + bug.severity} />
                <div><strong>{isOpen ? bug.reportFinding : "No exposure reproduced after the last change."}</strong><small>{stage?.tool ?? "evidence log"} · {stage?.name ?? "retest"} · {bug.evidence}</small></div>
                {isOpen && <button type="button" onClick={() => onOpenFinding(bug.id)}><ChevronRight /></button>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="node-clean-card"><Check /><div><strong>Reference asset — no graded finding is attached.</strong><p>The tester still uses this node to understand the route and its trust boundaries.</p></div></div>
      )}
      <button type="button" className="node-settings-cta" onClick={onOpenSettings}><SlidersHorizontal /><span><strong>Open settings</strong><small>Review or change the current configuration</small></span><ChevronRight /></button>
    </div>
  );
}

function NodeSettingsPanel({
  node,
  report,
  testing,
  configurationChanged,
  hardMode,
  overrides,
  onSettingChange,
}: {
  node: NetworkNode;
  report: TestReport | null;
  testing: boolean;
  configurationChanged: boolean;
  hardMode: boolean;
  overrides: Record<string, string>;
  onSettingChange: (settingId: string, value: string) => void;
}) {
  const settings = nodeSettings[node.id] ?? [];
  const ports = settings.filter((setting) => setting.kind === "port");
  const otherSettings = settings.filter((setting) => setting.kind !== "port");
  const nodeBugs = bugsForNode(node.id);

  return (
    <div className="node-settings-panel">
      <div className="settings-intro"><div><span className="section-eyebrow">CURRENT CONFIGURATION</span><h3>Change the control, then retest</h3></div><span className={report ? "revealed-chip" : "hidden-chip"}>{report ? "TESTED" : "NOT TESTED"}</span></div>
      <p className="settings-help">{testing ? "The pentester is running. Settings remain readable, but wait for the report before judging a value." : report ? "The report has revealed the tested path. Apply a setting change and run the test again to verify it." : "Values are intentionally ungraded until the first pentest. Explore the controls without guessing which one is vulnerable."}</p>
      {configurationChanged && <div className="settings-dirty"><Settings2 /><span>Local changes are ready. They will not count as fixed until a new pentest verifies them.</span></div>}
      {ports.length > 0 && <RetroPortManager nodeName={node.name} settings={ports} report={report} hardMode={hardMode} overrides={overrides} onSettingChange={onSettingChange} />}
      <div className="settings-list">
        {otherSettings.map((setting) => (
          <SettingControl key={setting.id} setting={setting} value={valueForSetting(setting.id, overrides)} changed={Boolean(overrides[setting.id])} revealed={Boolean(report)} hardMode={hardMode} nodeBugs={nodeBugs} onChange={onSettingChange} />
        ))}
      </div>
      {settings.length === 0 && <div className="node-clean-card"><Info /><div><strong>No editable settings are modelled for this reference.</strong><p>Use the node overview to see how it participates in the request path.</p></div></div>}
    </div>
  );
}

function RetroPortManager({
  nodeName,
  settings,
  report,
  hardMode,
  overrides,
  onSettingChange,
}: {
  nodeName: string;
  settings: NodeSetting[];
  report: TestReport | null;
  hardMode: boolean;
  overrides: Record<string, string>;
  onSettingChange: (settingId: string, value: string) => void;
}) {
  return (
    <div className="retro-window" aria-label={nodeName + " port manager"}>
      <div className="retro-titlebar"><strong>{nodeName} — Port Manager</strong><span><i>_</i><i>□</i><i>×</i></span></div>
      <div className="retro-menubar"><span>File</span><span>Edit</span><span>View</span><span>Help</span></div>
      <div className="retro-window-body">
        <div className="retro-toolbar"><span>Interfaces / listeners</span><span className="retro-toolbar-status">{report ? "Last scan loaded" : "Local preview"}</span></div>
        <div className="retro-port-table">
          {settings.map((setting) => {
            const value = valueForSetting(setting.id, overrides);
            const isClosed = value === "CLOSED" || value === "SHUTDOWN";
            const isRelevant = settingIsRelevant(setting.id);
            const canShowBaseline = Boolean(report) && !hardMode && isRelevant;
            return (
              <div className={["retro-port-row", isClosed ? "closed" : "open"].join(" ")} key={setting.id}>
                <div className="retro-port-state"><span className="retro-led" /><strong>{isClosed ? "CLOSED" : value}</strong></div>
                <div className="retro-port-copy"><strong>{setting.label}</strong><small>{setting.description}</small>{canShowBaseline && <em>Expected baseline: {setting.safeValue}</em>}</div>
                <button type="button" className="retro-button" onClick={() => onSettingChange(setting.id, isClosed ? setting.value : setting.safeValue)}>{isClosed ? "OPEN" : setting.kind === "port" ? "CLOSE" : "APPLY"}</button>
              </div>
            );
          })}
        </div>
        <div className="retro-statusbar"><span>{settings.length} item{settings.length === 1 ? "" : "s"}</span><span>{hardMode ? "diagnostic mode" : "administrator"}</span></div>
      </div>
    </div>
  );
}

function SettingControl({
  setting,
  value,
  changed,
  revealed,
  hardMode,
  nodeBugs,
  onChange,
}: {
  setting: NodeSetting;
  value: string;
  changed: boolean;
  revealed: boolean;
  hardMode: boolean;
  nodeBugs: Bug[];
  onChange: (settingId: string, value: string) => void;
}) {
  const relevant = settingIsRelevant(setting.id) && nodeBugs.length > 0;
  const showBaseline = revealed && relevant && !hardMode;
  const matchesBaseline = value === setting.safeValue;
  const options = setting.options ?? [setting.value, setting.safeValue];
  const uniqueOptions = [...new Set(options)];

  return (
    <div className={["setting-control", relevant && revealed ? "is-relevant" : "", changed ? "is-changed" : ""].filter(Boolean).join(" ")}>
      <div className="setting-control-copy">
        <div><strong>{setting.label}</strong>{changed && <span className="setting-changed">CHANGED</span>}</div>
        <small>{setting.description}</small>
        {showBaseline && <em>{matchesBaseline ? "Matches expected baseline." : "Expected baseline: " + setting.safeValue}</em>}
      </div>
      <label className="setting-input">
        <span className="sr-only">Set {setting.label}</span>
        <select value={value} onChange={(event) => onChange(setting.id, event.target.value)}>
          {uniqueOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </div>
  );
}
