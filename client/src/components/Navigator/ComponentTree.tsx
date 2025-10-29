import React, { useState } from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Component Tree Navigator - Visual Component Structure Explorer
 *
 * Displays a hierarchical tree view of the component's DOM structure based on the
 * preview AST. Allows users to navigate and select elements for editing in the
 * Inspector panel. Supports expanding/collapsing nodes and visual selection feedback.
 */

/**
 * ComponentTree Component - Main tree navigation interface
 *
 * Renders the component structure as an interactive tree with expand/collapse
 * functionality. Clicking on tree nodes updates the selected element in the store,
 * which propagates to the Inspector and Canvas for editing.
 */
export const ComponentTree: React.FC = () => {
	console.log('[ComponentTree] Render');
	
	// Access state directly
	const activeProjectId = useComponentStore((s) => s.activeProjectId);
	const projects = useComponentStore((s) => s.projects);
	
	const activeProject = activeProjectId ? projects[activeProjectId] : null;
	const activeComponentId = activeProject?.activeComponentId ?? null;
	const activeComponent = activeComponentId && activeProject 
		? activeProject.components[activeComponentId] 
		: null;
	const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
	
	console.log('[ComponentTree] Active component:', activeComponent?.name);

	return (
		<div className="h-full flex flex-col">
			{/* Active Component Tree Section */}
			<div className="flex-1 overflow-auto">
				<div className="px-2 py-1 mb-2">
					<h3 className="text-sm font-semibold text-foreground">Component Structure</h3>
					{activeComponentId && (
						<p className="text-xs text-muted-foreground">
							{activeComponent?.name || 'Unknown Component'}
						</p>
					)}
				</div>
				
				{!componentPreviewAst ? (
					<div className="text-sm text-muted-foreground px-2">
						Render the active component to see its tree.
					</div>
				) : (
					<div className="space-y-1 px-2">
						<TreeNode node={componentPreviewAst} depth={0} />
					</div>
				)}
			</div>
		</div>
	);
};

interface TreeNodeProps {
	node: SerializableElement | string;
	depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth }) => {
	const selectedNodeId = useComponentStore((s) => s.selectedNodeId);
	const setSelectedNodeId = useComponentStore((s) => s.setSelectedNodeId);
	const [expanded, setExpanded] = useState(true);

	const nodeRef = React.useRef<HTMLDivElement | null>(null);

	// Compute selection early so hooks run in a stable order
	const isSelected = typeof node !== 'string' && selectedNodeId === (node as SerializableElement).id;

	// Scroll this node into view when it becomes selected
	React.useEffect(() => {
		if (isSelected && nodeRef.current) {
			const el = nodeRef.current;
			if (el.offsetParent !== null) {
				el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
			}
		}
	}, [isSelected]);

	// Debug log to see when selectedNodeId changes
	React.useEffect(() => {
		// Navigator: selectedNodeId changed
	}, [selectedNodeId]);

	if (typeof node === 'string') {
		const text = node.trim();
		if (text === '') return null;
		return (
			<div className="text-xs text-muted-foreground truncate" style={{ paddingLeft: `${depth * 0.75}rem` }}>
				<ChevronsRight className="inline-block h-3 w-3 mr-1 text-muted-foreground" />
				"{text.length > 30 ? `${text.substring(0, 30)}...` : text}"
			</div>
		);
	}

	const label = typeof node.type === 'string'
		? node.type
		: ((node.type as React.ComponentType<unknown>).displayName || (node.type as React.ComponentType<unknown>).name || 'Component');

	const rawChildren = (node as SerializableElement).props?.children as unknown;
	const children: Array<SerializableElement | string> = Array.isArray(rawChildren)
		? rawChildren
		: rawChildren != null
		? [rawChildren as SerializableElement | string]
		: [];
	const hasChildren = children.length > 0;

	const handleToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		setExpanded(!expanded);
	};

	const handleSelect = () => {
		setSelectedNodeId(node.id);
	};

	return (
		<div>
			<div
				onClick={handleSelect}
				role="treeitem"
				aria-selected={isSelected}
				ref={nodeRef}
				className={cn(
					"flex items-center text-sm cursor-pointer hover:bg-accent p-1",
					isSelected
						? "bg-accent text-accent-foreground rounded-md ring-1 ring-accent-foreground/25 shadow-sm"
						: "rounded"
				)}
				style={{ paddingLeft: `${depth * 0.75}rem` }}
			>
				{hasChildren ? (
					<ChevronRight
						className={cn(
							"h-4 w-4 mr-1 shrink-0 transition-transform",
							expanded && "rotate-90",
							isSelected ? "text-accent-foreground" : "text-muted-foreground"
						)}
						onClick={handleToggle}
					/>
				) : (
					<span className={cn("w-5 mr-1", isSelected && "bg-accent-foreground/10 rounded-sm")} />
				)}
				<span className={cn("font-semibold", isSelected ? "font-extrabold text-accent-foreground" : "text-foreground")}>
					{label}
				</span>
			</div>

            

			{expanded && hasChildren && (
				<div className="pl-2 border-l border ml-4">
					{children.map((child: SerializableElement | string, index: number) => (
						<TreeNode key={index} node={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
};
