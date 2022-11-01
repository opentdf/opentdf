from fastapi import FastAPI, File, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.templating import Jinja2Templates
from logging import getLogger
from opentdf import TDFClient, OIDCCredentials, LogLevel, TDFStorageType
from os import getenv, remove, stat
from tempfile import NamedTemporaryFile

logger = getLogger(__name__)

KAS_URL = getenv('KAS_URL', "http://opentdf-key-access:8000")
OIDC_ENDPOINT = getenv('OIDC_ENDPOINT', "http://opentdf-keycloak")

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/encrypt/",
    responses = {
        200: {
            "content": {"application/octet-stream": {}}
        }
    },
)
async def encrypt_file(file: bytes = File(...)):
    plaintext = NamedTemporaryFile(delete=False, prefix="plaintext-", suffix=".tmp")
    plaintext_path = plaintext.name
    try:
        plaintext.write(file)
        plaintext.close()
        logger.warning("Wrote file as [%s]", plaintext_path)

        oidc_creds = OIDCCredentials()
        oidc_creds.set_client_credentials_client_secret(
            client_id="web-app-client",
            client_secret="123-456",
            organization_name="tdf",
            oidc_endpoint=OIDC_ENDPOINT
        )
        logger.warning("Logging in at [%s] for [%s]", OIDC_ENDPOINT, KAS_URL)
        client = TDFClient(oidc_credentials=oidc_creds,
                            kas_url=KAS_URL)
        client.enable_console_logging(LogLevel.Trace)
        logger.warning("Starting encrypt; input file size [%s]", len(file))

        ciphertext_path = plaintext_path + ".tdf"
        tdfStorage = TDFStorageType()
        tdfStorage.set_tdf_storage_file_type(plaintext_path)
        client.encrypt_file(tdfStorage, ciphertext_path)
        logger.warning("Encrypt completed; file size [%s]", stat(ciphertext_path).st_size)


        return FileResponse(ciphertext_path, filename="sample.tdf")
    finally:
        remove(plaintext_path)

@app.post("/decrypt/",
    responses = {
        200: {
            "content": {"application/octet-stream": {}}
        }
    },
    response_class=FileResponse,
)
async def decrypt_file(file: bytes = File(...)):
    ciphertext = NamedTemporaryFile(delete=False, prefix="ciphertext-", suffix=".tmp")
    ciphertext_path = ciphertext.name
    try:
        ciphertext.write(file)
        ciphertext.close()

        logger.warning("Logging in at [%s] for [%s]", OIDC_ENDPOINT, KAS_URL)
        oidc_creds = OIDCCredentials()
        oidc_creds.set_client_credentials_client_secret(
            client_id="web-app-client",
            client_secret="123-456",
            organization_name="tdf",
            oidc_endpoint=OIDC_ENDPOINT
        )
        client = TDFClient(
            oidc_credentials=oidc_creds,
            kas_url=KAS_URL
        )
        client.enable_console_logging(LogLevel.Trace)
        logger.warning("Starting dencrypt; input file size [%s]", len(file))

        plaintext_path = ciphertext_path + ".untdf"
        tdfStorage = TDFStorageType()
        tdfStorage.set_tdf_storage_file_type(ciphertext_path)
        client.decrypt_file(tdfStorage, plaintext_path)
        logger.warning("Decrypt completed; file size [%s]", stat(plaintext_path).st_size)

        return FileResponse(plaintext_path, filename="untdf.bin")
    finally:
        remove(ciphertext_path)

@app.get("/test/")
async def oidc_test():
    logger.warning("Logging in at [%s] for [%s]", OIDC_ENDPOINT, KAS_URL)
    oidc_creds = OIDCCredentials()
    oidc_creds.set_client_credentials_client_secret(
        client_id="web-app-client",
        client_secret="123-456",
        organization_name="tdf",
        oidc_endpoint=OIDC_ENDPOINT
    )
    client = TDFClient(oidc_credentials=oidc_creds,
                        kas_url=KAS_URL)
    client.enable_console_logging(LogLevel.Trace)
    plain_text = 'Hello world!!'
    sampleStringStorage = TDFStorageType()
    sampleStringStorage.set_tdf_storage_string_type(plain_text)
    tdf_data = client.encrypt_data(sampleStringStorage)
    logger.warning("Encrypt completed; file size [%s]", len(tdf_data))
    sampleEncryptedStringStorage = TDFStorageType()
    sampleEncryptedStringStorage.set_tdf_storage_string_type(tdf_data)
    decrypted_plain_text = client.decrypt_data(sampleEncryptedStringStorage)
    logger.warning("Decrypt completed; file size [%s]", len(decrypted_plain_text))
    return decrypted_plain_text
