///<reference path="../../_definitions.ts"/>
/**
 * @module away.base
 */
module away.base
{
	/**
	 * @class away.base.SubGeometryBase
	 */
	export class SubGeometryBase
	{
		public static SUBGEOM_ID_COUNT:number = 0;

		public _parentGeometry:away.base.Geometry;
		public _vertexData:number[];

		public _faceNormalsDirty:boolean = true;
		public _faceTangentsDirty:boolean = true;
		public _faceTangents:number[];
		public _indices:number[] /*uint*/;
		public _indexBuffer:away.display3D.IndexBuffer3D[] = new Array<away.display3D.IndexBuffer3D>(8);//Vector.<IndexBuffer3D> = new Vector.<IndexBuffer3D>(8);
		public _numIndices:number;
		public _indexBufferContext:away.display3D.Context3D[] = new Array<away.display3D.Context3D>(8);//Vector.<Context3D> = new Vector.<Context3D>(8);
		public _indicesInvalid:boolean[] = new Array<boolean>(8);//new Vector.<Boolean>(8, true);
		public _numTriangles:number;

		public _autoDeriveVertexNormals:boolean = true;
		public _autoDeriveVertexTangents:boolean = true;
		public _autoGenerateUVs:boolean = false;
		public _useFaceWeights:boolean = false;
		public _vertexNormalsDirty:boolean = true;
		public _vertexTangentsDirty:boolean = true;

		public _faceNormals:number[];
		public _faceWeights:number[];
		public _scaleU:number = 1;
		public _scaleV:number = 1;
		public _uvsDirty:boolean = true;

		/**
		 * An id for this subgeometry, used to identify subgeometries when using animation sets.
		 *
		 * @private
		 */
		public _iUniqueId:number;//Arcane

		constructor()
		{
			this._iUniqueId = SubGeometryBase.SUBGEOM_ID_COUNT++;
		}

		/**
		 * Defines whether a UV buffer should be automatically generated to contain dummy UV coordinates.
		 * Set to true if a geometry lacks UV data but uses a material that requires it, or leave as false
		 * in cases where UV data is explicitly defined or the material does not require UV data.
		 */
		public get autoGenerateDummyUVs():boolean
		{
			return this._autoGenerateUVs;
		}

		public set autoGenerateDummyUVs(value:boolean)
		{
			this._autoGenerateUVs = value;
			this._uvsDirty = value;
		}

		/**
		 * True if the vertex normals should be derived from the geometry, false if the vertex normals are set
		 * explicitly.
		 */
		public get autoDeriveVertexNormals():boolean
		{
			return this._autoDeriveVertexNormals;
		}

		public set autoDeriveVertexNormals(value:boolean)
		{
			this._autoDeriveVertexNormals = value;
			this._vertexNormalsDirty = value;
		}

		/**
		 * Indicates whether or not to take the size of faces into account when auto-deriving vertex normals and tangents.
		 */
		public get useFaceWeights():boolean
		{
			return this._useFaceWeights;
		}

		public set useFaceWeights(value:boolean)
		{

			this._useFaceWeights = value;

			if (this._autoDeriveVertexNormals) {
				this._vertexNormalsDirty = true;
			}

			if (this._autoDeriveVertexTangents) {
				this._vertexTangentsDirty = true;
			}

			this._faceNormalsDirty = true;

		}

		/**
		 * The total amount of triangles in the SubGeometry.
		 */
		public get numTriangles():number
		{
			return this._numTriangles;
		}

		/**
		 * Unique identifier for a subgeometry
		 */
		public get uniqueId():number
		{
			return this._iUniqueId;
		}

		/**
		 * Retrieves the VertexBuffer3D object that contains triangle indices.
		 * @param context The Context3D for which we request the buffer
		 * @return The VertexBuffer3D object that contains triangle indices.
		 */
		public getIndexBuffer(stage3DProxy:away.managers.Stage3DProxy):away.display3D.IndexBuffer3D
		{
			var contextIndex:number = stage3DProxy._iStage3DIndex;//_stage3DIndex;
			var context:away.display3D.Context3D = stage3DProxy._iContext3D;//_context3D;

			if (!this._indexBuffer[contextIndex] || this._indexBufferContext[contextIndex] != context) {
				this._indexBuffer[contextIndex] = context.createIndexBuffer(this._numIndices);
				this._indexBufferContext[contextIndex] = context;
				this._indicesInvalid[contextIndex] = true;
			}

			if (this._indicesInvalid[contextIndex]) {
				this._indexBuffer[contextIndex].uploadFromArray(this._indices, 0, this._numIndices);
				this._indicesInvalid[contextIndex] = false;
			}

			return this._indexBuffer[contextIndex];
		}

