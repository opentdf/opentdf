# TDF3SDK decrypt python tutorial

Well Alice, the good news is, your first encrypted file is so safe, only you can decrypt it. Let’s confirm that with your protected file. Then, we’ll grant access to someone you trust.

## Decrypting via SDK

```python
# Decryption example
import os
from tdf3sdk import TDF3Client, OIDCCredentials, LogLevel

# Load email and appId from environment variables
# encrypt the file and apply the policy on tdf file and also decrypt.
# OIDC_ENDPOINT = os.getenv("OIDC_ENDPOINT")
# KAS_URL = os.getenv("KAS_URL")

KAS_URL = "http://localhost:8000"
OIDC_ENDPOINT = "http://localhost:8080"


if not (KAS_URL and OIDC_ENDPOINT):
    raise EnvironmentError(
        "An environment variable is not set:\n- KAS_URL\n- OIDC_ENDPOINT")

# Authenticate
oidc_creds = OIDCCredentials(owner="neep@yeep.dance",
                             client_id="tdf-client",
                             client_secret="123-456",
                             organization_name="tdf",
                             oidc_endpoint=OIDC_ENDPOINT)


client = TDF3Client(oidc_credentials=oidc_creds,
                    kas_url=KAS_URL)
client.enable_console_logging(LogLevel.Info)

# Decrypt
protected_file = "sensitive.txt.tdf"
unprotected_file = "sensitive_decrypted.txt"
client.decrypt_file(in_filename=protected_file,
                    out_filename=unprotected_file)

print(f"Decrypted file {unprotected_file}")
```
