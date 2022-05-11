## Generate CA and Server Certificates
```console
openssl genrsa -aes256 -out ca.key 2048

openssl req -x509 -new -nodes -key ca.key -sha256 -days 1024 -out ca.crt -subj "/C=US/ST=Home/L=Home/O=mycorp/OU=myorg/CN=caroot.opentdf.local"

openssl genrsa -out  tls.key 2048

openssl req -new -key  tls.key -out  opentdf.local.csr -subj "/C=UA/ST=Home/L=Home/O=mycorp/OU=myorg/CN=opentdf.local"

openssl x509 -req -in opentdf.local.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out tls.crt -days 500 -sha256
```
## Generate Client certificate
```console
openssl genrsa -out john.doe.key 2048

openssl req -new -key john.doe.key -out john.doe.req -subj "/C=US/ST=California/L=LA/O=example/CN=John Doe/emailAddress=john.doe@example.org"

openssl x509 -req -in john.doe.req -CA ca.crt -CAkey ca.key -set_serial 101 -extensions client -days 365 -outform PEM -out john.doe.cer

openssl pkcs12 -export -inkey john.doe.key -in john.doe.cer -out john.doe.p12
```
## Register a secret to be deploy for Wildfly and the Ingress
```
 kubectl create secret generic x509-secret --from-file=ca.crt=ca.crt --from-file=tls.crt=tls.crt --from-file=tls.key=tls.key
```