		/**
		 * Updates the tangents for each face.
		 */
		public pUpdateFaceTangents()
		{
			var i:number = 0;
			var index1:number;
			var index2:number;
			var index3:number;
			var len:number = this._indices.length;
			var ui:number;
			var vi:number;
			var v0:number;
			var dv1:number;
			var dv2:number;
			var denom:number;
			var x0:number, y0:number, z0:number;
			var dx1:number, dy1:number, dz1:number;
			var dx2:number, dy2:number, dz2:number;
			var cx:number, cy:number, cz:number;
			var vertices:number[] = this._vertexData;
			var uvs:number[] = this.UVData;
			var posStride:number = this.vertexStride;
			var posOffset:number = this.vertexOffset;
			var texStride:number = this.UVStride;
			var texOffset:number = this.UVOffset;

			if (this._faceTangents == null) {
				this._faceTangents = new Array<number>(this._indices.length); //||= new Vector.<Number>(_indices.length, true);
			}

			while (i < len) {
				index1 = this._indices[i];
				index2 = this._indices[i + 1];
				index3 = this._indices[i + 2];

				ui = texOffset + index1*texStride + 1;
				v0 = uvs[ui];
				ui = texOffset + index2*texStride + 1;
				dv1 = uvs[ui] - v0;
				ui = texOffset + index3*texStride + 1;
				dv2 = uvs[ui] - v0;

				vi = posOffset + index1*posStride;
				x0 = vertices[vi];
				y0 = vertices[(vi + 1)];
				z0 = vertices[(vi + 2)];
				vi = posOffset + index2*posStride;
				dx1 = vertices[(vi)] - x0;
				dy1 = vertices[(vi + 1)] - y0;
				dz1 = vertices[(vi + 2)] - z0;
				vi = posOffset + index3*posStride;
				dx2 = vertices[(vi)] - x0;
				dy2 = vertices[(vi + 1)] - y0;
				dz2 = vertices[(vi + 2)] - z0;

				cx = dv2*dx1 - dv1*dx2;
				cy = dv2*dy1 - dv1*dy2;
				cz = dv2*dz1 - dv1*dz2;
				denom = 1/Math.sqrt(cx*cx + cy*cy + cz*cz);

				this._faceTangents[i++] = denom*cx;
				this._faceTangents[i++] = denom*cy;
				this._faceTangents[i++] = denom*cz;
			}

			this._faceTangentsDirty = false;

		}

		/**
		 * Updates the normals for each face.
		 */
		private updateFaceNormals()
		{
			var i:number = 0;
			var j:number = 0;
			var k:number = 0;
			var index:number;

			var len:number = this._indices.length;
			var x1:number, x2:number, x3:number;
			var y1:number, y2:number, y3:number;
			var z1:number, z2:number, z3:number;
			var dx1:number, dy1:number, dz1:number;
			var dx2:number, dy2:number, dz2:number;
			var cx:number, cy:number, cz:number;
			var d:number;
			var vertices:number[] = this._vertexData;
			var posStride:number = this.vertexStride;
			var posOffset:number = this.vertexOffset;

			if (this._faceNormals == null) {
				this._faceNormals = new Array<number>(len);//_faceNormals ||= new Vector.<Number>(len, true);
			}

			if (this._useFaceWeights) {
				if (this._faceWeights == null) {
					this._faceWeights = new Array<number>(len/3);//_faceWeights ||= new Vector.<Number>(len/3, true);
				}
			}

			while (i < len) {
				index = posOffset + this._indices[i++]*posStride;
				x1 = vertices[index];
				y1 = vertices[index + 1];
				z1 = vertices[index + 2];
				index = posOffset + this._indices[i++]*posStride;
				x2 = vertices[index];
				y2 = vertices[index + 1];
				z2 = vertices[index + 2];
				index = posOffset + this._indices[i++]*posStride;
				x3 = vertices[index];
				y3 = vertices[index + 1];
				z3 = vertices[index + 2];
				dx1 = x3 - x1;
				dy1 = y3 - y1;
				dz1 = z3 - z1;
				dx2 = x2 - x1;
				dy2 = y2 - y1;
				dz2 = z2 - z1;
				cx = dz1*dy2 - dy1*dz2;
				cy = dx1*dz2 - dz1*dx2;
				cz = dy1*dx2 - dx1*dy2;
				d = Math.sqrt(cx*cx + cy*cy + cz*cz);
				// length of cross product = 2*triangle area

				if (this._useFaceWeights) {
					var w:number = d*10000;

					if (w < 1) {
						w = 1;
					}

					this._faceWeights[k++] = w;
				}

				d = 1/d;

				this._faceNormals[j++] = cx*d;
				this._faceNormals[j++] = cy*d;
				this._faceNormals[j++] = cz*d;
			}

			this._faceNormalsDirty = false;

		}

