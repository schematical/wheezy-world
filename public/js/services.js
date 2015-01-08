angular.module('chaos_engine')
	.factory(
		'SpriteSheet',
		[
			function () {
				var _spriteSheet = function (options) {
					this.img_src = options.img_src;
					this.x_offset = options.x_offset || 0;
					this.y_offset = options.y_offset || 0;
					this.tile_width = options.tile_width;
					this.tile_height = options.tile_height;
					this.image = null;

					return this;
				}
				_spriteSheet.prototype.getTile = function (x, y) {
					if (!this.canvas) {
						this.canvas = document.createElement('canvas');
						this.canvas.width = this.tile_width;
						this.canvas.height = this.tile_height;
						this.ctx = this.canvas.getContext('2d');
					}
					this.ctx.drawImage(
						this.image,
						(x * this.tile_width) + this.x_offset,
						(y * this.tile_height) + this.y_offset,
						this.tile_width,
						this.tile_height,
						0,
						0,
						this.tile_width,
						this.tile_height
					);
					var tImage = new Image();
					tImage.src = this.canvas.toDataURL();
					return tImage;

				}
				_spriteSheet.prototype.load = function (callback) {
					//Append canvas
					this.image = new Image();
					this.image.onload = function () {
						return callback(null, this.image);
					}
					this.image.src = this.img_src;
				}

				return _spriteSheet
			}
		]
	).service(
		'Socket',
		[
			'$rootScope',
			'$cookies',
			'GameScreen',
			'WorldCache',
			'InventoryModal',
			function ($rootScope, $cookies, GameScreen, WorldCache, InventoryModal) {
				return {
					init: function () {

						var socket = window.io();
						socket.on('hello', function (data) {
							//console.log($cookies);
							socket.emit('greet', { user: $cookies.user /*$cookieStore.get('user')*/ });
						});
						socket.on('create-user', function (data) {

							//Create cookie
							//console.log(data.user);
							//$cookieStore.remove('user');
							//$cookieStore.put('user', data.user);
							$cookies.user = data.user;
							$cookies.view_port_focus = data.view_port_focus;
							$rootScope.$digest();

						});
						socket.on('refresh-world', function (data) {
							GameScreen.set_viewport_focus($cookies.view_port_focus);

							WorldCache.init(data);
							GameScreen.render_world();

						});
						socket.on('update-world', function (data) {

							//console.log("Updateing WOrld:", data);
							WorldCache.update(data);
							GameScreen.render_world();

						});
						/** Setup for user generated events */

						$rootScope.$on('keypress', function (e, a, key) {
							if (GameScreen.modal) {
								//Pass control to the modal
								return GameScreen.modal.apply(key);

							}
							switch (key) {
								case('s'):
									//Trigger Down
									socket.emit('user-input', {
										action: 'player.move.down'
									})
									break;
								case('d'):
									//Trigger Down
									socket.emit('user-input', {
										action: 'player.move.right'
									})
									break;
								case('a'):
									//Trigger Down
									socket.emit('user-input', {
										action: 'player.move.left'
									})
									break;
								case('w'):
									//Trigger Down

									socket.emit('user-input', {
										action: 'player.move.up'
									})
									break;
								case('e'):
									//Figure out what the user is trying to interact with
									socket.emit('user-input', {
										action: 'player.interact'
									})
									break;
								case('i'):
									//Display the inventory Modal
									GameScreen.showModal(new InventoryModal({
										ingest: function (inventory_object) {
											socket.emit('user-input', {
												action: 'player.ingest',
												object: inventory_object
											})
										}
									}));

									break;
							}

							/*$scope.$apply(function () {
							 $scope.key = key;
							 });*/
						})
						return socket;
					}
				}
			}
		]
	)
