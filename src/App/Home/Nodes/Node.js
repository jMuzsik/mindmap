import React, { useState } from "react";
import { Button, ButtonGroup, Classes } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

import Editor from "../../../Components/Editor";

import { removeFromTree } from "../utils";
import { useFocusAndSet } from "../../../Hooks";
import db from "../../../db";

async function handleEditSave(
  { content, height, width },
  { setLoading, setDisabled, setEditable, changeData, id }
) {
  const user = await db.user.toCollection().first();
  await db.nodes.update(id, {
    width,
    aspectRatio: width / height,
    content,
  });
  await db.nodes.get(id);
  const nodes =
    (await db.nodes.where({ subjectId: user.currentSubject }).toArray()) || [];

  setLoading(false);
  setDisabled(false);
  setEditable(false);
  changeData({ update: "setData", data: nodes });
}

async function handleDelete({ changeData, setOpen, id }) {
  const user = await db.user.toCollection().first();
  const treeRemoval = await removeFromTree(`node-${id}`, null, true);

  // undefined or rejection
  await db.nodes.delete(id);
  const nodes =
    (await db.nodes.where({ subjectId: user.currentSubject }).toArray()) || [];

  setOpen(false);
  if (treeRemoval === null) {
    changeData({ update: "setData", data: nodes });
  } else {
    changeData({
      update: "updateTreeAndData",
      data: nodes,
      structure: treeRemoval.updatedStructure,
    });
  }
}

export default function Node(props) {
  const { node, changeData, setOpen, names } = props;

  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editorState, setEditorState] = useState(node.content);
  const [editable, setEditable] = useState(false);
  let editorRef;
  editorRef = useFocusAndSet(editorRef);

  return (
    <form className="node">
      <div className={Classes.DIALOG_BODY}>
        <ButtonGroup fill large>
          <Button
            type="button"
            intent="none"
            icon={IconNames.EDIT}
            onClick={() => setEditable(!editable)}
          >
            {names.edit}
          </Button>
          <Button
            type="button"
            intent="danger"
            disabled={disabled}
            loading={loading}
            icon={IconNames.DELETE}
            onClick={async () => {
              setLoading(true);
              setDisabled(true);
              await handleDelete({
                changeData,
                setOpen,
                id: node.id,
              });
              // TODO: Handle error
            }}
          >
            {names.delete}
          </Button>
        </ButtonGroup>
        <Editor
          contentEditable={editable}
          theme={editable ? "snow" : "bubble"}
          readOnly={!editable}
          editorRef={editorRef}
          editorState={editorState}
          setEditorState={setEditorState}
        />
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {editable && (
            <ButtonGroup fill>
              <Button
                type="button"
                intent="primary"
                disabled={disabled}
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  setDisabled(true);
                  const editor = editorRef.current.getEditor();
                  const content = editor.getContents();
                  const box = editor.root;
                  await handleEditSave(
                    {
                      content,
                      height: box.clientHeight,
                      width: box.clientWidth,
                    },
                    {
                      setLoading,
                      setDisabled,
                      setEditable,
                      id: node.id,
                      changeData,
                    }
                  );
                  // TODO: Handle error
                }}
              >
                {names.action}
              </Button>
            </ButtonGroup>
          )}
        </div>
      </div>
    </form>
  );
}
