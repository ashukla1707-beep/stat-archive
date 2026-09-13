function cleanFilename(value) {
  const raw = String(value || "Stat Archive file.pdf")
    .replace(/[\\/:*?"<>|\r\n]+/g, "_")
    .trim();
  return raw || "Stat Archive file.pdf";
}

function driveId(raw) {
  const value = String(raw || "").trim();
  if (/^[A-Za-z0-9_-]{10,}$/.test(value)) return value;
  const match = value.match(/\/file\/d\/([A-Za-z0-9_-]+)/i)
    || value.match(/[?&]id=([A-Za-z0-9_-]+)/i)
    || value.match(/\/d\/([A-Za-z0-9_-]+)/i);
  return match ? match[1] : "";
}

async function fetchDriveFile(id, request) {
  const headers = new Headers();
  headers.set("Accept", "application/pdf,application/octet-stream,*/*");
  headers.set("User-Agent", request.headers.get("User-Agent") || "Mozilla/5.0");

  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);

  const candidates = [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}&confirm=t`,
    `https://drive.google.com/uc?id=${encodeURIComponent(id)}&export=download`
  ];

  let lastResponse = null;

  for (const target of candidates) {
    try {
      const response = await fetch(target, {
        method: "GET",
        headers,
        redirect: "follow"
      });

      lastResponse = response;
      const contentType = (response.headers.get("content-type") || "").toLowerCase();

      if (response.ok && !contentType.includes("text/html")) {
        return response;
      }
    } catch (_) {}
  }

  return lastResponse;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/drive-file") {
      const id = driveId(url.searchParams.get("id"));
      if (!id) {
        return new Response("Invalid Drive file", { status: 400 });
      }

      const requestedName = cleanFilename(url.searchParams.get("name"));
      const mode = url.searchParams.get("mode") === "download" ? "attachment" : "inline";
      const upstream = await fetchDriveFile(id, request);

      if (!upstream || !upstream.ok) {
        return new Response("Drive file unavailable", {
          status: upstream?.status || 502
        });
      }

      const upstreamType = (upstream.headers.get("content-type") || "").toLowerCase();
      if (upstreamType.includes("text/html")) {
        return new Response("Drive returned a confirmation page instead of the file", {
          status: 502
        });
      }

      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/pdf");

      const length = upstream.headers.get("Content-Length");
      if (length) headers.set("Content-Length", length);

      const contentRange = upstream.headers.get("Content-Range");
      if (contentRange) headers.set("Content-Range", contentRange);

      const acceptRanges = upstream.headers.get("Accept-Ranges");
      if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

      headers.set("Cache-Control", "private, no-store");
      headers.set(
        "Content-Disposition",
        `${mode}; filename*=UTF-8''${encodeURIComponent(requestedName)}`
      );
      headers.set("X-Content-Type-Options", "nosniff");

      return new Response(upstream.body, {
        status: upstream.status,
        headers
      });
    }

    return env.ASSETS.fetch(request);
  }
};
