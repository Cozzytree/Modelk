class Table {
   static get toolbox() {
      return {
         title: "Table",
         icon: `<svg width="800px" height="800px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
              <?xml version="1.0" encoding="UTF-8" standalone="no"?>  
              <title>db-table</title>
              <desc>Created with Sketch.</desc>
          <defs></defs>
           <g id="64px-Line" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
           <g id="db-table">

       </g>
        <path d="M56,12 C56,9.794 54.206,8 52,8 L10,8 C7.794,8 6,9.794 6,12 L6,54 C6,56.206 7.794,58 10,58 L52,58 C54.206,58 56,56.206 56,54 L56,12 L56,12 Z M30,22 L30,32 L20,32 L20,22 L30,22 L30,22 Z M42,22 L42,32 L32,32 L32,22 L42,22 L42,22 Z M54,22 L54,32 L44,32 L44,22 L54,22 L54,22 Z M18,32 L8,32 L8,22 L18,22 L18,32 L18,32 Z M8,34 L18,34 L18,44 L8,44 L8,34 L8,34 Z M20,34 L30,34 L30,44 L20,44 L20,34 L20,34 Z M30,46 L30,56 L20,56 L20,46 L30,46 L30,46 Z M32,46 L42,46 L42,56 L32,56 L32,46 L32,46 Z M32,44 L32,34 L42,34 L42,44 L32,44 L32,44 Z M44,34 L54,34 L54,44 L44,44 L44,34 L44,34 Z M10,10 L52,10 C53.103,10 54,10.897 54,12 L54,20 L8,20 L8,12 C8,10.897 8.897,10 10,10 L10,10 Z M8,54 L8,46 L18,46 L18,56 L10,56 C8.897,56 8,55.103 8,54 L8,54 Z M52,56 L44,56 L44,46 L54,46 L54,54 C54,55.103 53.103,56 52,56 L52,56 Z" id="Shape" fill="#000000">

        </path>
        </g>
       </svg>`,
      };
   }

   constructor({ data, config, api, readOnly }) {
      this.data = data && data.content ? data : { content: [[""]] };
      this.wrapper = null;
   }

   render() {
      this.wrapper = document.createElement("div");
      this.wrapper.classList.add(
         "w-[92%]",
         "m-auto",
         "flex",
         "flex-col",
         "items-start"
      );
      //   this.wrapper.classList.add("table-tool");

      const table = document.createElement("table");
      table.style.width = "100%"; // Set the table width to 100%
      const tbody = document.createElement("tbody");

      this.data.content.forEach((rowContent, rowIndex) => {
         const row = document.createElement("tr");
         rowContent.forEach((cellContent, cellIndex) => {
            const cell = document.createElement("td");
            cell.style.border = "1px solid #707070";
            cell.classList.add("px-[5px]");

            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "hello";
            input.classList.add(
               `input-${cellIndex}`,
               "outline-none",
               "text-xs",
               "w-full"
            );
            input.value = cellContent;
            input.style.width = "100%";

            input.addEventListener("input", (event) => {
               this.data.content[rowIndex][cellIndex] = event.target.value;
            });

            cell.appendChild(input);
            row.appendChild(cell);
         });
         tbody.appendChild(row);
      });

      table.appendChild(tbody);
      this.wrapper.appendChild(table);

      const addRowButton = document.createElement("button");
      addRowButton.textContent = "Add Row";
      addRowButton.classList.add(
         "p-1",
         "text-xs",
         "hover:bg-accent",
         "transition-all",
         "duration-200",
         "rounded-sm"
      );
      addRowButton.addEventListener("click", () => this.addRow(tbody));

      const addColumnButton = document.createElement("button");
      addColumnButton.textContent = "Add Column";
      addColumnButton.classList.add(
         "p-1",
         "text-xs",
         "hover:bg-accent",
         "transition-all",
         "duration-200",
         "rounded-sm"
      );
      addColumnButton.addEventListener("click", () => this.addColumn());

      this.wrapper.appendChild(addRowButton);
      this.wrapper.appendChild(addColumnButton);

      return this.wrapper;
   }

   save(blockContent) {
      const table = blockContent.querySelector("table");
      const content = [];
      if (table) {
         const rows = table.querySelectorAll("tr");
         rows.forEach((row) => {
            const rowData = [];
            row.querySelectorAll("td input").forEach((input) => {
               rowData.push(value);
            });
            content.push(rowData);
         });
      }
      return { content };
   }

   addRow(tbody) {
      const row = document.createElement("tr");
      const cellCount = this.data.content[0].length;
      const newRow = [];
      for (let i = 0; i < cellCount; i++) {
         const cell = document.createElement("td");
         cell.classList.add("px-[5px]");
         cell.style.border = "1px solid #707070";

         const input = document.createElement("input");
         input.classList.add("outline-none", "text-xs", "w-full");
         input.type = "text";
         input.addEventListener("input", (event) => {
            this.data.content[this.data.content.length - 1][i] =
               event.target.value;
         });
         cell.appendChild(input);
         row.appendChild(cell);
         newRow.push("");
      }
      this.data.content.push(newRow);
      tbody.appendChild(row);
   }

   addColumn() {
      this.data.content.forEach((rowContent, rowIndex) => {
         rowContent.push("");
         const row = this.wrapper?.querySelectorAll("tr")[rowIndex];
         const cell = document.createElement("td");
         cell.classList.add("px-[5px]");
         cell.style.border = "1px solid #707070";

         const input = document.createElement("input");
         input.classList.add("outline-none", "text-xs", "w-full");
         input.type = "text";
         input.addEventListener("input", (event) => {
            this.data.content[rowIndex][rowContent.length - 1] =
               event.target.value;
         });
         cell.appendChild(input);
         row.appendChild(cell);
      });
   }
}

export default Table;