		/**
		 * Updates the vertex normals based on the geometry.
		 */
		public pUpdateVertexNormals(target:number[]):number[]
		{
			if (this._faceNormalsDirty) {
				this.updateFaceNormals();
			}

			var v1:number;
			var f1:number = 0;
			var f2:number = 1;
			var f3:number = 2;
			var lenV:number = this._vertexData.length;
			var normalStride:number = this.vertexNormalStride;
			var normalOffset:number = this.vertexNormalOffset;

			if (target == null) {

				target = new Array<number>(lenV);//target ||= new Vector.<Number>(lenV, true);

			}

			v1 = normalOffset;

			while (v1 < lenV) {
				target[v1] = 0.0;
				target[v1 + 1] = 0.0;
				target[v1 + 2] = 0.0;
				v1 += normalStride;
			}

			var i:number = 0;
			var k:number = 0;
			var lenI:number = this._indices.length;
			var index:number;
			var weight:number;

			while (i < lenI) {
				weight = this._useFaceWeights? this._faceWeights[k++] : 1;
				index = normalOffset + this._indices[i++]*normalStride;
				target[index++] += this._faceNormals[f1]*weight;
				target[index++] += this._faceNormals[f2]*weight;
				target[index] += this._faceNormals[f3]*weight;
				index = normalOffset + this._indices[i++]*normalStride;
				target[index++] += this._faceNormals[f1]*weight;
				target[index++] += this._faceNormals[f2]*weight;
				target[index] += this._faceNormals[f3]*weight;
				index = normalOffset + this._indices[i++]*normalStride;
				target[index++] += this._faceNormals[f1]*weight;
				target[index++] += this._faceNormals[f2]*weight;
				target[index] += this._faceNormals[f3]*weight;
				f1 += 3;
				f2 += 3;
				f3 += 3;
			}

			v1 = normalOffset;
			while (v1 < lenV) {
				var vx:number = target[v1];
				var vy:number = target[v1 + 1];
				var vz:number = target[v1 + 2];
				var d:number = 1.0/Math.sqrt(vx*vx + vy*vy + vz*vz);
				target[v1] = vx*d;
				target[v1 + 1] = vy*d;
				target[v1 + 2] = vz*d;
				v1 += normalStride;
			}

			this._vertexNormalsDirty = false;

			return target;
		}

		/**
		 * Updates the vertex tangents based on the geometry.
		 */
		public pUpdateVertexTangents(target:number[]):number[]
		{
			if (this._faceTangentsDirty) {
				this.pUpdateFaceTangents()//updateFaceTangents();
			}

			var i:number;
			var lenV:number = this._vertexData.length;
			var tangentStride:number = this.vertexTangentStride;
			var tangentOffset:number = this.vertexTangentOffset;

			if (target == null) {

				target = new Array<number>(lenV); //target ||= new Vector.<Number>(lenV, true);
			}


			i = tangentOffset;

			while (i < lenV) {

				target[i] = 0.0;
				target[i + 1] = 0.0;
				target[i + 2] = 0.0;
				i += tangentStride;

			}

			var k:number = 0;
			var lenI:number = this._indices.length;
			var index:number;
			var weight:number;
			var f1:number = 0;
			var f2:number = 1;
			var f3:number = 2;

			i = 0;

			while (i < lenI) {
				weight = this._useFaceWeights? this._faceWeights[k++] : 1;
				index = tangentOffset + this._indices[i++]*tangentStride;
				target[index++] += this._faceTangents[f1]*weight;
				target[index++] += this._faceTangents[f2]*weight;
				target[index] += this._faceTangents[f3]*weight;
				index = tangentOffset + this._indices[i++]*tangentStride;
				target[index++] += this._faceTangents[f1]*weight;
				target[index++] += this._faceTangents[f2]*weight;
				target[index] += this._faceTangents[f3]*weight;
				index = tangentOffset + this._indices[i++]*tangentStride;
				target[index++] += this._faceTangents[f1]*weight;
				target[index++] += this._faceTangents[f2]*weight;
				target[index] += this._faceTangents[f3]*weight;
				f1 += 3;
				f2 += 3;
				f3 += 3;
			}

			i = tangentOffset;

			while (i < lenV) {
				var vx:number = target[i];
				var vy:number = target[i + 1];
				var vz:number = target[i + 2];
				var d:number = 1.0/Math.sqrt(vx*vx + vy*vy + vz*vz);
				target[i] = vx*d;
				target[i + 1] = vy*d;
				target[i + 2] = vz*d;
				i += tangentStride;
			}

			this._vertexTangentsDirty = false;

			return target;
		}

