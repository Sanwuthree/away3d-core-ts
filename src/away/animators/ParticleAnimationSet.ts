///<reference path="../_definitions.ts"/>

module away.animators
{
	import ISubGeometry			= away.base.ISubGeometry;
	import ParticleGeometry		= away.base.ParticleGeometry;
	import SubMesh				= away.base.SubMesh;
	import ContextGL			= away.gl.ContextGL;
	import Mesh					= away.entities.Mesh;
	import StageGL				= away.base.StageGL;
	import MaterialPassBase		= away.materials.MaterialPassBase;
	
	/**
	 * The animation data set used by particle-based animators, containing particle animation data.
	 *
	 * @see away.animators.ParticleAnimator
	 */
	export class ParticleAnimationSet extends AnimationSetBase implements IAnimationSet
	{
		/** @private */
		public _iAnimationRegisterCache:AnimationRegisterCache;
		
		//all other nodes dependent on it
		private _timeNode:ParticleTimeNode;
		
		/**
		 * Property used by particle nodes that require compilation at the end of the shader
		 */
		public static POST_PRIORITY:number /*int*/ = 9;
		
		/**
		 * Property used by particle nodes that require color compilation
		 */
		public static COLOR_PRIORITY:number /*int*/ = 18;
		
		private _animationSubGeometries:Object = new Object();
		private _particleNodes:Array<ParticleNodeBase> = new Array<ParticleNodeBase>();
		private _localDynamicNodes:Array<ParticleNodeBase> = new Array<ParticleNodeBase>();
		private _localStaticNodes:Array<ParticleNodeBase> = new Array<ParticleNodeBase>();
		private _totalLenOfOneVertex:number /*int*/ = 0;
		
		//set true if has an node which will change UV
		public hasUVNode:boolean;
		//set if the other nodes need to access the velocity
		public needVelocity:boolean;
		//set if has a billboard node.
		public hasBillboard:boolean;
		//set if has an node which will apply color multiple operation
		public hasColorMulNode:boolean;
		//set if has an node which will apply color add operation
		public hasColorAddNode:boolean;
		
		/**
		 * Initialiser function for static particle properties. Needs to reference a with teh following format
		 *
		 * <code>
		 * initParticleFunc(prop:ParticleProperties)
		 * {
		 * 		//code for settings local properties
		 * }
		 * </code>
		 *
		 * Aside from setting any properties required in particle animation nodes using local static properties, the initParticleFunc function
		 * is required to time node requirements as they may be needed. These properties on the ParticleProperties object can include
		 * <code>startTime</code>, <code>duration</code> and <code>delay</code>. The use of these properties is determined by the setting
		 * arguments passed in the constructor of the particle animation set. By default, only the <code>startTime</code> property is required.
		 */
		public initParticleFunc:Function;

		/**
		 * Initialiser function scope for static particle properties
		 */
		public initParticleScope:Object;

		/**
		 * Creates a new <code>ParticleAnimationSet</code>
		 *
		 * @param    [optional] usesDuration    Defines whether the animation set uses the <code>duration</code> data in its static properties to determine how long a particle is visible for. Defaults to false.
		 * @param    [optional] usesLooping     Defines whether the animation set uses a looping timeframe for each particle determined by the <code>startTime</code>, <code>duration</code> and <code>delay</code> data in its static properties function. Defaults to false. Requires <code>usesDuration</code> to be true.
		 * @param    [optional] usesDelay       Defines whether the animation set uses the <code>delay</code> data in its static properties to determine how long a particle is hidden for. Defaults to false. Requires <code>usesLooping</code> to be true.
		 */
		constructor(usesDuration:boolean = false, usesLooping:boolean = false, usesDelay:boolean = false)
		{
			super();

			//automatically add a particle time node to the set
			this.addAnimation(this._timeNode = new ParticleTimeNode(usesDuration, usesLooping, usesDelay));
		}
		
