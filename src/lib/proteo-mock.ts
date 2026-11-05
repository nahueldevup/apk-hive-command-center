export type Phone = { id: string; name: string; online: boolean; android: string; storage: number };
export type Apk = {
  id: string;
  name: string;
  file: string;
  pkg: string;
  version: string;
  code: string;
  size: number;
  type: "apk" | "bundle";
  format?: "apkm" | "xapk" | "apks" | "zip";
  splits?: string[];
  abi?: string;
  obbIgnored?: boolean;
  isDefault: boolean;
  added: string;
  sha: string;
  installedOn: string[];
};
export type FsEntry = { name: string; dir: boolean; size: number; mtime: string; children?: FsEntry[] };

export const PHONES: Phone[] = [
  { id: "phone-80", name: "phone-80", online: true, android: "13", storage: 0.42 },
  { id: "phone-81", name: "phone-81", online: false, android: "13", storage: 0.18 },
  { id: "phone-82", name: "phone-82", online: true, android: "13", storage: 0.66 },
  { id: "phone-83", name: "phone-83", online: true, android: "13", storage: 0.31 },
  { id: "phone-84", name: "phone-84", online: false, android: "13", storage: 0.07 },
  { id: "phone-85", name: "phone-85", online: true, android: "13", storage: 0.54 },
];

export const APKS: Apk[] = [
  {
    id: "a1", name: "Facebook", file: "com.facebook.katana_585.0.0.47.54-476015546_1dpi_a5341ccc2d3c9f7f2a09e48f60d4f5f8_apkmirror.com.apkm",
    pkg: "com.facebook.katana", version: "585.0.0.47.54", code: "476015546", size: 95.3, type: "bundle", format: "apkm",
    splits: ["base.apk"], abi: "x86_64", isDefault: true, added: "2026-11-02", sha: "a5341ccc2d3c9f7f", installedOn: ["phone-80"],
  },
  {
    id: "a2", name: "DevCheck", file: "flar2.devcheck_5.49-549_4arch_7dpi_308f836c401b6a7cdbd103213a1346cb_apkmirror.com.apkm",
    pkg: "flar2.devcheck", version: "5.49", code: "549", size: 14.0, type: "bundle", format: "apkm",
    splits: ["base.apk", "split_config.x86_64.apk", "split_config.arm64_v8a.apk", "split_config.armeabi_v7a.apk", "split_config.x86.apk", "split_config.xxhdpi.apk", "split_config.xhdpi.apk", "split_config.hdpi.apk", "split_config.mdpi.apk", "split_config.es.apk", "split_config.en.apk"],
    abi: "x86_64", isDefault: false, added: "2026-11-03", sha: "308f836c401b6a7c", installedOn: ["phone-80", "phone-82"],
  },
  {
    id: "a3", name: "Device Info HW", file: "ru.andr7e.deviceinfohw_5.26.1-238_minAPI16(nodpi)_apkmirror.com.apk",
    pkg: "ru.andr7e.deviceinfohw", version: "5.26.1", code: "238", size: 3.6, type: "apk", isDefault: false,
    added: "2026-11-04", sha: "9c1e77ab0042d1f3", installedOn: [],
  },
  {
    id: "a4", name: "PUBG Lite", file: "com.tencent.iglite_0.27.0.xapk", pkg: "com.tencent.iglite", version: "0.27.0", code: "270",
    size: 212.4, type: "bundle", format: "xapk", splits: ["base.apk", "config.x86_64.apk", "config.arm64_v8a.apk"], abi: "x86_64",
    obbIgnored: true, isDefault: false, added: "2026-10-28", sha: "e0f1aa98c34be210", installedOn: ["phone-83"],
  },
];

const d = (name: string, children: FsEntry[], mtime = "2026-11-04 18:22"): FsEntry => ({ name, dir: true, size: 0, mtime, children });
const f = (name: string, size: number, mtime = "2026-11-04 18:22"): FsEntry => ({ name, dir: false, size, mtime });

export const makeFs = (): Record<string, FsEntry[]> => ({
  Download: [
    d("Telegram", [f("doc_2291.pdf", 1.2e6), f("voice_0042.ogg", 84e3)]),
    f("contacts_export.vcf", 42e3, "2026-11-03 09:10"),
    f("proxy_list.txt", 3.1e3, "2026-11-04 12:44"),
    f("whatsapp_backup.zip", 48.2e6, "2026-10-30 22:01"),
  ],
  DCIM: [
    d("Camera", [f("IMG_20261104_101233.jpg", 2.4e6), f("IMG_20261104_101240.jpg", 2.1e6), f("VID_20261104_101300.mp4", 18.7e6)]),
    d("Screenshots", [f("Screenshot_20261103.png", 640e3)]),
  ],
  Pictures: [f("avatar_01.jpg", 380e3), f("avatar_02.jpg", 412e3), f("banner_promo.png", 1.1e6), d("Instagram", [])],
  Documents: [f("guion_campaña.docx", 88e3), f("cuentas.csv", 12e3)],
});

export const ROOTS = ["Download", "DCIM", "Pictures", "Documents"] as const;

export function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}
