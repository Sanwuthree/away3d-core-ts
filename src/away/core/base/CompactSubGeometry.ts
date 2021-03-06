///<reference path="../../_definitions.ts"/>

/**
 * @module away.base
 */
module away.base
{
	/**
	 * @class away.base.CompactSubGeometry
	 */
	export class CompactSubGeometry extends SubGeometryBase implements ISubGeometry
	{
		public _pVertexDataInvalid:boolean[] = Array<boolean>(8);
		private _vertexBuffer:away.gl.VertexBuffer[] = new Array<away.gl.VertexBuffer>(8);
		private _bufferContext:away.gl.ContextGL[] = new Array<away.gl.ContextGL>(8);
		public _pNumVertices:number;
		private _contextIndex:number;
		public _pActiveBuffer:away.gl.VertexBuffer;
		private _activeContext:away.gl.ContextGL;
		public _pActiveDataInvalid:boolean;
		private _isolatedVertexPositionData:Array<number>;
		private _isolatedVertexPositionDataDirty:boolean;

		constructor()
		{
			super();

			this._autoDeriveVertexNormals = false;
			this._autoDeriveVertexTangents = false;
		}

		public get numVertices():number
		{
			return this._pNumVertices;
		}

		/**
		 * Updates the vertex data. All vertex properties are contained in a single Vector, and the order is as follows:
		 * 0 - 2: vertex position X, Y, Z
		 * 3 - 5: normal X, Y, Z
		 * 6 - 8: tangent X, Y, Z
		 * 9 - 10: U V
		 * 11 - 12: Secondary U V
		 */
		public updateData(data:Array<number>)
		{
			if (this._autoDeriveVertexNormals) {
				this._vertexNormalsDirty = true;
			}

			if (this._autoDeriveVertexTangents) {
				this._vertexTangentsDirty = true;
			}

			this._faceNormalsDirty = true;
			this._faceTangentsDirty = true;
			this._isolatedVertexPositionDataDirty = true;
			this._vertexData = data;

			var numVertices:number = this._vertexData.length/13;

			if (numVertices != this._pNumVertices) {
				this.pDisposeVertexBuffers(this._vertexBuffer);
			}

			this._pNumVertices = numVertices;

			if (this._pNumVertices == 0) {
				throw new Error("Bad data: geometry can't have zero triangles");
			}

			this.pInvalidateBuffers(this._pVertexDataInvalid);
			this.pInvalidateBounds();

		}

		public activateVertexBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;

			if (contextIndex != this._contextIndex) {
				this.pUpdateActiveBuffer(contextIndex);
			}

			if (!this._pActiveBuffer || this._activeContext != context) {
				this.pCreateBuffer(contextIndex, context);
			}

			if (this._pActiveDataInvalid) {
				this.pUploadData(contextIndex);
			}

			context.setVertexBufferAt(index, this._pActiveBuffer, 0, away.gl.ContextGLVertexBufferFormat.FLOAT_3);

		}

		public activateUVBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;

			if (this._uvsDirty && this._autoGenerateUVs) {
				this._vertexData = this.pUpdateDummyUVs(this._vertexData);
				this.pInvalidateBuffers(this._pVertexDataInvalid);
			}

			if (contextIndex != this._contextIndex) {
				this.pUpdateActiveBuffer(contextIndex);

			}

			if (!this._pActiveBuffer || this._activeContext != context) {
				this.pCreateBuffer(contextIndex, context);
			}

			if (this._pActiveDataInvalid) {
				this.pUploadData(contextIndex);
			}

