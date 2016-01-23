describe('User Names tests', function() {
	beforeEach(module('userNames'));
	describe('colorGenerator', function() {
		var colorGenerator;
		beforeEach(inject(function(_colorGenerator_){
			colorGenerator = _colorGenerator_
		}));
		it('should return different colors for different names on consecutive calls to getColor()', function(){
			expect(colorGenerator.getColor('Bob')).not.toEqual(colorGenerator.getColor('Fred'));
		});
		it('should return the same color for the same name', function(){
			expect(colorGenerator.getColor('Bob')).toEqual(colorGenerator.getColor('Bob'));
		});
		it('should keep generating colors after exceeding the number of colors', function(){
			for(var i = 0; i<100; i += 1) {
				colorGenerator.getColor(i);
			}
			expect(colorGenerator.getColor(i+1)).toBeDefined();
		});
	});
	describe('user', function() {
		var $compile;
		var $rootScope;
		beforeEach(inject(function(_$compile_, _$rootScope_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
		}));
		it('should set the same color for the same name', function() {
			var element = $compile('<div user-name="Bob" user-color>Bob</div>')($rootScope);
			var element2 = $compile('<div user-name="Bob" user-color>Bob</div>')($rootScope);
			$rootScope.$digest();
			expect(element.css('color')).toEqual(element2.css('color'));
		})
		it('should set different colors for different names', function() {
			var element = $compile('<div user-name="Bob" user-color>Bob</div>')($rootScope);
			var element2 = $compile('<div user-name="Fred" user-color>Fred</div>')($rootScope);
			$rootScope.$digest();
			expect(element.css('color')).not.toEqual(element2.css('color'));
		})
	});
});