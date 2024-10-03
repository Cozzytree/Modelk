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
   }

   // Method to update the current state
   updateCurrentState(maps = []) {
      this.currentState = new Map();
      maps.forEach((val) => {
         if (!val) return;
         this.currentState.set(val.id, JSON.parse(JSON.stringify(val)));
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
            this.deletedShapes.add(shape.id);
         }
      });

      // Determine updated shapes and new shapes
      this.currentState.forEach((shape, id) => {
         const initialShape = this.initialState.get(id);
         if (!initialShape) {
            // New shape
            this.newShapes.set(id, shape);
         } else if (this.shapeHasChanged(initialShape, shape)) {
            // Updated shape
            console.log("in here");
            this.updatedShapes.set(id, shape);
         }
      });
   }

   // Method to check if a shape has changed (e.g., by comparing properties)
   shapeHasChanged(initialShape, updatedShape) {
      // Check if the number of properties is different
      // if (
      //    Object.keys(initialShape).length !== Object.keys(updatedShape).length
      // ) {
      //    return true;
      // }

      // Check each property in initialShape
      for (const [key, val] of Object.entries(initialShape)) {
         // Check if the property value is different

         if (JSON.stringify(updatedShape[key]) !== JSON.stringify(val)) {
            return true;
         }
      }

      // If all checks pass, the shapes are the same
      return false;
   }

   getUpdatedShapes() {
      let newShape = [];
      let updated = [];

      this.newShapes.forEach((v) => {
         newShape.push(v);
      });
      this.updatedShapes.forEach((s) => {
         updated.push({ shapeId: s.shapeId, params: s });
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
