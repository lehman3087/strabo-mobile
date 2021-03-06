(function () {
  'use strict';

  angular
    .module('app')
    .controller('StratSectionController', StratSectionController);

  StratSectionController.$inject = ['$ionicHistory', '$ionicLoading', '$ionicModal', '$ionicPopover', '$ionicPopup',
    '$ionicSideMenuDelegate', '$location', '$log', '$rootScope', '$scope', '$state', '$timeout', 'FormFactory',
    'HelpersFactory', 'ImageFactory', 'MapDrawFactory', 'MapEmogeosFactory', 'MapFeaturesFactory', 'MapLayerFactory',
    'MapSetupFactory', 'MapViewFactory', 'ProjectFactory', 'SpotFactory', 'StratSectionFactory', 'IS_WEB'];

  function StratSectionController($ionicHistory, $ionicLoading, $ionicModal, $ionicPopover, $ionicPopup,
                                  $ionicSideMenuDelegate, $location, $log, $rootScope, $scope, $state, $timeout,
                                  FormFactory, HelpersFactory, ImageFactory, MapDrawFactory, MapEmogeosFactory,
                                  MapFeaturesFactory, MapLayerFactory, MapSetupFactory, MapViewFactory, ProjectFactory,
                                  SpotFactory, StratSectionFactory, IS_WEB) {
    var vm = this;

    var currentSpot = {};
    var datasetsLayerStates;
    var map;
    var spotsThisMap = [];
    var stratSection = {};
    var tagsToAdd = [];

    vm.addIntervalModal = {};
    vm.allTags = [];
    vm.clickedFeatureId = undefined;
    vm.data = {};
    vm.grainSizeOptions = {};
    vm.isNesting = SpotFactory.getActiveNesting();
    vm.newNestModal = {};
    vm.newNestProperties = {};
    vm.mapView = true;
    vm.popover = {};
    vm.saveEditsText = 'Save Edits';
    vm.showSaveEditsBtn = false;
    vm.stratSectionIntervals = [];
    vm.thisSpotWithStratSection = {};

    vm.addInterval = addInterval;
    vm.addMoreDetail = addMoreDetail;
    vm.closeModal = closeModal;
    vm.createTag = createTag;
    vm.deleteSpot = deleteSpot;
    vm.getTagNames = getTagNames;
    vm.goBack = goBack;
    vm.goToSpot = goToSpot;
    vm.groupSpots = groupSpots;
    vm.hasRelationships = hasRelationships;
    vm.hasTags = hasTags;
    vm.isiOS = isiOS;
    vm.saveEdits = saveEdits;
    vm.saveInterval = saveInterval;
    vm.stereonetSpots = stereonetSpots;
    vm.switchView = switchView;
    vm.toggleNesting = toggleNesting;
    vm.toggleTagChecked = toggleTagChecked;
    vm.zoomToSpotsExtent = zoomToSpotsExtent;

    activate();

    /**
     * Private Functions
     */

    function activate() {
      $ionicLoading.show({
        'template': '<ion-spinner></ion-spinner><br>Loading Strat Section...'
      });
      $log.log('Loading Strat Section ...');

      // Disable dragging back to ionic side menu because this affects drawing tools
      $ionicSideMenuDelegate.canDragContent(false);

      currentSpot = SpotFactory.getCurrentSpot();
      if (currentSpot) vm.clickedFeatureId = currentSpot.properties.id;
      MapEmogeosFactory.clearSelectedSpot();

      createModals();
      createPopover();
      createMap();
    }

    function createMap() {
      var switcher = new ol.control.LayerSwitcher();

      gatherSpots();
      var blankStratSection = {'height': 3000, 'width': 2000};
      MapViewFactory.setInitialMapView(blankStratSection);
      MapSetupFactory.setMap();
      MapSetupFactory.setImageOverlays(vm.thisSpotWithStratSection).then(function () {
        MapSetupFactory.setOtherLayers();
        MapSetupFactory.setMapControls(switcher);
        MapSetupFactory.setPopupOverlay();

        map = MapSetupFactory.getMap();

        updateFeatureLayer();
        updateSelectedSymbol();

        createSwitcher(switcher);

        vm.currentZoom = HelpersFactory.roundToDecimalPlaces(map.getView().getZoom(), 2);
        createMapInteractions();
        createPageEvents();

        $ionicLoading.hide();
        $log.log('Done Loading Strat Section');
        $timeout(function () {
          map.updateSize();         // use OpenLayers API to force map to update
        });
      });
    }

    function createMapInteractions() {
      // When the map is moved update the zoom control
      map.on('moveend', function (evt) {
        var mapZoom = HelpersFactory.roundToDecimalPlaces(evt.map.getView().getZoom(), 2);
        if (vm.currentZoom !== mapZoom) {
          vm.currentZoom = mapZoom;
          $scope.$apply();
        }
      });

      map.on('touchstart', function (event) {
        $log.log('touch');
        $log.log(event);
      });

      // display popup on click
      map.on('click', function (evt) {
        //$log.log('map clicked at pixel:', evt.pixel, 'mapcoords:', map.getCoordinateFromPixel(evt.pixel));
        MapFeaturesFactory.removeSelectedSymbol(map);
        MapEmogeosFactory.clearSelectedSpot();

        // are we in draw mode?  If so we dont want to display any popovers during draw mode
        if (!MapDrawFactory.isDrawMode()) {
          var feature = MapFeaturesFactory.getClickedFeature(map, evt);
          var layer = MapFeaturesFactory.getClickedLayer(map, evt);
          if (feature && feature.get('id') && layer && layer.get('name') !== 'geolocationLayer') {
            vm.clickedFeatureId = feature.get('id');
            MapEmogeosFactory.setSelectedSpot(SpotFactory.getSpotById(vm.clickedFeatureId));
            if (IS_WEB) {
              MapFeaturesFactory.setSelectedSymbol(map, feature.getGeometry());
              $rootScope.$broadcast('clicked-mapped-spot', {'spotId': vm.clickedFeatureId});
            }
            else MapFeaturesFactory.showMapPopup(feature, evt);
          }
          else {
            vm.clickedFeatureId = undefined;
            if (IS_WEB) MapEmogeosFactory.resetAllEmogeoButtons();
          }
          $scope.$apply();
        }
      });

      // Draw Map Axes
      map.on('precompose', function (event) {
        if ($state.current.name === 'app.strat-section') {
          var ctx = event.context;
          var pixelRatio = event.frameState.pixelRatio;
          StratSectionFactory.drawAxes(ctx, pixelRatio, stratSection);

          var mapSize = map.getSize();
          var mapExtent = map.getView().calculateExtent(map.getSize());
          // $log.log(mapSize, mapExtent);
        }
      });

      var popup = MapSetupFactory.getPopupOverlay();
      popup.getElement().addEventListener('click', function (e) {
        var action = e.target.getAttribute('data-action');
        if (action) {
          if (action === 'takePicture') {
            popup.hide();
            ImageFactory.setIsReattachImage(false);
            ImageFactory.setCurrentSpot(SpotFactory.getSpotById(vm.clickedFeatureId));
            ImageFactory.setCurrentImage({'image_type': 'photo'});
            ImageFactory.takePicture();
          }
          else if (action === 'more') {
            popup.hide();
            var spot = SpotFactory.getSpotById(vm.clickedFeatureId);
            if (spot.properties.surface_feature &&
              spot.properties.surface_feature.surface_feature_type === 'strat_interval') {
              goToSpot(vm.clickedFeatureId, 'sed-lithologies');
            }
            else goToSpot(vm.clickedFeatureId, 'spot');
            $scope.$apply();
          }
          e.preventDefault();
        }
      }, false);
    }

    function createModals() {
      $ionicModal.fromTemplateUrl('app/maps/map/add-tag-modal.html', {
        'scope': $scope,
        'animation': 'slide-in-up',
        'backdropClickToClose': false,
        'hardwareBackButtonClose': false
      }).then(function (modal) {
        vm.addTagModal = modal;
      });

      $ionicModal.fromTemplateUrl('app/shared/new-nest-modal.html', {
        'scope': $scope,
        'animation': 'slide-in-up',
        'backdropClickToClose': false,
        'hardwareBackButtonClose': false
      }).then(function (modal) {
        vm.newNestModal = modal;
      });
    }

    function createPageEvents() {
      $rootScope.$on('updateStratSectionFeatureLayer', function () {
        $log.log('Updating Strat Section Feature Layer ...');
        updateFeatureLayer();
      });

      // Spot deleted from map side panel
      $rootScope.$on('deletedSpot', function () {
        $log.log('Handling Deleted Spot ...');
        vm.clickedFeatureId = undefined;
        MapFeaturesFactory.removeSelectedSymbol(map);
        updateFeatureLayer();
      });

      $scope.$on('$destroy', function () {
        $log.log('Destroying Strat Section Page ...');
        MapDrawFactory.cancelEdits();    // Cancel any edits
        vm.popover.remove();            // Remove the popover
        vm.addTagModal.remove();
      });

      $scope.$on('enableSaveEdits', function (e, data) {
        $log.log('Enabling Save Edits ...');
        vm.showSaveEditsBtn = data;
        vm.saveEditsText = 'Save Edits';
        _.defer(function () {
          $scope.$apply();
        });
      });

      $scope.$on('changedDrawMode', function () {
        $log.log('Changing Draw Mode ...');
        var draw = MapDrawFactory.getDrawMode();
        var lmode = MapDrawFactory.getLassoMode();
        $log.log('LassoMode:', lmode);
        draw.on('drawend', function (e) {
          MapDrawFactory.doOnDrawEnd(e, stratSection, vm.thisSpotWithStratSection);
          var selectedSpots = SpotFactory.getSelectedSpots();
          if (!_.isEmpty(selectedSpots)) {

            if (lmode == "tags") {
              $log.log("tag mode enabled");

              //cull spots to only those shown on map
              var visibleSpots = MapFeaturesFactory.getVisibleLassoedSpots(selectedSpots, map);
              SpotFactory.setSelectedSpots(visibleSpots);

              vm.allTags = ProjectFactory.getTags();
              tagsToAdd = [];
              vm.addTagModal.show();
              MapDrawFactory.setLassoMode("");
            }
            else if (lmode == "stereonet") {
              $log.log("stereonet mode enabled");

              //use MapFeaturesFactory to get only mapped orientations
              var stereonetSpots = MapFeaturesFactory.getVisibleLassoedSpots(selectedSpots, map);
              $log.log('stereonetSpots: ', stereonetSpots);

              HelpersFactory.getStereonet(stereonetSpots);
              MapDrawFactory.setLassoMode("");
            }
          }
        });
      });
    }

    function createPopover() {
      $ionicPopover.fromTemplateUrl('app/maps/strat-section/strat-section-popover.html', {
        'scope': $scope
      }).then(function (popover) {
        vm.popover = popover;
      });
    }

    // Layer switcher
    function createSwitcher(switcher) {
      // Add a `change:visible` listener to all layers currently within the map
      ol.control.LayerSwitcher.forEachRecursive(map, function (l, idx, a) {
        l.on('change:visible', function (e) {
          var lyr = e.target;
          if (lyr.get('layergroup') === 'Datasets') {     // Individual Datasets
            datasetsLayerStates[lyr.get('datasetId')] = lyr.getVisible();
            updateFeatureLayer();
            switcher.renderPanel();
          }
          else if (lyr.get('name') === 'datasetsLayer') {  // Datasets as a Group
            lyr.getLayers().forEach(function (layer) {     // Individual Datasets
              datasetsLayerStates[layer.get('datasetId')] = lyr.getVisible();
            });
            updateFeatureLayer();
            switcher.renderPanel();
          }
        });
      });
    }

    function gatherSpots() {
      // Get the Spot that has this Strat Section
      vm.thisSpotWithStratSection = StratSectionFactory.getSpotWithThisStratSection($state.params.stratSectionId);
      stratSection = vm.thisSpotWithStratSection.properties.sed.strat_section;
      $log.log('thisSpotWithStratSection', vm.thisSpotWithStratSection);

      // Get all Strat Section Spots
      StratSectionFactory.gatherStratSectionSpots($state.params.stratSectionId);
      spotsThisMap = StratSectionFactory.getStratSectionSpots();
      $log.log('Spots on this Map:', spotsThisMap);

      // Separate the Strat Section Spots into the Interval Spots and other Spots
      var stratSectionSpotsPartitioned = _.partition(spotsThisMap, function (spot) {
        return spot.properties.surface_feature && spot.properties.surface_feature.surface_feature_type === 'strat_interval';
      });
      vm.stratSectionIntervals = stratSectionSpotsPartitioned[0];
      vm.stratSectionIntervals = StratSectionFactory.orderStratSectionIntervals(vm.stratSectionIntervals);
      vm.stratSectionOtherSpots = stratSectionSpotsPartitioned[1];
      $log.log('stratSectionIntervals', vm.stratSectionIntervals);
    }

    function openIntervalModal() {
      $ionicModal.fromTemplateUrl('app/maps/strat-section/add-interval-modal.html', {
        'scope': $scope,
        'animation': 'slide-in-up',
        'backdropClickToClose': false,
        'hardwareBackButtonClose': false
      }).then(function (modal) {
        vm.addIntervalModal = modal;
        vm.addIntervalModal.show();
      });
    }

    function updateFeatureLayer() {
      $log.log('Updating Strat Section Feature Layer ...');
      gatherSpots();
      MapFeaturesFactory.setMappableSpots(spotsThisMap);
      datasetsLayerStates = MapFeaturesFactory.getInitialDatasetLayerStates(map);
      MapFeaturesFactory.createDatasetsLayer(datasetsLayerStates, map);
      MapFeaturesFactory.createFeatureLayer(datasetsLayerStates, map);
      MapViewFactory.zoomToSpotsExtent(map, spotsThisMap);

      updateSelectedSymbol();
    }

    // If on WEB and we have a current feature set the selected symbol
    function updateSelectedSymbol() {
      if (IS_WEB && vm.clickedFeatureId) {
        MapFeaturesFactory.removeSelectedSymbol(map);
        var feature = MapFeaturesFactory.getFeatureById(vm.clickedFeatureId);
        if (!_.isEmpty(feature)) MapFeaturesFactory.setSelectedSymbol(map, feature.getGeometry());
      }
    }

    /**
     * Public Functions
     */

    function addInterval() {
      FormFactory.setForm('sed', 'add_interval');
      vm.data = {};
      if (stratSection.column_profile && stratSection.column_profile === 'clastic') {
        vm.data.is_this_a_bed_or_package = 'bed';
        vm.data.primary_lithology = 'siliciclastic';
      }
      else if (stratSection.column_profile && stratSection.column_profile === 'carbonate') {
        vm.data.is_this_a_bed_or_package = 'bed';
      }
      else if (stratSection.column_profile && stratSection.column_profile === 'mixed_clastic') {
        vm.data.is_this_a_bed_or_package = 'bed';
      }
      if (stratSection.column_y_axis_units) vm.data.thickness_units = stratSection.column_y_axis_units;
      openIntervalModal();
    }

    function addMoreDetail() {
      $log.log(vm.data);
      if (stratSection.column_y_axis_units && vm.data.thickness_units !== stratSection.column_y_axis_units) {
        $ionicPopup.alert({
          'title': 'Units Mismatch',
          'template': 'The units for the Y Axis are <b>' + stratSection.column_y_axis_units + '</b> but <b>' +
            vm.data.thickness_units + '</b> have been designated for this interval. Please fix the units ' +
            'for this interval.'
        });
      }
      else if (StratSectionFactory.validateNewInterval(vm.data, FormFactory.getForm())) {
        vm.addIntervalModal.remove();
        var newInterval = StratSectionFactory.createInterval(stratSection.strat_section_id, vm.data);
        SpotFactory.setNewSpot(newInterval).then(function (id) {
          goToSpot(newInterval.properties.id, 'sed-lithologies');
        });
      }
    }

    function closeModal(modal) {
      vm[modal].hide();
      if (modal === 'addTagModal') {
        var selectedSpots = SpotFactory.getSelectedSpots();
        _.each(tagsToAdd, function (tagToAdd) {
          _.each(selectedSpots, function (selectedSpot) {
            if (!tagToAdd.spots) tagToAdd.spots = [];
            if (!_.contains(tagToAdd.spots, selectedSpot.properties.id)) {
              tagToAdd.spots.push(selectedSpot.properties.id);
            }
          });
          ProjectFactory.saveTag(tagToAdd);
        });
      }
      else if (modal === 'newNestModal') {
        if (!vm.newNestProperties.name) vm.newNestProperties.name = HelpersFactory.getNewId().toString();
        if (!_.isEmpty(vm.data)) vm.newNestProperties.surface_feature = {};
        _.extend(vm.newNestProperties.surface_feature, vm.data);
        SpotFactory.setNewNestProperties(vm.newNestProperties);
        vm.data = {};
      }
      SpotFactory.clearSelectedSpots();
    }

    function createTag() {
      vm.addTagModal.hide();
      var id = HelpersFactory.getNewId();
      $location.path('/app/tags/' + id);
    }

    function deleteSpot(spot) {
      var deleteMsg = SpotFactory.isSafeDelete(spot);
      if (!deleteMsg) {
        var confirmPopup = $ionicPopup.confirm({
          'title': 'Delete Spot',
          'template': 'Are you sure you want to delete Spot ' + spot.properties.name + '?'
        });
        confirmPopup.then(function (res) {
          if (res) {
            SpotFactory.destroy(spot.properties.id).then(function () {
              updateFeatureLayer();
              if (IS_WEB) {
                vm.clickedFeatureId = undefined;
                MapFeaturesFactory.removeSelectedSymbol(map);
              }
            });
          }
        });
      }
      else {
        $ionicPopup.alert({
          'title': 'Spot Deletion Prohibited!',
          'template': deleteMsg
        });
      }
    }

    function getTagNames(spotId) {
      var tags = ProjectFactory.getTagsBySpotId(spotId);
      return _.pluck(tags, 'name').join(', ');
    }

    function goBack() {
      if ($ionicHistory.backView()) $ionicHistory.goBack();
      else $location.path('/app/strat-sections');
    }

    function goToSpot(id, page) {
      vm.clickedFeatureId = id;
      // If navigating to the Sed Lithologies page make sure it is toggled on
      if (page && page === 'sed-lithologies') {
        var projectPreferences = ProjectFactory.getPreferences();
        projectPreferences['sed_lithologies'] = true;
        ProjectFactory.saveProjectItem('preferences', projectPreferences).then(function () {
          $location.path('/app/spotTab/' + id + '/' + page);
        });
      }
      else if (page) $location.path('/app/spotTab/' + id + '/' + page);
      else $location.path('/app/spotTab/' + id + '/spot');
    }

    function groupSpots() {
      vm.popover.hide().then(function () {
        MapDrawFactory.groupSpots();
      });
    }

    function hasRelationships(spotId) {
      return !_.isEmpty(ProjectFactory.getRelationshipsBySpotId(spotId));
    }

    function hasTags(spotId) {
      return !_.isEmpty(ProjectFactory.getTagsBySpotId(spotId));
    }

    function isiOS() {
      return ionic.Platform.device().platform == "iOS";
    }

    function saveEdits() {
      vm.saveEditsText = 'Saved Edits';
      MapDrawFactory.saveEdits(vm.clickedFeatureId);
    }

    function saveInterval() {
      $log.log(vm.data);
      if (stratSection.column_y_axis_units && vm.data.thickness_units !== stratSection.column_y_axis_units) {
        $ionicPopup.alert({
          'title': 'Units Mismatch',
          'template': 'The units for the Y Axis are <b>' + stratSection.column_y_axis_units + '</b> but <b>' +
            vm.data.thickness_units + '</b> have been designated for this interval. Please fix the units ' +
            'for this interval.'
        });
      }
      else if (StratSectionFactory.validateNewInterval(vm.data, FormFactory.getForm())) {
        vm.addIntervalModal.remove();
        var newInterval = StratSectionFactory.createInterval(stratSection.strat_section_id, vm.data);
        SpotFactory.setNewSpot(newInterval).then(function (id) {
          updateFeatureLayer();
        });
      }
    }

    function stereonetSpots() {
      vm.popover.hide().then(function () {
        MapDrawFactory.stereonetSpots();
      });
    }

    // Switch between map view and list of Spots on this map
    function switchView() {
      vm.mapView = !vm.mapView;
    }

    function toggleNesting() {
      vm.popover.hide().then(function () {
        vm.isNesting = !vm.isNesting;
        SpotFactory.setActiveNesting(vm.isNesting);
        if (vm.isNesting) {
          $log.log('Starting Nesting');
          SpotFactory.clearActiveNest();
          FormFactory.setForm('surface_feature');
          vm.data = {};
          vm.newNestModal.show();
        }
        else {
          var activeNest = SpotFactory.getActiveNest();
          SpotFactory.clearActiveNest();
          vm.newNestProperties = {};
          if (_.isEmpty(activeNest)) {
            $ionicPopup.alert({
              'title': 'Empty Nest!',
              'template': 'No Spots were added to the Nest.'
            });
          }
        }
      });
    }

    function toggleTagChecked(tag) {
      var found = _.find(tagsToAdd, function (tagToAdd) {
        return tagToAdd.id === tag.ig;
      });
      if (found) {
        tagsToAdd = _.reject(tagsToAdd, function (tagToAdd) {
          return tagToAdd.id === tag.id;
        });
      }
      else tagsToAdd.push(tag);
    }

    function zoomToSpotsExtent() {
      vm.popover.hide().then(function () {
        MapViewFactory.zoomToSpotsExtent(map, spotsThisMap);
      });
    }
  }
}());
