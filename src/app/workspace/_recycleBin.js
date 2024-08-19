// strcucture  { type : "start"}
//
export const redoType = {
   revert: "revert",
   revert_deleted: "revert_delete",
   delete: "delete",
   fresh: "new and fresh",
};

class Stack {
   store = [];

   insert(val) {
      if (this.store.length >= 40) return;
      this.store.push(JSON.parse(JSON.stringify(val)));
   }

   popOut() {
      if (!this.store.length) return;
      return this.store.pop();
   }
}

// const Bin = new RecycleBin();
export const Bin = new Stack();
export const Restore = new Stack();
