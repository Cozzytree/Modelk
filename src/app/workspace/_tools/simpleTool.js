import {
   BlockTool,
   BlockToolConstructorOptions,
   ToolboxConfig,
} from "@editorjs/editorjs";

class SimpleTool {
   static get toolbox() {
      return {
         title: "Simple Tool",
         icon: `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
<path d="M 1 3 L 1 4 L 1 15 L 3 15 L 3 48 L 47 48 L 47 15 L 49 15 L 49 3 L 1 3 z M 3 5 L 47 5 L 47 13 L 3 13 L 3 5 z M 5 15 L 45 15 L 45 46 L 5 46 L 5 15 z M 17.5 19 C 15.57619 19 14 20.57619 14 22.5 C 14 24.42381 15.57619 26 17.5 26 L 32.5 26 C 34.42381 26 36 24.42381 36 22.5 C 36 20.57619 34.42381 19 32.5 19 L 17.5 19 z M 17.5 21 L 32.5 21 C 33.37619 21 34 21.62381 34 22.5 C 34 23.37619 33.37619 24 32.5 24 L 17.5 24 C 16.62381 24 16 23.37619 16 22.5 C 16 21.62381 16.62381 21 17.5 21 z"></path>
</svg>`,
      };
   }

   constructor({ data, config, api, readOnly }) {
      this.data = data;
      this.wrapper = null;
   }

   render() {
      this.wrapper = document.createElement("div");
      this.wrapper.classList.add("simple-tool");

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Enter something...";
      input.value = this.data.text || "";

      input.addEventListener("input", (event) => {
         this.data.text = event.target.value;
      });

      this.wrapper.appendChild(input);

      return this.wrapper;
   }

   save(blockContent) {
      const input = blockContent.querySelector("input");
      return {
         text: input.value,
      };
   }
}

export default SimpleTool;
