// client/src/lib/codeUpdater.ts
// Surgical string replacement approach that preserves component logic
import type { SerializableElement } from '@/store/componentStore';

interface Change {
  start: number;
  end: number;
  text: string;
}

// Helper to convert a style object back into a clean string like `{ color: 'red' }`
const styleObjectToString = (style: React.CSSProperties): string => {
  const styleString = JSON.stringify(style, null, 2);
  // Convert to valid JSX style object by removing quotes from keys
  return styleString.replace(/"([^"]+)":/g, '$1:');
};

// Main function to update the code
export const updateCodeWithStyles = async (
  originalCode: string,
  previewAst: SerializableElement
): Promise<string | null> => {
  if (!originalCode || !previewAst) {
    console.error("updateCodeWithStyles: Missing required parameters");
    return null;
  }

  try {
    // Use dynamic imports to avoid process reference before shim loads
    const [{ parse }, traverseModule] = await Promise.all([
      import('@babel/parser'),
      import('@babel/traverse'),
    ]);
    const traverseFn = traverseModule.default || traverseModule;

    if (!traverseFn || typeof traverseFn !== 'function') {
      console.error('Failed to load Babel traverse function');
      return null;
    }

    const babelAst = parse(originalCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    if (!babelAst) {
      console.error('Failed to parse code with Babel');
      return null;
    }

    const changes: Change[] = [];
    const styleMap = new Map<string, React.CSSProperties>();

    // 1. Create a map of which node ID has which new style
    const collectStyles = (node: SerializableElement | string) => {
      if (typeof node !== 'string' && node.props.style && node.id) {
        styleMap.set(node.id, node.props.style);
      }
      if (typeof node !== 'string' && node.props.children) {
        node.props.children.forEach(collectStyles);
      }
    };
    collectStyles(previewAst);

    // 2. Traverse the code's AST. We must re-generate the IDs in the exact same
    //    way the renderer did to ensure they match.
    let idCounter = 0;
    
    try {
      traverseFn(babelAst, {
        JSXOpeningElement(path) {
          // This is how we ensure the ID matches the one in our previewAst
          const nodeId = `node-${idCounter++}`;
          const newStyle = styleMap.get(nodeId);

          if (newStyle) {
            const styleAttr = path.node.attributes.find(
              attr => attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier' && attr.name.name === 'style'
            );

            const newStyleString = `style={${styleObjectToString(newStyle)}}`;

            if (styleAttr && styleAttr.start != null && styleAttr.end != null) {
              // If style prop exists, record a change to replace it
              changes.push({
                start: styleAttr.start,
                end: styleAttr.end,
                text: newStyleString,
              });
            } else if (path.node.start != null) {
              // If style prop does not exist, add it before the closing ">"
              const tagName = path.node.name.type === 'JSXIdentifier' ? path.node.name.name : 'unknown';
              const insertPos = path.node.selfClosing
                ? path.node.start + tagName.length + 1
                : (path.node.end ?? path.node.start + tagName.length + 1) - 1;
              changes.push({
                start: insertPos,
                end: insertPos,
                text: ` ${newStyleString}`,
              });
            }
          }
        },
      });
    } catch (traverseError) {
      console.error("Error during Babel traversal:", traverseError);
      return null;
    }

    // 3. Apply the collected changes to the original code string
    // We go in reverse order so that character indices don't get messed up
    let updatedCode = originalCode;
    for (const change of changes.sort((a, b) => b.start - a.start)) {
      updatedCode =
        updatedCode.slice(0, change.start) + change.text + updatedCode.slice(change.end);
    }

    return updatedCode;
  } catch (error) {
    console.error("Failed to update code with styles:", error);
    return null;
  }
};
