# See: https://istio.tetratelabs.io/istio-in-practice/setting-up-ssl-certs/
DOMAIN_NAME="local.opentdf.io"
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -subj '/O='"$DOMAIN_NAME"' Inc./CN='"$DOMAIN_NAME"'' -keyout $DOMAIN_NAME.CA.key -out $DOMAIN_NAME.CA.crt
openssl req -out $DOMAIN_NAME.CA.csr -newkey rsa:2048 -nodes -keyout $DOMAIN_NAME.key -subj "/CN=$DOMAIN_NAME/O=opentdf from $DOMAIN_NAME"
openssl x509 -req -days 365 -CA $DOMAIN_NAME.CA.crt -CAkey $DOMAIN_NAME.CA.key -set_serial 0 -in $DOMAIN_NAME.CA.csr -out $DOMAIN_NAME.crt
