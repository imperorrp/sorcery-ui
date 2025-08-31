import React, { useState } from 'react';
import { useComponentStore } from '@/store/componentStore';
import type { SerializableElement } from '@/store/componentStore';
import { ChevronRight, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ComponentTree: React.FC = () => {
	const { componentPreviewAst } = useComponentStore();

	if (!componentPreviewAst) {
		return <div className="text-sm text-gray-500 px-2">Render a component to see its tree.</div>;
	}

	return (
		<div className="space-y-1">
			<TreeNode node={componentPreviewAst} depth={0} />
		</div>
	);
};

interface TreeNodeProps {
	node: SerializableElement | string;
	depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth }) => {
	const { selectedNodeId, setSelectedNodeId } = useComponentStore();
	const [expanded, setExpanded] = useState(true);

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