			context.setVertexBufferAt(index, this._pActiveBuffer, 9, away.gl.ContextGLVertexBufferFormat.FLOAT_2);

		}

		public activateSecondaryUVBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;

			if (contextIndex != this._contextIndex) {
				this.pUpdateActiveBuffer(contextIndex);
			}

			if (!this._pActiveBuffer || this._activeContext != context) {
				this.pCreateBuffer(contextIndex, context);
			}

			if (this._pActiveDataInvalid) {
				this.pUploadData(contextIndex);
			}

			context.setVertexBufferAt(index, this._pActiveBuffer, 11, away.gl.ContextGLVertexBufferFormat.FLOAT_2);

		}

		public pUploadData(contextIndex:number)
		{
			this._pActiveBuffer.uploadFromArray(this._vertexData, 0, this._pNumVertices);
			this._pVertexDataInvalid[contextIndex] = this._pActiveDataInvalid = false;
		}

		public activateVertexNormalBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;

			if (contextIndex != this._contextIndex) {
				this.pUpdateActiveBuffer(contextIndex);
			}

			if (!this._pActiveBuffer || this._activeContext != context) {
				this.pCreateBuffer(contextIndex, context);
			}

			if (this._pActiveDataInvalid) {
				this.pUploadData(contextIndex);
			}

			context.setVertexBufferAt(index, this._pActiveBuffer, 3, away.gl.ContextGLVertexBufferFormat.FLOAT_3);

		}

		public activateVertexTangentBuffer(index:number, stageGL:away.base.StageGL)
		{
			var contextIndex:number = stageGL._iStageGLIndex;
			var context:away.gl.ContextGL = stageGL.contextGL;

			if (contextIndex != this._contextIndex) {
				this.pUpdateActiveBuffer(contextIndex);
			}

			if (!this._pActiveBuffer || this._activeContext != context) {
				this.pCreateBuffer(contextIndex, context);
			}

			if (this._pActiveDataInvalid) {
				this.pUploadData(contextIndex);
			}


			context.setVertexBufferAt(index, this._pActiveBuffer, 6, away.gl.ContextGLVertexBufferFormat.FLOAT_3);

		}

		public pCreateBuffer(contextIndex:number, context:away.gl.ContextGL)
		{
			this._vertexBuffer[contextIndex] = this._pActiveBuffer = context.createVertexBuffer(this._pNumVertices, 13);
			this._bufferContext[contextIndex] = this._activeContext = context;
			this._pVertexDataInvalid[contextIndex] = this._pActiveDataInvalid = true;
		}

		public pUpdateActiveBuffer(contextIndex:number)
		{
			this._contextIndex = contextIndex;
			this._pActiveDataInvalid = this._pVertexDataInvalid[contextIndex];
			this._pActiveBuffer = this._vertexBuffer[contextIndex];
			this._activeContext = this._bufferContext[contextIndex];
		}

		public get vertexData():Array<number>
		{
			if (this._autoDeriveVertexNormals && this._vertexNormalsDirty) {
				this._vertexData = this.pUpdateVertexNormals(this._vertexData);
			}

			if (this._autoDeriveVertexTangents && this._vertexTangentsDirty) {
				this._vertexData = this.pUpdateVertexTangents(this._vertexData);
			}

			if (this._uvsDirty && this._autoGenerateUVs) {
				this._vertexData = this.pUpdateDummyUVs(this._vertexData);
			}

			return this._vertexData;
		}

		public pUpdateVertexNormals(target:Array<number>):Array<number>
		{
			this.pInvalidateBuffers(this._pVertexDataInvalid);
			return super.pUpdateVertexNormals(target);
		}

		public pUpdateVertexTangents(target:Array<number>):Array<number>
		{
			if (this._vertexNormalsDirty) {
				this._vertexData = this.pUpdateVertexNormals(this._vertexData);
			}

			this.pInvalidateBuffers(this._pVertexDataInvalid);

			return super.pUpdateVertexTangents(target);

		}

		public get vertexNormalData():Array<number>
		{
			if (this._autoDeriveVertexNormals && this._vertexNormalsDirty) {
				this._vertexData = this.pUpdateVertexNormals(this._vertexData);
			}

			return this._vertexData;

		}

		public get vertexTangentData():Array<number>
		{
			if (this._autoDeriveVertexTangents && this._vertexTangentsDirty) {
				this._vertexData = this.pUpdateVertexTangents(this._vertexData);
			}

			return this._vertexData;
		}

		public get UVData():Array<number>
		{
			if (this._uvsDirty && this._autoGenerateUVs) {
				this._vertexData = this.pUpdateDummyUVs(this._vertexData);
				this.pInvalidateBuffers(this._pVertexDataInvalid);
			}

			return this._vertexData;
		}

		public applyTransformation(transform:away.geom.Matrix3D)
		{
			super.applyTransformation(transform);
			this.pInvalidateBuffers(this._pVertexDataInvalid);
		}

		public scale(scale:number)
		{
			super.scale(scale);
			this.pInvalidateBuffers(this._pVertexDataInvalid);
		}

		public clone():ISubGeometry
		{
			var clone:CompactSubGeometry = new CompactSubGeometry();

			clone._autoDeriveVertexNormals = this._autoDeriveVertexNormals;
			clone._autoDeriveVertexTangents = this._autoDeriveVertexTangents;

			clone.updateData(this._vertexData.concat());
			clone.updateIndexData(this._indices.concat());

			return clone;
		}

		public scaleUV(scaleU:number = 1, scaleV:number = 1)
		{

			super.scaleUV(scaleU, scaleV);

			this.pInvalidateBuffers(this._pVertexDataInvalid);

		}

		public get vertexStride():number
		{
			return 13;
		}

		public get vertexNormalStride():number
		{
			return 13;
		}

		public get vertexTangentStride():number
		{
			return 13;
		}

		public get UVStride():number
		{
			return 13;
		}

		public get secondaryUVStride():number
		{
			return 13;
		}

		public get vertexOffset():number
		{
			return 0;
		}

		public get vertexNormalOffset():number
		{
			return 3;
		}

		public get vertexTangentOffset():number
		{
			return 6;
		}

		public get UVOffset():number
		{
			return 9;
		}

		public get secondaryUVOffset():number
		{
			return 11;
		}

		public dispose()
		{
			super.dispose();
			this.pDisposeVertexBuffers(this._vertexBuffer);
			this._vertexBuffer = null;
		}

		public pDisposeVertexBuffers(buffers:Array<away.gl.VertexBuffer>)
		{

			super.pDisposeVertexBuffers(buffers);
			this._pActiveBuffer = null;

		}

		public pInvalidateBuffers(invalid:Array<boolean>)
		{
			super.pInvalidateBuffers(invalid);
			this._pActiveDataInvalid = true;
		}

		public cloneWithSeperateBuffers():SubGeometry
		{
			var clone:SubGeometry = new SubGeometry();

			clone.updateVertexData(this._isolatedVertexPositionData? this._isolatedVertexPositionData : this._isolatedVertexPositionData = this.stripBuffer(0, 3));
			clone.autoDeriveVertexNormals = this._autoDeriveVertexNormals;
			clone.autoDeriveVertexTangents = this._autoDeriveVertexTangents;

			if (!this._autoDeriveVertexNormals) {
				clone.updateVertexNormalData(this.stripBuffer(3, 3));
			}

			if (!this._autoDeriveVertexTangents) {
				clone.updateVertexTangentData(this.stripBuffer(6, 3));
			}

			clone.updateUVData(this.stripBuffer(9, 2));
			clone.updateSecondaryUVData(this.stripBuffer(11, 2));
			clone.updateIndexData(this.indexData.concat());

			return clone;

		}

		public get vertexPositionData():Array<number>
		{
			if (this._isolatedVertexPositionDataDirty || !this._isolatedVertexPositionData) {
				this._isolatedVertexPositionData = this.stripBuffer(0, 3);
				this._isolatedVertexPositionDataDirty = false;
			}

			return this._isolatedVertexPositionData;

		}

		public get strippedUVData():Array<number>
		{
			return this.stripBuffer(9, 2);
		}

		/**
		 * Isolate and returns a Vector.Number of a specific buffer type
		 *
		 * - stripBuffer(0, 3), return only the vertices
		 * - stripBuffer(3, 3): return only the normals
		 * - stripBuffer(6, 3): return only the tangents
		 * - stripBuffer(9, 2): return only the uv's
		 * - stripBuffer(11, 2): return only the secondary uv's
		 */
		public stripBuffer(offset:number, numEntries:number):Array<number>
		{
			var data:number[] = new Array<number>(this._pNumVertices*numEntries);
			var i:number = 0;
			var j:number = offset;
			var skip:number = 13 - numEntries;

			for (var v:number = 0; v < this._pNumVertices; ++v) {
				for (var k:number = 0; k < numEntries; ++k) {
					data[i++] = this._vertexData[j++];
				}

				j += skip;

			}

			return data;

		}

		public fromVectors(verts:Array<number>, uvs:Array<number>, normals:Array<number>, tangents:Array<number>)
		{
			var vertLen:number = verts.length/3*13;

			var index:number = 0;
			var v:number = 0;
			var n:number = 0;
			var t:number = 0;
			var u:number = 0;

			var data:number[] = new Array<number>(vertLen);

			while (index < vertLen) {

				data[index++] = verts[v++];
				data[index++] = verts[v++];
				data[index++] = verts[v++];

				if (normals && normals.length) {
					data[index++] = normals[n++];
					data[index++] = normals[n++];
					data[index++] = normals[n++];
				} else {
					data[index++] = 0;
					data[index++] = 0;
					data[index++] = 0;
				}

				if (tangents && tangents.length) {
					data[index++] = tangents[t++];
					data[index++] = tangents[t++];
					data[index++] = tangents[t++];
				} else {
					data[index++] = 0;
					data[index++] = 0;
					data[index++] = 0;
				}

				if (uvs && uvs.length) {
					data[index++] = uvs[u];
					data[index++] = uvs[u + 1];
					// use same secondary uvs as primary
					data[index++] = uvs[u++];
					data[index++] = uvs[u++];
				} else {
					data[index++] = 0;
					data[index++] = 0;
					data[index++] = 0;
					data[index++] = 0;
				}
			}

			this.autoDeriveVertexNormals = !(normals && normals.length);
			this.autoDeriveVertexTangents = !(tangents && tangents.length);
			this.autoGenerateDummyUVs = !(uvs && uvs.length);
			this.updateData(data);

		}
	}
}
