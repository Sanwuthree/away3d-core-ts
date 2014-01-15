﻿///<reference path="../_definitions.ts"/>

module away.entities
{
	import Delegate						= away.utils.Delegate;

	import IAnimator					= away.animators.IAnimator;
	import ISubGeometry					= away.base.ISubGeometry;
	import SubGeometry					= away.base.SubGeometry;
	import SubMesh						= away.base.SubMesh;
	import Geometry						= away.base.Geometry;
	import GeometryEvent				= away.events.GeometryEvent;
	import DefaultMaterialManager		= away.materials.DefaultMaterialManager;
	import MaterialBase					= away.materials.MaterialBase;
	import EntityNode					= away.partition.EntityNode;
	import MeshNode						= away.partition.MeshNode;

	/**
	 * Mesh is an instance of a Geometry, augmenting it with a presence in the scene graph, a material, and an animation
	 * state. It consists out of SubMeshes, which in turn correspond to SubGeometries. SubMeshes allow different parts
	 * of the geometry to be assigned different materials.
	 */
	export class Mesh extends Entity implements away.base.IMaterialOwner, away.library.IAsset
	{
		private _subMeshes:Array<SubMesh>;
		private _geometry:Geometry;
		private _material:MaterialBase;
		private _animator:IAnimator;
		private _castsShadows:boolean = true;
		private _shareAnimationGeometry:boolean = true;

		private _onGeometryBoundsInvalidDelegate:Function;
		private _onSubGeometryAddedDelegate:Function;
		private _onSubGeometryRemovedDelegate:Function;

		/**
		 * Create a new Mesh object.
		 *
		 * @param geometry                    The geometry used by the mesh that provides it with its shape.
		 * @param material    [optional]        The material with which to render the Mesh.
		 */
		constructor(geometry:Geometry, material:MaterialBase = null)
		{
			super();

			this._subMeshes = new Array<SubMesh>();

			this._onGeometryBoundsInvalidDelegate = Delegate.create(this, this.onGeometryBoundsInvalid);
			this._onSubGeometryAddedDelegate = Delegate.create(this, this.onSubGeometryAdded);
			this._onSubGeometryRemovedDelegate = Delegate.create(this, this.onSubGeometryRemoved);

			//this should never happen, but if people insist on trying to create their meshes before they have geometry to fill it, it becomes necessary
			if (geometry == null) {
				this.geometry = new Geometry();
			} else {
				this.geometry = geometry;
			}

			if (material == null) {
				this.material = DefaultMaterialManager.getDefaultMaterial(this);
			} else {
				this.material = material;
			}

		}

		public bakeTransformations()
		{
			this.geometry.applyTransformation(this.transform);
			this.transform.identity();
		}

		public get assetType():string
		{
			return away.library.AssetType.MESH;
		}

		private onGeometryBoundsInvalid(event:GeometryEvent)
		{
			this.pInvalidateBounds();

		}

		/**
		 * Indicates whether or not the Mesh can cast shadows. Default value is <code>true</code>.
		 */
		public get castsShadows():boolean
		{
			return this._castsShadows;
		}

		public set castsShadows(value:boolean)
		{
			this._castsShadows = value;
		}

		/**
		 * Defines the animator of the mesh. Act on the mesh's geometry.  Default value is <code>null</code>.
		 */


		public get animator():IAnimator
		{
			return this._animator;
		}


		public set animator(value:IAnimator)
		{
			if (this._animator)
				this._animator.removeOwner(this);

			this._animator = value;

			// cause material to be unregistered and registered again to work with the new animation type (if possible)
			var oldMaterial:away.materials.MaterialBase = this.material;
			this.material = null;
			this.material = oldMaterial;

			var len:number = this._subMeshes.length;
			var subMesh:away.base.SubMesh;

			// reassign for each SubMesh
			for (var i:number = 0; i < len; ++i) {
				subMesh = this._subMeshes[i];
				oldMaterial = subMesh._iMaterial;
				if (oldMaterial) {
					subMesh.material = null;
					subMesh.material = oldMaterial;
				}
			}

			if (this._animator)
				this._animator.addOwner(this);
		}

		/**
		 * The geometry used by the mesh that provides it with its shape.
		 */
		public get geometry():Geometry
		{
			return this._geometry;
		}

