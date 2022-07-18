import sys
from opentdf import TDFClient, NanoTDFClient, OIDCCredentials, LogLevel

# encrypt the file and apply the policy on tdf file and also decrypt.
OIDC_ENDPOINT = "http://localhost:65432"
KAS_URL = "http://localhost:65432/api/kas"

try:
    # Create OIDC credentials object
    oidc_creds = OIDCCredentials()
    oidc_creds.set_client_credentials_client_secret(
        client_id="tdf-client",
        client_secret="123-456",
        organization_name="tdf",
        oidc_endpoint=OIDC_ENDPOINT,
    )

    client = TDFClient(oidc_credentials=oidc_creds, kas_url=KAS_URL)
    client.enable_console_logging(LogLevel.Info)
    plain_text = "Hello world!!"
    #################################################
    # TDF - File API
    ################################################
    f = open("sample.txt", "w")
    f.write(plain_text)
    f.close()

    client.add_data_attribute(
        "https://kovan.network/attr/Wallet/value/0x57ADbD106A0bC1b1BAb666a63A6F674677Ccaa3e", KAS_URL
    )
    client.add_data_attribute(
        "https://virtru.com/attr/ContentExclusivity/value/Premium", KAS_URL
    )
    client.encrypt_file("sample.txt", "sample.txt.tdf")
    client.decrypt_file("sample.txt.tdf", "sample_out.txt")


except:
    print("Unexpected error: %s" % sys.exc_info()[0])
    raise