		/**
		 * Returns a vector of the particle animation nodes contained within the set.
		 */
		public get particleNodes():Array<ParticleNodeBase>
		{
			return this._particleNodes;
		}
		
		/**
		 * @inheritDoc
		 */
		public addAnimation(node:AnimationNodeBase)
		{
			var i:number /*int*/;
			var n:ParticleNodeBase = <ParticleNodeBase> node;
			n._iProcessAnimationSetting(this);
			if (n.mode == ParticlePropertiesMode.LOCAL_STATIC) {
				n._iDataOffset = this._totalLenOfOneVertex;
				this._totalLenOfOneVertex += n.dataLength;
				this._localStaticNodes.push(n);
			} else if (n.mode == ParticlePropertiesMode.LOCAL_DYNAMIC)
				this._localDynamicNodes.push(n);
			
			for (i = this._particleNodes.length - 1; i >= 0; i--) {
				if (this._particleNodes[i].priority <= n.priority)
					break;
			}

			this._particleNodes.splice(i + 1, 0, n);
			
			super.addAnimation(node);
		}
		
		/**
		 * @inheritDoc
		 */
		public activate(stageGL:StageGL, pass:MaterialPassBase)
		{
			this._iAnimationRegisterCache = pass.animationRegisterCache;
		}
		
		/**
		 * @inheritDoc
		 */
		public deactivate(stageGL:StageGL, pass:MaterialPassBase)
		{
			var context:ContextGL = stageGL.contextGL;
			var offset:number /*int*/ = this._iAnimationRegisterCache.vertexAttributesOffset;
			var used:number /*int*/ = this._iAnimationRegisterCache.numUsedStreams;
			for (var i:number /*int*/ = offset; i < used; i++)
				context.setVertexBufferAt(i, null);
		}
		
		/**
		 * @inheritDoc
		 */
		public getAGALVertexCode(pass:MaterialPassBase, sourceRegisters:Array<string>, targetRegisters:Array<string>, profile:string):string
		{
			//grab animationRegisterCache from the materialpassbase or create a new one if the first time
			this._iAnimationRegisterCache = pass.animationRegisterCache;

			if (this._iAnimationRegisterCache == null)
				this._iAnimationRegisterCache = pass.animationRegisterCache = new AnimationRegisterCache(profile);
			
			//reset animationRegisterCache
			this._iAnimationRegisterCache.vertexConstantOffset = pass.numUsedVertexConstants;
			this._iAnimationRegisterCache.vertexAttributesOffset = pass.numUsedStreams;
			this._iAnimationRegisterCache.varyingsOffset = pass.numUsedVaryings;
			this._iAnimationRegisterCache.fragmentConstantOffset = pass.numUsedFragmentConstants;
			this._iAnimationRegisterCache.hasUVNode = this.hasUVNode;
			this._iAnimationRegisterCache.needVelocity = this.needVelocity;
			this._iAnimationRegisterCache.hasBillboard = this.hasBillboard;
			this._iAnimationRegisterCache.sourceRegisters = sourceRegisters;
			this._iAnimationRegisterCache.targetRegisters = targetRegisters;
			this._iAnimationRegisterCache.needFragmentAnimation = pass.needFragmentAnimation;
			this._iAnimationRegisterCache.needUVAnimation = pass.needUVAnimation;
			this._iAnimationRegisterCache.hasColorAddNode = this.hasColorAddNode;
			this._iAnimationRegisterCache.hasColorMulNode = this.hasColorMulNode;
			this._iAnimationRegisterCache.reset();
			
			var code:string = "";
			
			code += this._iAnimationRegisterCache.getInitCode();
			
			var node:ParticleNodeBase;
			var i:number /*int*/;

			for (i = 0; i < this._particleNodes.length; i++) {
				node = this._particleNodes[i];
				if (node.priority < ParticleAnimationSet.POST_PRIORITY)
					code += node.getAGALVertexCode(pass, this._iAnimationRegisterCache);
			}
			
			code += this._iAnimationRegisterCache.getCombinationCode();

			for (i = 0; i < this._particleNodes.length; i++) {
				node = this._particleNodes[i];
				if (node.priority >= ParticleAnimationSet.POST_PRIORITY && node.priority < ParticleAnimationSet.COLOR_PRIORITY)
					code += node.getAGALVertexCode(pass, this._iAnimationRegisterCache);
			}
			
			code += this._iAnimationRegisterCache.initColorRegisters();

			for (i = 0; i < this._particleNodes.length; i++) {
				node = this._particleNodes[i];
				if (node.priority >= ParticleAnimationSet.COLOR_PRIORITY)
					code += node.getAGALVertexCode(pass, this._iAnimationRegisterCache);
			}
			code += this._iAnimationRegisterCache.getColorPassCode();
			return code;
		}
		
