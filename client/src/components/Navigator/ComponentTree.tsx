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
	// Use active component selectors for proper data access
	const activeComponent = useComponentStore((s) => s.activeComponentId ? s.components[s.activeComponentId] : null);
	const componentPreviewAst = activeComponent?.componentPreviewAst ?? null;
	const activeComponentId = useComponentStore((s) => s.activeComponentId);
	const components = useComponentStore((s) => s.components);

	return (
		<div className="h-full flex flex-col">
			{/* Active Component Tree Section */}
			<div className="flex-1 overflow-auto">
				<div className="px-2 py-1 mb-2">
					<h3 className="text-sm font-semibold text-gray-300">Component Structure</h3>
					{activeComponentId && (
						<p className="text-xs text-gray-500">
							{components[activeComponentId]?.name || 'Unknown Component'}
						</p>
					)}
				</div>
				
				{!componentPreviewAst ? (
					<div className="text-sm text-gray-500 px-2">
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

	// Debug log to see when selectedNodeId changes
	React.useEffect(() => {
		console.log('🌳 Navigator: selectedNodeId changed to:', selectedNodeId);
	}, [selectedNodeId]);

	if (typeof node === 'string') {
		const text = node.trim();
		if (text === '') return null;
		return (
			<div className="text-xs text-gray-400 truncate" style={{ paddingLeft: `${depth * 0.75}rem` }}>
				<ChevronsRight className="inline-block h-3 w-3 mr-1 text-gray-600" />
				"{text.length > 30 ? `${text.substring(0, 30)}...` : text}"
			</div>
		);
	}

	const label = typeof node.type === 'string'
		? node.type
		: ((node.type as React.ComponentType<unknown>).displayName || (node.type as React.ComponentType<unknown>).name || 'Component');

	const isSelected = selectedNodeId === node.id;
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
				className={cn(
					"flex items-center text-sm cursor-pointer hover:bg-gray-800 rounded p-1",
					isSelected && "bg-blue-600/30 hover:bg-blue-600/40"
				)}
				style={{ paddingLeft: `${depth * 0.75}rem` }}
			>
				{hasChildren ? (
					<ChevronRight
						className={cn("h-4 w-4 mr-1 flex-shrink-0 transition-transform", expanded && "rotate-90")}
						onClick={handleToggle}
					/>
				) : (
					<span className="w-5 mr-1" />
				)}
				<span className="font-semibold text-gray-300">{label}</span>
			</div>

			{expanded && hasChildren && (
				<div className="pl-2 border-l border-gray-700 ml-4">
					{children.map((child: SerializableElement | string, index: number) => (
						<TreeNode key={index} node={child} depth={depth + 1} />
					))}
				</div>
			)}
		</div>
	);
};
