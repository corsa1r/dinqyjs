var Dinqyjs = (function(){
	return {
		Collection : (function(){
		    function Collection(array){
		    	this._ = array || [];
		    }

			var _config = {
				ARRAY_PREALLOCATION : 64000
			};

			var _differenceXY = function(inner, outer, predicate) {
				var usePredicate = _isFunction(predicate),
					i = 0,
					j,
					x,
					y,
					difference = [],
					innerLength,
					outerLength;

				inner = _wrap(inner).distinct(predicate).raw();
				outer = _unwrap(outer);

				innerLength = inner.length;
				outerLength = outer.length;

				while(i < innerLength)
				{
					x = inner[i];
					j = 0;
					while(j < outerLength)
					{
						y = outer[j];
						if(usePredicate && predicate(x, y) || !usePredicate && x === y) {
							break;
						}
						j++;
					}
					if(j === outerLength) {
						difference.push(x);
					}
					i++;
				}
				return new Collection(difference);
			};

			var _errorNoMatches = 'Array contains no matching elements';
			var _errorNotExactlyOneMatch = 'Array does not contain exactly one matching element';

			var _arrayPrototype = Array.prototype;

			var _firstIndex = function(array, predicate, increments, startIndex, count) {
				var thisLength = array.length,
					thisElement;
				
				increments = increments || 1;

				if(!_isFunction(predicate)) {
					if(thisLength > 0) {
						return increments > 0 ? 0 : thisLength - 1;
					}
					else{
						return -1;
					}
				}

				if(_isUndefined(startIndex)) {
					startIndex = increments > 0 ? 0 : thisLength - 1;
				}

				if(_isUndefined(count) || count > thisLength) {
					count = thisLength;
				}

				while(count > 0) {
					thisElement = array[startIndex];
					if(predicate(thisElement)) {
						return startIndex;
					}
					startIndex += increments;
					count--;
				}
				return -1;
			};

			var _getTop1 = function(comparison, arr, selector) {
				var thisLength = arr.length,
					highest = thisLength > 0 ? arr[0] : null,
					thisElement,
					i = 0;

				while(i < thisLength) {
					thisElement = arr[i];

					if(comparison((typeof selector == 'function' ? selector(thisElement) : thisElement) , highest)) {
						highest = thisElement;
					}
					i++;
				}
				return highest;
			};

			var _isFunction = function(obj) {
				return typeof obj == 'function';
			};

			var _isUndefined = function(obj) {
				return obj === void 0;
			};

			var _joinXY = function(innerElement, outerElement) {
				return {
					inner : innerElement,
					outer : outerElement
				};
			};

			var _maxComparison = function(thisElement, bestElement) {
				return thisElement >= bestElement;
			};

			var _minComparison = function(thisElement, bestElement) {
				return thisElement <= bestElement;
			};

			var _wrap = function(array) {
				return array._ ?  array : new Collection(array);
			};

			var _unwrap = function(Collection) {
				return Collection._ || Collection;
			};

			var _total = function(array, summingFunction, selector) {
				var total = null,
					i = array.length - 1,
					thisElement,
					usePredicate = _isFunction(selector),
					toAdd;

				while(i >= 0) {
					thisElement = array[i--];
					toAdd = usePredicate ? selector(thisElement) : thisElement;
					total = (total === null ? toAdd : summingFunction(total, toAdd));
				}
				return total;
			};

			Collection.configure = function(key, value) {
				return _config[key] = (arguments.length < 2) ? _config[key] : value;
			};

			var _sortArg = function(selector) {
				var useSelector = _isFunction(selector);
				if(useSelector) {
					return [function(a, b) {
						return selector(a) - selector(b);
					}];
				}
				return [];
			};

			Collection.prototype = {
				all : function(predicate) {
					var all = true;
					for(var i = 0; i < this._.length; i++) {
						all &= predicate(this._[i]);
					}
					return all ? true : false;
				},

				any : function(predicate) {
					return _firstIndex(this._, predicate) >= 0;
				},

				ascending : function(selector) {
					_arrayPrototype.sort.apply(this._, _sortArg(selector));
					return this;
				},

				atRandom : function() {
					return this._[Math.floor(Math.random() * this._.length)];
				},

				average : function(selector) {
					var total = 0,
						i = 0,
						thisLength = this._.length;

					while(i < thisLength) {
						total += selector ? selector(this._[i]) : this._[i];
						i++;
					}
					return thisLength ? (total / thisLength) : 0;
				},

				clear : function() {
					this._.splice(0, this._.length);
				},

				clearWhere : function(selector) {
					var thisLength = this._.length,
						i = thisLength - 1;

					while(i >= 0) {
						if(selector(this._[i])) {
							this._.splice(i, 1);
						}
						i--;
					}
					return this;
				},

				clone : function() {
					return new Collection(this._.concat());
				},

				concat : function() {
					return new Collection(_arrayPrototype.concat.apply(this._, arguments));
				},

				contains : function(item) {
					return this._.indexOf(item) > -1;
				},

				count : function() {
					return this._.length;
				},

				descending : function(selector) {
					_arrayPrototype.sort.apply(this._, _sortArg(selector)).reverse();
					return this;
				},

				difference : function(other, predicate) {
					other = _unwrap(other);
					var thisUnwrapped = this._;
					return _differenceXY(thisUnwrapped, other, predicate).union(_differenceXY(other, thisUnwrapped, predicate));
				},

				distinct : function(predicate) {
					var usePredicate = _isFunction(predicate);
					var distinct = [],
						x,
						y,
						i = 0,
						j;

					while(i < this._.length)
					{
						x = this._[i];
						if(distinct.indexOf(x) == -1) {
							j = 0;
							while(j < this._.length)
							{
								y = this._[j];
								if(usePredicate && predicate(x, y) || !usePredicate && x === y) {
									distinct.push(x);
									break;
								}
								j++;
							}
						}
						i++;
					}
					return new Collection(distinct);
				},

				doUntil : function(callback, stoppingCondition) {
					var i = 0,
						thisLength = this._.length;
					while(i < thisLength) {
						callback(this._[i]);
						i++;
						if(stoppingCondition(this._[i])) {
							return;
						}
					}
				},

				doWhile : function(callback, condition) {
					var i = 0,
						thisLength = this._.length;
					while(i < thisLength) {
						if(!condition(this._[i], i)) {
							return;
						}
						callback(this._[i], i);
						i++;
					}
				},

				each : function(callback) {
					var i = 0,
						thisLength = this._.length;
					while(i < thisLength) {
						callback(this._[i], i);
						i++;
					}
				},

				element : function(index) {
					return this._[index];
				},

				findIndex : function (predicate, startIndex, count) {
					if(!_isFunction(predicate)) {
						return -1;
					}
					return _firstIndex(this._, predicate, 1, startIndex, count);
				},

				findLastIndex : function (predicate, startIndex, count) {
					if(!_isFunction(predicate)) {
						return -1;
					}
					return _firstIndex(this._, predicate, -1, startIndex, count);
				},

				first : function (predicate) {
					var firstIndex = _firstIndex(this._, predicate);
					if(firstIndex >= 0) {
						return this._[firstIndex];
					}
					else {
						throw new Error(_errorNoMatches);
					}
				},

				flatten : function() {
					var i = 0,
						flattened = new Collection(),
						thisLength = this._.length,
						thisElement;
					while(i < thisLength) {
						thisElement = this._[i++];
						Collection.prototype.push.apply(flattened, Array.isArray(thisElement) ? thisElement : [thisElement]);
					}
					return flattened;
				},

				indexOf : function() {
					return _arrayPrototype.indexOf.apply(this._, arguments);
				},

				insert : function(index, element) {
					this._.splice(index, 0, element);
				},

				insertRange : function(index, elements) {
					var args = [index, 0].concat(
						arguments.length < 3 ? _unwrap(elements) : Array.prototype.slice.call(arguments, 1)
					);
					Array.prototype.splice.apply(this._, args);
				},

				intersect : function(other, predicate) {
					var usePredicate = _isFunction(predicate),
						intersection = [],
						x,
						y,
						i = 0,
						j,
						thisDistinct = this.distinct(predicate).raw(),
						otherDistinct = _wrap(other).distinct(predicate).raw(),
						thisLength = thisDistinct.length,
						otherLength = otherDistinct.length;

					while(i < thisLength) {
						x = thisDistinct[i];
						j = 0;
						while(j < otherLength) {
							y = otherDistinct[j];
							if(usePredicate && predicate(x, y) || !usePredicate && x === y) {
								intersection.push(x);
								break;
							}
							j++;
						}
						i++;
					}
					return new Collection(intersection);
				},

				innerJoin : function(other, predicate, joinedObjectCreator) {
					other = _unwrap(other);
					if(!Array.isArray(other)) {
						return new Collection(this._.concat());
					}
					if(!_isFunction(joinedObjectCreator)) {
						joinedObjectCreator = _joinXY;
					}

					var joined = [],
						innerElement,
						outerElement,
						i = 0,
						j,
						thisLength = this._.length,
						otherLength = other.length;

					while(i < thisLength) {
						innerElement = this._[i];
						j = 0;
						while(j < otherLength) {
							outerElement = other[j];
							if(predicate(innerElement, outerElement)) {
								joined.push(joinedObjectCreator(innerElement, outerElement));
							}
							j++;
						}
						i++;
					}
					return new Collection(joined);
				},

				join : function() {
					return _arrayPrototype.join.apply(this._, arguments);
				},

				keys : function() {
					var keys = [];
					for(var key in this._) {
					    keys.push(key);
					}
					return keys;
				},

				last : function(predicate) {
					var firstIndex = _firstIndex(this._, predicate, -1);
					if(firstIndex >= 0) {
						return this._[firstIndex];
					}
					else {
						throw new Error(_errorNoMatches);
					}
				},

				lastIndexOf : function() {
					return _arrayPrototype.lastIndexOf.apply(this._, arguments);
				},

				map : function() {
					var mapped = _arrayPrototype.map.apply(this._, arguments);
					return mapped ? new Collection(mapped) : void 0;
				},

				max : function(selector) {
					return _getTop1(_maxComparison, this._, selector);
				},

				min : function(selector) {
					return _getTop1(_minComparison, this._, selector);
				},

				multiply : function(selector) {
					return this._.length > 0 ? _total(this._, function(runningTotal, value) {
						return runningTotal * value;
					}, selector) : 0;
				},

				outerJoin : function(other, predicate, joinedObjectCreator) {
					other = _unwrap(other);
					if(!Array.isArray(other)) {
						return new Collection(this._.concat());
					}
					if(!_isFunction(joinedObjectCreator)) {
						joinedObjectCreator = _joinXY;
					}

					var joined = [],
						innerElement,
						outerElement,
						outerFound,
						i = 0,
						thisLength = this._.length,
						j,
						otherLength = other.length,
						usePredicate = _isFunction(predicate);

					while(i < thisLength) {
						innerElement = this._[i++];
						outerFound = 0;
						j = 0;
						while(j < otherLength) {
							outerElement = other[j++];
							if(usePredicate && predicate(innerElement, outerElement) || !usePredicate && innerElement === outerElement) {
								outerFound = 1;
								joined.push(joinedObjectCreator(innerElement, outerElement));
							}
						}

						if(!outerFound) {
							joined.push(joinedObjectCreator(innerElement, null));
						}
					}
					return new Collection(joined);
				},

				pack : function() {
					var i = this._.length - 1,
						thisElement;
					while(i >= 0) {
						thisElement = this._[i];
						if(_isUndefined(thisElement) || thisElement === null) {
							this._.splice(i, 1);
						}
						i--;
					}
					return this;
				},

				partition : function(predicate) {
					var thisLength = this._.length,
						i = 0,
						thisElement,
						partitions = [],
						p;

					while(i < thisLength) {
						thisElement = this._[i++];
						p = predicate(thisElement);
						(partitions[p] = (p in partitions) ? partitions[p] : []).push(thisElement);
					}

					return new Collection(partitions);
				},

				pop : function() {
					return _arrayPrototype.pop.apply(this._, arguments);
				},

				push : function() {
					return _arrayPrototype.push.apply(this._, arguments);
				},

				range : function(start, end) {
					return this._.slice(start, end);
				},

				raw : function() {
					return this._;
				},

				removeAt : function(index) {
					this._.splice(index, 1);
				},

				removeRange : function(start, count) {
					this._.splice(start, count);
				},

				reverse : function() {
					return new Collection(_arrayPrototype.reverse.apply(this._, arguments));
				},

				shift : function() {
					return _arrayPrototype.shift.apply(this._, arguments);
				},

				//Use Fisher-Yates shuffle algorithm
				shuffle : function() {
					var thisLength = this._.length,
						i = thisLength - 1,
						thisElement,
						random;

					while(i >= 0) {
       					random = Math.floor(Math.random() * thisLength);
       					thisElement = this._[i];
       					this._[i--] = this._[random];
       					this._[random] = thisElement;
       				}

					return this;
				},

				single : function(predicate) {
					var matches = _unwrap(this);
					if(_isFunction(predicate)) {
						matches = _wrap(this).where(predicate).raw();
					}

					if(matches.length != 1) {
						throw new Error(_errorNotExactlyOneMatch);
					}
					else {
						return matches[0];
					}
				},

				skip : function(count) {
					return new Collection(this._.slice(count));
				},

				sort : function() {
					_arrayPrototype.sort.apply(this._, arguments);
					return this;
				},

				sum : function(selector) {
					return this._.length > 0 ? _total(this._, function(runningTotal, value) {
						return runningTotal + value;
					}, selector) : 0;
				},

				take : function(count) {
					return new Collection(this._.slice(0, count));
				},

				toString : function() {
					return _arrayPrototype.toString.apply(this._, arguments);
				},

				union : function(other) {
					var unioned = this.clone();
					_arrayPrototype.push.apply(unioned.raw(), _unwrap(other));
					return unioned;
				},

				unshift : function() {
					return _arrayPrototype.unshift.apply(this._, arguments);
				},

				valueOf : function() {
					return _arrayPrototype.valueOf.apply(this._, arguments);
				},

				where : function(predicate) {
					var matches = [],
						thisElement,
						i = 0,
						thisLength = this._.length;

					while(i < thisLength) {
						thisElement = this._[i];
						if(predicate(thisElement)) {
							matches.push(thisElement);
						}
						i++;
					}
					return new Collection(matches);
				}
			};

			//Array polyfills:
			if (!_arrayPrototype.indexOf) {
			  	_arrayPrototype.indexOf = function (element, start) {
			  		return _firstIndex(this, _arrayElementCompare(element), 1, start);
			  	};
			}

			if (!_arrayPrototype.lastIndexOf) {
				_arrayPrototype.lastIndexOf = function(element, start) {
			  		return _firstIndex(this, _arrayElementCompare(element), -1, start);
				};
			}

			if (!_arrayPrototype.map) {
				_arrayPrototype.map = function(callback) {
					var thisLength = this.length,
						results = new Array(thisLength > _config.ARRAY_PREALLOCATION ? 0 : thisLength),
						i = 0;

					if(!_isFunction(callback)) {
						return void(0);
					}

					while(i < thisLength) {
						results[i] = callback(this[i++]);
					}
					return results;
				};
			}

			if (!Array.isArray) {
				Array.isArray = function(arg) {
					return Object.prototype.toString.call(arg) === '[object Array]';
				};
			}

			var _arrayElementCompare = function(element) {
				return function(other) {
					return element === other;
				};
			};

		    return Collection; 
		 
		}())
	};
}());