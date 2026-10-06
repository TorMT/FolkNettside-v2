# Future user uploads

The v2 architecture must not assume every resource lives in the deployed repository.

A resource should eventually expose a source descriptor such as:

- `site` - deployed static resource
- `upload` - user-selected browser file/blob
- `drive` - connected Google Drive resource
- `remote` - explicitly allowed remote URL

Viewer adapters should consume a resolved URL/blob and metadata rather than owning storage logic.

This allows a future upload flow where another user can open their own PDF, code, notebook, STL, 3MF or similar file without changing ViewerShell or the analysis engines.

Persistent sharing/storage/authentication is intentionally deferred.
