///<reference path="../../_definitions.ts"/>

/**
 * @module away.render
 */
module away.render
{
	/**
	 * The DefaultRenderer class provides the default rendering method. It renders the scene graph objects using the
	 * materials assigned to them.
	 *
	 * @class away.render.DefaultRenderer
	 */
	export class DefaultRenderer extends RendererBase implements IRenderer
	{
		public _pRequireDepthRender:boolean;

		private static RTT_PASSES:number = 1;
		private static SCREEN_PASSES:number = 2;
		private static ALL_PASSES:number = 3;

		private _activeMaterial:away.materials.MaterialBase;
		private _pDistanceRenderer:DepthRenderer;
		private _pDepthRenderer:DepthRenderer;
		private _skyboxProjection:away.geom.Matrix3D = new away.geom.Matrix3D();
		public _pFilter3DRenderer:Filter3DRenderer;

		public _pDepthRender:away.gl.Texture;
		public _pRttBufferManager:away.managers.RTTBufferManager;
		public _depthTextureInvalid:boolean = true;

		private _viewPort:away.geom.Rectangle = new away.geom.Rectangle();
		private _viewportDirty:boolean;
		private _scissorDirty:boolean;

		private _forceSoftware:boolean;
		private _profile:string;
		private _antiAlias:number;

		private _localPos:away.geom.Point = new away.geom.Point();
		private _globalPos:away.geom.Point = new away.geom.Point();
		public _pScissorRect:away.geom.Rectangle = new away.geom.Rectangle();

		private _scissorUpdated:away.events.RendererEvent;
		private _viewPortUpdated:away.events.RendererEvent;

		private _onViewportUpdatedDelegate;


		public get antiAlias():number
		{
			return this._antiAlias;
		}

		public set antiAlias(value:number)
		{
			if (this._antiAlias == value)
				return;

			this._antiAlias = value;

			this._pBackBufferInvalid = true;
		}

		/**
		 *
		 */
		public get depthPrepass():boolean
		{
			return this._depthPrepass;
		}

		public set depthPrepass(value:boolean)
		{
			this._depthPrepass = value;
		}

		/**
		 *
		 * @returns {*}
		 */
		public get filters3d():Array<away.filters.Filter3DBase>
		{
			return this._pFilter3DRenderer? this._pFilter3DRenderer.filters : null;
		}
		public set filters3d(value:Array<away.filters.Filter3DBase>)
		{
			if (value && value.length == 0)
				value = null;

			if (this._pFilter3DRenderer && !value) {
				this._pFilter3DRenderer.dispose();
				this._pFilter3DRenderer = null;
			} else if (!this._pFilter3DRenderer && value) {
				this._pFilter3DRenderer = new Filter3DRenderer(this._pStageGL);
				this._pFilter3DRenderer.filters = value;
			}

			if (this._pFilter3DRenderer) {
				this._pFilter3DRenderer.filters = value;
				this._pRequireDepthRender = this._pFilter3DRenderer.requireDepthRender;
			} else {
				this._pRequireDepthRender = false;

				if (this._pDepthRender) {
					this._pDepthRender.dispose();
					this._pDepthRender = null;
				}
			}
		}

		/**
		 * A viewPort rectangle equivalent of the StageGL size and position.
		 */
		public get viewPort():away.geom.Rectangle
		{
			return this._viewPort;
		}

		/**
		 * A scissor rectangle equivalent of the view size and position.
		 */
		public get scissorRect():away.geom.Rectangle
		{
			return this._pScissorRect;
		}

		/**
		 *
		 */
		public get x():number
		{
			return this._localPos.x;
		}

		public set x(value:number)
		{
			if (this.x == value)
				return;

			this._globalPos.x = this._localPos.x = value;

			this.updateGlobalPos();
		}

		/**
		 *
		 */
		public get y():number
		{
			return this._localPos.y;
		}

		public set y(value:number)
		{
			if (this.y == value)
				return;

			this._globalPos.y = this._localPos.y = value;

			this.updateGlobalPos();
		}

