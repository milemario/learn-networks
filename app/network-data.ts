export type RepairKind = "physical" | "configuration" | "process";

export type FixOption = {
  id: string;
  kind: RepairKind;
  label: string;
  detail: string;
  correct: boolean;
};

export type Bug = {
  id: string;
  deviceId: string;
  severity: "critical" | "high" | "medium";
  title: string;
  summary: string;
  evidence: string;
  risk: string;
  reportFinding: string;
  reportHint: string;
  fixes: FixOption[];
  hardFixes?: FixOption[];
};

export type NetworkNode = {
  id: string;
  name: string;
  role: string;
  zone: "outside" | "perimeter" | "dmz" | "internal";
  ip: string;
  icon: "globe" | "shield" | "server" | "switch" | "database" | "computer" | "laptop" | "wifi" | "terminal";
  position: { x: number; y: number };
};

export const tcpIpLayers = [
  { name: "Application", examples: "HTTP · DNS · SMB", note: "What the service says" },
  { name: "Transport", examples: "TCP · UDP · ports", note: "How sessions travel" },
  { name: "Internet", examples: "IP · routing · ACLs", note: "Where packets go" },
  { name: "Link", examples: "Ethernet · VLAN · Wi-Fi", note: "How devices connect" },
];

export const securityChain = [
  { name: "Asset", text: "Finance data" },
  { name: "Threat", text: "External attacker" },
  { name: "Vulnerability", text: "Weak control" },
  { name: "Risk", text: "Loss or misuse" },
  { name: "Control", text: "Repair choice" },
  { name: "Residual risk", text: "Retest result" },
];

export const nodes: NetworkNode[] = [
  { id: "pentest-box", name: "PENTEST-BOX", role: "Authorised test console", zone: "outside", ip: "198.51.100.44", icon: "terminal", position: { x: 8, y: 78 } },
  { id: "internet", name: "INTERNET", role: "Untrusted network", zone: "outside", ip: "0.0.0.0/0", icon: "globe", position: { x: 8, y: 34 } },
  { id: "edge-fw", name: "EDGE-FW", role: "Perimeter firewall", zone: "perimeter", ip: "203.0.113.10", icon: "shield", position: { x: 26, y: 51 } },
  { id: "web-01", name: "WEB-01", role: "Customer portal", zone: "dmz", ip: "10.10.10.21", icon: "server", position: { x: 46, y: 25 } },
  { id: "core-sw", name: "CORE-SW", role: "Managed switch", zone: "internal", ip: "10.20.0.2", icon: "switch", position: { x: 46, y: 69 } },
  { id: "db-01", name: "DB-01", role: "Finance database", zone: "internal", ip: "10.30.0.12", icon: "database", position: { x: 68, y: 22 } },
  { id: "fs-01", name: "FS-01", role: "Shared file server", zone: "internal", ip: "10.30.0.18", icon: "server", position: { x: 88, y: 22 } },
  { id: "pc-07", name: "PC-07", role: "Employee workstation", zone: "internal", ip: "10.20.0.57", icon: "computer", position: { x: 68, y: 68 } },
  { id: "admin-01", name: "ADMIN-01", role: "Administrator laptop", zone: "internal", ip: "10.20.0.9", icon: "laptop", position: { x: 88, y: 68 } },
  { id: "ap-01", name: "AP-01", role: "Wireless access point", zone: "internal", ip: "10.20.0.31", icon: "wifi", position: { x: 78, y: 88 } },
];

export const edges = [
  { from: "pentest-box", to: "internet", label: "authorised probe" },
  { from: "internet", to: "edge-fw", label: "WAN" },
  { from: "edge-fw", to: "web-01", label: "22 · 80" },
  { from: "edge-fw", to: "core-sw", label: "transit" },
  { from: "web-01", to: "db-01", label: "3306" },
  { from: "core-sw", to: "db-01", label: "server VLAN" },
  { from: "core-sw", to: "fs-01", label: "445" },
  { from: "core-sw", to: "pc-07", label: "access" },
  { from: "core-sw", to: "admin-01", label: "access" },
  { from: "core-sw", to: "ap-01", label: "802.1Q" },
];

