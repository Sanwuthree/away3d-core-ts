///<reference path="../../_definitions.ts"/>

/**
 * @module away.base
 */
module away.base
{
	/**
	 * @interface away.base.ISubGeometry
	 */
	export interface ISubGeometry
	{
		/**
		 * The total amount of vertices in the SubGeometry.
		 */
		numVertices:number;//GET

		/**
		 * The amount of triangles that comprise the IRenderable geometry.
		 */
		numTriangles:number;//GET

		/**
		 * The distance between two consecutive vertex, normal or tangent elements
		 * This always applies to vertices, normals and tangents.
		 */
		vertexStride:number;//GET

		/**
		 * The distance between two consecutive normal elements
		 * This always applies to vertices, normals and tangents.
		 */
		vertexNormalStride:number;//GET

		/**
		 * The distance between two consecutive tangent elements
		 * This always applies to vertices, normals and tangents.
		 */
		vertexTangentStride:number;//GET

		/**
		 * The distance between two consecutive UV elements
		 */
		UVStride:number;//GET

		/**
		 * The distance between two secondary UV elements
		 */
		secondaryUVStride:number;//GET

		/**
		 * Unique identifier for a subgeometry
		 */
		id:string;//GET

		/**
		 * Assigns the attribute stream for vertex positions.
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		activateVertexBuffer(index:number, stageGL:away.base.StageGL);

		/**
		 * Assigns the attribute stream for UV coordinates
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		activateUVBuffer(index:number, stageGL:away.base.StageGL);

		/**
		 * Assigns the attribute stream for a secondary set of UV coordinates
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		activateSecondaryUVBuffer(index:number, stageGL:away.base.StageGL);

		/**
		 * Assigns the attribute stream for vertex normals
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		activateVertexNormalBuffer(index:number, stageGL:away.base.StageGL);

		/**
		 * Assigns the attribute stream for vertex tangents
		 * @param index The attribute stream index for the vertex shader
		 * @param stageGL The StageGL to assign the stream to
		 */
		activateVertexTangentBuffer(index:number, stageGL:away.base.StageGL);

		/**
		 * Retrieves the IndexBuffer object that contains triangle indices.
		 * @param context The ContextGL for which we request the buffer
		 * @return The VertexBuffer object that contains triangle indices.
		 */

		getIndexBuffer(stageGL:away.base.StageGL):away.gl.IndexBuffer;

		/**
		 * Retrieves the object's vertices as a Number array.
		 */
		vertexData:Array<number>;//GET

		/**
		 * Retrieves the object's normals as a Number array.
		 */
		vertexNormalData:Array<number>;//GET

		/**
		 * Retrieves the object's tangents as a Number array.
		 */
		vertexTangentData:Array<number>;//GET

		/**
		 * The offset into vertexData where the vertices are placed
		 */
		vertexOffset:number;//GET

		/**
		 * The offset into vertexNormalData where the normals are placed
		 */
		vertexNormalOffset:number;//GET

		/**
		 * The offset into vertexTangentData where the tangents are placed
		 */
		vertexTangentOffset:number;//GET

		/**
		 * The offset into UVData vector where the UVs are placed
		 */
		UVOffset:number;//GET

		/**
		 * The offset into SecondaryUVData vector where the UVs are placed
		 */
		secondaryUVOffset:number;//GET

		/**
		 * Retrieves the object's indices as a uint array.
		 */
		indexData:Array<number> /*uint*/;//GET

		/**
		 * Retrieves the object's uvs as a Number array.
		 */
		UVData:Array<number>;//GET

		applyTransformation(transform:away.geom.Matrix3D);

		scale(scale:number);

		dispose();

		clone():away.base.ISubGeometry;

		scaleU:number;//GET

		scaleV:number;//GET

		scaleUV(scaleU:number, scaleV:number);//scaleUV(scaleU:number = 1, scaleV:number = 1);

		parentGeometry:away.base.Geometry;//GET / SET

		faceNormals:Array<number>;//GET

		cloneWithSeperateBuffers():away.base.SubGeometry;

		autoDeriveVertexNormals:boolean;//GET / SET

		autoDeriveVertexTangents:boolean;//GET / SET

		fromVectors(vertices:Array<number>, uvs:Array<number>, normals:Array<number>, tangents:Array<number>);

		vertexPositionData:Array<number>;//GET
	}
}
