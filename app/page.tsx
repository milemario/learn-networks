"use client";

import { useMemo, useState, type ComponentType } from "react";
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

export default function Home() {
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedFixes, setSelectedFixes] = useState<Record<string, string>>({});
  const [report, setReport] = useState<TestReport | null>(null);
  const [testing, setTesting] = useState(false);
  const [testRuns, setTestRuns] = useState(0);

  const selectedBug = bugs.find((bug) => bug.id === selectedBugId) ?? null;
  const preparedCount = bugs.filter((bug) => selectedFixes[bug.id]).length;
  const resolvedCount = bugs.filter((bug) => bug.fixes.find((fix) => fix.id === selectedFixes[bug.id])?.correct).length;
  const progress = Math.round((resolvedCount / bugs.length) * 100);

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
    const nextRun = testRuns + 1;
    window.setTimeout(() => {
      const unresolved = bugs
        .filter((bug) => !bug.fixes.find((fix) => fix.id === selectedFixes[bug.id])?.correct)
        .map((bug) => bug.id);
      setReport({ clean: unresolved.length === 0, unresolved, run: nextRun });
      setTestRuns(nextRun);
      setTesting(false);
    }, 900);
  }

  function resetLab() {
    setSelectedBugId(null);
    setSelectedFixes({});
    setReport(null);
    setTesting(false);
    setTestRuns(0);
    setFilter("all");
  }

  return (
    <main className="lab-shell">
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
            <div><span>Controls ready</span><strong>{resolvedCount} / {bugs.length}</strong></div>
            <Progress value={progress} aria-label={`${resolvedCount} of ${bugs.length} controls ready`} />
          </div>
          <Button className="test-button" onClick={testSystem} disabled={testing}>
            {testing ? <ScanLine className="spin-icon" /> : <TestTube2 />}
            {testing ? "Pentester running…" : "Test the system"}
          </Button>
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
              const fixed = Boolean(bug.fixes.find((fix) => fix.id === selectedFix)?.correct);
              return (
                <button className={`issue-row ${isSelected ? "is-selected" : ""} ${fixed ? "is-fixed" : ""}`} key={bug.id} onClick={() => setSelectedBugId(bug.id)}>
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
                const fixed = Boolean(bug?.fixes.find((fix) => fix.id === selection)?.correct);
                const isSelected = bug?.id === selectedBugId;
                return (
                  <button key={node.id} className={`network-node ${node.zone} ${isSelected ? "is-selected" : ""} ${fixed ? "is-fixed" : ""} ${selection && !fixed ? "is-prepared" : ""}`} style={{ left: `${node.position.x}%`, top: `${node.position.y}%` }} onClick={() => bug ? setSelectedBugId(bug.id) : undefined} aria-label={bug ? `Inspect ${bug.title} on ${node.name}` : node.name}>
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
            <RepairInspector bug={selectedBug} selectedFix={selectedFixes[selectedBug.id]} onChoose={(fix) => chooseFix(selectedBug.id, fix)} onClose={() => setSelectedBugId(null)} report={report} />
          ) : (
            <EmptyInspector preparedCount={preparedCount} onStart={() => setSelectedBugId(bugs[0].id)} />
          )}
        </aside>
      </div>

      <section className={`pentest-report ${report ? "has-report" : ""}`} aria-live="polite" aria-labelledby="report-heading">
        <div className="report-heading">
          <div className="report-icon"><ScanLine /></div>
          <div><p className="section-eyebrow">PENTESTER OUTPUT</p><h2 id="report-heading">Mock penetration test report</h2></div>
          {report && <span className={`report-status ${report.clean ? "clean" : "open"}`}>{report.clean ? <><Check /> CLEAN RUN {report.run}</> : <><AlertTriangle /> {report.unresolved.length} FINDING{report.unresolved.length === 1 ? "" : "S"} OPEN</>}</span>}
        </div>
        {!report ? (
          <div className="report-empty"><div><strong>Ready when you are.</strong><p>The authorised PENTEST-BOX will check the eight controls in this case and show what an attacker can still reach.</p></div><Button variant="outline" onClick={testSystem} disabled={testing}><Play /> Run mock test</Button></div>
        ) : report.clean ? (
          <div className="report-clean"><Check /><div><strong>No exploitable path found in this test run.</strong><p>External access is constrained, trust boundaries hold, and the endpoint baseline is back in place. Residual risk still needs normal monitoring.</p></div><span className="clean-stamp">8 / 8 checks passed</span></div>
        ) : (
          <div className="report-findings"><div className="report-summary"><AlertTriangle /><div><strong>The network is still testable.</strong><p>Pick a repair for each open finding, then run the test again. A prepared option is not necessarily an effective control.</p></div></div><div className="report-list">{report.unresolved.map((bugId) => { const bug = bugs.find((item) => item.id === bugId)!; return <div className="report-row" key={bug.id}><span className={`severity-pill ${bug.severity}`}>{severityLabel(bug.severity)}</span><div><strong>{bug.reportFinding}</strong><small>{bug.reportHint}</small></div><button onClick={() => setSelectedBugId(bug.id)}>Repair <ChevronRight /></button></div>; })}</div></div>
        )}
      </section>

      <footer className="lab-footer"><span><ShieldCheck /> Training environment · fictional systems only</span><span>Use only on owned or authorised systems · Northstar snapshot 2026-08-18</span></footer>
    </main>
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

function RepairInspector({ bug, selectedFix, onChoose, onClose, report }: { bug: Bug; selectedFix?: string; onChoose: (fix: FixOption) => void; onClose: () => void; report: TestReport | null }) {
  const selected = bug.fixes.find((fix) => fix.id === selectedFix);
  const fixed = Boolean(selected?.correct);
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
            <button className={`fix-option ${isChosen ? "is-chosen" : ""} ${isChosen && fixed ? "is-correct" : ""}`} key={fix.id} onClick={() => onChoose(fix)}>
              <span className="fix-number">0{index + 1}</span><span className="fix-kind"><FixIcon /><small>{repairLabels[fix.kind]}</small></span><span className="fix-copy"><strong>{fix.label}</strong><small>{fix.detail}</small></span><span className="fix-radio">{isChosen ? <Check /> : null}</span>
            </button>
          );
        })}
      </div>
      {selected && <div className={`selection-note ${fixed ? "good" : "warn"}`}>{fixed ? <Check /> : <AlertTriangle />}<span>{fixed ? "This control closes the modeled path. Run the test to verify it." : "This is a plausible change, but the modeled risk would remain."}</span></div>}
      {statusAfterTest && <div className={`test-status ${statusAfterTest}`}>{statusAfterTest === "passed" ? <Check /> : <AlertTriangle />}<span>{statusAfterTest === "passed" ? "Pentester check passed for this issue." : "Pentester still reproduced this finding."}</span></div>}
      <div className="inspector-footnote"><Settings2 /><span>Think: is this a physical boundary, a technical setting, or a process that keeps the control alive?</span></div>
    </div>
  );
}
