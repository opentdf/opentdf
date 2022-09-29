# ABACship
ABACship is a two-player battleship-like game implemented using opentdf and ABAC (attribute based access control). The visibility of each square on the board is controlled using attributes and entitlements. 

### Create cluster

```
cd ./examples/abacship-app
kind create cluster --name opentdf
```

### Start services

```
tilt up
```

### Now you can use Abacship
[Let's go!](http://localhost:65432/abacship/)


Use user1 for player 1 :
    </br>- login: user1
    </br>- password: testuser123

Use user2 for player 2 :
    </br>- login: user2
    </br>- password: testuser123


### Clean up

NOTE: Running kind delete will wipe your local cluster and any data associated with it. Delete at your own risk!

```shell
tilt down
kind delete cluster --name opentdf
```

### Troubleshooting
- You will need to use 2 separate windows, one for each player
- If you get stuck on "Generating board...", hit "Reset Game" in both windows, then reselect each player
- If you get an "Invalid parameter: redirect_uri" error from keycloak:
    - Login to Keycloak admin portal with admin credentials found [here](../../quickstart/helm/values-keycloak-bootstrap.yaml#L45-L46)
    - On the left, click on `clients`-> from the list, select `abacship-frontend`
    - Modify `Valid Redirect URLs` property to be: `http://localhost:65432/*`
    - Scroll to the bottom of the page and click `Save`
- If you see a "Realm does not exist error", trigger an update for keycloak-bootstrap, wait for it to run, then trigger an update for abacship-backend. Once the backend is running, click "Reset Game" in both windows, then reselect each player.
- If keycloak crashes, retrigger keycloak, then retrigger keycloak-bootstrap and wait for it to run, then retrigger abacship-backend and wait for it to run. Once the backend is running, click "Reset Game" in both windows, then reselect each player.
- For issues with kind, tilt, or backend services, please see the [troubleshooting section in Quickstart](../../quickstart/README.md#troubleshoot)

### Quickstart
Do you want a quick, local demonstration of OpenTDF? See [Quickstart](../../quickstart)
