# Secure Cycle

Secure Cycle is a secure period and symptom tracking app powered by OpenTDF.

Please see the [standalone Secure Cycle repo](https://github.com/opentdf/secure-cycle) to run this example. 

### Start Backend

Execute the following steps inside of the [Secure Cycle repo]((https://github.com/opentdf/secure-cycle) ). 

```shell
kind create cluster --name opentdf
tilt up
```

### Start Frontend

Execute the following steps inside of the [Secure Cycle repo]((https://github.com/opentdf/secure-cycle) ). 

Requires Ruby and XCode

1. Run npm install from the root directory.
2. Run cd ios to navigate to the ios directory
3. Run bundle install. This will install a specific version of Ruby to only this project folder. This will avoid conflicts will the Macos default version of ruby, while keeping your development environment clean
4. Run pod install to install the needed pod dependencies
5. Open Xcode -> ios/SecureCycle.xcworkspace. NOTE: Do not try to open SecureCycle.xcodeproj. Opening the xcode proj will result in build errors as xcode will not be able to locate your installed pods. This is a common mistake when working with react-native for the first time.
Press the play button!

### Clean up

NOTE: Running kind delete will wipe your local cluster and any data associated with it. Delete at your own risk!

```shell
tilt down
kind delete cluster --name opentdf
```