		/**
		 * @inheritDoc
		 */
		public getAGALUVCode(pass:MaterialPassBase, UVSource:string, UVTarget:string):string
		{
			var code:string = "";
			if (this.hasUVNode) {
				this._iAnimationRegisterCache.setUVSourceAndTarget(UVSource, UVTarget);
				code += "mov " + this._iAnimationRegisterCache.uvTarget + ".xy," + this._iAnimationRegisterCache.uvAttribute.toString() + "\n";
				var node:ParticleNodeBase;
				for (var i:number /*uint*/ = 0; i < this._particleNodes.length; i++)
					node = this._particleNodes[i];
					code += node.getAGALUVCode(pass, this._iAnimationRegisterCache);
				code += "mov " + this._iAnimationRegisterCache.uvVar.toString() + "," + this._iAnimationRegisterCache.uvTarget + ".xy\n";
			} else
				code += "mov " + UVTarget + "," + UVSource + "\n";
			return code;
		}
		
		/**
		 * @inheritDoc
		 */
		public getAGALFragmentCode(pass:MaterialPassBase, shadedTarget:string, profile:string):string
		{
			return this._iAnimationRegisterCache.getColorCombinationCode(shadedTarget);
		}
		
		/**
		 * @inheritDoc
		 */
		public doneAGALCode(pass:MaterialPassBase)
		{
			this._iAnimationRegisterCache.setDataLength();
			
			//set vertexZeroConst,vertexOneConst,vertexTwoConst
			this._iAnimationRegisterCache.setVertexConst(this._iAnimationRegisterCache.vertexZeroConst.index, 0, 1, 2, 0);
		}
		
		/**
		 * @inheritDoc
		 */
		public get usesCPU():boolean
		{
			return false;
		}
		
		/**
		 * @inheritDoc
		 */
		public cancelGPUCompatibility()
		{
		
		}
		
		public dispose()
		{
			for (var key in this._animationSubGeometries)
				(<AnimationSubGeometry> this._animationSubGeometries[key]).dispose();
			
			super.dispose();
		}
		
