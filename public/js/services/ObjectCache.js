angular.module('chaos_engine')
	.service(
		'ObjectCache',
		[
			'$q',
			'ObjectCacheData',
			'SpriteSheet',
			'ObjectClass',
			function ($q, ObjectCacheData, SpriteSheet, ObjectClass) {
				var _ObjectCache = {
					cached_images: {},
					cached_objects: {},
					loadImage: function (url, callback) {

						if (_ObjectCache.cached_images[url]) {
							return callback(null, _ObjectCache.cached_images[url]);
						}
						var image = new Image();
						_ObjectCache.cached_images[url] = image;

						image.src = url
						image.onload = function () {
							return callback(null, _ObjectCache.cached_images[url]);
						}
					},
					storeInImageCache: function (url, image) {
						if (!image.src) {
							throw new Error("Not a valid image");
						}
						_ObjectCache.cached_images[url] = image;
					},
					loadObject: function (type) {
						if (!_ObjectCache.cached_objects[type]) {
							if (!ObjectCacheData[type]) {
								return null;
							}

							//This actually creates proper animations and caches them
							_ObjectCache.cached_objects[type] = new ObjectClass({
								cache: this,
								type: type
							});
						}
						return _ObjectCache.cached_objects[type];

					},
					createNewObjectInstance: function (instance_data) {

						var objectClass = _ObjectCache.loadObject(instance_data.type);
						if (!objectClass) {
							return null;
						}
						var instance = objectClass.createNewInstance(instance_data);
						return instance;
					},
					preload: function () {
						//Iterate through the ObjectCacheData
						/*var promisses = [];
						 for (var type in ObjectCacheData) {
						 promisses.push(_ObjectCache.loadObject(type));
						 }
						 return $q.all(promisses);*/

					}/*,
					 old_preload: function () {
					 var spriteSheet1 = new SpriteSheet({
					 img_src: '/imgs/tiles/prison_floor.png',
					 tile_width: 75,
					 tile_height: 38
					 });
					 spriteSheet1.load(function (err, image) {
					 for (var x = 0; x < 4; x++) {
					 for (var y = 0; y < 10; y++) {
					 var i = (x * 10) + y;


					 //_ObjectCache.storeInCache(spriteSheet1.getTile(x, y);
					 }
					 }
					 });
					 _ObjectCache.cached_images['player-1'] = {};
					 _ObjectCache.cached_images['player-1']['default'] = new Image();
					 _ObjectCache.cached_images['player-1']['default'].src = '/imgs/player/default.bmp';


					 _ObjectCache.cached_images['beretta'] = {};
					 _ObjectCache.cached_images['beretta']['default'] = new Image();
					 _ObjectCache.cached_images['beretta']['default'].src = '/imgs/objects/gun.bmp';


					 }*/
				}

				return _ObjectCache;
			}
		]
	)

