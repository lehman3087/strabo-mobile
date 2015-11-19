(function () {
  'use strict';

  angular
    .module('app')
    .controller('SpotsController', Spots);

  Spots.$inject = ['$cordovaDevice', '$cordovaFile', '$document', '$ionicActionSheet', '$ionicModal', '$ionicPopup',
    '$log', '$scope', '$state', '$window', 'CurrentSpotFactory', 'ImageMapFactory', 'NewSpotFactory', 'SpotFactory',
    'UserFactory'];

  function Spots($cordovaDevice, $cordovaFile, $document, $ionicActionSheet, $ionicModal, $ionicPopup, $log, $scope,
                 $state, $window, CurrentSpotFactory, ImageMapFactory, NewSpotFactory, SpotFactory, UserFactory) {
    var vm = this;

    vm.clearAllSpots = clearAllSpots;
    vm.closeModal = closeModal;
    vm.exportToCSV = exportToCSV;
    vm.isOnlineLoggedIn = isOnlineLoggedIn;
    vm.newSpot = newSpot;
    vm.openModal = openModal;
    vm.showActionsheet = showActionsheet;
    vm.spots = [];
    vm.sync = sync;

    activate();

    /**
     * Private Functions
     */

    function activate() {
      CurrentSpotFactory.clearCurrentSpot();            // Make sure the current spot is empty
      loadSpots();
      createModals();
      cleanupModals();
    }

    function cleanupModals() {
      // Cleanup the modal when we're done with it!
      // Execute action on hide modal
      $scope.$on('syncModal.hidden', function () {
        vm.syncModal.remove();
      });
    }

    function createModals() {
      $ionicModal.fromTemplateUrl('app/remote-connection/sync-modal.html', {
        'scope': $scope,
        'animation': 'slide-in-up'
      }).then(function (modal) {
        vm.syncModal = modal;
      });
    }

    function loadSpots() {
      SpotFactory.all().then(
        function (spots) {
          vm.spots = spots;
        }
      );
    }

    /**
     * Public Functions
     */

    // clears all spots
    function clearAllSpots() {
      var confirmPopup = $ionicPopup.confirm({
        'title': 'Delete Spots',
        'template': 'Are you sure you want to delete <b>ALL</b> spots?'
      });
      confirmPopup.then(
        function (res) {
          if (res) {
            SpotFactory.clear(
              function () {
                // update the spots list
                SpotFactory.all().then(
                  function (spots) {
                    vm.spots = spots;
                  }
                );
                // Remove all of the image maps
                ImageMapFactory.clearAllImageMaps();
              }
            );
          }
        }
      );
    }

    function closeModal(modal) {
      vm[modal].hide();
      SpotFactory.all().then(function (spots) {
        vm.spots = spots;
      });
    }

    // Export data to CSV
    function exportToCSV() {
      // Convert the spot objects to a csv format
      function convertToCSV() {
        // Get all the fields for the csv header row
        var allHeaders = [];
        _.each(vm.spots,
          function (spot) {
            var headers = _.keys(spot.properties);
            // If there are custom fields, loop through the custom object grabbing those fields
            var i = _.indexOf(headers, 'custom');
            if (i !== -1) {
              headers = _.without(headers, 'custom');
              var customHeaders = _.keys(spot.properties.custom);
              customHeaders = _.map(customHeaders,
                function (header) {
                  return 'custom_' + header;
                }
              );
              allHeaders = _.union(headers, allHeaders, customHeaders);
            }
            else {
              allHeaders = _.union(headers, allHeaders);
            }
          }
        );
        // Add the two fields for the geometry
        allHeaders.push('geometry_type');
        allHeaders.push('geometry_coordinates');

        var allHeadersQuoted = _.map(allHeaders,
          function (ele) {
            return '\'' + ele + '\'';
          }
        );
        var csv = allHeadersQuoted.toString() + '\r\n';

        // Get all the values for each csv data row
        _.each(vm.spots,
          function (spot) {
            var row = new Array(allHeaders.length);
            row = _.map(row,
              function (ele) {
                return '';
              }
            );
            _.each(spot.properties,
              function (value, key) {
                // If the value is actually an object
                var i = _.indexOf(allHeaders, key);
                if (_.isObject(value)) {
                  // Get all the custom field values
                  if (key === 'custom') {
                    _.each(value,
                      function (customValue, customKey) {
                        i = _.indexOf(allHeaders, 'custom_' + customKey);
                        row[i] = '\'' + customValue + '\'';
                      }
                    );
                  }
                  // Get just a string of the ids for groups, group_members and links
                  else if (key === 'groups' || key === 'group_members' || key === 'links') {
                    value = _.pluck(value, 'id');
                    row[i] = '\'' + value.join(', ') + '\'';
                  }
                  // Separate date parts
                  else if (value instanceof Date) {
                    if (key === 'time') {
                      row[i] = value.toLocaleTimeString();
                    }
                    else if (key === 'date') {
                      row[i] = value.toLocaleDateString();
                    }
                    else {
                      row[i] = value.toJSON();
                    }
                  }
                  // Flatten the child values
                  else {
                    row[i] = '\'' + _.flatten(value).join(', ') + '\'';
                  }
                }
                else {
                  row[i] = '\'' + value + '\'';
                }
              }
            );
            // Add the values for the geometry fields
            if (angular.isDefined(spot.geometry) && angular.isDefined(spot.geometry.type)) {
              var i = _.indexOf(allHeaders, 'geometry_type');
              row[i] = '\'' + spot.geometry.type + '\'';
              if (angular.isDefined(spot.geometry.coordinates)) {
                i = _.indexOf(allHeaders, 'geometry_coordinates');
                row[i] = '\'' + _.flatten(spot.geometry.coordinates).join(', ') + '\'';
              }
            }
            csv += row.toString() + '\r\n';
          }
        );
        return csv;
      }

      var spotData = convertToCSV(vm.spots);

      // If this is a web browser and not using cordova
      if ($document[0].location.protocol !== 'file:') { // Phonegap is not present }
        spotData = spotData.replace(/\r\n/g, '<br>');
        var win = $window.open();
        win.document.body.innerHTML = spotData;
        return;
      }

      var d = new Date();
      d = d.toLocaleDateString() + '-' + d.toLocaleTimeString();
      d = d.replace(/\//g, '-');
      d = d.replace(/:/g, '');
      d = d.replace(/ /g, '');
      var fileName = d + '-' + 'strabo-data.csv';

      var devicePath;
      switch ($cordovaDevice.getPlatform()) {
        case 'Android':
          devicePath = cordova.file.externalRootDirectory;
          break;
        case 'iOS':
          devicePath = cordova.file.documentsDirectory;
          break;
        default:
          // uh oh?  TODO: what about windows and blackberry?
          devicePath = cordova.file.externalRootDirectory;
          break;
      }

      var directory = 'strabo';

      function writeFile(dir) {
        $cordovaFile.writeFile(devicePath + dir, fileName, spotData, true).then(
          function (success) {
            $log.log(success);
            $ionicPopup.alert({
              'title': 'Success!',
              'template': 'CSV written to ' + devicePath + dir + fileName
            });
          },
          function (error) {
            $log.log(error);
          }
        );
      }

      $cordovaFile.checkDir(devicePath, directory).then(
        function (success) {
          $log.log(success);
          writeFile(success.fullPath);
        },
        function (error) {
          $cordovaFile.createDir(devicePath, directory, false).then(
            function (success) {
              $log.log(success);
              writeFile(success.fullPath);
            },
            function (error) {
              $log.log(error);
            }
          );
        }
      );
    }

    // Is the user online and logged in
    function isOnlineLoggedIn() {
      return navigator.onLine && UserFactory.getLogin();
    }

    // Create a new Spot
    function newSpot() {
      var jsonTemplate = {
        'properties': {
          'type': 'point'  // Todo Just create as default point type for now but this should be removed
        }
      };
      NewSpotFactory.setNewSpot(jsonTemplate);
      $state.go('spotTab.spot');
    }

    function openModal(modal) {
      vm[modal].show();
    }

    function showActionsheet() {
      $ionicActionSheet.show({
        'titleText': 'Spot Actions',
        'buttons': [{
          'text': '<i class="icon ion-trash-b"></i> Delete All Spots'
        }, {
          'text': '<i class="icon ion-archive"></i>Export All Spots to CSV'
        }],
        'cancelText': 'Cancel',
        'cancel': function () {
          $log.log('CANCELLED');
        },
        'buttonClicked': function (index) {
          $log.log('BUTTON CLICKED', index);
          switch (index) {
            case 0:
              vm.clearAllSpots();
              break;
            case 1:
              vm.exportToCSV();
              break;
          }
          return true;
        }
      });
    }

    function sync() {
      if (isOnlineLoggedIn()) {
        vm.openModal('syncModal');
      }
      else {
        if (!navigator.onLine && !UserFactory.getLogin()) {
          $ionicPopup.alert({
            'title': 'Get Online and Log In!',
            'template': 'You must be online and logged in to sync with the Strabo database.'
          });
        }
        else if (!navigator.onLine) {
          $ionicPopup.alert({
            'title': 'Not Online!',
            'template': 'You must be online to sync with the Strabo database.'
          });
        }
        else {
          $ionicPopup.alert({
            'title': 'Not Logged In!',
            'template': 'You must be logged in to sync with the Strabo database.'
          });
        }
      }
    }
  }
}());