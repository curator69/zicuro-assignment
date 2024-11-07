import React, { useState, useEffect, useRef } from "react";
import {
  Editor,
  EditorState,
  Modifier,
  convertToRaw,
  convertFromRaw,
  SelectionState,
} from "draft-js";
import "draft-js/dist/Draft.css";

function App() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );
  const editorRef = useRef(null);

  useEffect(() => {
    const savedData = localStorage.getItem("editorContent");
    if (savedData) {
      const contentState = convertFromRaw(JSON.parse(savedData));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);

  const handleEditorChange = (state) => {
    const contentState = state.getCurrentContent();
    const selectionState = state.getSelection();
    const blockKey = selectionState.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const text = block.getText();

    let newState = clearInlineStyles(state);

    if (text.startsWith("# ")) {
      newState = applyStyle(newState, "HEADER", 2);
    } else if (text.startsWith("* ")) {
      newState = applyStyle(newState, "BOLD", 2);
    } else if (text.startsWith("** ")) {
      newState = applyStyle(newState, "RED", 3);
    } else if (text.startsWith("*** ")) {
      newState = applyStyle(newState, "UNDERLINE", 4);
    }

    setEditorState(newState);
  };

  const applyStyle = (state, style, markerLength) => {
    const contentState = state.getCurrentContent();
    const selectionState = state.getSelection();
    const block = contentState.getBlockForKey(selectionState.getStartKey());

    const updatedSelection = selectionState.merge({
      anchorOffset: markerLength,
      focusOffset: block.getLength(),
    });

    const newContentState = Modifier.applyInlineStyle(
      contentState,
      updatedSelection,
      style
    );
    const newState = EditorState.push(
      state,
      newContentState,
      "change-inline-style"
    );

    const resetSelection = SelectionState.createEmpty(block.getKey()).merge({
      anchorOffset: block.getLength(),
      focusOffset: block.getLength(),
    });
    return EditorState.forceSelection(newState, resetSelection);
  };

  const clearInlineStyles = (state) => {
    const contentState = state.getCurrentContent();
    const selectionState = state.getSelection();
    const blockKey = selectionState.getStartKey();
    const block = contentState.getBlockForKey(blockKey);

    const blockSelection = SelectionState.createEmpty(blockKey).merge({
      anchorOffset: 0,
      focusOffset: block.getLength(),
      hasFocus: true,
    });

    let newContentState = contentState;
    ["HEADER", "BOLD", "RED", "UNDERLINE"].forEach((style) => {
      newContentState = Modifier.removeInlineStyle(
        newContentState,
        blockSelection,
        style
      );
    });

    const newEditorState = EditorState.push(
      state,
      newContentState,
      "change-inline-style"
    );

    return EditorState.forceSelection(newEditorState, selectionState);
  };

  const handleSave = () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = JSON.stringify(convertToRaw(contentState));
    localStorage.setItem("editorContent", rawContent);
    alert("Content saved!");
  };

  const styleMap = {
    HEADER: { fontSize: "1.5em", fontWeight: "bold" },
    BOLD: { fontWeight: "bold" },
    RED: { color: "red" },
    UNDERLINE: { textDecoration: "underline" },
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Draft.js Editor with Heading, Bold, Red, and Underline</h1>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "200px",
        }}
        onClick={() => editorRef.current.focus()}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleEditorChange}
          customStyleMap={styleMap}
          placeholder="Type #, *, **, or *** followed by space to format"
        />
      </div>
      <button
        onClick={handleSave}
        style={{ marginTop: "10px", padding: "5px 10px" }}
      >
        Save
      </button>
    </div>
  );
}

export default App;
