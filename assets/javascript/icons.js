(function(){
	angular.module('icons', ['ngSanitize']).
	factory('iconReplacer', ['$sanitize', function($sanitize){
		var replacer = {};
		var icons = [
			{pattern: ":)", id: 'icon-smile'}, 
			{pattern: ";)", id: 'icon-wink'}, 
			{pattern: "<3", id: 'icon-heart'}, 
			{pattern: ":(", id: 'icon-frown'}
		]
		var entityMap = {
        	"&": "&amp;",
        	"<": "&lt;",
			">": "&gt;"
    	};
		var esc = function(str) {
        	return String(str).replace(/[&<>]/g, function (s) {
            	return entityMap[s];
        	});
	    }
		replacer.replace = function(message) {
			message = esc(message);
			icons.forEach(function(icon){
				var pattern = esc(icon.pattern);
				message = message.split(pattern).join('<image src="assets/images/'+icon.id+'.gif" class="icon" id="' + icon.id + '"/>');
			})
			return message;
		}
		return replacer;
	}])
})();