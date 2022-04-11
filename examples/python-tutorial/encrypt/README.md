# OpenTDF encrypt python tutorial

Now that OpenTDF knows you’re Alice, you can protect your first piece of data.

## Encryption Basics

Before calling encrypt, you need to specify a few simple parameters.

You don’t need to include your email address when encrypting. You will already have access to anything you encrypt because you authenticated. But if you want anyone else to have access (like another one of your emails, `alice@nowhere.com`), you could include them here:

```python
client = TDFClient(oidc_credentials=oidc_creds, kas_url=KAS_URL)
client.share_with_users(["alice@nowhere.com"])
```

Call encrypt and check out the resulting file:

```python
unprotected_file = "sensitive.txt"
protected_file = unprotected_file + ".tdf"
client.encrypt_file(input=unprotected_file, output=protected_file)
print(f"Encrypted file {protected_file}")
```

Here's the complete source code:

```python
import os
from opentdf import TDFClient, OIDCCredentials, LogLevel

# Load email and appId from environment variables
# encrypt the file and apply the policy on tdf file and also decrypt.
# OIDC_ENDPOINT = os.getenv('OIDC_ENDPOINT')
# KAS_URL = os.getenv("KAS_URL")

KAS_URL = "http://localhost:65432/kas/"
OIDC_ENDPOINT = "http://localhost:65432/keycloak"

if not (KAS_URL and OIDC_ENDPOINT):
    raise EnvironmentError(
        "An environment variable is not set:\n- KAS_URL\n- OIDC_ENDPOINT")

# Authenticate
oidc_creds = OIDCCredentials()
oidc_creds.set_client_credentials(
    client_id="tdf-client",
    client_secret="123-456",
    organization_name="tdf",
    oidc_endpoint=OIDC_ENDPOINT,
)

client = TDFClient(oidc_credentials=oidc_creds,
                    kas_url=KAS_URL)
client.enable_console_logging(LogLevel.Info)

# Create share
client.share_with_users(["service-account-tdf-client"])
unprotected_file = "sensitive.txt"
protected_file = unprotected_file + ".tdf.html"

# Encrypt
client.encrypt_file(input=unprotected_file, output=protected_file)
print(f"Encrypted file {protected_file}")```
```

Now, your sensitive data is safe.
