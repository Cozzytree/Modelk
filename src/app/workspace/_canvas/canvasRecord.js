class CanvasRecord {
   constructor() {
      this.initialState = new Map(); // Key: shape ID, Value: shape data
      this.currentState = new Map(); // Key: shape ID, Value: shape data
      this.newShapes = new Map(); // Key: shape ID, Value: shape data
      this.updatedShapes = new Map(); // Key: shape ID, Value: shape data
      this.deletedShapes = new Set(); // Set of shape IDs
   }

   // Method to set initial state
   setInitialState(state) {
      this.initialState = new Map(
         state.map((shape) => [
            shape.Params.id,
            { Params: { ...shape.Params, shapeId: shape._id } },
         ]),
      );
      console.log("state", this.initialState);
   }

   // Method to update the current state
   updateCurrentState(...maps) {
      this.currentState = new Map();
      maps.forEach((map) => {
         map.forEach((value, key) => {
            this.currentState.set(
               key,
               JSON.parse(JSON.stringify({ Params: value })),
            );
         });
      });
   }

   // Method to compare states and determine changes
   compareStates() {
      this.updatedShapes = new Map();
      this.newShapes = new Map();
      this.deletedShapes = new Set();
      // Determine deleted shapes
      this.initialState.forEach((shape, id) => {
         if (!this.currentState.has(id)) {
            this.deletedShapes.add(id);
         }
      });

      // Determine updated shapes and new shapes
      this.currentState.forEach((shape, id) => {
         const initialShape = this.initialState.get(id);
         if (!initialShape) {
            // New shape
            this.newShapes.set(id, shape);
         } else if (this.shapeHasChanged(initialShape?.Params, shape?.Params)) {
            // Updated shape
            this.updatedShapes.set(id, shape);
         }
      });
   }

   // Method to check if a shape has changed (e.g., by comparing properties)
   shapeHasChanged(initialShape, updatedShape) {
      return JSON.stringify(initialShape) !== JSON.stringify(updatedShape);
   }

   getUpdatedShapes() {
      let newShape = [];
      let updated = [];

      this.newShapes.forEach((v) => {
         newShape.push(v);
      });
      this.updatedShapes.forEach((s) => {
         updated.push({ shapeId: s.Params.shapeId, params: s.Params });
      });
      return { newShape, updated };
   }

   pushRecords() {
      this.compareStates();
      const { newShape, updated } = this.getUpdatedShapes();
      return { newShape, updated };
   }
}

export const canvasRecord = new CanvasRecord();
