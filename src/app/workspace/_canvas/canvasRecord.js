class CanvasRecord {
   constructor() {
      this.records = [];
      this.intervalId = null;
   }

   // Method to insert a new record
   insertNewRecord(value = []) {
      if (!value.length) return;
      value.forEach((v) => {
         this.records.push(v);
      });
   }

   // Method to update a record based on its id
   updateRecord(values = []) {
      if (!values.length) return;
      values.forEach((v) => {
         const index = this.records.findIndex((record) => record.id === v.id);
         if (index !== -1) {
            this.records[index] = v;
         }
      });
   }

   deleteRecord(values = []) {
      if (!values.length) return;

      // Create a Set of ids to delete for O(1) lookup
      const idsToDelete = new Set(values.map((v) => v.id));

      // Filter out records whose id is not in idsToDelete
      this.records = this.records.filter(
         (record) => !idsToDelete.has(record.id),
      );
   }

   async pushRecords(handler) {
      try {
         await handler(this.records);
      } catch (error) {
         throw error;
      }

      // Clear previous interval if exists
      if (this.intervalId) {
         clearInterval(this.intervalId);
      }

      // Set new interval
      // this.intervalId = setInterval(() => this.pushRecords(handler), 10000);
   }

   stopPushRecords() {
      clearInterval(this.intervalId);
      this.intervalId = null;
   }
}

export default CanvasRecord;