		/**
		 *
		 */
		public get width():number
		{
			return this._width;
		}

		public set width(value:number)
		{
			if (this._width == value)
				return;

			this._width = value;
			this._pScissorRect.width = value;

			if (this._pRttBufferManager)
				this._pRttBufferManager.viewWidth = value;

			this._pBackBufferInvalid = true;
			this._depthTextureInvalid = true;

			this.notifyScissorUpdate();
		}

		/**
		 *
		 */
		public get height():number
		{
			return this._height;
		}

		public set height(value:number)
		{
			if (this._height == value)
				return;

			this._height = value;
			this._pScissorRect.height = value;

			if (this._pRttBufferManager)
				this._pRttBufferManager.viewHeight = value;

			this._pBackBufferInvalid = true;
			this._depthTextureInvalid = true;

			this.notifyScissorUpdate();
		}

		/**
		 * Creates a new DefaultRenderer object.
		 *
		 * @param antiAlias The amount of anti-aliasing to use.
		 * @param renderMode The render mode to use.
		 */
		constructor(forceSoftware:boolean = false, profile:string = "baseline")
		{
			super();

			this._onViewportUpdatedDelegate = away.utils.Delegate.create(this, this.onViewportUpdated);

			this._pDepthRenderer = new DepthRenderer();
			this._pDistanceRenderer = new DepthRenderer(false, true);

			if (this._pStageGL == null)
				this.stageGL = away.managers.StageGLManager.getInstance().getFreeStageGL(this._forceSoftware, this._profile);

			this._forceSoftware = forceSoftware;
			this._profile = profile;

			this._pRttBufferManager = away.managers.RTTBufferManager.getInstance(this._pStageGL);

			if (this._width == 0)
				this.width = window.innerWidth;
			else
				this._pRttBufferManager.viewWidth = this._width;

			if (this._height == 0)
				this.height = window.innerHeight;
			else
				this._pRttBufferManager.viewHeight = this._height;
		}

		public render(entityCollector:away.traverse.ICollector)
		{
			this._viewportDirty = false;
			this._scissorDirty = false;

			if (!this._pStageGL.recoverFromDisposal()) {//if contextGL has Disposed by the OS,don't render at this frame
				this._pBackBufferInvalid = true;
				return;
			}

			if (this._pBackBufferInvalid)// reset or update render settings
				this.pUpdateBackBuffer();

			if (this._shareContext)
				this._pStageGL.clearDepthBuffer();

			if (this._pFilter3DRenderer || this.iRenderToTexture) {
				this.textureRatioX = this._pRttBufferManager.textureRatioX;
				this.textureRatioY = this._pRttBufferManager.textureRatioY;
			} else {
				this.textureRatioX = 1;
				this.textureRatioY = 1;
			}

			if (this._pRequireDepthRender)
				this.pRenderSceneDepthToTexture(<away.traverse.EntityCollector> entityCollector);

			if (this._depthPrepass)
				this.pRenderDepthPrepass(<away.traverse.EntityCollector> entityCollector);

			if (this._pFilter3DRenderer && this._pStageGL.contextGL) {
				this._iRender(entityCollector, this._pFilter3DRenderer.getMainInputTexture(this._pStageGL), this._pRttBufferManager.renderToTextureRect);
				this._pFilter3DRenderer.render(this._pStageGL, entityCollector.camera, this._pDepthRender);

			} else {

				if (this._shareContext)
					this._iRender(entityCollector, null, this._pScissorRect);
				else
					this._iRender(entityCollector);
			}

			super.render(entityCollector);

			if (!this._shareContext)
				this._pStageGL.present();

			// register that a view has been rendered
			this._pStageGL.bufferClear = false;
		}

