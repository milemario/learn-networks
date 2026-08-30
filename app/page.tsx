"use client";

import { useMemo, useRef, useState, type ComponentType } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  CircleDot,
  FileText,
  LockKeyhole,
  Play,
  RotateCcw,
  ScanLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  bugs,
  edges,
  nodes,
  securityChain,
  tcpIpLayers,
  type Bug,
  type FixOption,
  type NetworkNode,
  type RepairKind,
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

type Filter = "all" | "open" | "prepared";

type TestReport = {
  clean: boolean;
  unresolved: string[];
  run: number;
};

const pentestStages = [
  { phase: "01", name: "Scope & rules of engagement", tool: "PENTEST-BOX", command: "scope --case northstar-01", output: "Authorised target, source address and test window confirmed.", affected: [] },
  { phase: "02", name: "Asset discovery", tool: "dig / host", command: "dig northstar.example A +short", output: "203.0.113.10 → edge firewall; published service identified.", affected: [] },
  { phase: "03", name: "Port & service enumeration", tool: "nmap", command: "nmap -sV -Pn 203.0.113.10", output: "443/tcp HTTPS · 22/tcp SSH · 80/tcp HTTP response observed.", affected: ["fw-ssh", "web-tls"] },
  { phase: "04", name: "Transport & TLS checks", tool: "openssl / curl", command: "openssl s_client · curl -I", output: "Certificate, redirects and security headers compared with the baseline.", affected: ["web-tls"] },
  { phase: "05", name: "Web surface mapping", tool: "HTTP probe", command: "GET / · safe path checks", output: "Portal and administration paths catalogued without destructive payloads.", affected: ["web-tls"] },
  { phase: "06", name: "Boundary validation", tool: "nmap / policy probes", command: "controlled source-and-port tests", output: "Firewall, VLAN and lateral reachability rules tested from authorised positions.", affected: ["fw-ssh", "db-acl", "wifi-guest", "switch-ports", "fileshare", "admin-rdp"] },
  { phase: "07", name: "Non-destructive confirmation", tool: "curl / session checks", command: "repeat observed attack paths", output: "Only the evidence needed to confirm exploitability is replayed.", affected: bugs.map((bug) => bug.id) },
  { phase: "08", name: "Retest & report", tool: "diff / evidence log", command: "compare before → after", output: "Open paths are recorded for the defender; fixes are not assumed effective.", affected: bugs.map((bug) => bug.id) },
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

const repairLabels: Record<RepairKind, string> = {
  physical: "Physical",
  configuration: "Setting",
  process: "Process",
};

const repairIcons: Record<RepairKind, typeof Settings2> = {
  physical: Wrench,
  configuration: Settings2,
  process: FileText,
};

const nodeMap = new Map(nodes.map((node) => [node.id, node]));

function severityLabel(severity: Bug["severity"]) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function getBugForNode(nodeId: string) {
  return bugs.find((bug) => bug.deviceId === nodeId);
}

function timelineTone(stage: (typeof pentestStages)[number], index: number, activeStep: number, report?: TestReport | null) {
  if (!report) {
    if (index === activeStep - 1) return "running";
    if (index < activeStep) return stage.affected.length ? "finding" : "info";
    return "pending";
  }
  if (!stage.affected.length) return "info";
  return stage.affected.some((bugId) => report.unresolved.includes(bugId)) ? "finding" : "pass";
}

function timelineToneLabel(tone: string) {
  return tone === "finding" ? "FOUND" : tone === "pass" ? "CLEAR" : tone === "running" ? "RUNNING" : tone === "info" ? "OBSERVED" : "PENDING";
}

function timelineOutput(stage: (typeof pentestStages)[number], report?: TestReport | null) {
  if (!report || !stage.affected.length) return stage.output;
  const openFindings = stage.affected
    .filter((bugId) => report.unresolved.includes(bugId))
    .map((bugId) => bugs.find((bug) => bug.id === bugId)?.title)
    .filter(Boolean);
  if (openFindings.length) return `${stage.output} Finding corroborated: ${openFindings.join(" · ")}.`;
  return `${stage.output} No exposure from this phase remained reproducible.`;
}

export default function Home() {
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedFixes, setSelectedFixes] = useState<Record<string, string>>({});
  const [report, setReport] = useState<TestReport | null>(null);
  const [testing, setTesting] = useState(false);
  const [testRuns, setTestRuns] = useState(0);
  const [hardMode, setHardMode] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const reportRef = useRef<HTMLElement>(null);

  const selectedBug = bugs.find((bug) => bug.id === selectedBugId) ?? null;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const preparedCount = bugs.filter((bug) => selectedFixes[bug.id]).length;
  const resolvedCount = bugs.filter((bug) => bug.fixes.find((fix) => fix.id === selectedFixes[bug.id])?.correct).length;
  const visibleResolvedCount = hardMode && !report ? 0 : resolvedCount;
  const progress = Math.round((visibleResolvedCount / bugs.length) * 100);

  const filteredBugs = useMemo(() => bugs.filter((bug) => {
    if (filter === "open") return !selectedFixes[bug.id];
    if (filter === "prepared") return Boolean(selectedFixes[bug.id]);
    return true;
  }), [filter, selectedFixes]);

  function chooseFix(bugId: string, fix: FixOption) {
    setSelectedFixes((current) => ({ ...current, [bugId]: fix.id }));
    setReport(null);
  }

  function testSystem() {
    if (testing) return;
    setTesting(true);
    setReport(null);
    setScanStep(0);
    window.setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    const nextRun = testRuns + 1;
    pentestStages.forEach((_, index) => window.setTimeout(() => setScanStep(index + 1), index * 620));
    window.setTimeout(() => {
      const unresolved = bugs
        .filter((bug) => !bug.fixes.find((fix) => fix.id === selectedFixes[bug.id])?.correct)
        .map((bug) => bug.id);
      setReport({ clean: unresolved.length === 0, unresolved, run: nextRun });
      setTestRuns(nextRun);
      setTesting(false);
    }, pentestStages.length * 620 + 350);
  }

  function resetLab() {
    setSelectedBugId(null);
    setSelectedNodeId(null);
    setSelectedFixes({});
    setReport(null);
    setTesting(false);
    setTestRuns(0);
    setFilter("all");
  }

  return (
    <main className={`lab-shell ${hardMode ? "hard-mode" : ""}`}>
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
        </div>
        <div className="header-actions">
          <span className="authorized-chip"><LockKeyhole /> authorised simulation</span>
          <button className={`difficulty-toggle ${hardMode ? "active" : ""}`} onClick={() => setHardMode((value) => !value)} aria-pressed={hardMode}>{hardMode ? "Hard mode" : "Easy mode"}</button>
          <Button className="light-button" variant="ghost" size="sm" onClick={resetLab}><RotateCcw /> Reset</Button>
        </div>
      </header>

      <section className="intro-strip">
        <div className="intro-copy">
          <div className="intro-kicker"><Sparkles /> DEFENDER VIEW</div>
          <h2>Repair the network. Then let the pentester try again.</h2>
          <p>Find the weak control, choose one of three repairs, and keep testing until the mock report comes back clean.</p>
        </div>
        <div className="intro-action">
          <div className="control-progress">
            <div><span>Controls ready</span><strong>{visibleResolvedCount} / {bugs.length}</strong></div>
            <Progress value={progress} aria-label={`${visibleResolvedCount} of ${bugs.length} controls ready`} />
          </div>
          <Button className="test-button" onClick={testSystem} disabled={testing}>
            {testing ? <ScanLine className="spin-icon" /> : <TestTube2 />}
            {testing ? "Pentester running…" : "Test the system"}
          </Button>
          {testing && <div className="top-scan-status" aria-live="polite"><span>{pentestStages[Math.max(0, scanStep - 1)]?.tool ?? "PENTEST-BOX"}</span><strong>{pentestStages[Math.max(0, scanStep - 1)]?.name ?? "Starting authorised scan…"}</strong></div>}
        </div>
      </section>

      <section className="model-strip" aria-labelledby="model-heading">
        <div className="model-label">
          <p className="section-eyebrow">THE MAP WE USE</p>
          <h2 id="model-heading">Security chain</h2>
          <p>TCP/IP explains where a control lives. The chain explains why it matters.</p>
        </div>
        <div className="chain-row">
          {securityChain.map((item, index) => (
            <div className="chain-item" key={item.name}>
              <span className="chain-number">0{index + 1}</span>
              <div><strong>{item.name}</strong><small>{item.text}</small></div>
              {index < securityChain.length - 1 && <ArrowRight className="chain-arrow" />}
            </div>
          ))}
        </div>
        <div className="model-note"><CircleHelp /><div><span>TCP/IP model</span><small>{tcpIpLayers.map((layer) => layer.name).join(" · ")}</small></div><ArrowDown /><span>security reasoning</span></div>
      </section>

      <div className="lab-grid">
        <aside className="issue-rail" aria-labelledby="issues-heading">
          <div className="rail-heading">
            <div><p className="section-eyebrow">ISSUE QUEUE</p><h2 id="issues-heading">What needs attention?</h2></div>
            <span className="issue-count">{bugs.length}</span>
          </div>
          <div className="filter-row" role="group" aria-label="Filter issues">
            {(["all", "open", "prepared"] as Filter[]).map((item) => (
              <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)}>
                {item === "all" ? "All" : item === "open" ? "Open" : "Prepared"}
              </button>
            ))}
          </div>
          <div className="issue-list">
            {filteredBugs.map((bug, index) => {
              const isSelected = selectedBugId === bug.id;
              const selectedFix = selectedFixes[bug.id];
              const fixed = Boolean(bug.fixes.find((fix) => fix.id === selectedFix)?.correct) && (!hardMode || Boolean(report));
              return (
                <button className={`issue-row ${isSelected ? "is-selected" : ""} ${fixed ? "is-fixed" : ""}`} key={bug.id} onClick={() => { setSelectedBugId(bug.id); setSelectedNodeId(null); }}>
                  <span className={`severity-dot ${bug.severity}`} />
                  <span className="issue-row-copy"><span className="issue-code">ISSUE 0{index + 1}</span><strong>{bug.title}</strong><small>{nodeMap.get(bug.deviceId)?.name} · {severityLabel(bug.severity)}</small></span>
                  <span className="issue-status">{fixed ? <Check /> : selectedFix ? <Wrench /> : <ChevronRight />}</span>
                </button>
              );
            })}
          </div>
          <div className="rail-legend">
            <span><i className="legend-dot critical" /> Critical</span>
            <span><i className="legend-dot high" /> High</span>
            <span><i className="legend-dot medium" /> Medium</span>
          </div>
          <div className="rail-tip"><CircleHelp /><p>One issue can have a physical, setting, or process fix. Choose the control that actually closes the path.</p></div>
        </aside>

        <section className="network-panel" aria-labelledby="network-heading">
          <div className="network-panel-heading">
            <div><p className="section-eyebrow">ARCHITECTURE MAP</p><h2 id="network-heading">Northstar network</h2></div>
            <div className="network-heading-meta"><span><i className="map-dot open" /> issue open</span><span><i className="map-dot fixed" /> repair prepared</span></div>
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
                  const active = selectedBug && (selectedBug.deviceId === edge.from || selectedBug.deviceId === edge.to);
                  return <line key={`${edge.from}-${edge.to}`} x1={from.position.x} y1={from.position.y} x2={to.position.x} y2={to.position.y} className={active ? "is-active" : ""} vectorEffect="non-scaling-stroke" />;
                })}
              </svg>
              {edges.map((edge) => {
                const from = nodeMap.get(edge.from)!;
                const to = nodeMap.get(edge.to)!;
                return <span key={`edge-label-${edge.from}-${edge.to}`} className="wire-label" style={{ left: `${(from.position.x + to.position.x) / 2}%`, top: `${(from.position.y + to.position.y) / 2}%` }}>{edge.label}</span>;
              })}
              {nodes.map((node) => {
                const Icon = deviceIcons[node.icon];
                const bug = getBugForNode(node.id);
                const selection = bug ? selectedFixes[bug.id] : undefined;
                const fixed = Boolean(bug?.fixes.find((fix) => fix.id === selection)?.correct) && (!hardMode || Boolean(report));
                const isSelected = bug?.id === selectedBugId || node.id === selectedNodeId;
                return (
                  <button key={node.id} className={`network-node ${node.zone} ${isSelected ? "is-selected" : ""} ${fixed ? "is-fixed" : ""} ${selection && !fixed ? "is-prepared" : ""}`} style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }} onClick={() => { if (bug) { setSelectedBugId(bug.id); setSelectedNodeId(null); } else { setSelectedBugId(null); setSelectedNodeId(node.id); } }} aria-label={bug ? `Inspect ${bug.title} on ${node.name}` : `Inspect ${node.name}`}>
                    <span className="node-sprite"><Icon /></span>
                    <span className="node-copy"><strong>{node.name}</strong><small>{node.role}</small></span>
                    {bug && <span className={`node-status ${fixed ? "fixed" : ""}`}>{fixed ? <Check /> : <AlertTriangle />}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="network-caption"><span><CircleDot /> Choose an issue from the queue or click a flagged device.</span><span className="sprite-credit">Pixel device glyphs · MIT / pixelarticons</span></div>
        </section>

        <aside className="repair-panel" aria-labelledby="repair-heading">
          {selectedBug ? (
            <RepairInspector bug={selectedBug} selectedFix={selectedFixes[selectedBug.id]} onChoose={(fix) => chooseFix(selectedBug.id, fix)} onClose={() => setSelectedBugId(null)} report={report} hardMode={hardMode} />
          ) : selectedNode ? (
            <NodeInspector node={selectedNode} onClose={() => setSelectedNodeId(null)} />
          ) : (
            <EmptyInspector preparedCount={preparedCount} onStart={() => setSelectedBugId(bugs[0].id)} />
          )}
        </aside>
      </div>

      <section ref={reportRef} className={`pentest-report ${report ? "has-report" : ""}`} aria-live="polite" aria-labelledby="report-heading">
        <div className="report-heading">
          <div className="report-icon"><ScanLine /></div>
          <div><p className="section-eyebrow">PENTESTER OUTPUT</p><h2 id="report-heading">Mock penetration test report</h2></div>
          {report && <span className={`report-status ${report.clean ? "clean" : "open"}`}>{report.clean ? <><Check /> CLEAN RUN {report.run}</> : <><AlertTriangle /> {report.unresolved.length} FINDING{report.unresolved.length === 1 ? "" : "S"} OPEN</>}</span>}
        </div>
        {testing ? (
          <PentestTimeline activeStep={scanStep} />
        ) : !report ? (
          <div className="report-empty"><div><strong>Ready when you are.</strong><p>The authorised PENTEST-BOX will check the eight controls in this case and show what an attacker can still reach.</p></div><Button variant="outline" onClick={testSystem} disabled={testing}><Play /> Run mock test</Button></div>
        ) : (
          <>
            <PentestTimeline activeStep={pentestStages.length} report={report} />
            {report.clean ? (
              <div className="report-clean"><Check /><div><strong>No exploitable path found in this test run.</strong><p>External access is constrained, trust boundaries hold, and the endpoint baseline is back in place. Residual risk still needs normal monitoring.</p></div><span className="clean-stamp">8 / 8 checks passed</span></div>
            ) : (
              <div className="report-findings"><div className="report-summary"><AlertTriangle /><div><strong>The network is still testable.</strong><p>Pick a repair for each open finding, then run the test again. A prepared option is not necessarily an effective control.</p></div></div><div className="report-list">{report.unresolved.map((bugId) => { const bug = bugs.find((item) => item.id === bugId)!; return <div className="report-row" key={bug.id}><span className={`severity-pill ${bug.severity}`}>{severityLabel(bug.severity)}</span><div><strong>{bug.reportFinding}</strong><small>{bug.reportHint}</small></div><button onClick={() => setSelectedBugId(bug.id)}>Repair <ChevronRight /></button></div>; })}</div></div>
            )}
          </>
        )}
      </section>

      <footer className="lab-footer"><span><ShieldCheck /> Training environment · fictional systems only</span><span>Use only on owned or authorised systems · Northstar snapshot 2026-08-18</span></footer>
    </main>
  );
}

function PentestTimeline({ activeStep, report }: { activeStep: number; report?: TestReport | null }) {
  return (
    <div className="pentest-timeline" aria-label="Pentest execution chain">
      <div className="timeline-heading"><div><span className="section-eyebrow">TEST CHAIN</span><h3>{report ? `Run ${report.run} · evidence summary` : "Pentester execution chain"}</h3></div><span className="timeline-count">{activeStep} / {pentestStages.length}</span></div>
      <div className="timeline-list">
        {pentestStages.map((stage, index) => {
          const done = activeStep > index;
          const running = activeStep === index + 1 && !report;
          const tone = timelineTone(stage, index, activeStep, report);
          return <div className={`timeline-row ${done ? "done" : ""} ${running ? "running" : ""} tone-${tone}`} key={stage.phase}>
            <span className="timeline-marker">{tone === "pass" ? <Check /> : tone === "finding" ? <AlertTriangle /> : running ? <ScanLine className="spin-icon" /> : stage.phase}</span>
            <div className="timeline-copy"><div className="timeline-top"><strong>{stage.name}</strong><span>{stage.tool}</span></div><div className="timeline-result">{timelineToneLabel(tone)}</div><code>{stage.command}</code><small>{timelineOutput(stage, report)}{report && index === pentestStages.length - 1 ? ` ${report.clean ? "No unresolved modeled path." : `${report.unresolved.length} modeled path${report.unresolved.length === 1 ? "" : "s"} still open.`}` : ""}</small></div>
          </div>;
        })}
      </div>
      {report && <p className="timeline-note">A mock, non-destructive sequence for this fictional authorised environment. Tool names show the tester’s reasoning; no real network is scanned.</p>}
    </div>
  );
}

function NodeInspector({ node, onClose }: { node: NetworkNode; onClose: () => void }) {
  const Icon = deviceIcons[node.icon];
  const context = node.id === "internet"
    ? "Az internet a nem megbízható külső hálózat. Innen érkeznek a tesztelt kérések, ezért a peremkontrolloknak itt kell szűrniük."
    : node.id === "pentest-box"
      ? "Ez az engedélyezett tesztgép. A jelentésben látható eszközlánc innen indítja a korlátozott, nem romboló ellenőrzéseket."
      : `${node.name} a(z) ${node.zone} zónában található. Ezen a ponton nincs külön modellezett hibajegy; a hálózati szerepe és a kapcsolatai a fontosak.`;
  return (
    <div className="repair-inspector node-inspector">
      <div className="inspector-topline"><span className="section-eyebrow">ARCHITECTURE MAP</span><button onClick={onClose} aria-label="Close node information"><X /></button></div>
      <div className="node-info-title"><div className={`node-info-icon ${node.zone}`}><Icon /></div><div><span className="severity-text low">REFERENCE NODE</span><h2>{node.name}</h2><p>{node.role}</p></div></div>
      <div className="evidence-card"><span className="card-label">NODE DETAILS</span><code>{node.ip} · {node.zone.toUpperCase()} ZONE</code></div>
      <div className="risk-card node-context"><span className="card-label">WHY IT MATTERS</span><p>{context}</p></div>
      <div className="selection-note neutral"><Settings2 /><span>Nincs javítandó hibajegy ezen a csomóponton. Kattints egy narancssárga jelölésre a javítási pad megnyitásához.</span></div>
      <div className="inspector-footnote"><CircleHelp /><span>A tiszta referencia-csomópontok is részei a támadási felület megértésének.</span></div>
    </div>
  );
}

function EmptyInspector({ preparedCount, onStart }: { preparedCount: number; onStart: () => void }) {
  return (
    <div className="inspector-empty">
      <div className="empty-illustration"><PixelShield /><span><Wrench /></span></div>
      <p className="section-eyebrow">REPAIR BENCH</p>
      <h2>Choose an issue to begin</h2>
      <p>Inspect the evidence, compare three different interventions, and choose the one that closes the attack path.</p>
      <Button variant="outline" onClick={onStart}><Wrench /> Open first issue</Button>
      <div className="bench-stats"><span><strong>{preparedCount}</strong><small>prepared</small></span><span><strong>3</strong><small>options / issue</small></span><span><strong>1</strong><small>clean report</small></span></div>
    </div>
  );
}

function RepairInspector({ bug, selectedFix, onChoose, onClose, report, hardMode }: { bug: Bug; selectedFix?: string; onChoose: (fix: FixOption) => void; onClose: () => void; report: TestReport | null; hardMode: boolean }) {
  const selected = bug.fixes.find((fix) => fix.id === selectedFix);
  const fixed = Boolean(selected?.correct) && (!hardMode || Boolean(report));
  const statusAfterTest = report?.unresolved.includes(bug.id) ? "open" : report ? "passed" : null;
  return (
    <div className="repair-inspector">
      <div className="inspector-topline"><span className="section-eyebrow">REPAIR BENCH</span><button onClick={onClose} aria-label="Close issue"><X /></button></div>
      <div className="bug-title-row"><div className={`bug-severity ${bug.severity}`}><AlertTriangle /></div><div><span className={`severity-text ${bug.severity}`}>{severityLabel(bug.severity)} control gap</span><h2 id="repair-heading">{bug.title}</h2><p>{bug.summary}</p></div></div>
      <div className="evidence-card"><span className="card-label">OBSERVED EVIDENCE</span><code>{bug.evidence}</code></div>
      <div className="risk-card"><span className="card-label">WHY IT MATTERS</span><p>{bug.risk}</p></div>
      <div className="options-heading"><div><span className="section-eyebrow">CHOOSE A CONTROL</span><h3>Three possible interventions</h3></div><span>1 effective</span></div>
      <div className="fix-list">
        {bug.fixes.map((fix, index) => {
          const FixIcon = repairIcons[fix.kind];
          const isChosen = fix.id === selectedFix;
          return (
            <button className={`fix-option ${isChosen ? "is-chosen" : ""} ${isChosen && fixed && !hardMode ? "is-correct" : ""}`} key={fix.id} onClick={() => onChoose(fix)}>
              <span className="fix-number">0{index + 1}</span><span className="fix-kind"><FixIcon /><small>{repairLabels[fix.kind]}</small></span><span className="fix-copy"><strong>{fix.label}</strong><small>{fix.detail}</small></span><span className="fix-radio">{isChosen ? <Check /> : null}</span>
            </button>
          );
        })}
      </div>
      {selected && <div className={`selection-note ${fixed ? "good" : hardMode ? "neutral" : "warn"}`}>{fixed ? <Check /> : hardMode ? <Settings2 /> : <AlertTriangle />}<span>{fixed ? "This control closed the modeled path in the last test." : hardMode ? "Selection recorded. Run the pentest to verify whether it closes the path." : "This is a plausible change, but the modeled risk would remain."}</span></div>}
      {statusAfterTest && <div className={`test-status ${statusAfterTest}`}>{statusAfterTest === "passed" ? <Check /> : <AlertTriangle />}<span>{statusAfterTest === "passed" ? "Pentester check passed for this issue." : "Pentester still reproduced this finding."}</span></div>}
      <div className="inspector-footnote"><Settings2 /><span>Think: is this a physical boundary, a technical setting, or a process that keeps the control alive?</span></div>
    </div>
  );
}
