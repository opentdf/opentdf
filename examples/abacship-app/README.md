## Quickstart

Do you want a quick, local demonstration of OpenTDF? See [Quickstart](../../quickstart)

### Create cluster

```
cd ./examples/abacship-app
kind create cluster --name opentdf
```

### Start services

```shell
tilt up
```

Front-end [Link](http://localhost:65432/abacship/) .
</br>
Use user1 for player 1 :
</br>login: user1
</br>password: testuser123

Use user1 for player 2 :
</br>login: user2
</br>password: testuser123


### Clean up

NOTE: Running kind delete will wipe your local cluster and any data associated with it. Delete at your own risk!

```shell
tilt down
kind delete cluster --name opentdf
pip3 uninstall opentdf
```