		public pExecuteRender(entityCollector:away.traverse.EntityCollector, target:away.gl.TextureBase = null, scissorRect:away.geom.Rectangle = null, surfaceSelector:number = 0)
		{
			this.updateLights(entityCollector);

			// otherwise RTT will interfere with other RTTs
			if (target) {
				this.drawRenderables(entityCollector.opaqueRenderableHead, entityCollector, DefaultRenderer.RTT_PASSES);
				this.drawRenderables(entityCollector.blendedRenderableHead, entityCollector, DefaultRenderer.RTT_PASSES);
			}

			super.pExecuteRender(entityCollector, target, scissorRect, surfaceSelector);
		}

		private updateLights(entityCollector:away.traverse.EntityCollector)
		{
			var dirLights:away.lights.DirectionalLight[] = entityCollector.directionalLights;
			var pointLights:away.lights.PointLight[] = entityCollector.pointLights;
			var len:number, i:number;
			var light:away.lights.LightBase;
			var shadowMapper:away.lights.ShadowMapperBase;

			len = dirLights.length;
			for (i = 0; i < len; ++i) {
				light = dirLights[i];

				shadowMapper = light.shadowMapper;

				if (light.castsShadows && (shadowMapper.autoUpdateShadows || shadowMapper._iShadowsInvalid ))
					shadowMapper.iRenderDepthMap(this._pStageGL, entityCollector, this._pDepthRenderer);
			}

			len = pointLights.length;
			for (i = 0; i < len; ++i) {
				light = pointLights[i];

				shadowMapper = light.shadowMapper;

				if (light.castsShadows && (shadowMapper.autoUpdateShadows || shadowMapper._iShadowsInvalid))
					shadowMapper.iRenderDepthMap(this._pStageGL, entityCollector, this._pDistanceRenderer);
			}
		}

		/**
		 * @inheritDoc
		 */
		public pDraw(entityCollector:away.traverse.EntityCollector, target:away.gl.TextureBase)
		{
			this._pContext.setBlendFactors(away.gl.ContextGLBlendFactor.ONE, away.gl.ContextGLBlendFactor.ZERO);

			if (entityCollector.skyBox) {
				if (this._activeMaterial)
					this._activeMaterial.iDeactivate(this._pStageGL);

				this._activeMaterial = null;

				this._pContext.setDepthTest(false, away.gl.ContextGLCompareMode.ALWAYS);
				this.drawSkybox(entityCollector);

			}

			this._pContext.setDepthTest(true, away.gl.ContextGLCompareMode.LESS_EQUAL);

			var which:number = target? DefaultRenderer.SCREEN_PASSES : DefaultRenderer.ALL_PASSES;

			this.drawRenderables(entityCollector.opaqueRenderableHead, entityCollector, which);
			this.drawRenderables(entityCollector.blendedRenderableHead, entityCollector, which);

			this._pContext.setDepthTest(false, away.gl.ContextGLCompareMode.LESS_EQUAL);

			if (this._activeMaterial)
				this._activeMaterial.iDeactivate(this._pStageGL);

			this._activeMaterial = null;
		}

		/**
		 * Draw the skybox if present.
		 * @param entityCollector The EntityCollector containing all potentially visible information.
		 */
		private drawSkybox(entityCollector:away.traverse.EntityCollector)
		{
			var skyBox:away.pool.RenderableBase = entityCollector.skyBox;

			var material:away.materials.MaterialBase = <away.materials.MaterialBase> skyBox.materialOwner.material;

			var camera:away.entities.Camera = entityCollector.camera;

			this.updateSkyboxProjection(camera);

			material.iActivatePass(0, this._pStageGL, camera);
			material.iRenderPass(0, skyBox, this._pStageGL, entityCollector, this._skyboxProjection);
			material.iDeactivatePass(0, this._pStageGL);
		}

