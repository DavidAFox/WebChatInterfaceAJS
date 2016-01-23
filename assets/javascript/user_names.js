angular.module('userNames', ['ui.bootstrap']).
factory('colorGenerator', function(){
	var index = 0;
	var colors = ["Red", "Green", "Blue", "Orange", "Brown", "Purple", "LightSeaGreen", "Black"];
	var gen = {};
	var users = {};
	gen.getColor = function(name) {
		if(typeof users[name] === 'undefined') {
			users[name] = colors[index];
			index += 1;
			if (index >= colors.length) {
				index = 0;
			}
		}
		return users[name];
	};
	return gen;
}).
directive('userColor', ['colorGenerator', function(colorGenerator) {
	var link = function(scope, element, attrs) {
		var color = colorGenerator.getColor(attrs.userName);
		element.css('color', color);
	};
	return {
		link: link,
	};
}]).
directive('user', function(){
	return {
 		restrict: 'E',
		template: function(element, attrs) {
			return 	"<span uib-dropdown>" +
						"<span user-name='" + attrs.userName + "' user-color uib-dropdown-toggle>" +
							"" + attrs.userName + "" +
						"</span>" +
						"<ul uib-dropdown-menu>" +
							"<li><a ng-click=block("+ attrs.userName.replace('{{', '').replace('}}', '') +") user-name='"+ attrs.userName + "' href>Block</a></li>" +
							"<li><a ng-click=unblock("+ attrs.userName.replace('{{', '').replace('}}','') +") user-name='" + attrs.userName + "' href>Unblock</a></li>" +
							"<li><a ng-click=friend("+ attrs.userName.replace('{{', '').replace('}}', '') + ") user-name='"+ attrs.userName + "' href>Friend</a></li>" +
							"<li><a ng-click=unfriend("+ attrs.userName.replace('{{','').replace('}}','') + ") user-name='" + attrs.userName + "' href>Unfriend</a></li>" +
							"<li><a ng-click=tell("+attrs.userName.replace('{{','').replace('}}','') + ") user-name='" + attrs.userName + "' href>Tell</a></li>" +
						"</ul>" +
					"</span>"
		}
	}
})
