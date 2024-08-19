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
      this.initialState = new Map(state.map((shape) => [shape.id, shape]));
   }

   // Method to update the current state
   updateCurrentState(...maps) {
      this.currentState = new Map();
      maps.forEach((map) => {
         map.forEach((value, key) => {
            this.currentState.set(key, value);
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
            // if (this.updatedShapes.has(id)) {
            //    this.updatedShapes.delete(id);
            // }
         }
         // else if (this.deletedShapes.has(id)) {
         //    this.deletedShapes.delete(id);
         // }
      });

      // Determine updated shapes and new shapes
      this.currentState.forEach((shape, id) => {
         const initialShape = this.initialState.get(id);
         if (!initialShape) {
            // New shape
            this.newShapes.set(id, shape);
         } else if (JSON.stringify(initialShape) !== JSON.stringify(shape)) {
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
      this.updatedShapes.forEach((s, id) => {
         updated.push({ shapedId: id, params: s });
      });
      return { newShape, updated };
   }

   async pushRecords(handler, interval = 10000) {
      this.compareStates();
      const { newShape, updated } = this.getUpdatedShapes();

      try {
         handler({ newShape, updated });
      } catch (err) {}
   }
}

export const canvasRecord = new CanvasRecord();
