const samples = ["https://example.com", "https://www.w3.org/WAI/", "https://developer.mozilla.org/"];
export function SampleUrls({ onSelect }: { onSelect: (url: string) => void }) {
  return <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500"><span>نمونه:</span>{samples.map((url) => <button type="button" key={url} onClick={() => onSelect(url)} className="focus-ring rounded-md border border-zinc-800 px-2 py-1 text-violet-300 hover:border-violet-500">{url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</button>)}</div>;
}