		/** @private */
		public _iGenerateAnimationSubGeometries(mesh:Mesh)
		{
			if (this.initParticleFunc == null)
				throw(new Error("no initParticleFunc set"));
			
			var geometry:ParticleGeometry = <ParticleGeometry> mesh.geometry;
			
			if (!geometry)
				throw(new Error("Particle animation can only be performed on a ParticleGeometry object"));
			
			var i:number /*int*/, j:number /*int*/, k:number /*int*/;
			var animationSubGeometry:AnimationSubGeometry;
			var newAnimationSubGeometry:boolean = false;
			var subGeometry:ISubGeometry;
			var subMesh:SubMesh;
			var localNode:ParticleNodeBase;
			
			for (i = 0; i < mesh.subMeshes.length; i++) {
				subMesh = mesh.subMeshes[i];
				subGeometry = subMesh.subGeometry;
				if (mesh.shareAnimationGeometry) {
					animationSubGeometry = this._animationSubGeometries[subGeometry.id];
					
					if (animationSubGeometry) {
						subMesh.animationSubGeometry = animationSubGeometry;
						continue;
					}
				}
				
				animationSubGeometry = subMesh.animationSubGeometry = new AnimationSubGeometry();
				if (mesh.shareAnimationGeometry)
					this._animationSubGeometries[subGeometry.id] = animationSubGeometry;
				
				newAnimationSubGeometry = true;
				
				//create the vertexData vector that will be used for local node data
				animationSubGeometry.createVertexData(subGeometry.numVertices, this._totalLenOfOneVertex);
			}
			
			if (!newAnimationSubGeometry)
				return;
			
			var particles:Array<ParticleData> = geometry.particles;
			var particlesLength:number /*uint*/ = particles.length;
			var numParticles:number /*uint*/ = geometry.numParticles;
			var particleProperties:ParticleProperties = new ParticleProperties();
			var particle:ParticleData;
			
			var oneDataLen:number /*int*/;
			var oneDataOffset:number /*int*/;
			var counterForVertex:number /*int*/;
			var counterForOneData:number /*int*/;
			var oneData:Array<Number>;
			var numVertices:number /*uint*/;
			var vertexData:Array<Number>;
			var vertexLength:number /*uint*/;
			var startingOffset:number /*uint*/;
			var vertexOffset:number /*uint*/;
			
			//default values for particle param
			particleProperties.total = numParticles;
			particleProperties.startTime = 0;
			particleProperties.duration = 1000;
			particleProperties.delay = 0.1;
			
			i = 0;
			j = 0;
			while (i < numParticles) {
				particleProperties.index = i;
				
				//call the init on the particle parameters
				this.initParticleFunc.call(this.initParticleScope, particleProperties);
				
				//create the next set of node properties for the particle
				for (k = 0; k < this._localStaticNodes.length; k++)
					this._localStaticNodes[k]._iGeneratePropertyOfOneParticle(particleProperties);
				
				//loop through all particle data for the curent particle
				while (j < particlesLength && (particle = particles[j]).particleIndex == i) {
					//find the target animationSubGeometry
					for (k = 0; k < mesh.subMeshes.length; k++) {
						subMesh = mesh.subMeshes[k];
						if (subMesh.subGeometry == particle.subGeometry) {
							animationSubGeometry = subMesh.animationSubGeometry;
							break;
						}
					}
					numVertices = particle.numVertices;
					vertexData = animationSubGeometry.vertexData;
					vertexLength = numVertices*this._totalLenOfOneVertex;
					startingOffset = animationSubGeometry.numProcessedVertices*this._totalLenOfOneVertex;
					
					//loop through each static local node in the animation set
					for (k = 0; k < this._localStaticNodes.length; k++) {
						localNode = this._localStaticNodes[k];
						oneData = localNode.oneData;
						oneDataLen = localNode.dataLength;
						oneDataOffset = startingOffset + localNode._iDataOffset;
						
						//loop through each vertex set in the vertex data
						for (counterForVertex = 0; counterForVertex < vertexLength; counterForVertex += this._totalLenOfOneVertex) {
							vertexOffset = oneDataOffset + counterForVertex;
							
							//add the data for the local node to the vertex data
							for (counterForOneData = 0; counterForOneData < oneDataLen; counterForOneData++)
								vertexData[vertexOffset + counterForOneData] = oneData[counterForOneData];
						}
						
					}
					
					//store particle properties if they need to be retreived for dynamic local nodes
					if (this._localDynamicNodes.length)
						animationSubGeometry.animationParticles.push(new ParticleAnimationData(i, particleProperties.startTime, particleProperties.duration, particleProperties.delay, particle));
					
					animationSubGeometry.numProcessedVertices += numVertices;
					
					//next index
					j++;
				}
				
				//next particle
				i++;
			}
		}
	}
}
