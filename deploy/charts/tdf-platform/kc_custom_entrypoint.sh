#!/bin/bash

CUSTOM_ARGS=""
# This is the same as the default value of log-gelf-timestamp-format in Keycloak
# This could be improve by retrieving the actual value if this is modified
LOG_TIMESTAMP_FORMAT="+%F %T,%3N"

autogenerate_keystores() {
    local CUSTOM_TLS_ARGS=""

    # Inspired by https://github.com/keycloak/keycloak-containers/blob/main/server/tools/x509.sh
    local KEYSTORES_STORAGE="${KEYCLOAK_HOME:=/opt/keycloak}/conf"

    local -r X509_CRT_DELIMITER="/-----BEGIN CERTIFICATE-----/"
    local JKS_TRUSTSTORE_FILE="truststore.jks"
    local JKS_TRUSTSTORE_PATH="${KEYSTORES_STORAGE}/${JKS_TRUSTSTORE_FILE}"
    local JKS_TRUSTSTORE_PASSWORD=$(tr -cd [:alnum:] < /dev/urandom | fold -w32 | head -n 1)

    local SYSTEM_CACERTS="/etc/pki/java/cacerts"

    if [[ ! -d "${KEYSTORES_STORAGE}" ]]; then
        mkdir -p "${KEYSTORES_STORAGE}"
    fi

    if [[ -f "${JKS_TRUSTSTORE_PATH}" ]] ; then
        rm "${JKS_TRUSTSTORE_PATH}"
    fi

    pushd /tmp >& /dev/null
    echo "$(date "$LOG_TIMESTAMP_FORMAT") INFO  [container.initialization] (keystore-autoconfiguration) Creating Keycloak truststore..."

    # X509 is a whitespace delimited list of cert file paths.
    CERTS=($X509_CA_BUNDLE)
    for (( i=0;  i < ${#CERTS[@]};  i++ )); do
        CERT_FILE=${CERTS[$i]}
        echo "Import ${CERT_FILE}"
        echo "$(date "$LOG_TIMESTAMP_FORMAT") INFO  [container.initialization] (keystore-autoconfiguration) Import '${CERT_FILE}' into ${JKS_TRUSTSTORE_PATH}"
        keytool -importcert -noprompt \
            -keystore "${JKS_TRUSTSTORE_PATH}" \
            -file "${CERT_FILE}" \
            -storepass "${JKS_TRUSTSTORE_PASSWORD}" \
            -alias "service-${i}" >& /dev/null
    done

    if [[ -f "${JKS_TRUSTSTORE_PATH}" ]]; then
        echo "$(date "$LOG_TIMESTAMP_FORMAT") INFO  [container.initialization] (keystore-autoconfiguration) Keycloak truststore successfully created at: ${JKS_TRUSTSTORE_PATH}."
        CUSTOM_TLS_ARGS+="--spi-truststore-file-file=${JKS_TRUSTSTORE_PATH} --spi-truststore-file-password=${JKS_TRUSTSTORE_PASSWORD}"
    else
        echo "$(date "$LOG_TIMESTAMP_FORMAT") ERROR  [container.initialization] (keystore-autoconfiguration) Keycloak truststore not created at: ${JKS_TRUSTSTORE_PATH}." >&2
    fi

    if keytool -v -list -keystore "${SYSTEM_CACERTS}" -storepass "changeit" > /dev/null; then
        echo "$(date "$LOG_TIMESTAMP_FORMAT") INFO  [container.initialization] (keystore-autoconfiguration) Importing certificates from system's Java CA certificate bundle into Keycloak truststore..."
        keytool -importkeystore -noprompt \
            -srckeystore "${SYSTEM_CACERTS}" \
            -destkeystore "${JKS_TRUSTSTORE_PATH}" \
            -srcstoretype jks \
            -deststoretype jks \
            -storepass "${JKS_TRUSTSTORE_PASSWORD}" \
            -srcstorepass "changeit" >& /dev/null
        if [[ "$?" -eq "0" ]]; then
            echo "$(date "$LOG_TIMESTAMP_FORMAT") INFO  [container.initialization] (keystore-autoconfiguration) Successfully imported certificates from system's Java CA certificate bundle into Keycloak truststore at: ${JKS_TRUSTSTORE_PATH}."
        else
            echo "$(date "$LOG_TIMESTAMP_FORMAT") ERROR  [container.initialization] (keystore-autoconfiguration) Failed to import certificates from system's Java CA certificate bundle into Keycloak truststore." >&2
        fi
    fi
    popd >& /dev/null
    CUSTOM_ARGS+=${CUSTOM_TLS_ARGS}
}

if [[ -n "${X509_CA_BUNDLE+0}" ]] ; then
    autogenerate_keystores
fi

# Start Keycloak with the default entrypoint
exec /opt/keycloak/bin/kc.sh ${CUSTOM_ARGS} $@
exit $?