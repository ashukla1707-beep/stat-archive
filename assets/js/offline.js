/* =========================================================
   STAT ARCHIVE — OFFLINE FILE SUPPORT
   Android WebView + Browser/PWA
   ========================================================= */


/* =========================================================
   Convert Blob → Base64
   Required for sending IndexedDB files to AndroidBridge
   ========================================================= */

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");

        if (comma === -1) {
          reject(
            new Error("Could not encode offline file.")
          );
          return;
        }

        /*
         * FileReader returns:
         *
         * data:application/pdf;base64,AAAA...
         *
         * Android only needs the Base64 part after the comma.
         */
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


/* =========================================================
   Detect native StatArchive Android WebView
   ========================================================= */

function hasAndroidBridge() {
  return (
    typeof window.AndroidBridge !== "undefined" &&
    window.AndroidBridge !== null
  );
}


/* =========================================================
   OPEN OFFLINE FILE
   ========================================================= */

async function openOfflineFile(id) {

  const record = await getOfflineFile(id);

  if (!record || !record.blob) {
    throw new Error(
      "Offline file is missing."
    );
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
   * =====================================================
   * ANDROID WEBVIEW
   * =====================================================
   *
   * Send the real saved file to MainActivity.java.
   *
   * Android then:
   * IndexedDB Blob
   *      ↓
   * Base64
   *      ↓
   * AndroidBridge.openFile()
   *      ↓
   * temporary Android file
   *      ↓
   * PDF/image viewer
   */

  if (
    hasAndroidBridge() &&
    typeof window.AndroidBridge.openFile === "function"
  ) {

    const base64 =
      await blobToBase64(record.blob);

    window.AndroidBridge.openFile(
      base64,
      filename,
      mime
    );

    return;
  }


  /*
   * =====================================================
   * NORMAL PWA / BROWSER
   * =====================================================
   */

  const url =
    URL.createObjectURL(record.blob);


  const a =
    document.createElement("a");

  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";


  document.body.appendChild(a);

  a.click();

  a.remove();


  /*
   * Keep the Blob URL alive long enough for
   * slower browsers/PDF viewers.
   */
  setTimeout(
    () => {
      URL.revokeObjectURL(url);
    },
    600000
  );
}


/* =========================================================
   SHARE OFFLINE FILE
   ========================================================= */

async function shareOfflineFile(id) {

  const record =
    await getOfflineFile(id);


  if (!record || !record.blob) {
    throw new Error(
      "Offline file is missing."
    );
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
   * =====================================================
   * ANDROID WEBVIEW
   * =====================================================
   */

  if (
    hasAndroidBridge() &&
    typeof window.AndroidBridge.shareFile === "function"
  ) {

    const base64 =
      await blobToBase64(record.blob);


    window.AndroidBridge.shareFile(
      base64,
      filename,
      mime
    );

    return;
  }


  /*
   * =====================================================
   * PWA / MOBILE BROWSER
   * =====================================================
   *
   * Try the Web Share API first.
   */

  try {

    const file =
      new File(
        [record.blob],
        filename,
        {
          type: mime
        }
      );


    if (navigator.share) {

      const shareData = {
        title:
          record.title ||
          filename,

        files: [file]
      };


      /*
       * Some browsers expose navigator.share
       * but cannot share files.
       */
      if (
        typeof navigator.canShare !== "function" ||
        navigator.canShare({
          files: [file]
        })
      ) {

        await navigator.share(
          shareData
        );

        return;
      }
    }

  } catch (err) {

    /*
     * If the user simply cancelled the Android/browser
     * share sheet, don't treat that as a real error.
     */

    if (
      err &&
      err.name === "AbortError"
    ) {
      return;
    }

    console.warn(
      "Web Share unavailable:",
      err
    );
  }


  /*
   * =====================================================
   * FINAL FALLBACK
   * =====================================================
   *
   * If sharing isn't supported, save/download it.
   */

  const url =
    URL.createObjectURL(record.blob);


  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    filename;


  document.body.appendChild(a);

  a.click();

  a.remove();


  setTimeout(
    () => {
      URL.revokeObjectURL(url);
    },
    600000
  );
}


/* =========================================================
   SAVE OFFLINE FILE TO DEVICE
   =========================================================
   Keep compatibility with existing Offline Library UI.
   ========================================================= */

async function saveOfflineFileToDevice(id) {

  const record =
    await getOfflineFile(id);


  if (!record || !record.blob) {
    throw new Error(
      "Offline file is missing."
    );
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
   * In the Android app, sharing through Android is much
   * more reliable than trying to download a blob: URL
   * directly from WebView.
   */

  if (
    hasAndroidBridge() &&
    typeof window.AndroidBridge.shareFile === "function"
  ) {

    const base64 =
      await blobToBase64(record.blob);


    window.AndroidBridge.shareFile(
      base64,
      filename,
      mime
    );

    return;
  }


  /*
   * Browser/PWA normal download.
   */

  const url =
    URL.createObjectURL(record.blob);


  const a =
    document.createElement("a");

  a.href = url;
  a.download = filename;


  document.body.appendChild(a);

  a.click();

  a.remove();


  setTimeout(
    () => {
      URL.revokeObjectURL(url);
    },
    600000
  );
}


/* =========================================================
   OFFLINE LIBRARY BUTTON HANDLING

   Event delegation is used because Offline Library cards
   are created dynamically after the page loads.
   ========================================================= */

document.addEventListener(
  "click",
  async function (event) {

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }


    const openButton =
      target.closest(
        ".offline-open-btn"
      );


    const shareButton =
      target.closest(
        ".offline-share-btn"
      );


    const deviceButton =
      target.closest(
        ".offline-device-btn"
      );


    /*
     * This file handles only file actions.
     * Other Offline Library buttons are left alone.
     */

    if (
      !openButton &&
      !shareButton &&
      !deviceButton
    ) {
      return;
    }


    const card =
      target.closest(
        ".offline-file"
      );


    if (!card) {

      console.warn(
        "Offline Library card not found."
      );

      return;
    }


    const id =
      card.dataset.offlineId;


    if (!id) {

      console.warn(
        "Offline file ID not found."
      );

      return;
    }


    /*
     * Stop another link/button handler from attempting
     * browser blob navigation at the same time.
     */

    event.preventDefault();

    event.stopPropagation();


    try {

      /* -------------------------
         OPEN
         ------------------------- */

      if (openButton) {

        await openOfflineFile(id);

        return;
      }


      /* -------------------------
         SHARE
         ------------------------- */

      if (shareButton) {

        await shareOfflineFile(id);

        return;
      }


      /* -------------------------
         SAVE TO DEVICE
         ------------------------- */

      if (deviceButton) {

        await saveOfflineFileToDevice(id);

        return;
      }


    } catch (err) {

      console.error(
        "Offline Library action failed:",
        err
      );


      const message =
        err?.message ||
        "Offline file action failed.";


      if (
        typeof window.showError ===
        "function"
      ) {

        window.showError(
          message
        );

      } else {

        alert(message);
      }
    }
  },
  true
);
