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
    client.enable_console_logging(LogLevel.Debug)
    plain_text = "Hello world!!"
    #################################################
    # TDF - File API
    ################################################
    f = open("sample.txt", "w")
    f.write(plain_text)
    f.close()

    client.add_data_attribute(
        "https://example.com/attr/Classification/value/S", KAS_URL
    )
    client.add_data_attribute("https://example.com/attr/COI/value/PRX", KAS_URL)
    client.encrypt_file("sample.txt", "sample.txt.tdf")
    client.decrypt_file("sample.txt.tdf", "sample_out.txt")

    #################################################
    # TDF - Data API
    #################################################

    tdf_data = client.encrypt_string(plain_text)
    decrypted_plain_text = client.decrypt_string(tdf_data)

    if plain_text == decrypted_plain_text:
        print("TDF Encrypt/Decrypt is successful!!")
    else:
        print("Error: TDF Encrypt/Decrypt failed!!")

    #################################################
    # Nano TDF - File API
    ################################################

    # create a nano tdf client.
    nano_tdf_client = NanoTDFClient(oidc_credentials=oidc_creds, kas_url=KAS_URL)
    nano_tdf_client.enable_console_logging(LogLevel.Error)
    nano_tdf_client.add_data_attribute(
        "https://example.com/attr/Classification/value/S", KAS_URL
    )
    nano_tdf_client.encrypt_file("sample.txt", "sample.txt.ntdf")
    nano_tdf_client.decrypt_file("sample.txt.ntdf", "sample_out.txt")

    #################################################
    # Nano TDF - Data API
    #################################################

    plain_text = "Hello world!!"
    nan_tdf_data = nano_tdf_client.encrypt_string(plain_text)
    nano_tdf_client = nano_tdf_client.decrypt_string(nan_tdf_data)

    if plain_text == decrypted_plain_text:
        print("Nano TDF Encrypt/Decrypt is successful!!")
    else:
        print("Error: Nano TDF Encrypt/Decrypt failed!!")

except:
    print("Unexpected error: %s" % sys.exc_info()[0])
    raise
