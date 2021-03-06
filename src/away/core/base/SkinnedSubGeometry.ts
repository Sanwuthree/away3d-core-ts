///<reference path="../../_definitions.ts"/>

/**
 * @module away.base
 */
module away.base
{
	/**
	 * SkinnedSubGeometry provides a SubGeometry extension that contains data needed to skin vertices. In particular,
	 * it provides joint indices and weights.
	 * Important! Joint indices need to be pre-multiplied by 3, since they index the matrix array (and each matrix has 3 float4 elements)
	 *
	 * @class away.base.SkinnedSubGeometry
	 *
	 */
	export class SkinnedSubGeometry extends CompactSubGeometry
	{
		private _bufferFormat:string;
		private _jointWeightsData:Array<number>;
		private _jointIndexData:Array<number>;
		private _animatedData:Array<number>; // used for cpu fallback
		private _jointWeightsBuffer:Array<away.gl.VertexBuffer> = new Array<away.gl.VertexBuffer>(8);
		private _jointIndexBuffer:Array<away.gl.VertexBuffer> = new Array<away.gl.VertexBuffer>(8);
		private _jointWeightsInvalid:Array<boolean> = new Array<boolean>(8);
		private _jointIndicesInvalid:Array<boolean> = new Array<boolean>(8);
		private _jointWeightContext:Array<away.gl.ContextGL> = new Array<away.gl.ContextGL>(8);
		private _jointIndexContext:Array<away.gl.ContextGL> = new Array<away.gl.ContextGL>(8);
		private _jointsPerVertex:number;

		private _condensedJointIndexData:Array<number>;
		private _condensedIndexLookUp:Array<number> /*uint*/; // used for linking condensed indices to the real ones
		private _numCondensedJoints:number;

		/**
		 * Creates a new SkinnedSubGeometry object.
		 * @param jointsPerVertex The amount of joints that can be assigned per vertex.
		 */
		constructor(jointsPerVertex:number)
		{
			super();

			this._jointsPerVertex = jointsPerVertex;
			this._bufferFormat = "float" + this._jointsPerVertex;
		}

		/**
		 * If indices have been condensed, this will contain the original index for each condensed index.
		 */
		public get condensedIndexLookUp():Array<number> /*uint*/
		{
			return this._condensedIndexLookUp;
		}

		/**
		 * The amount of joints used when joint indices have been condensed.
		 */
		public get numCondensedJoints():number
		{
			return this._numCondensedJoints;
		}

		/**
		 * The animated vertex positions when set explicitly if the skinning transformations couldn't be performed on GPU.
		 */
		public get animatedData():Array<number>
		{
			return this._animatedData || this._vertexData.concat();
		}

		public updateAnimatedData(value:Array<number>)
		{
			this._animatedData = value;
			this.pInvalidateBuffers(this._pVertexDataInvalid);
		}