export const bugs: Bug[] = [
  {
    id: "fw-ssh",
    deviceId: "edge-fw",
    severity: "critical",
    title: "Internet-facing SSH rule",
    summary: "A perimeter rule exposes the web server's administration port to every source on the internet.",
    evidence: "Rule 07 · ANY → WEB-01 · TCP/22 · ALLOW",
    risk: "Brute-force or credential-stuffing traffic can reach a DMZ administration service.",
    reportFinding: "External SSH exposure remains reachable from the test console.",
    reportHint: "The perimeter rule still needs a narrower source range.",
    fixes: [
      { id: "fw-vpn", kind: "configuration", label: "Restrict SSH to the admin VPN", detail: "Allow TCP/22 only from the managed jump host and VPN address pool.", correct: true },
      { id: "fw-cable", kind: "physical", label: "Move the firewall to a new rack", detail: "A different rack position does not change the traffic policy.", correct: false },
      { id: "fw-name", kind: "configuration", label: "Rename the rule to 'secure-ssh'", detail: "A clearer label improves documentation but does not reduce exposure.", correct: false },
    ],
    hardFixes: [
      { id: "hard-fw-vpn", kind: "configuration", label: "Restrict TCP/22 to the admin VPN", detail: "Allow the service only from the managed jump host and VPN address pool.", correct: true },
      { id: "hard-fw-bastion", kind: "process", label: "Remove public SSH and use a bastion host", detail: "Terminate administrative access on a jump host with no internet-facing SSH listener.", correct: true },
      { id: "hard-fw-port", kind: "configuration", label: "Move SSH to a high port", detail: "Change the listening port while keeping the public source range.", correct: false },
    ],
  },
  {
    id: "web-tls",
    deviceId: "web-01",
    severity: "high",
    title: "Customer portal without TLS",
    summary: "The login form is served over HTTP, so credentials and sessions are not protected in transit.",
    evidence: "TCP/80 active · HTTPS listener absent · redirect disabled",
    risk: "A network observer can read or modify customer traffic between the browser and the portal.",
    reportFinding: "The portal still accepts unencrypted customer traffic.",
    reportHint: "The service needs a real encrypted listener and redirect.",
    fixes: [
      { id: "web-cert", kind: "configuration", label: "Enable TLS and redirect HTTP", detail: "Install a certificate, enable HTTPS, redirect port 80, and add HSTS after validation.", correct: true },
      { id: "web-room", kind: "physical", label: "Move the server into a locked room", detail: "Physical access control cannot encrypt a customer's network session.", correct: false },
      { id: "web-nic", kind: "physical", label: "Install a faster network card", detail: "More throughput does not provide confidentiality or integrity.", correct: false },
    ],
    hardFixes: [
      { id: "hard-web-proxy", kind: "configuration", label: "Terminate TLS on a reverse proxy", detail: "The proxy serves HTTPS, forwards safely to WEB-01, and blocks direct public HTTP.", correct: true },
      { id: "hard-web-direct", kind: "configuration", label: "Enable HTTPS directly on WEB-01", detail: "Serve the portal over TLS and redirect every HTTP request to HTTPS.", correct: true },
      { id: "hard-web-banner", kind: "configuration", label: "Keep HTTP and add a security banner", detail: "Add a warning to the login page without changing the transport path.", correct: false },
    ],
  },
  {
    id: "db-acl",
    deviceId: "db-01",
    severity: "critical",
    title: "Database trusts the whole DMZ",
    summary: "The finance database accepts connections from every host in the DMZ instead of the application server only.",
    evidence: "TCP/3306 · source 10.10.10.0/24 · ACCEPT",
    risk: "One compromised DMZ host can probe the finance database directly.",
    reportFinding: "The database remains reachable from more hosts than the application needs.",
    reportHint: "Replace the subnet-wide allow rule with a host-specific trust boundary.",
    fixes: [
      { id: "db-host-acl", kind: "configuration", label: "Allow DB traffic from WEB-01 only", detail: "Replace the /24 source with 10.10.10.21 and keep the required application port.", correct: true },
      { id: "db-switch", kind: "physical", label: "Put DB-01 on a second switch", detail: "A second switch alone does not create a routed security boundary.", correct: false },
      { id: "db-port", kind: "configuration", label: "Move MySQL to TCP/3307", detail: "Changing a port can obscure a service but does not enforce least privilege.", correct: false },
    ],
    hardFixes: [
      { id: "hard-db-host-acl", kind: "configuration", label: "Permit TCP/3306 from WEB-01 only", detail: "Replace the subnet source with 10.10.10.21 and retain the application port.", correct: true },
      { id: "hard-db-vlan", kind: "configuration", label: "Move DB-01 to an isolated VLAN", detail: "Change the segment while leaving the current broad source rule in place.", correct: false },
      { id: "hard-db-port", kind: "configuration", label: "Hide MySQL behind a nonstandard port", detail: "Change the listener port without narrowing the trusted sources.", correct: false },
    ],
  },
  {
    id: "wifi-guest",
    deviceId: "ap-01",
    severity: "critical",
    title: "Guest Wi-Fi shares the employee VLAN",
    summary: "Visitors receive addresses on VLAN 20, the same segment used by employee endpoints.",
    evidence: "GuestNet → VLAN 20 · client isolation ON · network isolation OFF",
    risk: "An untrusted guest device can discover and attack internal hosts.",
    reportFinding: "A guest client can still reach the employee network.",
    reportHint: "The guest SSID needs a separate segment and an internet-only policy.",
    fixes: [
      { id: "wifi-vlan", kind: "configuration", label: "Create an isolated guest VLAN", detail: "Map GuestNet to a dedicated VLAN and block routes to internal address space.", correct: true },
      { id: "wifi-move", kind: "physical", label: "Move AP-01 to the ceiling", detail: "Changing the access point's position does not change its VLAN mapping.", correct: false },
      { id: "wifi-pass", kind: "configuration", label: "Use a longer guest password", detail: "A strong password cannot compensate for a missing network boundary.", correct: false },
    ],
    hardFixes: [
      { id: "hard-wifi-vlan", kind: "configuration", label: "Map GuestNet to an internet-only VLAN", detail: "Assign a dedicated segment and deny routes to employee and server networks.", correct: true },
      { id: "hard-wifi-zone", kind: "configuration", label: "Place GuestNet in a separate firewall zone", detail: "Apply an explicit deny-internal policy while retaining internet access.", correct: true },
      { id: "hard-wifi-pass", kind: "configuration", label: "Increase the guest password length", detail: "Strengthen authentication without changing the shared network segment.", correct: false },
    ],
  },
  {
    id: "switch-ports",
    deviceId: "core-sw",
    severity: "medium",
    title: "Unused wall ports are live",
    summary: "Seven access ports are active in the employee VLAN and have no port-security policy.",
    evidence: "Gi0/18–24 · access VLAN 20 · port-security DISABLED",
    risk: "Someone with physical access can plug in a rogue device and join the employee segment.",
    reportFinding: "An untrusted device can still attach through an unused wall port.",
    reportHint: "The physical access path itself must be closed or controlled.",
    fixes: [
      { id: "switch-shut", kind: "physical", label: "Disable unused ports and lock patch points", detail: "Administratively shut unused ports and secure the accessible patch-panel outlets.", correct: true },
      { id: "switch-more", kind: "physical", label: "Add another access switch", detail: "More ports increase capacity but do not reduce the open-port exposure.", correct: false },
      { id: "switch-label", kind: "configuration", label: "Rename VLAN 20 to 'trusted'", detail: "A label has no effect on who can connect to the VLAN.", correct: false },
    ],
    hardFixes: [
      { id: "hard-switch-shut", kind: "physical", label: "Close unused access ports and secure patch points", detail: "Shut unused ports and secure the accessible patch-panel outlets.", correct: true },
      { id: "hard-switch-auth", kind: "configuration", label: "Require 802.1X and port security", detail: "Authenticate clients and limit learned MAC addresses on every access port.", correct: true },
      { id: "hard-switch-label", kind: "configuration", label: "Rename VLAN 20 to 'trusted'", detail: "Change the label while leaving physical access and admission rules unchanged.", correct: false },
    ],
  },
  {
    id: "fileshare",
    deviceId: "fs-01",
    severity: "high",
    title: "Legacy SMB and anonymous share",
    summary: "The file server keeps SMBv1 enabled and exposes the public share to unauthenticated users.",
    evidence: "SMBv1 ENABLED · \\\\FS-01\\public · anonymous READ",
    risk: "An attacker can use an obsolete protocol and collect internal files without an account.",
    reportFinding: "Legacy SMB and anonymous file access are still available.",
    reportHint: "Remove the obsolete protocol and require an identity for the share.",
    fixes: [
      { id: "fileshare-hardening", kind: "configuration", label: "Disable SMBv1 and require authentication", detail: "Remove SMBv1, remove guest access, and review share and NTFS permissions.", correct: true },
      { id: "fileshare-room", kind: "physical", label: "Move the server to a locked room", detail: "Physical protection does not stop remote SMB abuse.", correct: false },
      { id: "fileshare-disk", kind: "physical", label: "Install a larger disk", detail: "More storage does not alter protocol or access permissions.", correct: false },
    ],
    hardFixes: [
      { id: "hard-fileshare-hardening", kind: "configuration", label: "Disable SMBv1 and remove anonymous access", detail: "Retire the legacy protocol and require an identity for every share.", correct: true },
      { id: "hard-fileshare-isolate", kind: "configuration", label: "Isolate FS-01 behind an identity-enforcing gateway", detail: "Require authenticated clients and block legacy SMB at the boundary while it is retired.", correct: true },
      { id: "hard-fileshare-disk", kind: "physical", label: "Move the share to a larger disk", detail: "Change storage capacity without changing protocol or access permissions.", correct: false },
    ],
  },
  {
    id: "admin-rdp",
    deviceId: "admin-01",
    severity: "high",
    title: "Privileged laptop accepts weak RDP",
    summary: "The administrator laptop is reachable from the user VLAN and does not require Network Level Authentication.",
    evidence: "TCP/3389 reachable from 10.20.0.0/24 · NLA DISABLED",
    risk: "A compromised employee endpoint can attack a privileged workstation laterally.",
    reportFinding: "The privileged laptop is still exposed to lateral RDP attempts.",
    reportHint: "Limit the source and require pre-authentication for privileged access.",
    fixes: [
      { id: "admin-nla", kind: "configuration", label: "Restrict RDP and enable NLA", detail: "Permit RDP from the admin jump host only and enforce Network Level Authentication.", correct: true },
      { id: "admin-bag", kind: "physical", label: "Use a privacy screen", detail: "A privacy screen protects shoulder-surfing, not remote access.", correct: false },
      { id: "admin-rack", kind: "physical", label: "Store the laptop in the server rack", detail: "Changing its storage location does not change the network service.", correct: false },
    ],
    hardFixes: [
      { id: "hard-admin-nla", kind: "configuration", label: "Restrict RDP to the admin jump host and require NLA", detail: "Limit the source and enforce Network Level Authentication for the service.", correct: true },
      { id: "hard-admin-remove", kind: "process", label: "Remove RDP from the user VLAN", detail: "Administer through a privileged jump box or local console instead.", correct: true },
      { id: "hard-admin-port", kind: "configuration", label: "Change the RDP port", detail: "Move the listener while keeping it reachable from the user VLAN.", correct: false },
    ],
  },
  {
    id: "pc-patch",
    deviceId: "pc-07",
    severity: "high",
    title: "Workstation missed the patch baseline",
    summary: "The employee workstation has not completed a security update for 141 days.",
    evidence: "Last security update 141 days ago · update error 0x8024401c",
    risk: "A phishing or malicious-content event has a larger chance of becoming endpoint compromise.",
    reportFinding: "The endpoint remains outside the approved patch baseline.",
    reportHint: "Repair the update path and contain the stale endpoint while it catches up.",
    fixes: [
      { id: "pc-patch-channel", kind: "process", label: "Repair patching and isolate until current", detail: "Fix the update channel, quarantine the stale endpoint briefly, then verify the baseline.", correct: true },
      { id: "pc-monitor", kind: "physical", label: "Replace the monitor", detail: "A new display does not install missing security updates.", correct: false },
      { id: "pc-wallpaper", kind: "configuration", label: "Change the desktop wallpaper", detail: "Cosmetic configuration has no patching effect.", correct: false },
    ],
    hardFixes: [
      { id: "hard-pc-patch", kind: "process", label: "Restore patching and quarantine until compliant", detail: "Repair update delivery, quarantine the endpoint, and verify the baseline.", correct: true },
      { id: "hard-pc-remediate", kind: "configuration", label: "Block production access and allow only remediation traffic", detail: "Contain PC-07 on a remediation network until the required updates complete.", correct: true },
      { id: "hard-pc-monitor", kind: "physical", label: "Replace the monitor", detail: "Change the display while leaving the stale endpoint software untouched.", correct: false },
    ],
  },
];
