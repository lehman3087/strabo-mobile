Strabo Mobile
==============

Strabo Mobile is a cross-platform mobile application for Structural Geology and Tectonics (SG&T) data acquisition.

**Build Stack:**
- Core Technology: [Cordova](http://cordova.apache.org/)
- UI Framework (CSS & JS): [Ionic](http://ionicframework.com/)
- MVC: [Angular JS](https://angularjs.org/)
- Map Library: [OpenLayers 3](http://openlayers.org/)
- AngularJS Extensions for Cordova API: [ngCordova](http://ngcordova.com/)
- Local Storage: [localForage with Cordova SQLite Driver](https://github.com/thgreasi/localForage-cordovaSQLiteDriver)
- Testing Framework: [Jasmine](http://jasmine.github.io/)
- Test Runner: [Karma](karma-runner.github.io/)
- Linting Utility: [ESLint](http://eslint.org/)

## Development Setup

### Prerequisites

- [node.js](http://nodejs.org/)
- [git](http://git-scm.com/)
- Java SDK, Apache Ant, Android SDK for Windows users developing for Android. See the [Ionic notes](http://ionicframework.com/docs/guide/installation.html).

### Installation

    npm install -g cordova ionic

### Get Project Files

    git clone https://github.com/StraboSpot/strabo-mobile.git
    cd strabo-mobile

Restore the Plugins and Platforms from `package.json`:

    ionic state restore

*Note: These plugins were originally added with the command `ionic plugin add` which adds the plugin to `package.json` whereas `cordova plugin add` does not.*
    
### Tested Environment - Plugins    
    cordova-plugin-camera 2.1.1 "Camera"
    cordova-plugin-console 1.0.2 "Console"
    cordova-plugin-device 1.1.1 "Device"
    cordova-plugin-file 4.1.1 "File"
    cordova-plugin-filepath 1.0.2 "FilePath"
    cordova-plugin-geolocation 2.1.0 "Geolocation"
    cordova-plugin-network-information 1.2.0 "Network Information"
    cordova-plugin-splashscreen 3.2.1 "Splashscreen"
    cordova-plugin-statusbar 2.1.2 "StatusBar"
    cordova-plugin-whitelist 1.2.1 "Whitelist"
    cordova-sqlite-storage 0.7.14 "Cordova sqlite storage plugin"
    ionic-plugin-deploy 0.5.0 "IonicDeploy"
    ionic-plugin-keyboard 2.0.1 "Keyboard"

*Notes:*
- This list can be generated with `ionic plugin list`.
- `cordova-plugin-filepath`: Added due to Cordova bug with Android and content schema
- `cordova-sqlite-storage@0.7.14`: Added for the localForage dependencies

### Tested Environment - Other Packages/Libraries

    ionic library: 1.2.4
    ionic cli : 1.7.14
    cordova: 6.6.1
    nodejs: 5.0.0
    npm: 2.12.1
    bower: 1.7.2
    ng-cordova: v0.1.23-alpha

## Running/Testing the App

### In a Desktop Web Browser:  

    ionic serve

### As a Native App, Built App with Ionic
- Packages were built in the step above with `ionic state restore`.
- Set up an [Ionic Security Profile](http://docs.ionic.io/docs/security-profiles), named strabo. 
- Use [Ionic Package](http://docs.ionic.io/docs/package-overview) to build new packages for changes that require binary modifications.

```
    ionic package build android --release --profile strabo
    ionic package build ios --release --profile strabo
```
    
- Changes to the HTML/CSS/JS/Images/Audio/Video files (basically anything inside `/www`) only need to be updated with [Ionic Deploy](http://docs.ionic.io/docs/deploy-overview).

To Deploy Updates:

    ionic upload --note "new version" --deploy=production

### As a Native App, Built Locally

To test as a native app see the Ionic [guide](http://ionicframework.com/docs/guide/testing.html).

For a USB connected Android device first copy `config.xml` from `strabo-moble/www` into the `strabo-mobile` root. Then:

    ionic platform add android
    ionic run
    
## Library Updates

**Ionic:**

1. Download latest ionic: `npm install -g ionic`
2. In project root run: `ionic lib update`
3. Check the version of `angular.js` that is bundled within `www/lib/ionic/js/ionic.bundle.js` and make sure that `www/lib/angular-mocks.js` and `www/lib/angular-messages.js` have the same version number. Download updates from [here](https://code.angularjs.org/) if necessary. 


## Unit-Testing

Prerequisites:

    npm install karma --save-dev
    npm install karma-jasmine --save-dev
    npm install jasmine-core --save-dev
    npm install -g karma-cli
    
Add test browsers:

    npm install karma-chrome-launcher --save-dev

To run tests:

    karma start

Note: Make sure the version of `angular.js` that is bundled within `www/lib/ionic/js/ionic.bundle.js` matches the version of `angular-mocks.js`. Updated versions can be found [here](https://code.angularjs.org/).

## Linting

Using [ESLint](http://eslint.org/) with an AngularJS plugin based on [John Papa's Guideline](https://github.com/johnpapa/angular-styleguide).

1) Install eslint as a dev-dependency:

    npm install --save-dev eslint

2) Install eslint-plugin-angular as a dev-dependency:

    npm install --save-dev eslint-plugin-angular

3) Install eslint-config-angular as a dev-dependency:

    npm install --save-dev eslint-config-angular
    
4) Use the config file in the project root: `.eslintrc`
