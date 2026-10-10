# MedisinTimer: end-to-end-encrypted Drive backup and optional shared folder

**Status:** implemented on V2 preview after tests, not yet validated using the owner's real Google account or Shared Drive. V1 is unchanged. No sensitive files or passphrases are stored in this repository.

## Encryption and folder selection

- The browser encrypts the complete validated MedisinTimer backup using AES-256-GCM with a fresh random 96-bit nonce and 128-bit authentication tag on each upload.
- A passphrase of at least 12 characters derives an AES-256 key using PBKDF2-HMAC-SHA-256, 310,000 iterations and a new random 128-bit salt per encryption. The vault includes `format: folk-medisin-vault`, `version:1`, KDF metadata, salt, IV and ciphertext. **No sensitive entries, key or passphrase are included in the Drive JSON file.**
- A passphrase is retained in the running V2 page memory only and cleared when the page is closed, the user signs out/changes accounts or disables sync. On a different device the user must provide the *same passphrase*. There is **no password recovery**; losing the passphrase means the encrypted cloud data is unrecoverable.
- The account's encrypted Drive filename is a deterministic pseudonymous hash of the Google account ID; separate accounts use different filenames. The file name is not secret. Users with Drive access can observe the file's existence, name, timestamps and size even though they cannot decrypt its contents without the passphrase.
- Blank **Drive-mappe-ID** means the account's own *Min disk*. To use a shared Google Drive folder, open the desired folder and copy only the ID portion after `/folders/` from the Drive link. Save the folder ID in MedisinTimer, then unlock. The folder ID is saved only in that browser and must be configured separately on each device. The account must have sufficient Drive permissions.
- The frontend uses the `drive.file` OAuth scope. Shared Drive capability (including Google Workspace/shared-folder permissions) needs a **real account test**; no one should claim it works on all account configurations merely from mocked browser tests.

### Existing cloud data and migration safety

- **Critical:** The previously used plaintext `folk-medisin-v2.json` is NOT automatically read, deleted, converted or overwritten. New encrypted backups use a different `.enc.json` file.
- Previously stored plaintext-sync opt-in keys are intentionally invalidated. Re-enable encrypted sync explicitly with a new passphrase.
- If a user needs their historical plaintext Drive backup, first download it from Drive directly into a **private local folder**, import it into the V2 MedisinTimer with the existing **Importer v2 JSON** control, review records, and activate encrypted sync. Confirm the encrypted backup can be opened on a second device before choosing whether to delete the old plaintext version manually. Never automatically delete legacy medical history.
- Browser `localStorage` and manually exported `.json` remain **unencrypted**. This change protects cloud copies, not data at rest on this computer. Use a protected personal device or pursue an encrypted local vault in the next phase.

### Sync behavior and limitations

- Logging into Google alone does **not** upload data. The user must explicitly opt in, enter the passphrase and press the encrypted sync button each new browser session.
- Drive reads decrypt the remote vault, validate its internal schema and only then merge with current local data by per-entry `updatedAt`. Wrong password or invalid authenticated data causes a hard stop, **not** a plaintext fallback or destructive write.
- Each upload uses fresh salt and IV; no static encryption nonce is reused. The remote file is never overwritten until its decrypt/validation path has passed.
- Disabling cloud sync stops further scheduled syncing in the page. It does not delete the existing encrypted or plaintext Drive backups.
- The last-write-wins entry merge is not yet a transaction or an atomic two-device update: simultaneous writes from two devices **may overwrite a recent change**. For now, use one device at a time and let sync finish before switching devices. A server-mediated revision/ETag conflict protocol or a documented immutable-change log is needed before declaring simultaneous shared-disk editing fully safe.
- A shared Google Drive folder is **not recommended for medical history** unless the owner has verified who may inspect, rename or delete the ciphertext file. Encryption does not replace storage permissions or backup retention.

## Independent verification

`tests/medisin-vault.test.mjs`, `tests/medisin-folder.test.mjs`, `tests/medisin-cloud-consent.test.mjs` and the Chrome test `tests/browser/medisin-v2-smoke.html` cover encryption/decryption, wrong passphrase, authenticated tampering, per-account folder naming, no auto-upload, encrypted-only multipart uploads, shared folder selection, and revocation. Real Google user/account tests remain mandatory.

**Not a medical decision-making tool.** Medication timer and concentration calculation outputs are informational only and must not be used as the sole basis for dosing.
