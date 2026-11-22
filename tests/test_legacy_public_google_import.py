"""Offline security and import-contract tests; never call the NTNU website."""
import io
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from scripts.import_legacy_public_google_config import (
    ImportErrorSafe,
    LEGACY_URL,
    MAX_RESPONSE_BYTES,
    fetch_public_config,
    public_google_config_from_legacy,
    save_new_config,
)

PUBLIC_ID = "123456789-legacy-browser.apps.googleusercontent.com"


class FakeResponse(io.BytesIO):
    def __init__(self, body, content_type="application/json", status=200):
        super().__init__(body)
        self.headers = {"Content-Type": content_type}
        self.status = status

    def getcode(self):
        return self.status


def fake_opener(payload, *, content_type="application/json", status=200):
    body = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
    return SimpleNamespace(
        open=lambda req, timeout: FakeResponse(body, content_type, status)
    )


class LegacyPublicGoogleImportTest(unittest.TestCase):
    def test_ignores_everything_except_public_browser_client_id(self):
        payload = {
            "googleDriveAuth": {
                "enabled": True,
                "clientId": PUBLIC_ID,
                "projectNumber": "0000000",
                "folderId": "private-drive-folder",
                "apiKey": "never-copy-this",
                "scope": "https://www.googleapis.com/auth/drive",
            },
            "config": {"brewfatherApiKey": "not-for-browser"},
            "storageOptions": [{"token": "never-copy"}],
        }
        expected = {"googleDriveAuth": {"clientId": PUBLIC_ID}}
        self.assertEqual(public_google_config_from_legacy(payload), expected)
        self.assertEqual(fetch_public_config(opener=fake_opener(payload)), expected)
        self.assertNotIn("never-copy", json.dumps(expected))

    def test_fails_closed_on_disabled_or_unexpected_client(self):
        for value in (
            {"googleDriveAuth": {"enabled": False, "clientId": PUBLIC_ID}},
            {"googleDriveAuth": {"enabled": True, "clientId": "not-an-oauth-id"}},
            {"googleDriveAuth": {"enabled": True, "clientId": "123-key.apps.googleusercontent.com\nSECRET"}},
            {"config": {"googleDriveClientId": PUBLIC_ID}},
            {},
            [],
        ):
            with self.subTest(value=value):
                with self.assertRaises(ImportErrorSafe):
                    public_google_config_from_legacy(value)

    def test_network_contract_rejects_unreviewed_urls(self):
        with self.assertRaises(ImportErrorSafe):
            fetch_public_config("http://tormt.folk.ntnu.no/includes/brewing/api/storage.php")
        with self.assertRaises(ImportErrorSafe):
            fetch_public_config("https://tormt.folk.ntnu.no/secrets/aps.local.json")

    def test_fails_closed_on_http_status_content_type_oversize_and_invalid_json(self):
        payload = {"googleDriveAuth": {"enabled": True, "clientId": PUBLIC_ID}}
        for opener in (
            fake_opener(payload, status=403),
            fake_opener(payload, content_type="text/html"),
            fake_opener(b"{" + b"x" * MAX_RESPONSE_BYTES + b"}"),
            fake_opener(b"not valid json"),
        ):
            with self.assertRaises(ImportErrorSafe):
                fetch_public_config(opener=opener)

    def test_exclusive_destination_creation_does_not_clobber_existing(self):
        config = {"googleDriveAuth": {"clientId": PUBLIC_ID}}
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / "google-auth.json"
            save_new_config(file, config)
            self.assertEqual(json.loads(file.read_text()), config)
            with self.assertRaises(ImportErrorSafe):
                save_new_config(file, {"unexpected": "value"})
            self.assertEqual(json.loads(file.read_text()), config)


if __name__ == "__main__":
    unittest.main()
