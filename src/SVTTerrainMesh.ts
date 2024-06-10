import { Box3, Camera, CanvasTexture, Frustum, Matrix4, Mesh, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Texture, Vector3 } from "three";

export class SVTTerrainMesh extends Mesh {
    private _tileSize: number = 256;
    private _numTiles: number;
    private _tiles: (Texture | null)[];
    private _lodThresholds: number[] = [50, 150, 300];//Level of detail at 50 meters, 150 meters, until 300 meters
    
    private _camera: PerspectiveCamera;
    private _frustum: Frustum = new Frustum();
    private _matrixWorldInverse: Matrix4 = new Matrix4();

    private _originalMap: Texture;

    constructor(geometry: PlaneGeometry, material: MeshStandardMaterial, camera: PerspectiveCamera, texture: Texture) {
        super(geometry, material);
        /**
         * The size of tile to cut. Two things to note here
         * 1 - The size of tile is always a square and hence only a single variable for tile size
         * 2 - The size should be power of ^2 i.e 2, 4, 8, 16, 32, 64, 128, 256, 512 etc
         * Larger the tile size less number of tiles(this._numTiles), smaller the tileSize more number of tiles(this._numSize)
         */
        this._tileSize = 256; // Size of each tile
        
        /**
         * Number of tiles along each axis
         */
        this._numTiles = Math.ceil(texture.image.width / this._tileSize); 

        /**
         * Create a square n x n array where n = this._numTiles
         */
        this._tiles = new Array(this._numTiles * this._numTiles); // Array to store loaded tiles
        
        this._camera = camera;  
        this._originalMap = texture.clone();
    }

    /**
     * 
     * @param x - normalized value between 0 to 1
     * @param y - normalized value between 0 to 1
     * @param material - {@link MeshStandardMaterial}
     * @returns a generic instance of Texture (CanvasTexture)
     * @description Performs DOM operations to create a canvas element and create a CanvasTexture based on this canvas element
     */

    private _loadTile(x: number, y: number, texture: Texture, lod: number): Texture {    
        if(!texture.image){
            throw new Error("Error!!!! No map is found for the given material");
        }
        
        const tileSize: number = this._tileSize >> lod;
        const canvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
        const context: CanvasRenderingContext2D = canvas.getContext('2d')! as CanvasRenderingContext2D;
        const tileWidth: number = Math.min(tileSize, texture.image.width - x * tileSize);
        const tileHeight: number = Math.min(tileSize, texture.image.height - y * tileSize);        
        
        let canvasTexture: CanvasTexture;

        canvas.width = tileWidth;
        canvas.height = tileHeight;

        context.drawImage(texture.image, x * tileSize, y * tileSize, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
        
        canvasTexture = new CanvasTexture(canvas);
        canvasTexture.needsUpdate = true;

        return texture;
    }

    /**
     * 
     * @param column - The index along the columns
     * @param row - The index along the rows
     * @returns number - The index 'k' of the pixel in the image array of size m = n x n (this.numTiles)
     */
    private _getTileIndex(column: number, row: number): number {
        return (row * this._numTiles) + column;
    }

    /**
     * 
     * @param column - The index along the columns
     * @param row - The index along the rows 
     * @param material - {@link MeshStandardMaterial}
     * @returns a generic instance of Texture (CanvasTexture)
     */
    private _getTile(column: number, row: number, lod: number): Texture {
        const index: number = this._getTileIndex(column, row);
        
        if (!this._tiles[index] && this._originalMap) {
            this._tiles[index] = this._loadTile(column, row, this._originalMap, lod);
        }
        return this._tiles[index]!;
    }

    /**
     * 
     * @param column - The index along the columns
     * @param row - The index along the rows
     * @description - Nullify the canvas textures to conserve memory
     */
    private _unloadTile(column: number, row: number): void {
        const index: number = this._getTileIndex(column, row);
        this._tiles[index] = null;
    }

    private _isTileVisible(x: number, y: number): boolean {
        const tileCenter: Vector3 = new Vector3((x + 0.5) * this._tileSize, 0, (y + 0.5) * this._tileSize);
        const halfTileSize: number = this._tileSize * 0.5;
        const box: Box3 = new Box3(
            new Vector3(tileCenter.x - halfTileSize, -halfTileSize, tileCenter.z - halfTileSize),
            new Vector3(tileCenter.x + halfTileSize, halfTileSize, tileCenter.z + halfTileSize)
        );
        return this._frustum.intersectsBox(box);
    }

    /**
     * 
     * @param x
     * @param y 
     * @param camera 
     * @returns 
     */
    private _getLOD(x: number, y: number, camera: Camera): number {
        // Calculate the distance from the camera to the tile
        const tileCenter = new Vector3((x + 0.5) * this._tileSize, 0, (y + 0.5) * this._tileSize);
        const distance = camera.position.distanceTo(tileCenter);

        // Determine LOD based on distance
        for (let i: number = 0; i < this._lodThresholds.length; i++) {
            if (distance < this._lodThresholds[i]) {
                return i;
            }
        }

        return this._lodThresholds.length; // Return the highest LOD level if distance exceeds all thresholds
    }

    public updateVisibleTiles(material: MeshStandardMaterial): void {
        const visibleRange: number = 1;
        let cameraX: number;
        let cameraY: number;
        let lod: number;
        let tile: Texture;
        

        this._camera.updateMatrixWorld();
        this._matrixWorldInverse.copy(this._camera.matrixWorld).invert();
        this._frustum.setFromProjectionMatrix(new Matrix4().multiplyMatrices(this._camera.projectionMatrix, this._matrixWorldInverse));

        cameraX = Math.floor(this._camera.position.x / this._tileSize);
        cameraY = Math.floor(this._camera.position.z / this._tileSize);

        for (let x: number = cameraX - visibleRange; x <= cameraX + visibleRange; x++) {
            for (let y: number = cameraY - visibleRange; y <= cameraY + visibleRange; y++) {
                if (x >= 0 && y >= 0 && x < this._numTiles && y < this._numTiles) {
                    if (this._isTileVisible(x, y)) {
                        lod = this._getLOD(x, y, this._camera);
                        tile = this._getTile(x, y, lod);
                        material.map = tile;  
                    } else {
                        this._unloadTile(x, y);
                        material.map = null;
                    }
                }
            }
        }
    }

    public render(): void {
        let mat: MeshStandardMaterial =  this.material as MeshStandardMaterial;
        if(!mat){
            return;
        }
        this.updateVisibleTiles(this.material as MeshStandardMaterial);
        (this.material as MeshStandardMaterial).needsUpdate = true;
    }
}
