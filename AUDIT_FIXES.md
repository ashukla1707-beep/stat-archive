# Audit fixes - 27 September 2026

This branch addresses website findings 1, 3-8, 10-13 and supplies the website adapter required by Android findings 2 and 7.

- PDF document loading explicitly disables evaluation (Mozilla's CVE-2024-4367 workaround). PDF.js remains 3.11.174 for compatibility; upgrading the engine remains a separate maintenance task.
- The new native messaging adapter is asynchronous, main-frame only, and does not expose saved passcodes. Old APKs remain usable; their unconfirmed save-picker returns no longer count as successful downloads.
- The service worker normalizes only known shell `v` parameters, includes scanner/native scripts and required external libraries, and refuses activation if a critical resource is missing. The Supabase SDK is pinned to 2.117.2.
- Replies are rate-limited, serialized, and explicitly rejected at 50 rather than evicting existing replies. Durable Object alarms expire throttle records, including legacy records.
- Moderation recognizes obfuscated standalone tokens rather than substrings of legitimate words. Malformed encoded routes return 400.
- Full scanner crop includes the entire image; Notes subtitle escaping is corrected.
- The former website APK route redirects to the canonical Android repository. Worker-first routing ensures the static asset cannot shadow this redirect; the obsolete duplicate APK is removed.
- Reader documentation matches current download, offline-library, role, and Drive behavior.

## Validation

Run `node --test tests/*.test.mjs` and syntax-check worker.js, sw.js, and assets/js/*.js. The audit suite covers moderation, malformed input, concurrent reply throttling, overflow retention, alarm cleanup, canonical APK routing, subtitle formatting, crop edges, PDF evaluation settings, fresh offline startup, failed installation, native save completion/cancellation, and child-frame rejection. The existing 21 bug-fix invariants also passed locally.

## Release order and remaining checks

Deploy this website adapter before releasing Android 1.5.22. The website works with older APKs, but those binaries retain their old native security implementation until users update. Do not advance version.json until a signed 1.5.22 artifact exists and has been verified. Verify PDF preview, offline launch, native scanner, save/cancel/share/open, auth autofill, and mobile layouts on actual devices. This branch is not a device-test certificate and has not been deployed by this change.

Validation also identified 14 pre-existing invalid one-time repair workflows. These were preserved verbatim in maintenance/legacy-workflows with .disabled extensions, outside the active Actions directory; active validation workflows remain enabled.
