import sys
from tdf3sdk import TDF3Client, NanoTDFClient, OIDCCredentials, LogLevel

# encrypt the file and apply the policy on tdf file and also decrypt.
OIDC_ENDPONT = "https://localhost:8443"  # "http://localhost:8080/keycloak"
KAS_URL = "http://localhost:8080/kas"

try:
    # Create OIDC credentials object
    oidc_creds = OIDCCredentials(client_id="tdf-client",
                                 client_secret="123-456",
                                 organization_name="tdf",
                                 oidc_endpoint=OIDC_ENDPONT)

    client = TDF3Client(oidc_credentials=oidc_creds,
                        kas_url=KAS_URL)
    client.enable_console_logging(LogLevel.Error)
    plain_text = 'Hello world!!'
    #################################################
    # TDF3 - File API
    ################################################
    f = open("sample.txt", "w")
    f.write(plain_text)
    f.close()

    client.with_data_attributes(["https://example.com/attr/Classification/value/S"])
    client.encrypt_file("sample.txt", "sample.txt.tdf")
    client.decrypt_file("sample.txt.tdf", "sample_out.txt")

    #################################################
    # TDF3 - Data API
    #################################################

    tdf_data = client.encrypt_string(plain_text)
    decrypted_plain_text = client.decrypt_string(tdf_data)

    if plain_text == decrypted_plain_text:
        print("TDF3 Encrypt/Decrypt is successful!!")
    else:
        print("Error: TDF3 Encrypt/Decrypt failed!!")

    #################################################
    # Nano TDF - File API
    ################################################

    # create a nano tdf client.
    nano_tdf_client = NanoTDFClient(oidc_credentials=oidc_creds,
                                    kas_url=KAS_URL)
    nano_tdf_client.enable_console_logging(LogLevel.Error)
    nano_tdf_client.with_data_attributes(["https://example.com/attr/Classification/value/S"])
    nano_tdf_client.encrypt_file("sample.txt", "sample.txt.ntdf")
    nano_tdf_client.decrypt_file("sample.txt.ntdf", "sample_out.txt")

    #################################################
    # Nano TDF - Data API
    #################################################

    plain_text = 'Hello world!!'
    nan_tdf_data = nano_tdf_client.encrypt_string(plain_text)
    nano_tdf_client = nano_tdf_client.decrypt_string(nan_tdf_data)

    if plain_text == decrypted_plain_text:
        print("Nano TDF Encrypt/Decrypt is successful!!")
    else:
        print("Error: Nano TDF Encrypt/Decrypt failed!!")

except:
    print("Unexpected error: %s" % sys.exc_info()[0])
    raise