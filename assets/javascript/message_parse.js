(function(){
	angular.module('messageParse', ['icons']).
	directive('messageText', ['iconReplacer', function (iconReplacer){
		return {
			template: "<span ng-bind-html='text'></span>",
			restrict: 'E',
			controller: ['$scope', function($scope) {
				$scope.text = iconReplacer.replace($scope.message);
			}],
			scope: {
				message: '=text'
			}
		}
	}])
})();