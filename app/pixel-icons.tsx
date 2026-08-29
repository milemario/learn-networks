import type { PropsWithChildren, SVGProps } from "react";

export type PixelIconProps = SVGProps<SVGSVGElement>;

function PixelSvg({ children, ...props }: PropsWithChildren<PixelIconProps>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges" {...props}>
      {children}
    </svg>
  );
}

// Device glyphs are adapted from pixelarticons by halfmage (MIT license).
export function PixelGlobe(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M6 2h12v2H6zm0 18h12v2H6zM4 4h2v2H4zm5 0h2v2H9zm0 14h2v2H9zm4 0h2v2h-2zM7 6h2v12H7zm8 0h2v12h-2zm-2-2h2v2h-2zm7 0h-2v2h2zM2 6h2v12H2zm20 0h-2v12h2zM4 18h2v2H4zm16 0h-2v2h2z"/><path d="M3 11h18v2H3z"/></PixelSvg>;
}

export function PixelShield(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M4 2h16v2H4zM2 4h2v10H2zm18 0h2v10h-2zM4 14h2v2H4zm2 2h2v2H6zm4 4h4v2h-4zm10-6h-2v2h2zm-2 2h-2v2h2zm-2 2h-2v2h2zm-6 0H8v2h2z"/></PixelSvg>;
}

export function PixelServer(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M6 7h4v2H6zm0 8h4v2H6zM2 5h2v14H2zm18 0h2v14h-2zM4 19h16v2H4zM4 3h16v2H4zm0 8h16v2H4z"/></PixelSvg>;
}

export function PixelServerSharp(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M6 7h4v2H6zm0 8h4v2H6zM2 5h2v14H2zm18 0h2v14h-2zM2 19h20v2H2zM2 3h20v2H2zM2 11h20v2H2z"/></PixelSvg>;
}

export function PixelSwitch(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M5 21H3v-2h2v2Zm16 0h-6v-2h2v-2h2v-2h2v6ZM7 19H5v-2h2v2Zm2-2H7v-2h2v2Zm8 0h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-2-2H9V9h2v2Zm4 0h-2V9h2v2ZM9 9H7V7h2v2Zm8 0h-2V7h2v2Zm4-6v6h-2V7h-2V5h-2V3h6ZM7 7H5V5h2v2ZM5 5H3V3h2v2Z"/></PixelSvg>;
}

export function PixelDatabase(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M2 6h2v4H2zm0 4h2v4H2zm0 4h2v4H2zm18-8h2v4h-2zm0 4h2v4h-2zm0 4h2v4h-2zM4 4h4v2H4zm0 8h4v-2H4zm0 4h4v-2H4zm0 4h4v-2H4zM16 4h4v2h-4zm0 8h4v-2h-4zm0 4h4v-2h-4zm0 4h4v-2h-4zM8 2h8v2H8zm0 12h8v-2H8zm0 4h8v-2H8zm0 4h8v-2H8z"/></PixelSvg>;
}

export function PixelComputer(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M6 1h12v2H6zm0 8h12v2H6zM4 3h2v6H4zm14 0h2v6h-2zM4 13h16v2H4zm0 8h16v2H4zm-2-6h2v6H2zm18 0h2v6h-2zM6 17h2v2H6zm4 0h8v2h-8zm-2-6h2v2H8zm6 0h2v2h-2z"/></PixelSvg>;
}

export function PixelLaptop(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M3 18h18v-2h2v4H1v-4h2v2Zm2-4h14V6h2v10H3V6h2v8Zm14-8H5V4h14v2Z"/></PixelSvg>;
}

export function PixelWifi(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M11 19h2v2h-2zm-4-3h2v2H7zm8 0h2v2h-2zm-6-2h6v2H9zm-5-1h2v2H4zm2-2h2v2H6zm2-2h8v2H8zm-7 1h2v2H1zm20 0h2v2h-2zM3 8h2v2H3zm2-2h2v2H5zm2-2h10v2H7zm12 4h2v2h-2zm-2-2h2v2h-2zm1 7h2v2h-2zm-2-2h2v2h-2z"/></PixelSvg>;
}

export function PixelTerminal(props: PixelIconProps) {
  return <PixelSvg {...props}><path d="M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zM6 16h2v2H6zm2-2h2v2H8zm-2-2h2v2H6z"/></PixelSvg>;
}

