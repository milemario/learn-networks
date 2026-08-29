export type Severity = "critical" | "high" | "medium";

export type Observation = {
  id: string;
  text: string;
  context: string;
  isFinding: boolean;
  severity?: Severity;
  layer: number;
  explanation?: string;
  remediation?: string;
};

export type Device = {
  id: string;
  name: string;
  role: string;
  zone: string;
  ip: string;
  platform: string;
  owner: string;
  icon: "globe" | "shield" | "server" | "router" | "database" | "drive" | "monitor" | "laptop" | "wifi";
  position: { x: number; y: number };
  layers: number[];
  services: string[];
  connections: { device: string; purpose: string }[];
  observations: Observation[];
};

export const osiLayers = [
  { number: 7, name: "Application", examples: "HTTP · DNS · SMB", color: "#a78bfa" },
  { number: 6, name: "Presentation", examples: "TLS · encoding", color: "#c084fc" },
  { number: 5, name: "Session", examples: "sessions · RPC", color: "#e879f9" },
  { number: 4, name: "Transport", examples: "TCP · UDP · ports", color: "#fb923c" },
  { number: 3, name: "Network", examples: "IP · routing", color: "#facc15" },
  { number: 2, name: "Data link", examples: "MAC · VLAN · Wi-Fi", color: "#34d399" },
  { number: 1, name: "Physical", examples: "cable · radio", color: "#22d3ee" },
];

