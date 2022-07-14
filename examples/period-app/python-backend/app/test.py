from opentdf import TDFClient, NanoTDFClient, OIDCCredentials, LogLevel
import boto3
import json
import io

ACCESS_KEY = "AKIA2KZCE7Q56T7ZXTFY"
SECRET_ACCESS_KEY = "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"
BUCKET_NAME = "hackathon-period"
ATTR_PREFIX = "http://period.com/attr/tracker/value/"
REGION = "us-east-2"

oidc_creds = OIDCCredentials()
oidc_creds.set_client_credentials_client_secret(client_id = "tdf-client",
                                                client_secret = "123-456",
                                                organization_name = "tdf",
                                                oidc_endpoint = "http://localhost:65432/")

# # k_id = get_keycloak_id(access_token)
# # attribute = ATTR_PREFIX + k_id
# total_data = {"hello world": "whats up"}

# # encrypt with tdf store and upload
client = NanoTDFClient(oidc_credentials = oidc_creds,
                    kas_url = 'http://localhost:65432/api/kas')
client.enable_console_logging(LogLevel.Error)
# # client.add_data_attribute(attribute, kas_url="http://localhost:65432/api/kas")
# encrypted_string = client.encrypt_string(json.dumps(total_data))

# s3 = boto3.client('s3', aws_access_key_id=ACCESS_KEY , aws_secret_access_key=SECRET_ACCESS_KEY)
# s3.put_object(Body=encrypted_string, Bucket=BUCKET_NAME, Key='testing.tdf', ContentType='text/html')


s3 = boto3.client('s3', aws_access_key_id=ACCESS_KEY , aws_secret_access_key=SECRET_ACCESS_KEY)
# Get bucket object
# my_bucket = s3.Bucket('boto-test')
# Download to file
buf = io.BytesIO()
s3.download_fileobj(BUCKET_NAME, "notafile.tdf", buf)
# my_bucket.download_fileobj("myfile.txt", buf)
# Get file content as bytes
filecontent_bytes = buf.getvalue()
# ... or convert to string
fstr = buf.getvalue().decode("utf-8")
# decrypted_string = client.decrypt_string(filecontent_bytes).decode('utf-8')
print(fstr)
