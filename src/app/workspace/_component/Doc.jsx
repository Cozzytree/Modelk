import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import RawTool from "@editorjs/raw";
import ImageTool from "@editorjs/image";
import Checklist from "@editorjs/checklist";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import { useEffect, useRef } from "react";

export default function Doc() {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = new EditorJS({
      holder: "editorjs",
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
  return (
    <div
      id="editorjs"
      className="h-screen sm:container py-5 mx-auto overflow-y-auto hide-scrollbars-element "
    ></div>
  );
}
