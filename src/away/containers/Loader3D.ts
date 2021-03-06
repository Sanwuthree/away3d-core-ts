///<reference path="../_definitions.ts"/>

module away.containers
{

	/**
	 * Dispatched when any asset finishes parsing. Also see specific events for each
	 * individual asset type (meshes, materials et c.)
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="assetComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when a full resource (including dependencies) finishes loading.
	 *
	 * @eventType away3d.events.LoaderEvent
	 */
	//[Event(name="resourceComplete", type="away3d.events.LoaderEvent")]


	/**
	 * Dispatched when a single dependency (which may be the main file of a resource)
	 * finishes loading.
	 *
	 * @eventType away3d.events.LoaderEvent
	 */
	//[Event(name="dependencyComplete", type="away3d.events.LoaderEvent")]


	/**
	 * Dispatched when an error occurs during loading. I
	 *
	 * @eventType away3d.events.LoaderEvent
	 */
	//[Event(name="loadError", type="away3d.events.LoaderEvent")]


	/**
	 * Dispatched when an error occurs during parsing.
	 *
	 * @eventType away3d.events.ParserEvent
	 */
	//[Event(name="parseError", type="away3d.events.ParserEvent")]


	/**
	 * Dispatched when a skybox asset has been costructed from a ressource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="skyboxComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a camera3d asset has been costructed from a ressource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="cameraComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a mesh asset has been costructed from a ressource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="meshComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a geometry asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="geometryComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a skeleton asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="skeletonComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a skeleton pose asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="skeletonPoseComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a container asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="containerComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a texture asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="textureComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when a texture projector asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="textureProjectorComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when a material asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="materialComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when a animator asset has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="animatorComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an animation set has been constructed from a group of animation state resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="animationSetComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an animation state has been constructed from a group of animation node resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="animationStateComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an animation node has been constructed from a resource.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="animationNodeComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an animation state transition has been constructed from a group of animation node resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="stateTransitionComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an light asset has been constructed from a resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="lightComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an light picker asset has been constructed from a resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="lightPickerComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an effect method asset has been constructed from a resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="effectMethodComplete", type="away3d.events.AssetEvent")]


	/**
	 * Dispatched when an shadow map method asset has been constructed from a resources.
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="shadowMapMethodComplete", type="away3d.events.AssetEvent")]

	/**
	 * Dispatched when an image asset dimensions are not a power of 2
	 *
	 * @eventType away3d.events.AssetEvent
	 */
	//[Event(name="textureSizeError", type="away3d.events.AssetEvent")]

	/**
	 * Loader3D can load any file format that Away3D supports (or for which a third-party parser
	 * has been plugged in) and be added directly to the scene. As assets are encountered
	 * they are added to the Loader3D container. Assets that can not be displayed in the scene
	 * graph (e.g. unused bitmaps/materials/skeletons etc) will be ignored.
	 *
	 * This provides a fast and easy way to load models (no need for event listeners) but is not
	 * very versatile since many types of assets are ignored.
	 *
	 * Loader3D by default uses the AssetLibrary to load all assets, which means that they also
	 * ends up in the library. To circumvent this, Loader3D can be configured to not use the
	 * AssetLibrary in which case it will use the AssetLoader directly.
	 *
	 * @see away.net.AssetLoader
	 * @see away.library.AssetLibrary
	 */
	export class Loader3D extends away.containers.DisplayObjectContainer
	{
		private _loadingSessions:Array<away.net.AssetLoader>;
		private _useAssetLib:boolean;
		private _assetLibId:string;
		private _onResourceCompleteDelegate:Function;
		private _onAssetCompleteDelegate:Function;

		constructor(useAssetLibrary:boolean = true, assetLibraryId:string = null)
		{
			super();

			this._loadingSessions = new Array<away.net.AssetLoader>();
			this._useAssetLib = useAssetLibrary;
			this._assetLibId = assetLibraryId;

			this._onResourceCompleteDelegate = away.utils.Delegate.create(this, this.onResourceComplete);
			this._onAssetCompleteDelegate = away.utils.Delegate.create(this, this.onAssetComplete);
		}

		/**
		 * Loads a file and (optionally) all of its dependencies.
		 *
		 * @param req The URLRequest object containing the URL of the file to be loaded.
		 * @param context An optional context object providing additional parameters for loading
		 * @param ns An optional namespace string under which the file is to be loaded, allowing the differentiation of two resources with identical assets
		 * @param parser An optional parser object for translating the loaded data into a usable resource. If not provided, AssetLoader will attempt to auto-detect the file type.
		 */
		public load(req:away.net.URLRequest, context:away.net.AssetLoaderContext = null, ns:string = null, parser:away.parsers.ParserBase = null):away.net.AssetLoaderToken
		{
			var token:away.net.AssetLoaderToken;

			if (this._useAssetLib) {
				var lib:away.library.AssetLibraryBundle;
				lib = away.library.AssetLibraryBundle.getInstance(this._assetLibId);
				token = lib.load(req, context, ns, parser);
			} else {
				var loader:away.net.AssetLoader = new away.net.AssetLoader();
				this._loadingSessions.push(loader);
				token = loader.load(req, context, ns, parser);
			}

			token.addEventListener(away.events.LoaderEvent.RESOURCE_COMPLETE, this._onResourceCompleteDelegate);
			token.addEventListener(away.events.AssetEvent.ASSET_COMPLETE, this._onAssetCompleteDelegate);

			// Error are handled separately (see documentation for addErrorHandler)
			token._iLoader._iAddErrorHandler(this.onLoadError);
			token._iLoader._iAddParseErrorHandler(this.onParseError);

			return token;
		}

