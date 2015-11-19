(function () {
  'use strict';

  angular
    .module('app')
    .factory('LocalStorageFactory', LocalStorageFactory);

  function LocalStorageFactory() {
    var configDb = {};        // global LocalForage for configuration data
    var mapNamesDb = {};      // global LocalForage for map names
    var mapTilesDb = {};      // global LocalForage for offline map tiles
    var projectDb = {};       // global LocalForage for configuration data
    var spotsDb = {};         // global LocalForage for spot data
    var userDb = {};          // global LocalForage for user data

    activate();

    return {
      'configDb': configDb,
      'mapNamesDb': mapNamesDb,
      'mapTilesDb': mapTilesDb,
      'projectDb': projectDb,
      'spotsDb': spotsDb,
      'userDb': userDb
    };

    function activate() {
      setConfigDb();
      setMapNamesDb();
      setMapTilesDb();
      setProjectDb();
      setSpotsDb();
      setUserDb();
    }

    function setConfigDb() {
      configDb = localforage.createInstance({
        // driver: localforage.WEBSQL,  // removing the driver lets localforage choose the best driver available to that platform
        'name': 'Config'
      });
    }

    function setMapNamesDb() {
      mapNamesDb = localforage.createInstance({
        // driver: localforage.WEBSQL,  // removing the driver lets localforage choose the best driver available to that platform
        'name': 'MapNames'
      });
    }

    function setMapTilesDb() {
      mapTilesDb = localforage.createInstance({
        // driver: localforage.WEBSQL,  // removing the driver lets localforage choose the best driver available to that platform
        'name': 'offlineMapTiles'
      });
    }

    function setProjectDb() {
      projectDb = localforage.createInstance({
        // driver: localforage.WEBSQL,  // removing the driver lets localforage choose the best driver available to that platform
        'name': 'Project'
      });
    }

    function setSpotsDb() {
      spotsDb = localforage.createInstance({
        // driver: localforage.WEBSQL,  // removing the driver lets localforage choose the best driver available to that platform
        'name': 'Spots'
      });
    }

    function setUserDb() {
      userDb = localforage.createInstance({
        // driver: localforage.WEBSQL,  // removing the driver lets localforage choose the best driver available to that platform
        'name': 'User'
      });
    }
  }
}());