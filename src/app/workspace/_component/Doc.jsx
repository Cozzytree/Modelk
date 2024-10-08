import { useUpdateDocument } from "@/requests/docRequest";
import Checklist from "@editorjs/checklist";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import ImageTool from "@editorjs/image";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import RawTool from "@editorjs/raw";
import { useEffect, useRef } from "react";

const initialData = {
   blocks: [
      {
         data: {
            text: "Hello Seattle<br>I am a mountaineer <br>In the hills and highlands<br>I fall asleep in hospital, parking lots<br>And awake in your mouth<br>",
         },
         id: "laBGXJrtZU",
         type: "paragraph",
      },
      { data: { text: "Story" }, id: "vHUzu-etTf", type: "paragraph" },
   ],
   time: 1725119180292,
   version: "2.30.2",
};

export default function Doc({ id }) {
   const editorRef = useRef(null);
   const { mutate, isPending } = useUpdateDocument();

   useEffect(() => {
      const editor = new EditorJS({
         placeholder: "Type your notes here",
         holder: "editorjs",
         data: initialData,
         tools: {
            header: {
               class: Header,
               shortcut: "CMD+SHIFT+H",
               placeholder: "Enter a header",
               levels: [2, 3, 4],
               defaultLevel: 3,
            },
            raw: RawTool,
            image: {
               class: ImageTool,
               config: {
                  endpoints: {
                     byFile: "http://localhost:3000/uploadFile", // Your backend file uploader endpoint
                     byUrl: "http://localhost:3000/fetchUrl", // Your endpoint that provides uploading by Url
                  },
               },
            },
            checklist: {
               class: Checklist,
               inlineToolbar: true,
            },
            list: {
               class: List,
               inlineToolbar: true,
               config: {
                  defaultStyle: "unordered",
               },
            },
            quote: {
               class: Quote,
               inlineToolbar: true,
               shortcut: "CMD+SHIFT+O",
               config: {
                  quotePlaceholder: "Enter a quote",
                  captionPlaceholder: "Quote's author",
               },
            },
         },
      });
      editorRef.current = editor;
   }, []);

   const handleSave = () => {
      if (!editorRef.current) return;
      editorRef.current
         .save()
         .then((outputData) => {
            mutate({ data: outputData, projectId: id });
            console.log("Article data: ", outputData);
         })
         .catch((error) => {
            console.log("Saving failed: ", error);
         });
   };

   return (
      <div
         id="editorjs"
         className="h-screen w-full px-2 sm:px-0 py-5 mx-auto overflow-y-auto hide-scrollbars-element "
      >
         <button className="absolute top-10 left-0 " onClick={handleSave}>
            save
         </button>
      </div>
   );
}
