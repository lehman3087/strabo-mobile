(function () {
  'use strict';

  angular
    .module('app')
    .factory('SpotsFactory', SpotsFactory);

  SpotsFactory.$inject = ['$ionicModal', '$ionicPopup', 'ProjectFactory', 'SpotFactory'];

  function SpotsFactory($ionicModal, $ionicPopup, ProjectFactory, SpotFactory) {
    var activeSpots = {};
    var filteredSpots = {};
    var displayedSpots = {};
    var filterConditions = {};
    var filteredSpots = {};
    var spotsListDetail = {'tabs': true, 'tags': true};  // Only Spots in the active datasets

    return {
      'areValidFilters': areValidFilters,
      'createSpotsFilterModal': createSpotsFilterModal,
      'createSpotsListDetailModal': createSpotsListDetailModal,
      'getActiveSpots': getActiveSpots,
      'getFilterConditions': getFilterConditions,
      'getSpotsListDetail': getSpotsListDetail,
      'getFilteredSpots': getFilteredSpots,
      'setFilterConditions': setFilterConditions,
      'setSpotsListDetail': setSpotsListDetail,
      'setFilteredSpots': setFilteredSpots,
      'sortSpots': sortSpots
    };

    /**
     * Public Functions
     */

    function areValidFilters() {
      // First make sure anything that was toggled on was not left empty
      _.each(filterConditions, function (value, key) {
        if (_.isEmpty(value)) delete filterConditions[key];
      });
      if (_.isEmpty(filterConditions)) {
        $ionicPopup.alert({
          'title': 'No Filters',
          'template': 'There are no filters to apply.'
        });
        return false;
      }
      // Check Date Filter
      if (filterConditions.date) {
        if (!filterConditions.date.start) {
          filterConditions.date.start = new Date("1000-02-01T05:00:00.000Z");    // Jan 31, 1000
        }
        if (!filterConditions.date.end) filterConditions.date.end = new Date(); // today
        filterConditions.date.end.setHours(23,59,59,999);
        if (filterConditions.date.start > filterConditions.date.end) {
          $ionicPopup.alert({
            'title': 'Invalid Dates',
            'template': 'There is a problem with the entered dates. Please fix your dates or turn off the date filter.'
          });
          return false;
        }
      }
      // Check Date Modified Filter
      if (filterConditions.dateModified) {
        if (!filterConditions.dateModified.start) {
          filterConditions.dateModified.start = new Date("1000-02-01T05:00:00.000Z");     // Jan 31, 1000
        }
        if (!filterConditions.dateModified.end) filterConditions.dateModified.end = new Date(); // today
        filterConditions.dateModified.end.setHours(23,59,59,999);
        if (filterConditions.dateModified.start > filterConditions.dateModified.end) {
          $ionicPopup.alert({
            'title': 'Invalid Modified Dates',
            'template': 'There is a problem with the entered dates. Please fix your modified dates or turn' +
            ' off the date modified filter.'
          });
          return false;
        }
      }
      return true;
    }

    function createSpotsFilterModal(scope) {
      return $ionicModal.fromTemplateUrl('app/spots/spots-filter-modal.html', {
        'scope': scope,
        'animation': 'slide-in-up',
        'backdropClickToClose': false
      }).then(function (modal) {
        return modal;
      });
    }

    function createSpotsListDetailModal(scope) {
      return $ionicModal.fromTemplateUrl('app/spots/spots-list-detail-modal.html', {
        'scope': scope,
        'animation': 'slide-in-up',
        'backdropClickToClose': false
      }).then(function (modal) {
        return modal;
      });
    }

    function getActiveSpots() {
      setActiveSpots();
      return activeSpots;
    }

    function getFilterConditions() {
      return filterConditions;
    }

    function getSpotsFilterModal() {
      return spotsFilterModal;
    }

    function getSpotsListDetail() {
      return spotsListDetail || {};
    }

    function getFilteredSpots() {
      if (!_.isEmpty(filterConditions)) setFilteredSpots();
      return filteredSpots;
    }

    function setActiveSpots() {
      activeSpots = SpotFactory.getActiveSpots();
    }

    function setFilterConditions(inFilterConditions) {
      filterConditions = inFilterConditions;
    }

    function setSpotsListDetail(inSpotsListDetail) {
      spotsListDetail = inSpotsListDetail;
    }

    function setFilteredSpots() {
      filteredSpots = activeSpots;
      // Filter by dataset
      if (filterConditions.datasets) {
        var datasetIdsToSpotIds = ProjectFactory.getSpotIds();
        var filteredSpotsIds = [];
        _.each(filterConditions.datasets, function (dataset) {
          filteredSpotsIds.push(datasetIdsToSpotIds[dataset]);
        });
        filteredSpotsIds = _.flatten(filteredSpotsIds);
        filteredSpots = _.filter(activeSpots, function (activeSpot) {
          return _.contains(filteredSpotsIds, activeSpot.properties.id);
        });
      }
      // Filter by name
      if (filterConditions.name) {
        filteredSpots = _.filter(filteredSpots, function (spot) {
          return spot.properties.name.includes(filterConditions.name);
        });
      }
      // Filter by date
      if (filterConditions.date) {
        filteredSpots = _.filter(filteredSpots, function (spot) {
          if (spot.properties.date) {
            return new Date(spot.properties.date) >= filterConditions.date.start &&
              new Date(spot.properties.date) <= filterConditions.date.end;
          }
        });
      }
      // Filter by date modified
      if (filterConditions.dateModified) {
        filteredSpots = _.filter(filteredSpots, function (spot) {
          if (spot.properties.modified_timestamp) {
            return new Date(spot.properties.modified_timestamp) >= filterConditions.dateModified.start &&
              new Date(spot.properties.modified_timestamp) <= filterConditions.dateModified.end;
          }
        });
      }
    }

    function sortSpots(spots) {
      return _.sortBy(spots, function (spot) {
        return spot.properties.modified_timestamp;
      }).reverse();
    }
  }
}());
