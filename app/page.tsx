"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Crosshair,
  Database,
  Eye,
  Flag,
  Globe2,
  HardDrive,
  Laptop,
  Layers3,
  Lightbulb,
  Monitor,
  Network,
  RotateCcw,
  Route,
  Router,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Wifi,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  correctAttackPath,
  devices,
  edges,
  findingIds,
  osiLayers,
  type Severity,
} from "./network-data";

const icons: Record<(typeof devices)[number]["icon"], LucideIcon> = {
  globe: Globe2,
  shield: Shield,
  server: Server,
  router: Router,
  database: Database,
  drive: HardDrive,
  monitor: Monitor,
  laptop: Laptop,
  wifi: Wifi,
};

const observationIndex = new Map(
  devices.flatMap((device) =>
    device.observations.map((observation) => [observation.id, { observation, device }]),
  ),
);

function severityLabel(severity?: Severity) {
  if (!severity) return "";
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export default function Home() {
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [selectedObservations, setSelectedObservations] = useState<Set<string>>(new Set());
  const [assessment, setAssessment] = useState<{
    correct: number;
    incorrect: number;
    missed: number;
    score: number;
  } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [pathMode, setPathMode] = useState(false);
  const [attackPath, setAttackPath] = useState<string[]>([]);
  const [pathResult, setPathResult] = useState<"correct" | "incorrect" | null>(null);

  const activeDevice = devices.find((device) => device.id === activeDeviceId) ?? null;
  const progress = Math.round((selectedObservations.size / findingIds.length) * 100);

  const selectedItems = useMemo(
    () =>
      Array.from(selectedObservations)
        .map((id) => observationIndex.get(id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [selectedObservations],
  );

  function toggleObservation(id: string) {
    setSelectedObservations((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAssessment(null);
  }

  function submitAssessment() {
    const correct = findingIds.filter((id) => selectedObservations.has(id)).length;
    const incorrect = Array.from(selectedObservations).filter(
      (id) => !observationIndex.get(id)?.observation.isFinding,
    ).length;
    const missed = findingIds.length - correct;
    const score = Math.max(0, Math.round((correct / findingIds.length) * 100 - incorrect * 5));
    setAssessment({ correct, incorrect, missed, score });
    setAttempts((value) => value + 1);
  }

  function handleDeviceClick(deviceId: string) {
    if (!pathMode) {
      setActiveDeviceId(deviceId);
      return;
    }
    setPathResult(null);
    setAttackPath((current) => {
      if (current.includes(deviceId) || current.length >= correctAttackPath.length) return current;
      return [...current, deviceId];
    });
  }

  function checkAttackPath() {
    const correct =
      attackPath.length === correctAttackPath.length &&
      attackPath.every((deviceId, index) => deviceId === correctAttackPath[index]);
    setPathResult(correct ? "correct" : "incorrect");
  }

  function resetExercise() {
    setActiveDeviceId(null);
    setSelectedLayer(null);
    setSelectedObservations(new Set());
    setAssessment(null);
    setAttempts(0);
    setReveal(false);
    setPathMode(false);
    setAttackPath([]);
    setPathResult(null);
  }

  return (
    <main className="range-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Network /></div>
          <div>
            <p className="eyebrow">LEARN / NETWORKS</p>
            <h1>Northstar security review</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <Badge className="scenario-badge" variant="outline">Scenario 01 · Intermediate</Badge>
          <Button className="reset-button" variant="ghost" size="sm" onClick={resetExercise}>
            <RotateCcw /> Reset
          </Button>
        </div>
      </header>

      <section className="mission-strip" aria-labelledby="mission-title">
        <div className="mission-number">01</div>
        <div className="mission-copy">
          <p className="eyebrow" id="mission-title">YOUR MISSION</p>
          <p>
            Audit the network before launch. Inspect every device, flag weak configurations,
            then trace the most likely route from the internet to the finance database.
          </p>
        </div>
        <div className="mission-progress">
          <div className="progress-heading">
            <span>Evidence flagged</span>
            <strong>{selectedObservations.size} / {findingIds.length}</strong>
          </div>
          <Progress value={progress} aria-label={`${selectedObservations.size} of ${findingIds.length} findings flagged`} />
        </div>
      </section>

      <div className="workspace-grid">
        <aside className="panel osi-panel" aria-labelledby="osi-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">REFERENCE MODEL</p>
              <h2 id="osi-heading">OSI layers</h2>
            </div>
            <Layers3 aria-hidden="true" />
          </div>
          <p className="panel-hint">Select a layer to focus the architecture.</p>
          <div className="osi-stack">
            {osiLayers.map((layer) => {
              const isSelected = selectedLayer === layer.number;
              return (
                <button
                  className={`osi-layer ${isSelected ? "is-selected" : ""}`}
                  key={layer.number}
                  onClick={() => setSelectedLayer(isSelected ? null : layer.number)}
                  style={{ "--layer-color": layer.color } as CSSProperties}
                  aria-pressed={isSelected}
                >
                  <span className="layer-number">L{layer.number}</span>
                  <span className="layer-copy">
                    <strong>{layer.name}</strong>
                    <small>{layer.examples}</small>
                  </span>
                  <ChevronRight />
                </button>
              );
            })}
          </div>
          <div className="osi-tip">
            <Lightbulb />
            <p><strong>Think in layers.</strong> A secure application can still be reached through a weak network rule.</p>
          </div>
        </aside>

        <section className="panel topology-panel" aria-labelledby="topology-heading">
          <div className="panel-heading topology-heading">
            <div>
              <p className="eyebrow">LIVE ARCHITECTURE</p>
              <h2 id="topology-heading">Network topology</h2>
            </div>
            <div className="map-legend" aria-label="Topology legend">
              <span><i className="legend-line" /> Connection</span>
              <span><i className="legend-flag" /> Flagged evidence</span>
            </div>
          </div>

          {pathMode && (
            <div className="path-mode-banner">
              <Crosshair />
              <span>Select {correctAttackPath.length} devices in order, beginning outside the network.</span>
              <button onClick={() => { setPathMode(false); setAttackPath([]); setPathResult(null); }} aria-label="Exit path mode"><X /></button>
            </div>
          )}

          <div className="topology-scroll">
            <div className="topology-canvas">
              <div className="zone zone-external"><span>UNTRUSTED</span></div>
              <div className="zone zone-perimeter"><span>PERIMETER</span></div>
              <div className="zone zone-dmz"><span>DMZ · 10.10.10.0/24</span></div>
              <div className="zone zone-internal"><span>INTERNAL NETWORK</span></div>

              <svg className="topology-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {edges.map((edge) => {
                  const from = devices.find((device) => device.id === edge.from)!;
                  const to = devices.find((device) => device.id === edge.to)!;
                  const isActive = activeDeviceId === from.id || activeDeviceId === to.id ||
                    (pathMode && attackPath.includes(from.id) && attackPath.includes(to.id));
                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={from.position.x}
                      y1={from.position.y}
                      x2={to.position.x}
                      y2={to.position.y}
                      className={isActive ? "is-active" : ""}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>

              {edges.map((edge) => {
                const from = devices.find((device) => device.id === edge.from)!;
                const to = devices.find((device) => device.id === edge.to)!;
                return (
                  <span
                    className="flow-label"
                    key={`label-${edge.from}-${edge.to}`}
                    style={{
                      left: `${(from.position.x + to.position.x) / 2}%`,
                      top: `${(from.position.y + to.position.y) / 2}%`,
                    }}
                  >
                    {edge.label}
                  </span>
                );
              })}

              {devices.map((device) => {
                const Icon = icons[device.icon];
                const flaggedOnDevice = device.observations.filter((observation) => selectedObservations.has(observation.id)).length;
                const pathStep = attackPath.indexOf(device.id);
                const isDimmed = selectedLayer !== null && !device.layers.includes(selectedLayer);
                return (
                  <button
                    className={`device-node zone-${device.zone.toLowerCase().replace(" ", "-")} ${
                      activeDeviceId === device.id ? "is-active" : ""
                    } ${isDimmed ? "is-dimmed" : ""} ${pathStep >= 0 ? "is-path" : ""}`}
                    key={device.id}
                    style={{ left: `${device.position.x}%`, top: `${device.position.y}%` }}
                    onClick={() => handleDeviceClick(device.id)}
                    aria-label={`${pathMode ? "Add to attack path" : "Inspect"} ${device.name}, ${device.role}`}
                  >
                    <span className="device-icon"><Icon /></span>
                    <span className="device-copy"><strong>{device.name}</strong><small>{device.role}</small></span>
                    {flaggedOnDevice > 0 && !pathMode && <span className="node-flag">{flaggedOnDevice}</span>}
                    {pathStep >= 0 && <span className="path-step">{pathStep + 1}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="topology-footer">
            <span><CircleDot /> Click a device to inspect its services and evidence.</span>
            {selectedLayer && (
              <button className="focus-chip" onClick={() => setSelectedLayer(null)}>Showing Layer {selectedLayer} <X /></button>
            )}
          </div>
        </section>

        <aside className="panel notebook-panel" aria-labelledby="notebook-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ANALYST WORKSPACE</p>
              <h2 id="notebook-heading">Field notebook</h2>
            </div>
            <Flag aria-hidden="true" />
          </div>

          <section className="notebook-section">
            <div className="section-kicker"><Search /> Suspected findings</div>
            {selectedItems.length === 0 ? (
              <div className="empty-notebook">
                <Eye />
                <p>No evidence flagged yet.</p>
                <span>Open a device and select anything you believe creates risk.</span>
              </div>
            ) : (
              <div className="finding-list">
                {selectedItems.map(({ observation, device }, index) => (
                  <button key={observation.id} onClick={() => setActiveDeviceId(device.id)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span><strong>{device.name}</strong><small>{observation.text}</small></span>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            )}
          </section>

          {assessment && (
            <section className={`assessment-result ${assessment.missed === 0 && assessment.incorrect === 0 ? "is-perfect" : ""}`}>
              <div className="score-ring"><strong>{assessment.score}</strong><span>/100</span></div>
              <div>
                <strong>{assessment.missed === 0 && assessment.incorrect === 0 ? "Assessment complete" : "Keep investigating"}</strong>
                <p>{assessment.correct} verified · {assessment.incorrect} false positive · {assessment.missed} still hidden</p>
              </div>
            </section>
          )}

          <div className="assessment-actions">
            <Button onClick={submitAssessment} disabled={selectedObservations.size === 0}><ShieldCheck /> Submit assessment</Button>
            {assessment && (
              <Button variant="outline" onClick={() => setReveal((current) => !current)}><Eye /> {reveal ? "Hide debrief" : "Reveal debrief"}</Button>
            )}
          </div>

          <section className="attack-card">
            <div className="attack-card-heading">
              <div className="attack-icon"><Route /></div>
              <div><p className="eyebrow">ATTACK VECTOR</p><h3>Trace a path to DB-01</h3></div>
            </div>
            <p>Choose the four devices an external attacker would cross in the most direct route.</p>

            <div className="path-slots" aria-label="Selected attack path">
              {Array.from({ length: correctAttackPath.length }).map((_, index) => {
                const device = devices.find((item) => item.id === attackPath[index]);
                return (
                  <div className={device ? "is-filled" : ""} key={index}>
                    <span>{index + 1}</span><strong>{device?.name ?? "Select"}</strong>
                    {index < correctAttackPath.length - 1 && <ArrowRight />}
                  </div>
                );
              })}
            </div>

            {pathResult && (
              <div className={`path-feedback ${pathResult}`}>
                {pathResult === "correct" ? <Check /> : <AlertTriangle />}
                <span>{pathResult === "correct" ? "Valid path. Now connect it to the evidence you found." : "That route breaks the observed traffic flow. Try again."}</span>
              </div>
            )}

            {!pathMode ? (
              <Button variant="outline" onClick={() => { setPathMode(true); setAttackPath([]); setPathResult(null); }}><Crosshair /> Build attack path</Button>
            ) : (
              <div className="path-actions">
                <Button onClick={checkAttackPath} disabled={attackPath.length < correctAttackPath.length}>Check path</Button>
                <Button variant="ghost" onClick={() => { setAttackPath([]); setPathResult(null); }}>Clear</Button>
              </div>
            )}
          </section>

          <div className="attempt-counter">Assessment attempts: {attempts}</div>
        </aside>
      </div>

      <footer className="status-footer">
        <span><ShieldCheck /> Training environment · no live systems</span>
        <span>Northstar Logistics · Architecture snapshot 2026-08-18</span>
      </footer>

      <Sheet open={Boolean(activeDevice)} onOpenChange={(open) => !open && setActiveDeviceId(null)}>
        <SheetContent className="device-sheet sm:max-w-2xl">
          {activeDevice && (
            <>
              <SheetHeader className="device-sheet-header">
                <div className="sheet-title-row">
                  <div className="sheet-device-icon">{(() => { const Icon = icons[activeDevice.icon]; return <Icon />; })()}</div>
                  <div>
                    <Badge variant="outline" className="zone-badge">{activeDevice.zone}</Badge>
                    <SheetTitle>{activeDevice.name}</SheetTitle>
                    <SheetDescription>{activeDevice.role} · {activeDevice.ip}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="evidence" className="device-tabs">
                <TabsList variant="line" className="device-tabs-list">
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>

                <TabsContent value="evidence" className="tab-scroll">
                  <div className="evidence-intro">
                    <div><p className="eyebrow">OBSERVED CONFIGURATION</p><h3>What deserves investigation?</h3></div>
                    <span>{activeDevice.observations.filter((item) => selectedObservations.has(item.id)).length} flagged</span>
                  </div>
                  <p className="evidence-guidance">Select suspicious evidence. Normal or protective controls are deliberately mixed in.</p>

                  <div className="evidence-list">
                    {activeDevice.observations.map((observation) => {
                      const isSelected = selectedObservations.has(observation.id);
                      const answerClass = reveal ? (observation.isFinding ? "is-finding" : "is-safe") : "";
                      return (
                        <div className={`evidence-item ${isSelected ? "is-selected" : ""} ${answerClass}`} key={observation.id}>
                          <button onClick={() => toggleObservation(observation.id)} aria-pressed={isSelected}>
                            <span className="evidence-check">{isSelected ? <Flag /> : null}</span>
                            <span className="evidence-copy"><code>{observation.text}</code><small>{observation.context}</small></span>
                            <span className="layer-tag">L{observation.layer}</span>
                          </button>
                          {reveal && (
                            <div className="debrief-copy">
                              <div className="answer-label">
                                {observation.isFinding ? <AlertTriangle /> : <Check />}
                                {observation.isFinding ? `${severityLabel(observation.severity)} finding` : "Protective or neutral control"}
                              </div>
                              {observation.isFinding && (
                                <><p>{observation.explanation}</p><p><strong>Mitigation:</strong> {observation.remediation}</p></>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="snapshot" className="tab-scroll">
                  <div className="snapshot-grid">
                    <div><span>Address</span><strong>{activeDevice.ip}</strong></div>
                    <div><span>Zone</span><strong>{activeDevice.zone}</strong></div>
                    <div><span>Platform</span><strong>{activeDevice.platform}</strong></div>
                    <div><span>Owner</span><strong>{activeDevice.owner}</strong></div>
                  </div>
                  <div className="service-block">
                    <p className="eyebrow">DISCOVERED SERVICES</p>
                    <div className="service-list">{activeDevice.services.map((service) => <code key={service}>{service}</code>)}</div>
                  </div>
                  <div className="layer-block">
                    <p className="eyebrow">RELEVANT OSI LAYERS</p>
                    <div>
                      {activeDevice.layers.map((layer) => (
                        <span key={layer} style={{ "--layer-dot": osiLayers.find((item) => item.number === layer)?.color } as CSSProperties}>
                          L{layer} {osiLayers.find((item) => item.number === layer)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="connections" className="tab-scroll">
                  <div className="connection-list">
                    {activeDevice.connections.map((connection) => (
                      <div key={`${activeDevice.id}-${connection.device}`}>
                        <span className="connection-icon"><Network /></span>
                        <span><strong>{connection.device}</strong><small>{connection.purpose}</small></span>
                        <ArrowRight />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}