/**
 * Caches world data for quicker socket comunitication
 */
	.service(
		'WorldCache',
		[
			'ObjectCache',
			'TileCache',

			function (ObjectCache, TileCache) {
				var _WorldCache = {
					world: null,
					init: function (data) {
						//First init the objects
						_WorldCache.world = {
							objects:{},
							tiles:{}
						}
						for(var object_id in data.objects){
							var instance = ObjectCache.createNewObjectInstance(data.objects[object_id]);
							if(!instance){
								console.log("No object class for:" + object_id);
							}else{
								_WorldCache.world.objects[instance.id] = instance;
							}
						}
						//Quick clone for now:
						for(var x in  data.tiles){
							if(!_WorldCache.world.tiles[x]){
								_WorldCache.world.tiles[x] = {}
							}
							for(var y in  data.tiles[x]){
								_WorldCache.world.tiles[x][y] = TileCache.initTileInstance(data.tiles[x][y]);
							}
						}

					},
					update: function (data) {
						for (var object_id in data.objects) {
							if(_WorldCache.world.objects[object_id]){
								_WorldCache.world.objects[object_id].update(data.objects[object_id]);
							}
						}
					}
				}
				return _WorldCache;
			}
		]
	)
	.service(
		'GameScreen',
		[
			'ObjectCache',
			'WorldCache',
			'TileCache',

			function (ObjectCache, WorldCache, TileCache) {
				var _GameScreen = function (options) {
					this.view_radius = 40;
					this.view_port = {
						x: 0,
						y: 0,
						z: 0
					}
					this.gameArea = document.getElementById('gameArea');
					if (!this.gameArea) {
						throw new Error("Game Area Element not found");
					}
					this.gameCanvas = document.getElementById('gameCanvas');
					this.widthToHeight = 4 / 3;
					this.tile_width = 75;
					this.tile_height = 38;

					this.gameContext = this.gameCanvas.getContext("2d");
					var _this = this;
					window.addEventListener('resize', function () {
						_this.resize()
					}, false);
					window.addEventListener('orientationchange', function () {
						_this.resize()
					}, false);
				}
				_GameScreen.prototype.set_viewport_focus = function (object_id) {
					if (object_id.id) {
						object_id = object_id.id;
					}
					this.view_port_focus = object_id;
				}
				_GameScreen.prototype.set_viewport = function (x, y, z) {

					this.view_port.x = x;
					this.view_port.y = y;
					this.view_port.z = z;
				}
				_GameScreen.prototype.render_world = function () {
					//Clear canvas
					this.gameContext.clearRect(
						0,
						0,
						this.gameCanvas.width,
						this.gameCanvas.height
					);
					var world = WorldCache.world;
					var _this = this;


					//Update view port
					if (this.view_port_focus && world.objects[this.view_port_focus]) {
						var focus_object = world.objects[this.view_port_focus];
						this.set_viewport(
							focus_object.x,
							focus_object.y,
							focus_object.z
						)
					}


					for (var x = this.view_port.x - this.view_radius; x < this.view_port.x + this.view_radius; x++) {
						if (world.tiles[x]) {

							for (var y = this.view_port.y - this.view_radius; y < this.view_port.y + this.view_radius; y++) {
								if (world.tiles[x][y]) {

									var tile = world.tiles[x][y];
									_this.gameContext.drawImage(
										tile.image,
										0,
										0,
										_this.tile_width,
										_this.tile_height
									);
									//ObjectCache.loadImage(tile.type, tile.state, function (err, image) {
									/*	var draw_x = (x - _this.view_port.x) + _this.view_radius / 2;
										var draw_y = (y - _this.view_port.y) + _this.view_radius / 2;
										_this.gameContext.drawImage(
											tile.image,
											(draw_x * _this.tile_width) - (_this.tile_width * draw_y/2),
											(draw_y * _this.tile_height) - (_this.tile_height * draw_y/2),
											_this.tile_width,
											_this.tile_height
										);*/
									//});
								}
							}
						}
					}
					return;
					for (var i in world.objects) {
						if (world.objects[i]) {

							var object = world.objects[i];
							if (!object.detached) {
								ObjectCache.loadImage(object.type, object.state, function (err, image) {
									var draw_x = (object.x - _this.view_port.x) + _this.view_radius / 2;
									var draw_y = (object.y - _this.view_port.y) + _this.view_radius / 2;


									_this.gameContext.drawImage(
										image,
										(draw_x * _this.tile_width) - (_this.tile_width * draw_y/2),
										(draw_y * _this.tile_height) - (_this.tile_height * draw_y/2),
										_this.tile_width/2,
										_this.tile_width/2
									);
								});
							}
						}
					}
					if (this.modal) {
						this.modal.render();
					}
				}
				_GameScreen.prototype.render = function () {

				}
				_GameScreen.prototype.showModal = function (modal) {

					this.modal = modal;
					if (!this.modal.world) {
						this.modal.world = WorldCache.world;
					}
					if (!this.modal.screen) {
						this.modal.screen = this;
					}
				}
				_GameScreen.prototype.hideModal = function () {
					this.modal = null;
				}
				_GameScreen.prototype.resize = function () {
					var newWidth = window.innerWidth;
					var newHeight = window.innerHeight;
					var newWidthToHeight = newWidth / newHeight;
					if (newWidthToHeight > this.widthToHeight) {
						// window width is too wide relative to desired game width
						newWidth = newHeight * this.widthToHeight;
						this.gameArea.style.height = newHeight + 'px';
						this.gameArea.style.width = newWidth + 'px';
					} else { // window height is too high relative to desired game height
						newHeight = newWidth / this.widthToHeight;
						this.gameArea.style.width = newWidth + 'px';
						this.gameArea.style.height = newHeight + 'px';
					}
					this.gameArea.style.marginTop = (-newHeight / 2) + 'px';
					this.gameArea.style.marginLeft = (-newWidth / 2) + 'px';
					this.gameArea.style.fontSize = (newWidth / 400) + 'em';

					this.gameCanvas.width = newWidth;
					this.gameCanvas.height = newHeight;
					this.view_radius = Math.ceil((newHeight / this.tile_height));
					/*this.view_radius = newHeight/this.tile_width;*/
				}
				var gameScreen = new _GameScreen();
				gameScreen.resize();
				return gameScreen;

			}
		]
	)
	.service('InventoryModal', ['ObjectCache', function (ObjectCache) {
		var _InventoryModal = function (data) {
			this.ingest = data.ingest;
			this.selected = null;
		}
		_InventoryModal.prototype.render = function () {
			var screen = this.screen;
			screen.gameContext.fillStyle = "#000000";
			var modal_width = this.screen.gameCanvas.width / 2;
			var modal_height = this.screen.gameCanvas.height / 2;
			screen.gameContext.fillRect(
				screen.gameCanvas.width / 4,
				screen.gameCanvas.height / 4,
				modal_width,
				modal_height
			);
			var object = this.world.objects[screen.view_port_focus];
			ObjectCache.loadImage(object.type, object.state, function (err, image) {

				screen.gameContext.drawImage(
					image,
					modal_width / 2 + (modal_width * .1),
					modal_height / 2 + (modal_height * .1),
					screen.tile_width,
					screen.tile_width
				);
			});
			var ct = 0;
			for (var i in object.inventory) {
				var screen_x = modal_width / 2 + (modal_width * .9) - screen.tile_width;
				var screen_y = modal_height / 2 + (modal_height * .1) + (screen.tile_width * 1.5 * ct);
				if (ct == this.selected) {
					screen.gameContext.fillStyle = "#ff0000";
					screen.gameContext.fillRect(
						screen_x - 5,
						screen_y - 5,
						screen.tile_width + 10,
						screen.tile_width + 10
					);
				}
				ObjectCache.loadImage(object.inventory[i].type, object.inventory[i].state, function (err, image) {

					screen.gameContext.drawImage(
						image,
						screen_x,
						screen_y,
						screen.tile_width,
						screen.tile_width
					);
				});
				ct += 1;
			}

		}
		_InventoryModal.prototype.apply = function (key) {

			var object = this.world.objects[this.screen.view_port_focus];
			switch (key) {
				case('w'):
					if (!this.selected) {
						this.selected = 0;
					} else {
						this.selected += 1;
					}
					if (this.selected > object.inventory.length) {
						this.selected = 0;
					}
					break;
				case('d'):
					if (!this.selected) {
						this.selected = 0;
					} else {
						this.selected -= 1;
					}
					if (this.selected < 0) {
						this.selected = object.inventory.length;
					}
					break;
				case('enter'):
					var inventory_object = object.inventory[this.selected];
					this.ingest(inventory_object);
					break;
				case('i'):
					this.screen.hideModal();
					break;
			}
		}
		return _InventoryModal;
	}])
	.directive('shortcut', ['$document', '$rootScope', function ($document, $rootScope) {
		return {
			restrict: 'E',
			replace: true,
			scope: true,
			link: function postLink(scope, iElement, iAttrs) {

				$document.bind('keypress', function (e) {
					//document.onkeypress = function (e) {
					var key = null;
					switch (e.which) {
						case(13):
							key = 'enter';
							break;
						default:
							key = String.fromCharCode(e.which);
					}
					$rootScope.$broadcast('keypress', e, key);
				});
			}
		};
	}])
	.factory('AnimationFactory', [
		function(){
			var _AnimationFactory = function(options){
				this._frame_ct = -1;
				//this.screen = options.screen;
				this.frames = options.frames;
				this.image = options.image;
				return this;
			}
			/**
			 * Returns an image in data url form
			 */
			_AnimationFactory.prototype.render = function(){

				this._frame_ct += 1;
				if(this._frame_ct > this.frames.length){
					this._frame_ct = 0;
				}
				var frame = this.frame[this._frame_ct];
				return frame.data_url;
			}
			return _AnimationFactory;
		}
	]);
