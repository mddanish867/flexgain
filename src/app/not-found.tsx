import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="max-w-md text-center">
        <p className="font-mono-label text-fg-dim mb-2">404 · NOT FOUND</p>
        <h1 className="text-3xl font-semibold mb-3">
          That lift isn&apos;t <span className="text-accent-red">on the program.</span>
        </h1>
        <p className="text-fg-muted text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="bg-accent-red text-white h-11 px-5 rounded font-medium inline-flex items-center hover:bg-[#ff4d44]"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
