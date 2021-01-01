import React from "react";
import { categoryToIMG } from "../parser/emojis";

/*
 * Return the HTML representation of a node.
 * The node is an object that has text, url, and category attributes;
 * all of them optional.
 */
const subnodesToHTML = (subnodes = [], fcolor, jsx) => {
  let color = fcolor || "";

  if (!fcolor && subnodes.length > 0 && subnodes[0].color) {
    color = `style="border-left-color: ${subnodes[0].color}"`;
  }

  return subnodes
    .map((subnode) => {
      let href = `href="${subnode.url}"`;
      // let emoji = categoryToIMG(subnode.category);

      if (!subnode.url) {
        href = "";
        // emoji = "";
      }
      if (typeof subnode.text === "object") {
      }
      return jsx ? (
        <div class="mindmap-subnode-group" color={color}>
          <a href={href}>
            {/* ${subnode.text || ""} ${emoji} */}
            ${subnode.text || ""}
          </a>
          <div>${subnodesToHTML(subnode.nodes, color)}</div>
        </div>
      ) : (
        // <a ${href}>${subnode.text || ""} ${emoji}</a>
        `<div class="mindmap-subnode-group" ${color}>
    <a ${href}>${subnode.text || ""}</a>
    <div>${subnodesToHTML(subnode.nodes, color)}</div>
  </div>`
      );
    })
    .join("");
};

export default subnodesToHTML;
