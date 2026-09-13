function cleanFilename(value) {
  const raw = String(value || "Stat Archive file.pdf").replace(/[\\/:*?"<>|\r\n]+/g, "_").trim();
  return raw || "Stat Archive file.pdf";
}

function driveId(raw) {
  const value = String(raw || "").trim();
  const match = value.match(/\/file\/d\/([A-Za-z0-9_-]+)/i)
    || value.match(/[?&]id=([A-Za-z0-9_-]+)/i)
    || value.match(/\/d\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/drive-file") {
      const id = driveId(url.searchParams.get("id"));
      if (!id) return new Response("Invalid Drive file", { status: 400 });
      const requestedName = cleanFilename(url.searchParams.get("name"));
      const mode = url.searchParams.get("mode") === "download" ? "attachment" : "inline";
      const upstreamUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`;
      const upstream = await fetch(upstreamUrl, { method: "GET", redirect: "follow" });
      if (!upstream.ok) return new Response("Drive file unavailable", { status: upstream.status });
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/octet-stream");
      const length = upstream.headers.get("Content-Length");
      if (length) headers.set("Content-Length", length);
      headers.set("Cache-Control", "private, max-age=0, no-store");
      headers.set("Content-Disposition", `${mode}; filename*=UTF-8''${encodeURIComponent(requestedName)}`);
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(upstream.body, { status: 200, headers });
    }
    return env.ASSETS.fetch(request);
  }
};
