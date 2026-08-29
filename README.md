# Learn Networks · Network repair lab

An interactive, fictional network-security case study for learners. Students
inspect a small architecture, identify weak controls, choose one of three
repairs, and ask an authorised mock pentester to test the system again.

The lab is intentionally built around two complementary maps:

- **TCP/IP** — Application, Transport, Internet, and Link show where a
  technical control lives.
- **Security chain** — Asset → Threat → Vulnerability → Risk → Control →
  Residual risk shows why the control matters and why a retest is required.

Each issue offers a physical, configuration, or process intervention. Only the
control that closes the modeled path makes that issue pass in the mock report.
The case uses fictional hosts and reserved example IP ranges; it is not an
instruction to probe real systems.

## Run locally

Requires Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To build the static GitHub Pages artifact:

```bash
npm run build:github
```

The generated site is written to `dist-github/` and is deployed by
`.github/workflows/deploy-pages.yml`.

## Publish with GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the Actions tab).

The workflow builds the lightweight Vite entrypoint and publishes it at the
repository Pages URL.

## Design notes

- Device glyphs are a small, vendored subset of the MIT-licensed
  [pixelarticons](https://github.com/halfmage/pixelarticons) set.
- The UI keeps the student loop visible: issue queue → repair bench → mock
  penetration test → findings → retest.
- Use this exercise only for systems you own or are explicitly authorised to
  test. Do not enter credentials or personal data.