		public set geometry(value:Geometry)
		{
			var i:number;

			if (this._geometry) {

				this._geometry.removeEventListener(GeometryEvent.BOUNDS_INVALID, this._onGeometryBoundsInvalidDelegate);
				this._geometry.removeEventListener(GeometryEvent.SUB_GEOMETRY_ADDED, this._onSubGeometryAddedDelegate);
				this._geometry.removeEventListener(GeometryEvent.SUB_GEOMETRY_REMOVED, this._onSubGeometryRemovedDelegate);

				for (i = 0; i < this._subMeshes.length; ++i) {

					this._subMeshes[i].dispose();
				}

				this._subMeshes.length = 0;

			}

			this._geometry = value;

			if (this._geometry) {

				this._geometry.addEventListener(GeometryEvent.BOUNDS_INVALID, this._onGeometryBoundsInvalidDelegate);
				this._geometry.addEventListener(GeometryEvent.SUB_GEOMETRY_ADDED, this._onSubGeometryAddedDelegate);
				this._geometry.addEventListener(GeometryEvent.SUB_GEOMETRY_REMOVED, this._onSubGeometryRemovedDelegate);

				var subGeoms:Array<ISubGeometry> = this._geometry.subGeometries;

				for (i = 0; i < subGeoms.length; ++i) {

					this.addSubMesh(subGeoms[i]);

				}

			}

			if (this._material) {

				this._material.iRemoveOwner(this);
				this._material.iAddOwner(this);

			}
		}

		/**
		 * The material with which to render the Mesh.
		 */
		public get material():away.materials.MaterialBase
		{
			return this._material;
		}

		public set material(value:away.materials.MaterialBase)
		{

			if (value == this._material) {

				return;

			}

			if (this._material) {

				this._material.iRemoveOwner(this);

			}

			this._material = value;

			if (this._material) {

				this._material.iAddOwner(this);

			}

		}

		/**
		 * The SubMeshes out of which the Mesh consists. Every SubMesh can be assigned a material to override the Mesh's
		 * material.
		 */
		public get subMeshes():Array<SubMesh>
		{
			// Since this getter is invoked every iteration of the render loop, and
			// the geometry construct could affect the sub-meshes, the geometry is
			// validated here to give it a chance to rebuild.

			this._geometry.iValidate();

			return this._subMeshes;
		}

		/**
		 * Indicates whether or not the mesh share the same animation geometry.
		 */
		public get shareAnimationGeometry():boolean
		{
			return this._shareAnimationGeometry;
		}

		public set shareAnimationGeometry(value:boolean)
		{
			this._shareAnimationGeometry = value;
		}

		/**
		 * Clears the animation geometry of this mesh. It will cause animation to generate a new animation geometry. Work only when shareAnimationGeometry is false.
		 */
		public clearAnimationGeometry()
		{
			 var len:number = this._subMeshes.length;
			 for (var i:number = 0; i < len; ++i)
				 this._subMeshes[i].animationSubGeometry = null;
		}

		/**
		 * @inheritDoc
		 */
		public dispose()
		{
			super.dispose();

			this.material = null;
			this.geometry = null;
		}

		/**
		 * Disposes mesh including the animator and children. This is a merely a convenience method.
		 * @return
		 */
		public disposeWithAnimatorAndChildren()
		{
			this.disposeWithChildren();

			 if (this._animator)
			 	this._animator.dispose();
		}

