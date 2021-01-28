import React from "react";
import { convertFromRaw, EditorState } from "draft-js";
import { Intent, Callout } from "@blueprintjs/core";
import update from "immutability-helper";

import db from "../db";

import RichEditor from "../Components/Editor/Editor";

let blobUrl = (blob) => {
  if (!blob.url) {
    blob.url = URL.createObjectURL(blob);
  }
  return blob.url;
};

export function handleStringCreation(label, data) {
  if (typeof label === "string") {
    return label;
  } else if (data.id) {
    return data.id;
  }
  return label;
}

export function aORb(type, a, b, c = null) {
  return type === "note" ? a : type === "image" ? b : c;
}

export function InnerContent({ type, id, data }) {
  return aORb(
    type,
    <RichEditor
      width={data.width}
      id={id}
      minimal
      controls={false}
      editorState={
        data.raw
          ? EditorState.createWithContent(convertFromRaw(data.raw))
          : null
      }
      contentEditable={false}
      readOnly={true}
      onChange={() => null}
    />,
    <img
      src={data.file ? blobUrl(data.file) : ""}
      alt={id}
      width={data.width}
      height={data.height}
    />
  );
}

export const createCallout = () => (
  <Callout intent={Intent.WARNING} title="You have no subject!">
    Please create a subject by clicking the Create Subject button above to use
    this website!
  </Callout>
);

// https://stackoverflow.com/questions/22222599/javascript-recursive-search-in-json-object
export function findNode(id, currentNode, parent = {}, returnParent = false) {
  let i, currentChild, result;

  if (id === currentNode.id) {
    if (returnParent) return parent;
    return currentNode;
  } else {
    // Use a for loop instead of forEach to avoid nested functions
    // Otherwise "return" will not work properly
    for (i = 0; i < currentNode.childNodes.length; i++) {
      currentChild = currentNode.childNodes[i];
      // Search in the current child
      result = findNode(id, currentChild, currentNode, returnParent);

      // Return the result if the node has been found
      if (result !== false) {
        return result;
      }
    }

    // The node has not been found and we have no more options
    return false;
  }
}

// May want to use again in future
// export function organiseSubjects({ subjects, currentSubject }) {
//   const firstSubject = subjects.filter(({ id }) => currentSubject === id);
//   const otherSubjects = subjects.filter(({ id }) => currentSubject !== id);
//   const organisedSubjects = firstSubject.concat(otherSubjects);
//   return organisedSubjects;
// }

export async function removeFromTree(nodeId, changeData, deletion) {
  // First get tree and update tree structure (remove node or nodes)
  const user = await db.user.toCollection().first();
  const tree = await db.trees.get({ subjectId: user.currentSubject });
  const { structure } = tree;

  // Set the property inTree to false for each piece of data
  const data = [];

  // Remove from structure
  // Either nested one down the heirarchy

  let childNodes;

  for (let i = 0; i < structure.childNodes.length; i++) {
    const elem = structure.childNodes[i];
    let inner;
    if (elem.nodeId === nodeId) {
      // Go through and update each data within if there are elements
      for (let j = 0; j < elem.childNodes.length; j++) {
        inner = elem.childNodes[j];
        await db[inner.type + "s"].update(inner.id, { inTree: false });
        data.push([await db[inner.type + "s"].get(inner.id), inner.type]);
      }
      // removal
      childNodes = update(structure.childNodes, (arr) =>
        arr.filter((n) => n.nodeId !== nodeId)
      );
      await db[elem.type + "s"].update(elem.id, { inTree: false });
      data.push([await db[elem.type + "s"].get(elem.id), elem.type]);
      break;
    }
    // Otherwise check if inner node is what has the id
    if (elem.childNodes.length > 0) {
      // or two down the heirarchy
      for (let j = 0; j < elem.childNodes.length; j++) {
        inner = elem.childNodes[j];
        if (inner.nodeId === nodeId) {
          childNodes = update(structure.childNodes, {
            [i]: {
              childNodes: (arr) => arr.filter((n) => n.nodeId !== nodeId),
            },
          });
          await db[inner.type + "s"].update(inner.id, { inTree: false });
          data.push([await db[inner.type + "s"].get(inner.id), inner.type]);
          break;
        }
      }
    }
  }
  const updatedStructure = update(structure, {
    childNodes: { $set: childNodes },
  });
  // If what is deleted is not within the tree structure
  // - this is called whenever an image or note is deleted
  if (data.length === 0) return null;

  await db.trees.update(tree.id, { structure: updatedStructure });
  if (deletion) {
    return { data, updatedStructure };
  } else {
    changeData({ update: "updateTree", data, structure: updatedStructure });
  }
}

export function getDim(ref, isOpen) {
  if (ref.current) {
    const [width, height] = [ref.current.clientWidth, ref.current.clientHeight];
    if (isOpen) {
      return {
        width: width - width / 4,
        height,
      };
    } else {
      return { width, height };
    }
  }
}
