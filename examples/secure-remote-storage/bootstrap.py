from keycloak import KeycloakAdmin

keycloak_admin = KeycloakAdmin(server_url="http://localhost:65432/auth/",
                               username='keycloakadmin',
                               password='mykeycloakpassword',
                               realm_name="tdf",
                               user_realm_name="master"
)

new_client = keycloak_admin.create_client()