		/**
		 * Clones this Mesh instance along with all it's children, while re-using the same
		 * material, geometry and animation set. The returned result will be a copy of this mesh,
		 * containing copies of all of it's children.
		 *
		 * Properties that are re-used (i.e. not cloned) by the new copy include name,
		 * geometry, and material. Properties that are cloned or created anew for the copy
		 * include subMeshes, children of the mesh, and the animator.
		 *
		 * If you want to copy just the mesh, reusing it's geometry and material while not
		 * cloning it's children, the simplest way is to create a new mesh manually:
		 *
		 * <code>
		 * var clone : Mesh = new Mesh(original.geometry, original.material);
		 * </code>
		 */
		public clone():Mesh
		{
			var clone:Mesh = new Mesh(this._geometry, this._material);
			clone.transform = this.transform;
			clone.pivotPoint = this.pivotPoint;
			clone.partition = this.partition;
			clone.bounds = this._pBounds.clone(); // TODO: check _pBounds is the correct prop ( in case of problem / debug note )


			clone.name = this.name;
			clone.castsShadows = this.castsShadows;
			clone.shareAnimationGeometry = this.shareAnimationGeometry;
			clone.mouseEnabled = this.mouseEnabled;
			clone.mouseChildren = this.mouseChildren;
			//this is of course no proper cloning
			//maybe use this instead?: http://blog.another-d-mention.ro/programming/how-to-clone-duplicate-an-object-in-actionscript-3/
			clone.extra = this.extra;

			var len:number = this._subMeshes.length;
			for (var i:number = 0; i < len; ++i) {
				clone._subMeshes[i]._iMaterial = this._subMeshes[i]._iMaterial;
			}


			len = this.numChildren;
			var obj:any;

			for (i = 0; i < len; ++i) {

				obj = this.getChildAt(i).clone();
				clone.addChild(<away.containers.ObjectContainer3D> obj);

			}

			if (this._animator) {

				clone.animator = this._animator.clone();

			}

			return clone;
		}

		/**
		 * @inheritDoc
		 */
		public pUpdateBounds()
		{
			this._pBounds.fromGeometry(this._geometry);
			this._pBoundsInvalid = false;
		}

		/**
		 * @inheritDoc
		 */
		public pCreateEntityPartitionNode():EntityNode
		{
			return new MeshNode(this);
		}

		/**
		 * Called when a SubGeometry was added to the Geometry.
		 */
		private onSubGeometryAdded(event:GeometryEvent)
		{
			this.addSubMesh(event.subGeometry);
		}

		/**
		 * Called when a SubGeometry was removed from the Geometry.
		 */
		private onSubGeometryRemoved(event:GeometryEvent)
		{
			var subMesh:SubMesh;
			var subGeom:ISubGeometry = event.subGeometry;
			var len:number = this._subMeshes.length;
			var i:number;

			// Important! This has to be done here, and not delayed until the
			// next render loop, since this may be caused by the geometry being
			// rebuilt IN THE RENDER LOOP. Invalidating and waiting will delay
			// it until the NEXT RENDER FRAME which is probably not desirable.

			for (i = 0; i < len; ++i) {

				subMesh = this._subMeshes[i];

				if (subMesh.subGeometry == subGeom) {
					subMesh.dispose();

					this._subMeshes.splice(i, 1);

					break;
				}
			}

			--len;
			for (; i < len; ++i) {

				this._subMeshes[i]._iIndex = i;

			}

		}

		/**
		 * Adds a SubMesh wrapping a SubGeometry.
		 */
		private addSubMesh(subGeometry:ISubGeometry)
		{

			var subMesh:SubMesh = new SubMesh(subGeometry, this, null);
			var len:number = this._subMeshes.length;

			subMesh._iIndex = len;

			this._subMeshes[len] = subMesh;

			this.pInvalidateBounds();
		}

		public getSubMeshForSubGeometry(subGeometry:SubGeometry):SubMesh
		{
			return this._subMeshes[this._geometry.subGeometries.indexOf(subGeometry)];
		}

		public iCollidesBefore(shortestCollisionDistance:number, findClosest:boolean):boolean
		{

			this._iPickingCollider.setLocalRay(this._iPickingCollisionVO.localRayPosition, this._iPickingCollisionVO.localRayDirection);
			this._iPickingCollisionVO.renderable = null;
			var len:number = this._subMeshes.length;
			for (var i:number = 0; i < len; ++i) {
				var subMesh:SubMesh = this._subMeshes[i];

				//var ignoreFacesLookingAway:boolean = _material ? !_material.bothSides : true;

				if (this._iPickingCollider.testSubMeshCollision(subMesh, this._iPickingCollisionVO, shortestCollisionDistance)) {

					shortestCollisionDistance = this._iPickingCollisionVO.rayEntryDistance;

					this._iPickingCollisionVO.renderable = subMesh;

					if (!findClosest) {

						return true;

					}

				}
			}

			return this._iPickingCollisionVO.renderable != null;
		}
	}
}