		/**
		 * Loads a resource from already loaded data.
		 *
		 * @param data The data object containing all resource information.
		 * @param context An optional context object providing additional parameters for loading
		 * @param ns An optional namespace string under which the file is to be loaded, allowing the differentiation of two resources with identical assets
		 * @param parser An optional parser object for translating the loaded data into a usable resource. If not provided, AssetLoader will attempt to auto-detect the file type.
		 */
		public loadData(data:any, context:away.net.AssetLoaderContext = null, ns:string = null, parser:away.parsers.ParserBase = null):away.net.AssetLoaderToken
		{
			var token:away.net.AssetLoaderToken;

			if (this._useAssetLib) {
				var lib:away.library.AssetLibraryBundle;
				lib = away.library.AssetLibraryBundle.getInstance(this._assetLibId);
				token = lib.loadData(data, context, ns, parser);
			} else {
				var loader:away.net.AssetLoader = new away.net.AssetLoader();
				this._loadingSessions.push(loader);
				token = loader.loadData(data, '', context, ns, parser);
			}

			token.addEventListener(away.events.LoaderEvent.RESOURCE_COMPLETE, this._onResourceCompleteDelegate);
			token.addEventListener(away.events.AssetEvent.ASSET_COMPLETE, this._onAssetCompleteDelegate);

			// Error are handled separately (see documentation for addErrorHandler)
			token._iLoader._iAddErrorHandler(this.onLoadError);
			token._iLoader._iAddParseErrorHandler(this.onParseError);

			return token;
		}

		/**
		 * Stop the current loading/parsing process.
		 */
		public stopLoad():void
		{
			if (this._useAssetLib) {
				var lib:away.library.AssetLibraryBundle;
				lib = away.library.AssetLibraryBundle.getInstance(this._assetLibId);
				lib.stopAllLoadingSessions();
				this._loadingSessions = null;
				return
			}
			var i:number /*int*/;
			var length:number /*int*/ = this._loadingSessions.length;
			for (i = 0; i < length; i++) {
				this.removeListeners(this._loadingSessions[i]);
				this._loadingSessions[i].stop();
				this._loadingSessions[i] = null;
			}
			this._loadingSessions = null;
		}

		/**
		 * Enables a specific parser.
		 * When no specific parser is set for a loading/parsing opperation,
		 * loader3d can autoselect the correct parser to use.
		 * A parser must have been enabled, to be considered when autoselecting the parser.
		 *
		 * @param parserClass The parser class to enable.
		 * @see away.parsers.Parsers
		 */
		public static enableParser(parserClass:Object):void
		{
			away.net.AssetLoader.enableParser(parserClass);
		}

		/**
		 * Enables a list of parsers.
		 * When no specific parser is set for a loading/parsing opperation,
		 * loader3d can autoselect the correct parser to use.
		 * A parser must have been enabled, to be considered when autoselecting the parser.
		 *
		 * @param parserClasses A Vector of parser classes to enable.
		 * @see away.parsers.Parsers
		 */
		public static enableParsers(parserClasses:Object[]):void
		{
			away.net.AssetLoader.enableParsers(parserClasses);
		}

		private removeListeners(dispatcher:away.events.EventDispatcher):void
		{
			dispatcher.removeEventListener(away.events.LoaderEvent.RESOURCE_COMPLETE, this._onResourceCompleteDelegate);
			dispatcher.removeEventListener(away.events.AssetEvent.ASSET_COMPLETE, this._onAssetCompleteDelegate);
		}

		private onAssetComplete(ev:away.events.AssetEvent):void
		{
			if (ev.type == away.events.AssetEvent.ASSET_COMPLETE) {
				// TODO: not used
				// var type : string = ev.asset.assetType;
				var obj:away.base.DisplayObject;
				switch (ev.asset.assetType) {
					case away.library.AssetType.LIGHT:
						obj = <away.lights.LightBase> ev.asset;
						break;
					case away.library.AssetType.CONTAINER:
						obj = <away.containers.DisplayObjectContainer> ev.asset;
						break;
					case away.library.AssetType.MESH:
						obj = <away.entities.Mesh> ev.asset;
						break;
						//case away.library.AssetType.SKYBOX:
						//    obj = <away.entities.Skybox> ev.asset;
						break;
						//case away.library.AssetType.TEXTURE_PROJECTOR:
						//    obj = <away.entities.TextureProjector> ev.asset;
						break;
					case away.library.AssetType.CAMERA:
						obj = <away.entities.Camera> ev.asset;
						break;
					case away.library.AssetType.SEGMENT_SET:
						obj = <away.entities.SegmentSet> ev.asset;
						break;
				}

				// If asset was of fitting type, and doesn't
				// already have a parent, add to loader container
				if (obj && obj.parent == null)
					this.addChild(obj);
			}

			this.dispatchEvent(ev.clone());
		}

		/**
		 * Called when an error occurs during loading
		 */
		private onLoadError(event:away.events.LoaderEvent):boolean
		{
			if (this.hasEventListener(away.events.IOErrorEvent.IO_ERROR, this.onLoadError)) {
				this.dispatchEvent(event);
				return true;
			} else {
				return false;
			}
		}

		/**
		 * Called when a an error occurs during parsing
		 */
		private onParseError(event:away.events.ParserEvent):boolean
		{
			if (this.hasEventListener(away.events.ParserEvent.PARSE_ERROR, this.onParseError)) {
				this.dispatchEvent(event);
				return true;
			} else {
				return false;
			}
		}

		/**
		 * Called when the resource and all of its dependencies was retrieved.
		 */
		private onResourceComplete(event:away.events.LoaderEvent)
		{
			var loader:away.net.AssetLoader = <away.net.AssetLoader> event.target;

			this.dispatchEvent(event);
		}
	}
}
