angular.module('app')
  .controller('SpotTabDetailCtrl', function ($scope,
                                             $stateParams) {

    console.log('inside spot tab detail ctrl');

    // load the current state into the parent, we do this because stateparams are accessible only through the child
    // and we need to propogate this to the parent because of business logic currently stuck in the parent controller
    $scope.load($stateParams);

  });
