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
rm -rf backend_server/src/venv
kind delete cluster --name opentdf
```

### Troubleshooting
- You will need to use 2 seperate windows, one for each player
- If you get stuck on "Generating board...", hit "Reset Game" in both windows
- For issues with kind, tilt, or backend services, please see the [troubleshooting section in Quickstart](../../quickstart/README.md#208)

### Quickstart
Do you want a quick, local demonstration of OpenTDF? See [Quickstart](../../quickstart)