		public dispose()
		{
			this.pDisposeIndexBuffers(this._indexBuffer);
			this._indices = null;
			this._indexBufferContext = null;
			this._faceNormals = null;
			this._faceWeights = null;
			this._faceTangents = null;
			this._vertexData = null;
		}

		/**
		 * The raw index data that define the faces.
		 *
		 * @private
		 */
		public get indexData():number[] /*uint*/
		{
			return this._indices;
		}

		/**
		 * Updates the face indices of the SubGeometry.
		 * @param indices The face indices to upload.
		 */
		public updateIndexData(indices:number[] /*uint*/)
		{
			this._indices = indices;
			this._numIndices = indices.length;

			var numTriangles:number = this._numIndices/3;

			if (this._numTriangles != numTriangles) {
				this.pDisposeIndexBuffers(this._indexBuffer);
			}

			this._numTriangles = numTriangles;
			this.pInvalidateBuffers(this._indicesInvalid);
			this._faceNormalsDirty = true;

			if (this._autoDeriveVertexNormals) {
				this._vertexNormalsDirty = true;
			}

			if (this._autoDeriveVertexTangents) {
				this._vertexTangentsDirty = true;
			}

		}

		/**
		 * Disposes all buffers in a given vector.
		 * @param buffers The vector of buffers to dispose.
		 */
		public pDisposeIndexBuffers(buffers:away.display3D.IndexBuffer3D[]):void //Vector.<IndexBuffer3D>)
		{
			for (var i:number = 0; i < 8; ++i) {
				if (buffers[i]) {
					buffers[i].dispose();
					buffers[i] = null;
				}
			}
		}

		/**
		 * Disposes all buffers in a given vector.
		 * @param buffers The vector of buffers to dispose.
		 */
		public pDisposeVertexBuffers(buffers:away.display3D.VertexBuffer3D []):void //Vector.<VertexBuffer3D>)
		{
			for (var i:number = 0; i < 8; ++i) {
				if (buffers[i]) {
					buffers[i].dispose();
					buffers[i] = null;
				}
			}
		}

		/**
		 * True if the vertex tangents should be derived from the geometry, false if the vertex normals are set
		 * explicitly.
		 */
		public get autoDeriveVertexTangents():boolean
		{
			return this._autoDeriveVertexTangents;
		}

		public set autoDeriveVertexTangents(value:boolean)
		{
			this._autoDeriveVertexTangents = value;
			this._vertexTangentsDirty = value;
		}

		/**
		 * The raw data of the face normals, in the same order as the faces are listed in the index list.
		 *
		 * @private
		 */
		public get faceNormals():number[]
		{
			if (this._faceNormalsDirty) {
				this.updateFaceNormals();
			}

			return this._faceNormals;
		}

		/**
		 * Invalidates all buffers in a vector, causing them the update when they are first requested.
		 * @param buffers The vector of buffers to invalidate.
		 */
		public pInvalidateBuffers(invalid:boolean[]):void
		{
			for (var i:number = 0; i < 8; ++i) {
				invalid[i] = true;
			}
		}

		public get UVStride():number
		{
			throw new away.errors.AbstractMethodError();//AbstractMethodError();
		}

		public get vertexData():number[]
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexPositionData():number[]
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexNormalData():number[]
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexTangentData():number[]
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get UVData():number[]
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexStride():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexNormalStride():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexTangentStride():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexOffset():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexNormalOffset():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get vertexTangentOffset():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public get UVOffset():number
		{
			throw new away.errors.AbstractMethodError();//
		}

		public pInvalidateBounds()
		{
			if (this._parentGeometry) {
				var me:any = this;
				this._parentGeometry.iInvalidateBounds(<away.base.ISubGeometry> me);
			}

		}

		/**
		 * The Geometry object that 'owns' this SubGeometry object.
		 *
		 * @private
		 */
		public get parentGeometry():away.base.Geometry
		{
			return this._parentGeometry;
		}

		public set parentGeometry(value:away.base.Geometry)
		{
			this._parentGeometry = value;
		}