export const devices: Device[] = [
  {
    id: "internet",
    name: "Internet",
    role: "Untrusted network",
    zone: "External",
    ip: "0.0.0.0/0",
    platform: "Public networks",
    owner: "External",
    icon: "globe",
    position: { x: 7, y: 50 },
    layers: [1, 2, 3],
    services: ["Untrusted traffic", "Public DNS"],
    connections: [{ device: "EDGE-FW", purpose: "WAN uplink" }],
    observations: [
      {
        id: "internet-boundary",
        text: "All inbound traffic crosses the managed perimeter",
        context: "Network boundary inventory",
        isFinding: false,
        layer: 3,
      },
    ],
  },
  {
    id: "edge-fw",
    name: "EDGE-FW",
    role: "Perimeter firewall",
    zone: "Perimeter",
    ip: "203.0.113.10",
    platform: "NGFW 9.1",
    owner: "Network team",
    icon: "shield",
    position: { x: 24, y: 50 },
    layers: [3, 4],
    services: ["TCP/22", "TCP/80", "IPsec VPN"],
    connections: [
      { device: "Internet", purpose: "WAN" },
      { device: "WEB-01", purpose: "Published service" },
      { device: "CORE-SW", purpose: "Internal transit" },
    ],
    observations: [
      {
        id: "fw-any-ssh",
        text: "Rule 07: ANY → WEB-01 TCP/22 ALLOW",
        context: "Active rule · 4,218 matches in the last 24 hours",
        isFinding: true,
        severity: "critical",
        layer: 4,
        explanation: "SSH is exposed to every internet source, creating a direct brute-force and credential-stuffing path to the web server.",
        remediation: "Restrict SSH to a managed jump host or VPN range and require key-based authentication.",
      },
      {
        id: "fw-default-deny",
        text: "Default inbound policy: DENY",
        context: "Applied after explicit allow rules",
        isFinding: false,
        layer: 4,
      },
      {
        id: "fw-admin-bound",
        text: "Administrative UI bound to 10.20.0.1 only",
        context: "Not reachable on the WAN interface",
        isFinding: false,
        layer: 3,
      },
    ],
  },
  {
    id: "web-01",
    name: "WEB-01",
    role: "Customer portal",
    zone: "DMZ",
    ip: "10.10.10.21",
    platform: "Ubuntu 18.04 · nginx 1.14.0",
    owner: "Application team",
    icon: "server",
    position: { x: 43, y: 25 },
    layers: [4, 5, 6, 7],
    services: ["TCP/22 SSH", "TCP/80 HTTP"],
    connections: [
      { device: "EDGE-FW", purpose: "Inbound web and SSH" },
      { device: "DB-01", purpose: "Application queries" },
    ],
    observations: [
      {
        id: "web-http",
        text: "HTTP/80 active; HTTPS listener absent",
        context: "Login and customer forms use this listener",
        isFinding: true,
        severity: "high",
        layer: 6,
        explanation: "Credentials and session data can traverse the network without transport encryption and may be intercepted or modified.",
        remediation: "Enable modern TLS, redirect HTTP to HTTPS, and deploy HSTS after validation.",
      },
      {
        id: "web-version",
        text: "Server header returns nginx/1.14.0",
        context: "Observed in every HTTP response",
        isFinding: true,
        severity: "medium",
        layer: 7,
        explanation: "The service discloses a legacy version, helping attackers target known weaknesses and confirming an unsupported baseline.",
        remediation: "Upgrade to a supported release and suppress unnecessary version banners.",
      },
      {
        id: "web-shell",
        text: "Service account web_svc has /usr/sbin/nologin",
        context: "Account record reviewed locally",
        isFinding: false,
        layer: 7,
      },
    ],
  },
  {
    id: "core-sw",
    name: "CORE-SW",
    role: "Core switch",
    zone: "Internal",
    ip: "10.20.0.2",
    platform: "48-port managed switch",
    owner: "Network team",
    icon: "router",
    position: { x: 43, y: 68 },
    layers: [1, 2, 3],
    services: ["802.1Q trunks", "SSH management"],
    connections: [
      { device: "EDGE-FW", purpose: "Perimeter transit" },
      { device: "DB-01", purpose: "Server VLAN" },
      { device: "FS-01", purpose: "Server VLAN" },
      { device: "PC-07", purpose: "User VLAN" },
      { device: "ADMIN-01", purpose: "User VLAN" },
      { device: "AP-01", purpose: "802.1Q trunk" },
    ],
    observations: [
      {
        id: "switch-open-ports",
        text: "Gi0/18–24: access VLAN 20; port security disabled",
        context: "Unused ports remain physically active",
        isFinding: true,
        severity: "medium",
        layer: 2,
        explanation: "An unauthorised device can be connected to an unused office port and immediately join the employee VLAN.",
        remediation: "Disable unused ports and apply 802.1X or port security to active access ports.",
      },
      {
        id: "switch-bpdu",
        text: "BPDU Guard enabled on access ports",
        context: "Violation automatically err-disables the port",
        isFinding: false,
        layer: 2,
      },
      {
        id: "switch-ssh",
        text: "Management protocol: SSHv2 only",
        context: "Telnet service disabled",
        isFinding: false,
        layer: 7,
      },
    ],
  },
  {
    id: "db-01",
    name: "DB-01",
    role: "Finance database",
    zone: "Server VLAN",
    ip: "10.30.0.12",
    platform: "Rocky Linux · MySQL 5.7",
    owner: "Database team",
    icon: "database",
    position: { x: 65, y: 22 },
    layers: [4, 5, 6, 7],
    services: ["TCP/3306 MySQL", "TCP/22 SSH"],
    connections: [
      { device: "WEB-01", purpose: "Application queries" },
      { device: "CORE-SW", purpose: "Server VLAN" },
    ],
    observations: [
      {
        id: "db-wide-source",
        text: "TCP/3306 accepts 10.10.10.0/24",
        context: "The entire DMZ subnet is permitted",
        isFinding: true,
        severity: "high",
        layer: 4,
        explanation: "Any compromised DMZ host can reach the database instead of only the authorised application host.",
        remediation: "Allow the minimum required source host and enforce an authenticated application path.",
      },
      {
        id: "db-remote-root",
        text: "Database account root@'%' permits password login",
        context: "Host wildcard found in mysql.user",
        isFinding: true,
        severity: "critical",
        layer: 7,
        explanation: "The database superuser can authenticate remotely from any permitted network, magnifying credential compromise.",
        remediation: "Remove remote root access and use named, least-privileged service and admin accounts.",
      },
      {
        id: "db-encryption",
        text: "Storage encryption: AES-256 enabled",
        context: "Key stored in the enterprise key manager",
        isFinding: false,
        layer: 6,
      },
    ],
  },
  {
    id: "fs-01",
    name: "FS-01",
    role: "Shared file server",
    zone: "Server VLAN",
    ip: "10.30.0.18",
    platform: "Windows Server 2016",
    owner: "Workplace team",
    icon: "drive",
    position: { x: 85, y: 22 },
    layers: [4, 5, 6, 7],
    services: ["TCP/445 SMB", "TCP/5985 WinRM"],
    connections: [{ device: "CORE-SW", purpose: "Server VLAN" }],
    observations: [
      {
        id: "fs-smb1",
        text: "SMBv1 enabled for legacy scanner compatibility",
        context: "Server feature installed and active",
        isFinding: true,
        severity: "high",
        layer: 5,
        explanation: "SMBv1 is obsolete and exposes the server to well-known exploitation and lateral-movement techniques.",
        remediation: "Remove SMBv1 and isolate the legacy transfer workflow.",
      },
      {
        id: "fs-anonymous",
        text: "\\\\FS-01\\public permits anonymous read",
        context: "Guest access succeeds from the employee VLAN",
        isFinding: true,
        severity: "medium",
        layer: 7,
        explanation: "Unauthenticated users can collect shared files that may contain internal or sensitive information.",
        remediation: "Require authentication and review share and NTFS permissions against business need.",
      },
      {
        id: "fs-backup",
        text: "Nightly backup completed successfully at 02:00",
        context: "Restore test passed this quarter",
        isFinding: false,
        layer: 7,
      },
    ],
  },
  {
    id: "pc-07",
    name: "PC-07",
    role: "Employee workstation",
    zone: "User VLAN",
    ip: "10.20.0.57",
    platform: "Windows 11 23H2",
    owner: "Finance user",
    icon: "monitor",
    position: { x: 65, y: 68 },
    layers: [1, 2, 3, 4, 5, 6, 7],
    services: ["DHCP client", "SMB client", "HTTPS"],
    connections: [
      { device: "CORE-SW", purpose: "Employee access" },
      { device: "FS-01", purpose: "Shared files" },
    ],
    observations: [
      {
        id: "pc-patching",
        text: "Last successful security update: 141 days ago",
        context: "Update agent reports error 0x8024401c",
        isFinding: true,
        severity: "high",
        layer: 7,
        explanation: "The workstation is missing months of security fixes and is more likely to be compromised through malicious content.",
        remediation: "Repair update management, isolate if necessary, and restore the approved patch baseline.",
      },
      {
        id: "pc-macros",
        text: "Office macros from the internet: blocked",
        context: "Policy applied successfully",
        isFinding: false,
        layer: 7,
      },
      {
        id: "pc-edr",
        text: "EDR sensor healthy; tamper protection on",
        context: "Last check-in two minutes ago",
        isFinding: false,
        layer: 7,
      },
    ],
  },
  {
    id: "admin-01",
    name: "ADMIN-01",
    role: "Administrator laptop",
    zone: "User VLAN",
    ip: "10.20.0.9",
    platform: "Windows 11 Enterprise",
    owner: "IT administrator",
    icon: "laptop",
    position: { x: 85, y: 68 },
    layers: [1, 2, 3, 4, 5, 6, 7],
    services: ["TCP/3389 RDP", "PowerShell Remoting"],
    connections: [
      { device: "CORE-SW", purpose: "Administration" },
      { device: "DB-01", purpose: "Privileged support" },
      { device: "FS-01", purpose: "Privileged support" },
    ],
    observations: [
      {
        id: "admin-rdp",
        text: "RDP/3389 reachable from User VLAN; NLA disabled",
        context: "Host firewall rule applies to 10.20.0.0/24",
        isFinding: true,
        severity: "high",
        layer: 5,
        explanation: "A compromised employee endpoint can reach a privileged laptop's RDP service without Network Level Authentication.",
        remediation: "Separate privileged administration, restrict RDP sources, and enable NLA with MFA-backed access.",
      },
      {
        id: "admin-laps",
        text: "Local administrator password rotated every 24 hours",
        context: "Managed by Windows LAPS",
        isFinding: false,
        layer: 7,
      },
      {
        id: "admin-mfa",
        text: "MFA enforced for VPN sign-in",
        context: "Conditional access policy enabled",
        isFinding: false,
        layer: 7,
      },
    ],
  },
  {
    id: "ap-01",
    name: "AP-01",
    role: "Wireless access point",
    zone: "User VLAN",
    ip: "10.20.0.31",
    platform: "Dual-band Wi-Fi 5 AP",
    owner: "Network team",
    icon: "wifi",
    position: { x: 75, y: 88 },
    layers: [1, 2, 3],
    services: ["CorpWiFi", "GuestNet", "802.1Q uplink"],
    connections: [{ device: "CORE-SW", purpose: "Tagged uplink" }],
    observations: [
      {
        id: "ap-wps",
        text: "WPS PIN mode enabled on CorpWiFi",
        context: "Configured for rapid printer onboarding",
        isFinding: true,
        severity: "high",
        layer: 2,
        explanation: "WPS PIN authentication weakens the wireless boundary and may allow recovery of network access credentials.",
        remediation: "Disable WPS and onboard managed devices through the approved enterprise process.",
      },
      {
        id: "ap-flat-guest",
        text: "GuestNet mapped to VLAN 20, shared with employees",
        context: "Client isolation on; network isolation absent",
        isFinding: true,
        severity: "critical",
        layer: 2,
        explanation: "Guest devices land on the employee network, bypassing the intended trust boundary and exposing internal hosts.",
        remediation: "Place guests in a dedicated VLAN with internet-only firewall policy and no internal routes.",
      },
      {
        id: "ap-crypto",
        text: "Wireless encryption: WPA2-AES",
        context: "TKIP and open authentication disabled",
        isFinding: false,
        layer: 2,
      },
    ],
  },
];

export const edges = [
  { from: "internet", to: "edge-fw", label: "WAN" },
  { from: "edge-fw", to: "web-01", label: "22 · 80" },
  { from: "edge-fw", to: "core-sw", label: "transit" },
  { from: "web-01", to: "db-01", label: "3306" },
  { from: "core-sw", to: "db-01", label: "server" },
  { from: "core-sw", to: "fs-01", label: "445" },
  { from: "core-sw", to: "pc-07", label: "access" },
  { from: "core-sw", to: "admin-01", label: "access" },
  { from: "core-sw", to: "ap-01", label: "trunk" },
];

export const findingIds = devices.flatMap((device) =>
  device.observations.filter((observation) => observation.isFinding).map((observation) => observation.id),
);

export const correctAttackPath = ["internet", "edge-fw", "web-01", "db-01"];