/**
 * This is like a template for a 'type' of object
 */
	.factory('ObjectClass', [
		'$q',
		'ObjectInstance',
		'ObjectCacheData',
		function ($q, ObjectInstance, ObjectCacheData) {
			var _ObjectClass = function (options) {
				this.cache = options.cache;
				this.type = options.type;
				this.data = ObjectCacheData[this.type];
				this._preloaded = true;
				return this;
			}
			/**
			 * Will return a $q.promise
			 */
			_ObjectClass.prototype.preload = function () {
				var promisses = []
				for (var state in ObjectCacheData[type]) {
					for (var facing in ObjectCacheData[type][state]) {
						promisses.push(this.cache.loadImage(ObjectCacheData[type][state][facing].src));
					}
				}
				this._preloaded = true;
				return $q.all(promisses);
			}
			/**
			 * Should return an animation object
			 * @param state
			 * @param facing
			 */
			_ObjectClass.prototype.getRenderable = function (state, facing) {

			}
			/**
			 * Creates a new instance of the ObjectClass
			 * @param object_data
			 */
			_ObjectClass.prototype.createNewInstance = function (instance_data) {
				if (this.data.custom_instance) {
					//Create a custom instance
					console.error("Matt Write this");
				}
				if (!this._preloaded) {
					//this.preload
				}
				return new ObjectInstance({
					object: instance_data,
					class: this
				})

			}
			return _ObjectClass;
		}
	])
	.factory('ObjectInstance', [
		'$q',
		function ($q) {
			var _ObjectInstance = function (options) {
				this.class = options.class;
				this.object = options.object;
				this.local_state = this.object.state;
				this.animation = null;
				return this;
			}
			//TODO: Probably define getters for (type, x,y,z,state, etc)
			/**
			 * Returns the correct frame for its state... hopefully
			 */
			_ObjectInstance.prototype.render = function () {
				return this.animation.render();
			}
			/**
			 * Updates the object instances state and animation
			 */
			_ObjectInstance.prototype.update = function (instance_data) {
				//First check to see the vars that trigger an animation change
				if (
					(instance_data.state != this.object.state) ||
						(instance_data.facing != this.object.facing)
					) {
					this.local_state = this.object.state;
					//Trigger new animation

					this.animation = this.class.getRenderable(
						this.object.local_state,
						this.object.facing
					);

				} else if (
					(instance_data.state != this.object.state) ||
						(instance_data.facing != this.object.facing)
					) {
					this.local_state = 'walking';
					this.animation = this.class.getRenderable(
						this.object.state,
						this.object.facing
					);
				}
				this.object = instance_data;
			}

			return _ObjectInstance;
		}
	])
	.service(
		'ObjectCacheData',
		[
			function () {
				return {"player-1": {"default": {"up": {"frames": [
					{"x": 0, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,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"},
					{"x": 46, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 92, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 138, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 184, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 230, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 276, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 322, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 368, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 414, "y": 0, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"}
				], "src": "/imgs/npcs/dogmeat.gif"}, "left": {"frames": [
					{"x": 0, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 46, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 92, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 92, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 138, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 138, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 184, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 184, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 230, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 230, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 276, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 276, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 322, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 322, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 368, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 368, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 414, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 414, "y": 38, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 0, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 46, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 92, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 138, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 184, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 230, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 276, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 322, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 368, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="},
					{"x": 414, "y": 180, "width": 46, "height": 35, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAjCAYAAADrJzjpAAAAa0lEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4vkT5OnO0bNH7z1d/PfLJZ44FOirQChtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUOJQyhtlrhGCUMP4KAAJMOzOjMAAAAASUVORK5CYII="}
				], "src": "/imgs/npcs/dogmeat.gif"}, "down": {"frames": [
					{"x": 0, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 46, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 92, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 138, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 184, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 230, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 276, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 322, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 368, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"},
					{"x": 414, "y": 76, "width": 46, "height": 38, "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAmCAYAAAC76qlaAAAAcklEQVRYR+3SwQkAIAzF0Hb/pV0hhyAU4jl85OnO0bNH7z1d/PfLJZ44FOirQCgtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtS1yjhEOJQygtOyv+ADMRACdHbuHJAAAAAElFTkSuQmCC"}
				], "src": "/imgs/npcs/dogmeat.gif"}}}}
			}
		]
	)
	.service('TileCache',
	[
		'TileCacheData',
		function(TileCacheData){
			var _TileCache  = {
				tile_image_cache:{},
				initTileInstance:function(tile_instance){
					var image = null;
					if(_TileCache.tile_image_cache[tile_instance.type]){
						image = _TileCache.tile_image_cache[tile_instance.type];
					}else{
						image = new Image();
						if(!TileCacheData[tile_instance.type]){
							console.log(tile_instance);
							return null;
						}
						image.src = TileCacheData[tile_instance.type].src;
						_TileCache.tile_image_cache[tile_instance.type] = image;
					}
					tile_instance.image = image;
					return tile_instance;

				}
			}
			return _TileCache;
		}
	])
	.service(
		'TileCacheData',
		[
			function () {
				return {"prison-0":{"src":"data:image/png;base64,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"},"prison-1":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-2":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-3":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-4":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-5":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-6":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-7":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-8":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-9":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-10":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-11":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-12":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-13":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-14":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="},"prison-15":{"src":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAmCAYAAACMJGZuAAAAhklEQVRoQ+3SsQ0AAAjDMPj/aV4guztnsrpjb4F9l8KBFU4AC1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnwQoCIfUsWEEgpJ4FKwiE1LNgBYGQehasIBBSz4IVBELqWbCCQEg9C1YQCKlnBawDlBwAJ+Tar3gAAAAASUVORK5CYII="}}
			}
		]
	)