function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");

        if (comma === -1) {
          reject(new Error("Could not encode offline file."));
          return;
        }

        resolve(result.slice(comma + 1));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(
        reader.error ||
        new Error("Could not read offline file.")
      );
    };

    reader.readAsDataURL(blob);
  });
}


async function openOfflineFile(id) {
  const record = await getOfflineFile(id);

  if (!record?.blob) {
    throw new Error("Offline file is missing.");
  }

  const filename =
    record.filename ||
    record.title ||
    "statarchive-file";

  const mime =
    record.mime ||
    record.blob.type ||
    "application/octet-stream";


  /*
   * Android WebView app:
   * send the offline file to the native Android bridge.
   */
  if (
    window.AndroidBridge &&
    typeof window.AndroidBridge.openFile === "function"
  ) {
    const base64 = await blobToBase64(record.blob);

    window.AndroidBridge.openFile(
      base64,
      filename,
      mime
    );

    return;
  }


  /*
   * Normal installed PWA/browser fallback.
   */
  const url = URL.createObjectURL(record.blob);

  const a = document.createElement("a");

  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    600000
  );
}


async function shareOfflineFile(id) {
  const record = await getOfflineFile(id);

  if (!record?.blob) {
    throw new Error("Offline file is missing.");
  }

  const filename =
    record.filename ||
    record.title ||
    "statarchive-file";

  const mime =
    record.mime ||
    record.blob.type ||
    "application/octet-stream";


  /*
   * Android WebView app:
   * use the native Android share sheet.
   */
  if (
    window.AndroidBridge &&
    typeof window.AndroidBridge.shareFile === "function"
  ) {
    const base64 = await blobToBase64(record.blob);

    window.AndroidBridge.shareFile(
      base64,
      filename,
      mime
    );

    return;
  }


  /*
   * Browser/PWA fallback using Web Share API.
   */
  const file = new File(
    [record.blob],
    filename,
    { type: mime }
  );


  if (
    navigator.share &&
    (
      !navigator.canShare ||
      navigator.canShare({ files: [file] })
    )
  ) {
    await navigator.share({
      title: record.title || filename,
      files: [file]
    });

    return;
  }


  /*
   * Final fallback:
   * download/save the file if sharing isn't supported.
   */
  const url = URL.createObjectURL(record.blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    600000
  );
}