		private updateSkyboxProjection(camera:away.entities.Camera)
		{
			var near:away.geom.Vector3D = new away.geom.Vector3D();

			this._skyboxProjection.copyFrom(this._pRttViewProjectionMatrix);
			this._skyboxProjection.copyRowTo(2, near);

			var camPos:away.geom.Vector3D = camera.scenePosition;

			var cx:number = near.x;
			var cy:number = near.y;
			var cz:number = near.z;
			var cw:number = -(near.x*camPos.x + near.y*camPos.y + near.z*camPos.z + Math.sqrt(cx*cx + cy*cy + cz*cz));

			var signX:number = cx >= 0? 1 : -1;
			var signY:number = cy >= 0? 1 : -1;

			var p:away.geom.Vector3D = new away.geom.Vector3D(signX, signY, 1, 1);

			var inverse:away.geom.Matrix3D = this._skyboxProjection.clone();
			inverse.invert();

			var q:away.geom.Vector3D = inverse.transformVector(p);

			this._skyboxProjection.copyRowTo(3, p);

			var a:number = (q.x*p.x + q.y*p.y + q.z*p.z + q.w*p.w)/(cx*q.x + cy*q.y + cz*q.z + cw*q.w);

			this._skyboxProjection.copyRowFrom(2, new away.geom.Vector3D(cx*a, cy*a, cz*a, cw*a));
		}

		/**
		 * Draw a list of renderables.
		 * @param renderables The renderables to draw.
		 * @param entityCollector The EntityCollector containing all potentially visible information.
		 */
		private drawRenderables(renderable:away.pool.RenderableBase, entityCollector:away.traverse.ICollector, which:number)
		{
			var numPasses:number;
			var j:number;
			var camera:away.entities.Camera = entityCollector.camera;
			var renderable2:away.pool.RenderableBase;

			while (renderable) {
				this._activeMaterial = <away.materials.MaterialBase> renderable.materialOwner.material;

				this._activeMaterial.iUpdateMaterial(this._pContext);

				numPasses = this._activeMaterial._iNumPasses;

				j = 0;

				do {
					renderable2 = renderable;

					var rttMask:number = this._activeMaterial.iPassRendersToTexture(j)? 1 : 2;

					if ((rttMask & which) != 0) {
						this._activeMaterial.iActivatePass(j, this._pStageGL, camera);

						do {
							this._activeMaterial.iRenderPass(j, renderable2, this._pStageGL, entityCollector, this._pRttViewProjectionMatrix);

							renderable2 = renderable2.next;

						} while (renderable2 && renderable2.materialOwner.material == this._activeMaterial);

						this._activeMaterial.iDeactivatePass(j, this._pStageGL);

					} else {
						do {
							renderable2 = renderable2.next;

						} while (renderable2 && renderable2.materialOwner.material == this._activeMaterial);
					}
				} while (++j < numPasses);

				renderable = renderable2;
			}
		}

		public dispose()
		{
			if (!this._shareContext)
				this._pStageGL.dispose();

			this._pDepthRenderer.dispose();
			this._pDistanceRenderer.dispose();
			this._pDepthRenderer = null;
			this._pDistanceRenderer = null;

			if (this._pRttBufferManager)
				this._pRttBufferManager.dispose();

			this._pRttBufferManager = null;
			this._pDepthRender = null;

			this._pStageGL.removeEventListener(away.events.StageGLEvent.VIEWPORT_UPDATED, this._onViewportUpdatedDelegate);

			super.dispose();
		}


		/**
		 *
		 */
		public pRenderDepthPrepass(entityCollector:away.traverse.EntityCollector)
		{
			this._pDepthRenderer.disableColor = true;

			if (this._pFilter3DRenderer || this.iRenderToTexture) {
				this._pDepthRenderer.textureRatioX = this._pRttBufferManager.textureRatioX;
				this._pDepthRenderer.textureRatioY = this._pRttBufferManager.textureRatioY;
				this._pDepthRenderer._iRender(entityCollector, this._pFilter3DRenderer.getMainInputTexture(this._pStageGL), this._pRttBufferManager.renderToTextureRect);
			} else {
				this._pDepthRenderer.textureRatioX = 1;
				this._pDepthRenderer.textureRatioY = 1;
				this._pDepthRenderer._iRender(entityCollector);
			}

			this._pDepthRenderer.disableColor = false;
		}


