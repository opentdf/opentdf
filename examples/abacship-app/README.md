# Keycloak authentic

# KC Admin (needed for setup)

U: `keycloakadmin`
P: `mykeycloakpassword`

# KC Setup (just for hackathon)

1. Stand up openTDF quickstart
2. Login to Keycloak admin portal with Admin credentials above: `http://localhost:65432/keycloak/auth/`

3. On the left, click on `clients`-> from the list, select `browsertest`

4. Modify `Valid Redirect URLs` property to be: http://localhost*

# User1

U: `user1`
P: `password`

# User2

U: `user2`
P: `password`
