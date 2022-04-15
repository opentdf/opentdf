# Encryption example - HTML format
import os
from opentdf import TDFClient, OIDCCredentials, LogLevel

# Load email and appId from environment variables
# encrypt the file and apply the policy on tdf file and also decrypt.

OIDC_ENDPOINT = "http://localhost:65432/keycloak"
KAS_URL = "http://localhost:65432/kas/"
# KAS_URL = os.getenv("KAS_URL")
# OIDC_ENDPOINT = os.getenv('OIDC_ENDPOINT')

if not (KAS_URL and OIDC_ENDPOINT):
    raise EnvironmentError(
        "An environment variable is not set:\n- KAS_URL\n- OIDC_ENDPOINT")

# Authenticate
oidc_creds = OIDCCredentials()
oidc_creds.set_client_credentials_client_secret(
    client_id="tdf-client",
    client_secret="123-456",
    organization_name="tdf",
    oidc_endpoint=OIDC_ENDPOINT,
)


client = TDFClient(oidc_credentials=oidc_creds,
                    kas_url=KAS_URL)
client.enable_console_logging(LogLevel.Info)

# Create share
client.share_with_users(["alice@nowhere.com"])
unprotected_file = "sensitive.txt"
protected_file = unprotected_file + ".tdf"

# Encrypt
client.encrypt_file(in_filename=unprotected_file,
                    out_filename=protected_file)
print(f"Encrypted file {protected_file}")
