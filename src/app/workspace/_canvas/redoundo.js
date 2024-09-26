class LinkNode {
   constructor(data, front = null, back = null) {
      this.data = data;
      this.front = front;
      this.back = back;
   }
}

class DoublyLinkedList {
   constructor() {
      this.head = null;
      this.tail = null;
      this.currentState = null;
      this.size = 0;
      this.maximumsize = 200;
   }

   addNewData(data) {
      const newNode = new LinkNode(data);
      if (this.head == null) {
         this.head = newNode;
         this.tail = this.head;
      } else {
         if (this.size >= this.maximumsize) {
            this.head = this.head.front;
         }
         newNode.back = this.tail;
         this.tail.front = newNode;
         this.tail = newNode;
      }
      if (this.size < this.maximumsize) this.size = this.size + 1;
      this.currentState = this.tail;
   }

   goback() {
      if (!this.currentState) return;
      const toreturn = this.currentState;
      this.currentState = this.currentState.back;
      return toreturn.data;
   }

   goFront() {
      if (!this.currentState.front) return;
      const toreturn = this.currentState.front;
      this.currentState = toreturn;
      return toreturn.data;
   }
}

export const RedoUndo = new DoublyLinkedList();