		/**
		 * Scales the uv coordinates
		 * @param scaleU The amount by which to scale on the u axis. Default is 1;
		 * @param scaleV The amount by which to scale on the v axis. Default is 1;
		 */
		public get scaleU():number
		{
			return this._scaleU;
		}

		public get scaleV():number
		{
			return this._scaleV;
		}

		public scaleUV(scaleU:number = 1, scaleV:number = 1)
		{
			var offset:number = this.UVOffset;
			var stride:number = this.UVStride;
			var uvs:number[] = this.UVData;
			var len:number = uvs.length;
			var ratioU:number = scaleU/this._scaleU;
			var ratioV:number = scaleV/this._scaleV;

			for (var i:number = offset; i < len; i += stride) {
				uvs[i] *= ratioU;
				uvs[i + 1] *= ratioV;
			}

			this._scaleU = scaleU;
			this._scaleV = scaleV;
		}

		/**
		 * Scales the geometry.
		 * @param scale The amount by which to scale.
		 */
		public scale(scale:number)
		{
			var vertices:number[] = this.UVData;
			var len:number = vertices.length;
			var offset:number = this.vertexOffset;
			var stride:number = this.vertexStride;

			for (var i:number = offset; i < len; i += stride) {
				vertices[i] *= scale;
				vertices[i + 1] *= scale;
				vertices[i + 2] *= scale;
			}
		}

		public applyTransformation(transform:away.geom.Matrix3D)
		{
			var vertices:number[] = this._vertexData;
			var normals:number[] = this.vertexNormalData;
			var tangents:number[] = this.vertexTangentData;
			var posStride:number = this.vertexStride;
			var normalStride:number = this.vertexNormalStride;
			var tangentStride:number = this.vertexTangentStride;
			var posOffset:number = this.vertexOffset;
			var normalOffset:number = this.vertexNormalOffset;
			var tangentOffset:number = this.vertexTangentOffset;
			var len:number = vertices.length/posStride;
			var i:number;
			var i1:number;
			var i2:number;
			var vector:away.geom.Vector3D = new away.geom.Vector3D();

			var bakeNormals:boolean = normals != null;
			var bakeTangents:boolean = tangents != null;
			var invTranspose:away.geom.Matrix3D;

			if (bakeNormals || bakeTangents) {
				invTranspose = transform.clone();
				invTranspose.invert();
				invTranspose.transpose();
			}

			var vi0:number = posOffset;
			var ni0:number = normalOffset;
			var ti0:number = tangentOffset;

			for (i = 0; i < len; ++i) {
				i1 = vi0 + 1;
				i2 = vi0 + 2;

				// bake position
				vector.x = vertices[vi0];
				vector.y = vertices[i1];
				vector.z = vertices[i2];
				vector = transform.transformVector(vector);
				vertices[vi0] = vector.x;
				vertices[i1] = vector.y;
				vertices[i2] = vector.z;
				vi0 += posStride;

				// bake normal
				if (bakeNormals) {
					i1 = ni0 + 1;
					i2 = ni0 + 2;
					vector.x = normals[ni0];
					vector.y = normals[i1];
					vector.z = normals[i2];
					vector = invTranspose.deltaTransformVector(vector);
					vector.normalize();
					normals[ni0] = vector.x;
					normals[i1] = vector.y;
					normals[i2] = vector.z;
					ni0 += normalStride;
				}

				// bake tangent
				if (bakeTangents) {
					i1 = ti0 + 1;
					i2 = ti0 + 2;
					vector.x = tangents[ti0];
					vector.y = tangents[i1];
					vector.z = tangents[i2];
					vector = invTranspose.deltaTransformVector(vector);
					vector.normalize();
					tangents[ti0] = vector.x;
					tangents[i1] = vector.y;
					tangents[i2] = vector.z;
					ti0 += tangentStride;
				}
			}
		}

		public pUpdateDummyUVs(target:number[]):number[]
		{
			this._uvsDirty = false;
			var idx:number;
			var uvIdx:number;
			var stride:number = this.UVStride;
			var skip:number = stride - 2;
			var len:number = this._vertexData.length/this.vertexStride*stride;

			if (!target) {
				target = new Array<number>();
			}

			target.length = len;

			idx = this.UVOffset;
			uvIdx = 0;

			while (idx < len) {
				target[idx++] = uvIdx*.5;
				target[idx++] = 1.0 - (uvIdx & 1);
				idx += skip;

				if (++uvIdx == 3) {
					uvIdx = 0;
				}
			}

			return target;

		}
	}
}