		/**
		 *
		 */
		public pRenderSceneDepthToTexture(entityCollector:away.traverse.EntityCollector)
		{
			if (this._depthTextureInvalid || !this._pDepthRender)
				this.initDepthTexture(this._pStageGL.contextGL);

			this._pDepthRenderer.textureRatioX = this._pRttBufferManager.textureRatioX;
			this._pDepthRenderer.textureRatioY = this._pRttBufferManager.textureRatioY;
			this._pDepthRenderer._iRender(entityCollector, this._pDepthRender);
		}


		/**
		 * Updates the backbuffer dimensions.
		 */
		public pUpdateBackBuffer()
		{
			// No reason trying to configure back buffer if there is no context available.
			// Doing this anyway (and relying on _stageGL to cache width/height for
			// context does get available) means usesSoftwareRendering won't be reliable.
			if (this._pStageGL.contextGL && !this._shareContext) {
				if (this._width && this._height) {
					this._pStageGL.configureBackBuffer(this._width, this._height, this._antiAlias, true);
					this._pBackBufferInvalid = false;
				}
			}
		}

		public iSetStageGL(value:away.base.StageGL)
		{
			if (this._pStageGL)
				this._pStageGL.removeEventListener(away.events.StageGLEvent.VIEWPORT_UPDATED, this._onViewportUpdatedDelegate);

			super.iSetStageGL(value);

			if (this._pStageGL)
				this._pStageGL.addEventListener(away.events.StageGLEvent.VIEWPORT_UPDATED, this._onViewportUpdatedDelegate);

			this._pDistanceRenderer.iSetStageGL(value);
			this._pDepthRenderer.iSetStageGL(value);
		}

		/**
		 *
		 */
		private initDepthTexture(context:away.gl.ContextGL):void
		{
			this._depthTextureInvalid = false;

			if (this._pDepthRender)
				this._pDepthRender.dispose();

			this._pDepthRender = context.createTexture(this._pRttBufferManager.textureWidth, this._pRttBufferManager.textureHeight, away.gl.ContextGLTextureFormat.BGRA, true);
		}


		/**
		 * @private
		 */
		private notifyScissorUpdate()
		{
			if (this._scissorDirty)
				return;

			this._scissorDirty = true;

			if (!this._scissorUpdated)
				this._scissorUpdated = new away.events.RendererEvent(away.events.RendererEvent.SCISSOR_UPDATED);

			this.dispatchEvent(this._scissorUpdated);
		}


		/**
		 * @private
		 */
		private notifyViewportUpdate()
		{
			if (this._viewportDirty)
				return;

			this._viewportDirty = true;

			if (!this._viewPortUpdated)
				this._viewPortUpdated = new away.events.RendererEvent(away.events.RendererEvent.VIEWPORT_UPDATED);

			this.dispatchEvent(this._viewPortUpdated);
		}

		/**
		 *
		 */
		public onViewportUpdated(event:away.events.StageGLEvent)
		{
			this._viewPort = this._pStageGL.viewPort;
			//TODO stop firing viewport updated for every stagegl viewport change

			if (this._shareContext) {
				this._pScissorRect.x = this._globalPos.x - this._pStageGL.x;
				this._pScissorRect.y = this._globalPos.y - this._pStageGL.y;
				this.notifyScissorUpdate();
			}

			this.notifyViewportUpdate();
		}

		/**
		 *
		 */
		public updateGlobalPos()
		{
			if (this._shareContext) {
				this._pScissorRect.x = this._globalPos.x - this._viewPort.x;
				this._pScissorRect.y = this._globalPos.y - this._viewPort.y;
			} else {
				this._pScissorRect.x = 0;
				this._pScissorRect.y = 0;
				this._viewPort.x = this._globalPos.x;
				this._viewPort.y = this._globalPos.y;
			}

			this.notifyScissorUpdate();
		}
	}
}
