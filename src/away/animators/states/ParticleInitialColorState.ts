///<reference path="../../_definitions.ts"/>

module away.animators
{
	import RenderableBase					= away.pool.RenderableBase;
	import Camera							= away.entities.Camera;
	import ContextGLVertexBufferFormat		= away.gl.ContextGLVertexBufferFormat
	import ColorTransform					= away.geom.ColorTransform;
	import Vector3D							= away.geom.Vector3D;
	import StageGL							= away.base.StageGL;
	
	export class ParticleInitialColorState extends ParticleStateBase
	{
		private _particleInitialColorNode:ParticleInitialColorNode;
		private _usesMultiplier:boolean;
		private _usesOffset:boolean;
		private _initialColor:ColorTransform;
		private _multiplierData:Vector3D;
		private _offsetData:Vector3D;
		
		constructor(animator:ParticleAnimator, particleInitialColorNode:ParticleInitialColorNode)
		{
			super(animator, particleInitialColorNode);
			
			this._particleInitialColorNode = particleInitialColorNode;
			this._usesMultiplier = particleInitialColorNode._iUsesMultiplier;
			this._usesOffset = particleInitialColorNode._iUsesOffset;
			this._initialColor = particleInitialColorNode._iInitialColor;
			
			this.updateColorData();
		}
		
		/**
		 * Defines the initial color transform of the state, when in global mode.
		 */
		public get initialColor():ColorTransform
		{
			return this._initialColor;
		}
		
		public set initialColor(value:ColorTransform)
		{
			this._initialColor = value;
		}
		
		/**
		 * @inheritDoc
		 */
		public setRenderState(stageGL:StageGL, renderable:RenderableBase, animationSubGeometry:AnimationSubGeometry, animationRegisterCache:AnimationRegisterCache, camera:Camera)
		{
			// TODO: not used
			renderable = renderable;
			camera = camera;
			
			if (animationRegisterCache.needFragmentAnimation) {
				if (this._particleInitialColorNode.mode == ParticlePropertiesMode.LOCAL_STATIC) {
					var dataOffset:number /*uint*/ = this._particleInitialColorNode._iDataOffset;
					if (this._usesMultiplier) {
						animationSubGeometry.activateVertexBuffer(animationRegisterCache.getRegisterIndex(this._pAnimationNode, ParticleInitialColorNode.MULTIPLIER_INDEX), dataOffset, stageGL, ContextGLVertexBufferFormat.FLOAT_4);
						dataOffset += 4;
					}
					if (this._usesOffset)
						animationSubGeometry.activateVertexBuffer(animationRegisterCache.getRegisterIndex(this._pAnimationNode, ParticleInitialColorNode.OFFSET_INDEX), dataOffset, stageGL, ContextGLVertexBufferFormat.FLOAT_4);
				} else {
					if (this._usesMultiplier)
						animationRegisterCache.setVertexConst(animationRegisterCache.getRegisterIndex(this._pAnimationNode, ParticleInitialColorNode.MULTIPLIER_INDEX), this._multiplierData.x, this._multiplierData.y, this._multiplierData.z, this._multiplierData.w);
					if (this._usesOffset)
						animationRegisterCache.setVertexConst(animationRegisterCache.getRegisterIndex(this._pAnimationNode, ParticleInitialColorNode.OFFSET_INDEX), this._offsetData.x, this._offsetData.y, this._offsetData.z, this._offsetData.w);
				}
			}
		}
		
		private updateColorData()
		{
			if (this._particleInitialColorNode.mode == ParticlePropertiesMode.GLOBAL) {
				if (this._usesMultiplier)
					this._multiplierData = new Vector3D(this._initialColor.redMultiplier, this._initialColor.greenMultiplier, this._initialColor.blueMultiplier, this._initialColor.alphaMultiplier);
				if (this._usesOffset)
					this._offsetData = new Vector3D(this._initialColor.redOffset/255, this._initialColor.greenOffset/255, this._initialColor.blueOffset/255, this._initialColor.alphaOffset/255);
			}
		}
	
	}

}