		/**
		 * Assigns the attribute stream for joint weights
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		public activateJointWeightsBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;
			if (this._jointWeightContext[contextIndex] != context || !this._jointWeightsBuffer[contextIndex]) {
				this._jointWeightsBuffer[contextIndex] = context.createVertexBuffer(this._pNumVertices, this._jointsPerVertex);
				this._jointWeightContext[contextIndex] = context;
				this._jointWeightsInvalid[contextIndex] = true;
			}
			if (this._jointWeightsInvalid[contextIndex]) {
				this._jointWeightsBuffer[contextIndex].uploadFromArray(this._jointWeightsData, 0, this._jointWeightsData.length/this._jointsPerVertex);
				this._jointWeightsInvalid[contextIndex] = false;
			}
			context.setVertexBufferAt(index, this._jointWeightsBuffer[contextIndex], 0, this._bufferFormat);
		}

		/**
		 * Assigns the attribute stream for joint indices
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		public activateJointIndexBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;

			if (this._jointIndexContext[contextIndex] != context || !this._jointIndexBuffer[contextIndex]) {
				this._jointIndexBuffer[contextIndex] = context.createVertexBuffer(this._pNumVertices, this._jointsPerVertex);
				this._jointIndexContext[contextIndex] = context;
				this._jointIndicesInvalid[contextIndex] = true;
			}
			if (this._jointIndicesInvalid[contextIndex]) {
				this._jointIndexBuffer[contextIndex].uploadFromArray(this._numCondensedJoints > 0? this._condensedJointIndexData : this._jointIndexData, 0, this._jointIndexData.length/this._jointsPerVertex);
				this._jointIndicesInvalid[contextIndex] = false;
			}
			context.setVertexBufferAt(index, this._jointIndexBuffer[contextIndex], 0, this._bufferFormat);
		}

		public pUploadData(contextIndex:number)
		{
			if (this._animatedData) {
				this._pActiveBuffer.uploadFromArray(this._animatedData, 0, this._pNumVertices);
				this._pVertexDataInvalid[contextIndex] = this._pActiveDataInvalid = false;
			} else {
				super.pUploadData(contextIndex);
			}
		}

		/**
		 * Clones the current object.
		 * @return An exact duplicate of the current object.
		 */
		public clone():ISubGeometry
		{
			var clone:SkinnedSubGeometry = new SkinnedSubGeometry(this._jointsPerVertex);

			clone.updateData(this._vertexData.concat());
			clone.updateIndexData(this._indices.concat());
			clone.iUpdateJointIndexData(this._jointIndexData.concat());
			clone.iUpdateJointWeightsData(this._jointWeightsData.concat());
			clone._autoDeriveVertexNormals = this._autoDeriveVertexNormals;
			clone._autoDeriveVertexTangents = this._autoDeriveVertexTangents;
			clone._numCondensedJoints = this._numCondensedJoints;
			clone._condensedIndexLookUp = this._condensedIndexLookUp;
			clone._condensedJointIndexData = this._condensedJointIndexData;

			return clone;
		}

		/**
		 * Cleans up any resources used by this object.
		 */
		public dispose()
		{
			super.dispose();
			this.pDisposeVertexBuffers(this._jointWeightsBuffer);
			this.pDisposeVertexBuffers(this._jointIndexBuffer);
		}

		/**
		 */
		public iCondenseIndexData()
		{
			var len:number = this._jointIndexData.length;
			var oldIndex:number;
			var newIndex:number = 0;
			var dic:Object = new Object();

			this._condensedJointIndexData = new Array<number>(len);
			this._condensedIndexLookUp = new Array<number>();

			for (var i:number = 0; i < len; ++i) {
				oldIndex = this._jointIndexData[i];

				// if we encounter a new index, assign it a new condensed index
				if (dic[oldIndex] == undefined) {
					dic[oldIndex] = newIndex;
					this._condensedIndexLookUp[newIndex++] = oldIndex;
					this._condensedIndexLookUp[newIndex++] = oldIndex + 1;
					this._condensedIndexLookUp[newIndex++] = oldIndex + 2;
				}
				this._condensedJointIndexData[i] = dic[oldIndex];
			}
			this._numCondensedJoints = newIndex/3;

			this.pInvalidateBuffers(this._jointIndicesInvalid);
		}

		/**
		 * The raw joint weights data.
		 */
		public get iJointWeightsData():Array<number>
		{
			return this._jointWeightsData;
		}

		public iUpdateJointWeightsData(value:Array<number>)
		{
			// invalidate condensed stuff
			this._numCondensedJoints = 0;
			this._condensedIndexLookUp = null;
			this._condensedJointIndexData = null;

			this._jointWeightsData = value;
			this.pInvalidateBuffers(this._jointWeightsInvalid);
		}

		/**
		 * The raw joint index data.
		 */
		public get iJointIndexData():Array<number>
		{
			return this._jointIndexData;
		}

		public iUpdateJointIndexData(value:Array<number>)
		{
			this._jointIndexData = value;
			this.pInvalidateBuffers(this._jointIndicesInvalid);
		}
	}
}
